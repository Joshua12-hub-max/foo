using System;
using System.IO.Ports;
using System.Text;

namespace BioMiddleware.Services
{
    /// <summary>
    /// Line-based SerialPort wrapper:
    /// - Raises LineReceived per newline
    /// - Sends text commands with newline
    /// </summary>
    public sealed class SerialDeviceService : IDisposable
    {
        private readonly SerialPort _port;
        private readonly StringBuilder _buffer = new StringBuilder();

        public event Action<string>? LineReceived;
        public event Action<string>? Status;
        public event Action<Exception>? Error;

        public bool IsOpen => _port.IsOpen;

        public SerialDeviceService(string comPort, int baudRate)
        {
            _port = new SerialPort(comPort, baudRate)
            {
                NewLine = "\n",
                Encoding = Encoding.ASCII,
                ReadTimeout = 5000,   // Increased from 500ms to 5000ms (5 seconds)
                WriteTimeout = 5000,  // Increased from 500ms to 5000ms (5 seconds)
                DtrEnable = true,
                RtsEnable = true
            };

            _port.DataReceived += OnDataReceived;
        }

        public void Open()
        {
            if (_port.IsOpen) return;
            _port.Open();
            try { _port.DiscardInBuffer(); } catch { }
            try { _port.DiscardOutBuffer(); } catch { }
            Status?.Invoke($"OPEN {_port.PortName} @{_port.BaudRate}");
        }

        public void Close()
        {
            if (!_port.IsOpen) return;
            _port.Close();
            Status?.Invoke("CLOSED");
        }

        public void SendLine(string line)
        {
            if (!_port.IsOpen) throw new InvalidOperationException("Serial port not open.");
            _port.WriteLine(line);
        }

        private void OnDataReceived(object sender, SerialDataReceivedEventArgs e)
        {
            try
            {
                var incoming = _port.ReadExisting();
                if (string.IsNullOrEmpty(incoming)) return;

                foreach (char ch in incoming)
                {
                    if (ch == '\r') continue;

                    if (ch == '\n')
                    {
                        var line = _buffer.ToString().Trim();
                        _buffer.Clear();
                        if (line.Length > 0) LineReceived?.Invoke(line);
                    }
                    else
                    {
                        if (_buffer.Length < 512) _buffer.Append(ch);
                    }
                }
            }
            catch (Exception ex)
            {
                Error?.Invoke(ex);
            }
        }

        public void Dispose()
        {
            try { _port.DataReceived -= OnDataReceived; } catch { }
            try { if (_port.IsOpen) _port.Close(); } catch { }
            _port.Dispose();
        }
    }
}
