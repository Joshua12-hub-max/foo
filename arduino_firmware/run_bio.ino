#include <SoftwareSerial.h>
#include <Adafruit_Fingerprint.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

/* ============================================================
   HARDWARE CONFIG
   ============================================================ */
// Fingerprint Sensor
static const uint8_t PIN_FP_RX = 2; // Arduino RX  (from sensor TX)
static const uint8_t PIN_FP_TX = 3; // Arduino TX  (to sensor RX)
static const uint32_t FP_BAUD  = 57600;

// PC serial (C#) baud
static const uint32_t HOST_BAUD = 115200;

// LCD Setup: Address 0x27, 20 columns, 4 rows
LiquidCrystal_I2C lcd(0x27, 20, 4);

/* ============================================================
   SERIAL + SENSOR
   ============================================================ */
SoftwareSerial fpSerial(PIN_FP_RX, PIN_FP_TX);
Adafruit_Fingerprint finger(&fpSerial);

/* ============================================================
   MODE + CLOCK
   ============================================================ */
enum class Mode : uint8_t { ENROLL, ATTEND };
Mode g_mode = Mode::ATTEND;

bool     g_timeSet = false;
uint32_t g_epochAtSet = 0;
uint32_t g_millisAtSet = 0;

uint32_t nowEpoch() {
  if (!g_timeSet) return 0;
  uint32_t elapsedSec = (millis() - g_millisAtSet) / 1000UL;
  return g_epochAtSet + elapsedSec;
}

/* ============================================================
   LCD HELPER & DISPLAY STATE
   ============================================================ */
uint32_t g_lcdMessageTimer = 0;
bool g_isTempMessage = false;

void updateLCD(const String &line1, const String &line2 = "", const String &line3 = "", const String &line4 = "") {
  lcd.clear();
  lcd.setCursor(0, 0); lcd.print(line1);
  lcd.setCursor(0, 1); lcd.print(line2);
  lcd.setCursor(0, 2); lcd.print(line3);
  lcd.setCursor(0, 3); lcd.print(line4);
}

void showTempLCD(const String &l1, const String &l2, const String &l3, const String &l4, uint32_t durationMs) {
  updateLCD(l1, l2, l3, l4);
  g_lcdMessageTimer = millis() + durationMs;
  g_isTempMessage = true;
}

void setIdleLCD() {
  g_isTempMessage = false;
  if (g_mode == Mode::ATTEND) {
    updateLCD("== SYSTEM READY ==", "Mode: ATTENDANCE", "Waiting for finger..", "");
  } else {
    updateLCD("== SYSTEM READY ==", "Mode: ENROLLMENT", "Awaiting Command...", "");
  }
}

void tickLCD() {
  if (g_isTempMessage && millis() > g_lcdMessageTimer) {
    setIdleLCD();
  }
}

/* ============================================================
   ENROLL STATE MACHINE
   ============================================================ */
enum class EnrollState : uint8_t {
  IDLE, WAIT_FIRST_FINGER, CONVERT_FIRST, WAIT_REMOVE,
  WAIT_SECOND_FINGER, CONVERT_SECOND, CREATE_MODEL, STORE_MODEL, DONE
};

EnrollState g_enrollState = EnrollState::IDLE;
uint16_t     g_enrollId = 0;
uint32_t     g_enrollStateSinceMs = 0;

void sendOK(const String &msg)  { Serial.println("OK " + msg); }
void sendERR(int code, const String &msg) {
  Serial.print("ERR "); Serial.print(code); Serial.print(" ");
  Serial.println(msg);
}
void sendEVENT(const String &msg) { Serial.println("EVENT " + msg); }

/* ============================================================
   INPUT PARSER
   ============================================================ */
String g_line;

String nextToken(String &s) {
  s.trim();
  int sp = s.indexOf(' ');
  // Use '|' character limit for special LCD commands
  if (s.startsWith("LCD_MATCH") || s.startsWith("LCD_BLOCK")) {
      sp = s.indexOf('|');
  }

  if (sp < 0) { String t = s; s = ""; return t; }
  String t = s.substring(0, sp);
  s = s.substring(sp + 1);
  s.trim();
  return t;
}

bool isUInt(const String &s) {
  if (s.length() == 0) return false;
  for (uint16_t i=0;i<s.length();i++) if (!isDigit(s[i])) return false;
  return true;
}

/* ============================================================
   FINGERPRINT OPS
   ============================================================ */
bool ensureSensorReady() {
  if (!finger.verifyPassword()) {
    updateLCD("SENSOR ERROR", "Not Responding", "Please check wiring", "");
    sendERR(100, "SENSOR_NOT_RESPONDING");
    return false;
  }
  return true;
}

void startEnroll(uint16_t id) {
  g_enrollId = id;
  g_enrollState = EnrollState::WAIT_FIRST_FINGER;
  g_enrollStateSinceMs = millis();
  updateLCD("ENROLLING ID: " + String(id), "Step 1: Place Finger", "", "");
}

void resetEnroll(const String &why) {
  g_enrollState = EnrollState::IDLE;
  g_enrollId = 0;
  showTempLCD("ENROLL ABORTED", why, "", "", 3000);
  sendEVENT("ENROLL_FAIL " + why); 
}

void doScanOnce(bool emitNoMatch) {
  int p = finger.getImage();
  if (p == FINGERPRINT_NOFINGER) return;

  if (p != FINGERPRINT_OK) {
    showTempLCD("SCAN ERROR", "Failed Image", "", "", 2000);
    sendERR(300, "GETIMAGE_FAIL " + String(p));
    return;
  }

  p = finger.image2Tz();
  if (p != FINGERPRINT_OK) {
    showTempLCD("SCAN ERROR", "Conversion Failed", "", "", 2000);
    sendERR(301, "IMAGE2TZ_FAIL " + String(p));
    return;
  }

  p = finger.fingerSearch();
  uint32_t ts = nowEpoch();

  if (p == FINGERPRINT_OK) {
    // Shows temporary ID while waiting for C# Middleware to reply with Name & IN/OUT
    showTempLCD("Verifying ID: " + String(finger.fingerID), "Please Wait...", "", "", 2000);
    Serial.print("EVENT MATCH ");
    Serial.print(finger.fingerID);
    Serial.print(" ");
    Serial.print(finger.confidence);
    Serial.print(" ");
    Serial.println(ts); 
  } else if (p == FINGERPRINT_NOTFOUND) {
    showTempLCD("NO MATCH FOUND", "Please try again", "", "", 2500);
    if (emitNoMatch) {
      Serial.print("EVENT NO_MATCH ");
      Serial.println(ts);
    }
  } else {
    showTempLCD("SEARCH ERROR", "Sensor error: " + String(p), "", "", 2000);
    sendERR(302, "SEARCH_FAIL " + String(p));
  }

  updateLCD("REMOVE FINGER", "Please...", "", "");
  while (finger.getImage() != FINGERPRINT_NOFINGER) delay(40);
  
  if(!g_isTempMessage) setIdleLCD(); 
}

/* ============================================================
   ENROLL TICK
   ============================================================ */
void tickEnroll() {
  if (g_enrollState == EnrollState::IDLE) return;

  if (millis() - g_enrollStateSinceMs > 60000UL) {
    resetEnroll("TIMEOUT");
    return;
  }

  int p;  

  switch (g_enrollState) {

    case EnrollState::WAIT_FIRST_FINGER:
      p = finger.getImage();
      if (p == FINGERPRINT_NOFINGER) return;
      if (p != FINGERPRINT_OK) { resetEnroll("GETIMAGE1_FAIL"); return; }
      g_enrollState = EnrollState::CONVERT_FIRST;
      break;

    case EnrollState::CONVERT_FIRST:
      p = finger.image2Tz(1);
      if (p != FINGERPRINT_OK) { resetEnroll("CONVERT1_FAIL"); return; }
      sendEVENT("ENROLL_Step1_OK"); 
      updateLCD("REMOVE FINGER", "Step 2: Remove", "", "");
      g_enrollState = EnrollState::WAIT_REMOVE;
      break;

    case EnrollState::WAIT_REMOVE:
      p = finger.getImage();
      if (p != FINGERPRINT_NOFINGER) return;
      updateLCD("PLACE FINGER AGAIN", "Step 3: Verify", "", "");
      g_enrollState = EnrollState::WAIT_SECOND_FINGER;
      break;

    case EnrollState::WAIT_SECOND_FINGER:
      p = finger.getImage();
      if (p == FINGERPRINT_NOFINGER) return;
      if (p != FINGERPRINT_OK) { resetEnroll("GETIMAGE2_FAIL"); return; }
      g_enrollState = EnrollState::CONVERT_SECOND;
      break;

    case EnrollState::CONVERT_SECOND:
      p = finger.image2Tz(2);
      if (p != FINGERPRINT_OK) { resetEnroll("CONVERT2_FAIL"); return; }
      sendEVENT("ENROLL_Step2_OK"); 
      g_enrollState = EnrollState::CREATE_MODEL;
      break;

    case EnrollState::CREATE_MODEL:
      p = finger.createModel();
      if (p != FINGERPRINT_OK) { 
        if (p == FINGERPRINT_ENROLLMISMATCH) resetEnroll("FINGERS_DONT_MATCH");
        else resetEnroll("MODEL_FAIL"); 
        return; 
      }
      g_enrollState = EnrollState::STORE_MODEL;
      break;

    case EnrollState::STORE_MODEL:
      p = finger.storeModel(g_enrollId);
      if (p != FINGERPRINT_OK) { resetEnroll("STORE_FAIL"); return; }
      Serial.print("EVENT ENROLL_OK ");
      Serial.println(g_enrollId);
      g_enrollState = EnrollState::DONE;
      break;

    case EnrollState::DONE:
      g_enrollState = EnrollState::IDLE;
      g_enrollId = 0;
      showTempLCD("ENROLL SUCCESS!", "ID saved.", "", "", 3000);
      break;

    default:
      resetEnroll("UNKNOWN_STATE");
      break;
  }
}

/* ============================================================
   COMMAND HANDLER
   ============================================================ */
bool g_waitingWipeConfirm = false;

void handleLine(String line) {
  line.trim();
  if (line.length() == 0) return;

  String work = line;
  String cmd = nextToken(work);
  cmd.toUpperCase();

  // -------- NEW LCD COMMANDS (Sent by C# Middleware) ---------
  if (cmd == "LCD_MATCH") {
      String empName = nextToken(work); // Uses | as delimiter
      String inOutStatus = work;        // The rest of the string
      
      String line1 = "Hello, " + empName.substring(0, 12) + "!";
      String line2 = "Status: TIME " + inOutStatus;
      String line3 = "Logged Successfully";
      
      // Iapakita sa LCD nang 4 seconds bago bumalik sa Standby
      showTempLCD(line1, line2, line3, "", 4000);
      return;
  }
  
  if (cmd == "LCD_BLOCK") {
      String empName = nextToken(work); // Uses | as delimiter
      String reason = work;             // The rest of the string
      
      String line1 = empName.substring(0, 15);
      showTempLCD("ALREADY LOGGED!", line1, reason, "", 4000);
      return;
  }
  
  if (cmd == "LCD_UNENROLLED") {
      showTempLCD("UNREGISTERED USER", "Biometrics Name", "Not Found in DB", "", 3500);
      return;
  }
  // ----------------------------------------------------------

  if (g_waitingWipeConfirm) {
    if (cmd == "YES") {
      updateLCD("WIPING DB...", "Please Wait", "", "");
      int p = finger.emptyDatabase();
      if (p == FINGERPRINT_OK) {
        showTempLCD("DATABASE WIPED!", "All cleared.", "", "", 3000);
        sendOK("WIPE_OK");
      } else {
        showTempLCD("WIPE FAILED", "Error Code: " + String(p), "", "", 3000);
        sendERR(410, "WIPE_FAIL " + String(p));
      }
    } else {
      showTempLCD("WIPE CANCELLED", "", "", "", 2000);
      sendOK("WIPE_CANCELLED");
    }
    g_waitingWipeConfirm = false;
    return;
  }

  if (cmd == "PING") { sendOK("PONG"); return; }

  if (cmd == "SCAN") {
    if (g_mode == Mode::ATTEND) { 
        sendOK("SCAN_IGNORED_AUTO_RUNNING"); 
        return; 
    }
    sendOK("SCAN_START");
    doScanOnce(true);
    sendOK("SCAN_DONE");
    return;
  }

  if (cmd == "MODE") {
    String m = nextToken(work);
    m.toUpperCase();
    if (m == "ENROLL") { g_mode = Mode::ENROLL; setIdleLCD(); sendOK("MODE_ENROLL"); return; }
    if (m == "ATTEND") { g_mode = Mode::ATTEND; setIdleLCD(); sendOK("MODE_ATTEND"); return; }
    sendERR(120, "BAD_MODE");
    return;
  }

  if (cmd == "TIME") {
    String t = nextToken(work);
    if (!isUInt(t)) { sendERR(121, "BAD_TIME"); return; }
    g_epochAtSet = (uint32_t)t.toInt();
    g_millisAtSet = millis();
    g_timeSet = true;
    showTempLCD("TIME SYNCHRONIZED", "Epoch updated.", "", "", 2000);
    sendOK("TIME_SET");
    return;
  }

  if (cmd == "ENROLL") {
    if (g_mode != Mode::ENROLL) { sendERR(130, "NOT_IN_ENROLL_MODE"); return; }
    if (g_enrollState != EnrollState::IDLE) { sendERR(131, "ENROLL_BUSY"); return; }

    String idStr = nextToken(work);
    if (!isUInt(idStr)) { sendERR(132, "BAD_ID"); return; }
    uint16_t id = (uint16_t)idStr.toInt();

    if (id < 1 || id > 200) { 
      sendERR(133, "ID_OUT_OF_RANGE_1_200");
      return;
    }

    startEnroll(id);
    return;
  }

  if (cmd == "DELETE") {
    String idStr = nextToken(work);
    if (!isUInt(idStr)) { sendERR(140, "BAD_ID"); return; }
    uint16_t id = (uint16_t)idStr.toInt();

    int p = finger.deleteModel(id);
    if (p == FINGERPRINT_OK) {
      showTempLCD("DELETE SUCCESS", "User ID: " + String(id), "", "", 2000);
      sendOK("DELETE_OK");
    } else {
      showTempLCD("DELETE FAILED", "Not Found or Error", "", "", 2000);
      sendERR(141, "DELETE_FAIL " + String(p));
    }
    return;
  }

  if (cmd == "COUNT") {
    int p = finger.getTemplateCount();
    if (p == FINGERPRINT_OK) {
      showTempLCD("TOTAL USERS:", String(finger.templateCount), "", "", 3000);
      Serial.print("OK COUNT ");
      Serial.println(finger.templateCount);
    } else {
      sendERR(150, "COUNT_FAIL " + String(p));
    }
    return;
  }
  
  if (cmd == "HELP") {
    sendOK("CMDS: PING, HELP, MODE ENROLL|ATTEND, TIME <epoch>, ENROLL <id>, SCAN, DELETE <id>, COUNT, WIPE");
    return;
  }

  if (cmd == "WIPE") {
    updateLCD("WIPE DATABASE?", "Send YES to Confirm", "", "");
    Serial.println("OK CONFIRM WIPE");
    g_waitingWipeConfirm = true;
    return;
  }

  sendERR(199, "UNKNOWN_CMD");
}

/* ============================================================
   SETUP / LOOP
   ============================================================ */
void setup() {
  Serial.begin(HOST_BAUD);
  
  lcd.init();
  lcd.backlight();
  updateLCD("Initializing...", "Fingerprint System", "Starting UP", "");
  
  delay(800);

  fpSerial.begin(FP_BAUD);
  finger.begin(FP_BAUD);

  Serial.println("OK BOOT");

  if (!ensureSensorReady()) { return; }

  finger.getParameters();
  
  Serial.print("OK SENSOR CAPACITY ");
  Serial.println(finger.capacity);

  sendOK("READY");
  setIdleLCD();
}

void loop() {
  tickLCD();

  while (Serial.available()) {
    char c = (char)Serial.read();
    if (c == '\r') continue;
    if (c == '\n') {
      handleLine(g_line);
      g_line = "";
    } else {
      if (g_line.length() < 120) g_line += c;
    }
  }

  if (g_mode == Mode::ENROLL) {
    tickEnroll();
    return;
  }

  if (g_mode == Mode::ATTEND) {
    doScanOnce(false);
    delay(40);
  }
}
