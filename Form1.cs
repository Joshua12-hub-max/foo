using System;
using System.Drawing;
using System.IO;
using System.IO.Ports;
using System.Windows.Forms;
using BioMiddleware.Services;
using MySqlConnector;
using Fleck;

namespace BioMiddleware
{
    public partial class Form1 : Form
    {
        // Config
        private const int HOST_BAUD = 115200;
        private const int SCAN_INTERVAL_MS = 1000; // Slower polling for better stability
        private const int NO_MATCH_UI_THROTTLE_SEC = 2;
        private const int MATCH_COOLDOWN_SEC = 60; // Up from 6 to prevent spam scans

        private const int UI_RETURN_TO_STANDBY_MS = 5000;

        // Database connection
        private readonly string _cs =
            "Server=127.0.0.1;Database=chrmo_db;Uid=root;SslMode=None;";

        // Runtime state
        private SerialDeviceService? _serial;
        private BioWebSocketServer? _wsServer; // WebSocket Server

        // Enrollment session
        private bool _isEnrolling;
        private int _pendingEnrollId;
        private string _pendingEnrollName = "";
        private string _pendingEnrollDept = "";

        // UI throttles
        private DateTime _lastNoMatchUi = DateTime.MinValue;
        private DateTime _lastMatchLogAt = DateTime.MinValue;
        private int _lastMatchEmpId;

        // Icons
        private Image? _icoStandby;     // standby.png
        private Image? _icoSuccess;     // success.png (good IN/OUT)
        private Image? _icoUnenrolled;  // unenrolled.png (not enrolled)
        private Image? _icoWarning;     // warning.png (already IN+OUT / warnings)

        // Auto-standby timer (do NOT confuse with tmrScan)
        private readonly System.Windows.Forms.Timer _tmrUiStandby = new System.Windows.Forms.Timer();

        public Form1()
        {
            InitializeComponent();
            SetupCommon();
        }

        public Form1(string empId, string name) : this()
        {
             // Support URI-based enrollment (e.g., nebr-bio://enroll?employeeId=Emp-001&name=Joshua)
             if (!string.IsNullOrEmpty(empId))
             {
                 // Extract numeric ID
                 string rawId = empId.Replace("Emp-", "").Trim();
                 if (int.TryParse(rawId, out int id))
                 {
                     // Use a small delay to ensure device is connected before starting enrollment
                     System.Windows.Forms.Timer t = new System.Windows.Forms.Timer();
                     t.Interval = 2000;
                     t.Tick += (s, e) => {
                         t.Stop();
                         if (IsDeviceReady()) StartEnrollment(id, name, "Unassigned");
                     };
                     t.Start();
                 }
             }
        }

        // Tray Icon
        private NotifyIcon? _trayIcon;

        private void SetupCommon()
        {
            // HIDE UI (Headless Mode)
            this.Opacity = 0;
            this.ShowInTaskbar = false;
            this.WindowState = FormWindowState.Minimized;

            // Setup System Tray Icon
            _trayIcon = new NotifyIcon();
            _trayIcon.Icon = SystemIcons.Shield; // Generic system icon
            _trayIcon.Text = "Biometric Middleware (Running in Background)";
            _trayIcon.Visible = true;
            
            var ctx = new ContextMenuStrip();
            ctx.Items.Add("Show Logs", null, (s, e) => {
                this.Opacity = 1;
                this.ShowInTaskbar = true;
                this.WindowState = FormWindowState.Normal;
            });
            ctx.Items.Add("Hide", null, (s, e) => {
                this.Opacity = 0;
                this.ShowInTaskbar = false;
                this.WindowState = FormWindowState.Minimized;
            });
            ctx.Items.Add("-");
            ctx.Items.Add("Exit", null, (s, e) => Application.Exit());
            _trayIcon.ContextMenuStrip = ctx;

            // UI Setup
            cmbPorts.DropDownStyle = ComboBoxStyle.DropDownList;

            tmrScan.Enabled = false;
            tmrScan.Interval = SCAN_INTERVAL_MS;

            lblStatus.Text = "Disconnected";
            lblBigStatus.Text = "DISCONNECTED";

            LoadIcons();
            SetUiStandby("APP_READY");

            _tmrUiStandby.Interval = UI_RETURN_TO_STANDBY_MS;
            _tmrUiStandby.Tick += (_, __) =>
            {
                _tmrUiStandby.Stop();

                // Only return to standby when not enrolling; otherwise keep enrollment UI
                if (_isEnrolling) return;

                // If disconnected, keep disconnected UI
                if (!IsDeviceReady())
                {
                    SetUiDisconnected();
                    return;
                }

                SetUiStandby("AUTO");
            };
        }

        protected override void OnLoad(EventArgs e)
        {
            base.OnLoad(e);

            RefreshPorts();
            Log("SYS APP_READY (BACKGROUND MODE)");

            // START WEBSOCKET SERVER
            try
            {
                _wsServer = new BioWebSocketServer(4649);
                _wsServer.OnEnrollStart += (payload) => 
                {
                    _wsServer?.Broadcast("DEBUG: OnEnrollStart Event " + payload);
                    try 
                    {
                        var parts = payload.Split('|');
                        if (parts.Length > 0)
                        {
                            string rawId = parts[0].Replace("Emp-", "").Trim();
                            if (int.TryParse(rawId, out int id))
                            {
                                string name = parts.Length > 1 ? parts[1] : "Unknown";
                                string dept = parts.Length > 2 ? parts[2] : "Unassigned";
                                // Invoke on UI Thread
                                this.Invoke((MethodInvoker)delegate {
                                    StartEnrollment(id, name, dept);
                                });
                            }
                            else
                            {
                                Console.WriteLine("Invalid ID format in ENROLL_START: " + parts[0]);
                                _wsServer?.Broadcast("DEBUG: Invalid ID Format " + parts[0]);
                            }
                        }
                        else 
                        {
                            Console.WriteLine("Empty ENROLL_START payload");
                            _wsServer?.Broadcast("DEBUG: Empty Payload");
                        }
                    }
                    catch(Exception ex)
                    {
                        Console.WriteLine("Error in OnEnrollStart: " + ex.Message);
                        _wsServer?.Broadcast("DEBUG: Error " + ex.Message);
                    }
                };
                
                _wsServer.OnEnrollCancel += () =>
                {
                     this.Invoke((MethodInvoker)delegate {
                        ResetEnrollSession();
                        ResumeScanning();
                        SetUiStandby("WS_CANCEL");
                        _wsServer.Broadcast("ENROLL_CANCELLED");
                    });
                };

                _wsServer.OnResetDevice += HandleResetDevice;

                _wsServer.OnClientConnected += (socket) =>
                {
                    // Send current device status to the new client
                    if (IsDeviceReady())
                    {
                        socket.Send("DEVICE_CONNECTED");
                    }
                    else
                    {
                        socket.Send("DEVICE_DISCONNECTED");
                    }
                };
                
                _wsServer.Start();
                Log("WS Server Started on 4649");
            }
            catch(Exception ex)
            {
                Log("WS_ERR: " + ex.Message);
            }
            
            // Auto-connect to first port if available (Optimization)
            if(cmbPorts.Items.Count > 0)
            {
                 ConnectSelectedPort();
            }
        }
        
        // ... (Existing UI Event Handlers remain same) ...
        // UI events (Designer.cs must reference these exact names)
        private void btnRefresh_Click(object sender, EventArgs e) => RefreshPorts();
        private void btnConnect_Click(object sender, EventArgs e) => ConnectSelectedPort();
        private void btnDisconnect_Click(object sender, EventArgs e) => DisconnectDevice();
        
        private void btnSend_Click(object sender, EventArgs e)
        {
            MessageBox.Show("Manual command input is disabled in HR mode.");
        }

        private void btnEnroll_Click(object sender, EventArgs e)
        {
            if (!IsDeviceReady())
            {
                MessageBox.Show("Device not connected.");
                return;
            }

            if (_isEnrolling)
            {
                MessageBox.Show("Enrollment already in progress.");
                return;
            }

            // Manual enrollment UI logic...
            // For now, let's keep it simple or just rely on WS
            MessageBox.Show("Please use the Website to enroll users.");
        }

        private void tmrScan_Tick(object? sender, EventArgs e)
        {
            // DISABLED: Polling with SCAN causes serial congestion while in ATTEND mode.
            // Arduino is now responsible for pushing EVENT MATCH autonomously.
            /*
            if (!IsDeviceReady()) return;
            if (_isEnrolling) return;

            try
            {
                _serial!.SendLine("SCAN");
            }
            catch (Exception ex)
            {
                Log("SCAN_ERR: " + ex.Message);
            }
            */
        }

        // Device lifecycle
        private void RefreshPorts()
        {
            cmbPorts.Items.Clear();

            var ports = SerialPort.GetPortNames();
            Array.Sort(ports);

            cmbPorts.Items.AddRange(ports);
            if (cmbPorts.Items.Count > 0) cmbPorts.SelectedIndex = 0;

            Log("SYS Ports: " + string.Join(", ", ports));
        }

        private void ConnectSelectedPort()
        {
            if (cmbPorts.SelectedItem == null)
            {
                MessageBox.Show("Select a COM port first.");
                return;
            }

            var port = cmbPorts.SelectedItem.ToString()!;

            try
            {
                DisconnectDevice();

                _serial = new SerialDeviceService(port, HOST_BAUD);

                _serial.LineReceived += line => BeginInvoke((Action)(() =>
                {
                    line = (line ?? "").Trim();
                    if (line.Length == 0) return;

                    // Log all incoming lines for debugging (except spam OKs)
                    if (!line.StartsWith("OK ")) Log(line);

                    HandleDeviceLine(line);
                }));

                _serial.Status += s => BeginInvoke((Action)(() =>
                {
                    lblStatus.Text = s;
                    Log("SYS STATUS: " + s);
                }));

                _serial.Error += ex => BeginInvoke((Action)(() =>
                {
                    Log("SERIAL_ERR: " + ex.Message);
                }));

                _serial.Open();
                _serial.SendLine("MODE ATTEND");

                ResetEnrollSession();
                ResetUiThrottles();

                lblStatus.Text = $"Connected {port}";
                SetUiStandby("CONNECTED");
                
                _wsServer?.Broadcast("DEVICE_CONNECTED");

                ResumeScanning();
                Log("SYS CONNECTED: " + port);
            }
            catch (Exception ex)
            {
                MessageBox.Show("Connect failed: " + ex.Message);
                Log("SYS CONNECT_FAIL: " + ex.Message);
                DisconnectDevice();
            }
        }

        private void DisconnectDevice()
        {
            PauseScanning();
            _tmrUiStandby.Stop();

            if (_serial != null)
            {
                try { _serial.Close(); } catch { }
                try { _serial.Dispose(); } catch { }
                _serial = null;
            }

            ResetEnrollSession();
            ResetUiThrottles();

            SetUiDisconnected();
            Log("SYS DISCONNECTED");
            _wsServer?.Broadcast("DEVICE_DISCONNECTED");
        }

        private bool IsDeviceReady() => _serial != null && _serial.IsOpen;

        private void PauseScanning()
        {
            try { tmrScan.Stop(); } catch { }
        }

        private void ResumeScanning()
        {
            // Scanning is now passive; tmrScan is disabled to prevent congestion.
            // if (IsDeviceReady() && !_isEnrolling)
            // {
            //     try { tmrScan.Start(); } catch { }
            // }
        }

        private void ResetEnrollSession()
        {
            _isEnrolling = false;
            _pendingEnrollId = 0;
            _pendingEnrollName = "";
            _pendingEnrollDept = "";
        }

        private void ResetUiThrottles()
        {
            _lastNoMatchUi = DateTime.MinValue;
            _lastMatchLogAt = DateTime.MinValue;
            _lastMatchEmpId = 0;
        }

        // Device line handling
        private string _lastReportedErr = "";
        private void HandleDeviceLine(string line)
        {
            var parts = line.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length < 2) return;

            var type = parts[0];
            var kind = parts[1];

            // Handle Device Errors on UI
            if (type == "ERR")
            {
                if (line == _lastReportedErr) return; // Suppress spam
                _lastReportedErr = line;

                lblBigStatus.Text = "SENSOR ERROR";
                SetIconWarning();
                
                // Human Readable Diagnostics
                if (line.Contains("SENSOR_NOT_RESPONDING") || line.Contains("PACKETRECIEVEERR") || line.EndsWith(" 1"))
                {
                    lblStatus.Text = "Hardware Connection Issue (Check Wires/USB)";
                    Log("SYS SENSOR_ERROR: Connection Failure");
                }
                else
                {
                    lblStatus.Text = "Error: " + line;
                }

                _wsServer?.Broadcast("DEBUG: Device Error " + line);
                return;
            }

            if (type == "OK")
            {
                if (kind == "READY" || kind == "BOOT")
                {
                    lblBigStatus.Text = "SCANNER READY";
                    lblStatus.Text = "Connected and Ready";
                    SetIconStandby();
                    Log("SYS SCANNER READY");
                    _wsServer?.Broadcast("SCANNER_READY");
                }
                return;
            }

            _lastReportedErr = ""; // Reset on event
            if (type != "EVENT") return;
            
            // Forward raw events to WS for debug (optional)
            // _wsServer?.Broadcast("DEBUG:" + line);

            if (kind == "ENROLL_OK" && parts.Length >= 3)
            {
                if (int.TryParse(parts[2], out int enrolledId))
                    HandleEnrollOk(enrolledId);
                return;
            }
            
            // Handle Enroll Progress/Fail
            if (kind == "ENROLL_FAIL") 
            {
                 _wsServer?.Broadcast("ENROLL_FAIL");
                 ResetEnrollSession();
                 SetUiStandby("ENROLL_FAIL");
                 ResumeScanning();
                 ScheduleStandbyReturn();
                 return;
            }
            
            if (kind == "ENROLL_Step1_OK") 
            {
                _wsServer?.Broadcast("ENROLL_PROGRESS:STEP_1");
            }
            else if (kind == "ENROLL_Step2_OK")
            {
                _wsServer?.Broadcast("ENROLL_PROGRESS:STEP_2");
            }

            if (_isEnrolling) return;

            if (kind == "MATCH" && parts.Length >= 5)
            {
                HandleMatch(parts);
                return;
            }

            if (kind == "NO_MATCH")
            {
                HandleNoMatchUi();
                return;
            }
        }

        private string FormatEmpId(int id) => $"Emp-{id:D3}";
        
        private void HandleMatch(string[] parts)
        {
            if (!int.TryParse(parts[2], out int rawBioId)) return;
            if (!int.TryParse(parts[3], out int confidence)) confidence = 0;

            string empId = FormatEmpId(rawBioId);
            var now = DateTime.Now;

            // Cooldown check to prevent multiple inserts for the same physical scan trigger
            if (rawBioId == _lastMatchEmpId && (now - _lastMatchLogAt).TotalSeconds < MATCH_COOLDOWN_SEC)
                return;

            _lastMatchEmpId = rawBioId;
            _lastMatchLogAt = now;

            try 
            {
                var name = DbGetEmployeeName(empId);
                
                // Websocket Broadcast Match - ALWAYS broadcast so the UI knows SOMEONE scanned
                _wsServer?.Broadcast($"SCAN_MATCH:{empId}|{name ?? "Unknown User"}");

                if (string.IsNullOrWhiteSpace(name))
                {
                    lblBigStatus.Text = $"NOT REGISTERED (ID {rawBioId})";
                    lblStatus.Text = "Unenrolled";
                    SetIconUnenrolled();

                    Log($"SYS NOT_REGISTERED: BioID {rawBioId} (Mapped to {empId})");
                    
                    try { _serial?.SendLine("LCD_UNENROLLED"); } catch { }
                    
                    ScheduleStandbyReturn();
                    return;
                }

                // Get the suggested card type (flexible logic, never returns null under normal conditions)
                var allowed = DbGetAllowedCardTypeForToday(empId, now, out var reason);
                
                if (allowed == null)
                {
                    // Backup safety (though DbGetAllowedCardTypeForToday is now designed to always return a type)
                    lblBigStatus.Text = "Scan Blocked";
                    lblStatus.Text = reason ?? "Policy violation";
                    SetIconWarning();

                    Log($"SYS BLOCKED: {empId} | {name} | {reason}");
                    try { _serial?.SendLine($"LCD_BLOCK {name}|{reason}"); } catch { }
                    ScheduleStandbyReturn();
                    return;
                }

                // Double Log Strategy: Insert to BOTH biometric-dedicated and HR-general logs
                DbInsertBioAttendance(empId, allowed, now);
                DbInsertHrAttendance(empId, allowed, now);

                lblBigStatus.Text = $"{allowed} - {name}";
                lblStatus.Text = $"Logged {now:yyyy-MM-dd HH:mm:ss}";
                SetIconSuccess();

                Log($"SYS LOGGED: {empId} | {name} | {allowed}");
                
                // Build LCD_INFO with First-In/Current-Out data
                var timeInStr = "--:--";
                var timeOutStr = "--:--";

                if (allowed == "IN")
                {
                    timeInStr = now.ToString("hh:mmtt");
                }
                else
                {
                    var timeIn = DbGetTimeInForToday(empId, now);
                    timeInStr = timeIn?.ToString("hh:mmtt") ?? "--:--";
                    timeOutStr = now.ToString("hh:mmtt");
                }

                var lcdName = name!.Length > 12 ? name!.Substring(0, 12) : name;
                var lcdDate = now.ToString("MM/dd");
                var lcdTime = now.ToString("hh:mmtt");

                try 
                { 
                    _serial?.SendLine($"LCD_INFO {empId}|{lcdName}|{lcdDate}|{lcdTime}|{allowed}|{timeInStr}|{timeOutStr}"); 
                } 
                catch (Exception ex)
                {
                    Log("LCD_WRITE_FAIL: " + ex.Message);
                }
                
                ScheduleStandbyReturn();
            }
            catch (Exception ex)
            {
                lblBigStatus.Text = "DB ERROR";
                lblStatus.Text = "Scan failed to log";
                SetIconWarning();
                Log("DB_ERR HANDLE_MATCH: " + ex.Message);
                ScheduleStandbyReturn();
            }
        }

        private void HandleNoMatchUi()
        {
            var now = DateTime.Now;
            if ((now - _lastNoMatchUi).TotalSeconds < NO_MATCH_UI_THROTTLE_SEC) return;

            _lastNoMatchUi = now;
            lblBigStatus.Text = "NOT ENROLLED";
            lblStatus.Text = "Try again";
            SetIconUnenrolled();
            
            _wsServer?.Broadcast("SCAN_NO_MATCH");

            try { _serial?.SendLine("LCD_UNENROLLED"); } catch { }

            Log("SYS NO_MATCH");
            ScheduleStandbyReturn();
        }

        private void ScheduleStandbyReturn()
        {
            if (_isEnrolling) return;
            if (!IsDeviceReady()) return;

            _tmrUiStandby.Stop();
            _tmrUiStandby.Start();
        }

        private void SetUiStandby(string reasonTag)
        {
            lblBigStatus.Text = "SCANNER READY";
            lblStatus.Text = "Standby";
            SetIconStandby();
            Log("SYS STANDBY: " + reasonTag);
        }

        private void SetUiDisconnected()
        {
            lblStatus.Text = "Disconnected";
            lblBigStatus.Text = "DISCONNECTED";
            SetIconStandby();
        }

        // Enrollment
        private void StartEnrollment(int id, string fullName, string department)
        {
            if (!IsDeviceReady())
            {
                // MessageBox.Show("Device not connected."); // REMOVED BLOCKING UI
                _wsServer?.Broadcast("ENROLL_ERROR:Device Not Connected");
                return;
            }

            if (_isEnrolling)
            {
                // Already enrolling
                _wsServer?.Broadcast("ENROLL_ERROR:Enrollment Busy");
                return;
            }

            PauseScanning();
            _tmrUiStandby.Stop();

            _isEnrolling = true;
            _pendingEnrollId = id;
            _pendingEnrollName = (fullName ?? "").Trim();
            _pendingEnrollDept = (department ?? "").Trim();

            lblBigStatus.Text = $"ENROLLING ID {id}";
            lblStatus.Text = "Place finger on scanner";
            SetIconWarning();
            
            _wsServer?.Broadcast("ENROLL_STARTED");

            Log($"SYS ENROLL_START: {id} | {_pendingEnrollName} | {_pendingEnrollDept}");

            try
            {
                _serial?.SendLine("MODE ENROLL");
                
                // 100% FIX: Clear the specific slot before enrolling!
                // This ensures re-registration works even if the sensor still has old template data.
                Log($"HW EMPTY {id}");
                _serial?.SendLine($"EMPTY {id}");
                
                // Hardware library sync delay
                System.Threading.Thread.Sleep(500); 

                _serial?.SendLine($"ENROLL {id}");
            }
            catch (Exception ex)
            {
                ResetEnrollSession();

                // MessageBox.Show("Enroll command failed: " + ex.Message); // REMOVED BLOCKING UI
                Log("SYS ENROLL_CMD_FAIL: " + ex.Message);
                
                _wsServer?.Broadcast("ENROLL_ERROR:" + ex.Message);

                SetUiStandby("ENROLL_CMD_FAIL");
                ResumeScanning();
            }
        }

        private void HandleEnrollOk(int rawEnrolledId)
        {
            if (!_isEnrolling || rawEnrolledId != _pendingEnrollId)
            {
                Log($"SYS ENROLL_OK (IGNORED): {rawEnrolledId}");
                return;
            }

            string empId = FormatEmpId(rawEnrolledId);

            try
            {
                DbUpsertEnrolledUser(empId, _pendingEnrollName, _pendingEnrollDept);

                // COOLDOWN FIX: Immediately update match throttles so the middleware
                // ignores any "ghost" scan that happens before the user removes their finger.
                _lastMatchEmpId = rawEnrolledId;
                _lastMatchLogAt = DateTime.Now;

                lblBigStatus.Text = $"✅ ENROLLED ID {empId}";
                lblStatus.Text = "Saved";
                SetIconSuccess();
                
                _wsServer?.Broadcast("ENROLL_SUCCESS");

                Log($"SYS ENROLL_SAVED: {empId} | {_pendingEnrollName}");
            }
            catch (Exception ex)
            {
                MessageBox.Show("DB save failed: " + ex.Message);

                lblStatus.Text = "DB save failed";
                SetIconWarning();
                
                _wsServer?.Broadcast("ENROLL_ERROR:DB_SAVE_FAIL");

                Log("DB_ERR ENROLL_SAVE: " + ex.Message);
            }
            finally
            {
                ResetEnrollSession();

                try { _serial?.SendLine("MODE ATTEND"); } catch { }

                SetUiStandby("ENROLL_DONE");
                ResumeScanning();
                ScheduleStandbyReturn();
            }
        }

        // DB operations (Existing Code...)
        private int DbGetNextAvailableEmployeeId()
        {
            using var con = new MySqlConnection(_cs);
            con.Open();

            using var cmd = con.CreateCommand();
            // Handle both 'Emp-1' and '1' formats for ID sequence detection
            cmd.CommandText = @"
                SELECT DISTINCT CAST(REGEXP_REPLACE(employee_id, '[^0-9]', '') AS UNSIGNED) as id
                FROM bio_enrolled_users
                ORDER BY id ASC";

            using var r = cmd.ExecuteReader();
            int expected = 1;

            while (r.Read())
            {
                int id = Convert.ToInt32(r["id"]);
                if (id == expected) expected++;
                else if (id > expected) break;
            }

            if (expected > 200) throw new Exception("No available biometric slots (1–200) left.");
            return expected;
        }

        private void DbUpsertEnrolledUser(string employeeId, string fullName, string department)
        {
            using var con = new MySqlConnection(_cs);
            con.Open();

            using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                INSERT INTO bio_enrolled_users(employee_id, full_name, department, user_status)
                VALUES(@id,@name,@dept,'active')
                ON DUPLICATE KEY UPDATE
                full_name=VALUES(full_name),
                department=VALUES(department),
                user_status='active',
                updated_at=NOW()";
            cmd.Parameters.AddWithValue("@id", employeeId);
            cmd.Parameters.AddWithValue("@name", fullName);
            cmd.Parameters.AddWithValue("@dept", department);
            cmd.ExecuteNonQuery();
        }


        private string? DbGetEmployeeName(string employeeId)
        {
            using var con = new MySqlConnection(_cs);
            con.Open();

            using var cmd = con.CreateCommand();
            // Robust lookup: try literal match first, then numeric normalization if needed
            cmd.CommandText = @"
                SELECT full_name
                FROM bio_enrolled_users
                WHERE (employee_id=@id OR CAST(REGEXP_REPLACE(employee_id, '[^0-9]', '') AS UNSIGNED) = CAST(REGEXP_REPLACE(@id, '[^0-9]', '') AS UNSIGNED))
                  AND user_status='active'
                LIMIT 1";
            cmd.Parameters.AddWithValue("@id", employeeId);

            var val = cmd.ExecuteScalar();
            return val?.ToString();
        }

        private string DbGetAllowedCardTypeForToday(string employeeId, DateTime now, out string? blockReason)
        {
            blockReason = null;

            using var con = new MySqlConnection(_cs);
            con.Open();

            using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                SELECT
                  SUM(card_type='IN')  AS in_count,
                  SUM(card_type='OUT') AS out_count
                FROM bio_attendance_logs
                WHERE employee_id=@id AND log_date=@d";
            cmd.Parameters.AddWithValue("@id", employeeId);
            cmd.Parameters.AddWithValue("@d", now.Date);

            using var r = cmd.ExecuteReader();
            int inCount = 0, outCount = 0;

            if (r.Read())
            {
                inCount = r.IsDBNull(0) ? 0 : Convert.ToInt32(r.GetValue(0));
                outCount = r.IsDBNull(1) ? 0 : Convert.ToInt32(r.GetValue(1));
            }

            // FLEXIBLE LOGIC:
            // 1. No logs yet? -> Suggest IN
            if (inCount == 0) return "IN";
            
            // 2. Already has IN but no OUT? -> Suggest OUT
            if (outCount == 0) return "OUT";

            // 3. Already has both? -> Default to OUT (allows re-logging exit time)
            // This ensures they are never locked out of the system.
            return "OUT";
        }

        private void DbInsertBioAttendance(string employeeId, string cardType, DateTime now)
        {
            using var con = new MySqlConnection(_cs);
            con.Open();

            using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                INSERT INTO bio_attendance_logs(employee_id, card_type, log_date, log_time)
                VALUES(@id,@ct,@d,@t)";
            cmd.Parameters.AddWithValue("@id", employeeId);
            cmd.Parameters.AddWithValue("@ct", cardType);
            cmd.Parameters.AddWithValue("@d", now.ToString("yyyy-MM-dd"));
            cmd.Parameters.AddWithValue("@t", now.ToString("HH:mm:ss"));
            cmd.ExecuteNonQuery();
        }

        private void DbInsertHrAttendance(string employeeId, string cardType, DateTime now)
        {
            using var con = new MySqlConnection(_cs);
            con.Open();

            using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                INSERT INTO attendance_logs(employee_id, scan_time, type, source)
                VALUES(@eid,@scan,@type,'BIOMETRIC')";
            cmd.Parameters.AddWithValue("@eid", employeeId);
            cmd.Parameters.AddWithValue("@scan", now.ToString("yyyy-MM-dd HH:mm:ss"));
            cmd.Parameters.AddWithValue("@type", cardType);
            cmd.ExecuteNonQuery();
        }

        private DateTime? DbGetTimeInForToday(string employeeId, DateTime now)
        {
            using var con = new MySqlConnection(_cs);
            con.Open();

            using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                SELECT log_time
                FROM bio_attendance_logs
                WHERE employee_id=@id AND log_date=@d AND card_type='IN'
                ORDER BY log_time ASC
                LIMIT 1";
            cmd.Parameters.AddWithValue("@id", employeeId);
            cmd.Parameters.AddWithValue("@d", now.Date);

            var val = cmd.ExecuteScalar();
            if (val == null || val is DBNull) return null;

            if (val is TimeSpan ts)
                return now.Date.Add(ts);

            return null;
        }

        // Icons
        private void LoadIcons()
        {
            var baseDir = AppDomain.CurrentDomain.BaseDirectory;

            _icoStandby = LoadImageSafe(Path.Combine(baseDir, "Assets", "standby.png"));
            _icoSuccess = LoadImageSafe(Path.Combine(baseDir, "Assets", "success.png"));
            _icoUnenrolled = LoadImageSafe(Path.Combine(baseDir, "Assets", "unenrolled.png"));
            _icoWarning = LoadImageSafe(Path.Combine(baseDir, "Assets", "warning.png"));

            picStats.SizeMode = PictureBoxSizeMode.Zoom;

            if (_icoStandby == null) Log("SYS ICON_MISSING: Assets/standby.png");
            if (_icoSuccess == null) Log("SYS ICON_MISSING: Assets/success.png");
            if (_icoUnenrolled == null) Log("SYS ICON_MISSING: Assets/unenrolled.png");
            if (_icoWarning == null) Log("SYS ICON_MISSING: Assets/warning.png");
        }

        private static Image? LoadImageSafe(string path)
        {
            if (!File.Exists(path)) return null;

            var bytes = File.ReadAllBytes(path);
            using var ms = new MemoryStream(bytes);
            return Image.FromStream(ms);
        }

        private void SetIcon(Image? img)
        {
            if (img == null) return;
            picStats.Image = img;
        }

        private void SetIconStandby() => SetIcon(_icoStandby ?? _icoWarning);
        private void SetIconSuccess() => SetIcon(_icoSuccess);
        private void SetIconUnenrolled() => SetIcon(_icoUnenrolled);
        private void SetIconWarning() => SetIcon(_icoWarning);

        // Utils
        private void Log(string msg)
        {
            if (lstLog.Items.Count > 1500) lstLog.Items.Clear();
            lstLog.Items.Add($"{DateTime.Now:HH:mm:ss} {msg}");
            lstLog.TopIndex = lstLog.Items.Count - 1;

            try
            {
                File.AppendAllText("bio_debug.log", $"{DateTime.Now:yyyy-MM-dd HH:mm:ss} {msg}{Environment.NewLine}");
            }
            catch { }
        }

        private void HandleResetDevice()
        {
            this.Invoke((MethodInvoker)delegate
            {
                if (!IsDeviceReady()) return;

                PauseScanning();
                try
                {
                    _serial!.SendLine("EMPTY"); // Clears sensor library
                    
                    using var con = new MySqlConnection(_cs);
                    con.Open();
                    using var cmd = con.CreateCommand();
                    cmd.CommandText = "SET FOREIGN_KEY_CHECKS=0; TRUNCATE TABLE bio_enrolled_users; TRUNCATE TABLE bio_attendance_logs; SET FOREIGN_KEY_CHECKS=1;";
                    cmd.ExecuteNonQuery();

                    _wsServer?.Broadcast("DEVICE_RESET_SUCCESS");
                    lblBigStatus.Text = "DEVICE RESET";
                    lblStatus.Text = "Database & Scanner Cleared";
                    Log("SYS RESET_OK: Scanner and DB cleared.");
                }
                catch (Exception ex)
                {
                    _wsServer?.Broadcast("DEVICE_RESET_ERROR:" + ex.Message);
                    Log("SYS RESET_FAIL: " + ex.Message);
                }
                finally
                {
                    ResumeScanning();
                    ScheduleStandbyReturn();
                }
            });
        }

        protected override void OnFormClosed(FormClosedEventArgs e)
        {
            base.OnFormClosed(e);
            try 
            {
               _tmrUiStandby.Stop();
               _wsServer?.Dispose(); // Stop WS Server
            } 
            catch { }
            DisconnectDevice();
        }
    }
}
