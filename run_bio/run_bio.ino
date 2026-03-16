#include <SoftwareSerial.h>  
#include <Adafruit_Fingerprint.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

/* ============================================================
   HARDWARE CONFIG
   ============================================================ */
static const uint8_t PIN_FP_RX = 2; 
static const uint8_t PIN_FP_TX = 3; 
static const uint32_t FP_BAUD  = 57600;
static const uint32_t HOST_BAUD = 115200;

LiquidCrystal_I2C lcd(0x27, 20, 4);

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
  return g_epochAtSet + ((millis() - g_millisAtSet) / 1000UL);
}

/* ============================================================
   LCD HELPER & DISPLAY STATE
   ============================================================ */
uint32_t g_lcdMessageTimer = 0;
bool g_isTempMessage = false;

// Optimization: Use __FlashStringHelper* to save RAM
void updateLCD(const __FlashStringHelper* l1, const char* l2 = "", const char* l3 = "", const char* l4 = "") {
  lcd.clear();
  delay(2);
  lcd.setCursor(0, 0); lcd.print(l1);
  lcd.setCursor(0, 1); lcd.print(l2);
  lcd.setCursor(0, 2); lcd.print(l3);
  lcd.setCursor(0, 3); lcd.print(l4);
}

void showTempLCD(const __FlashStringHelper* l1, const char* l2, uint32_t durationMs) {
  lcd.clear();
  lcd.setCursor(0, 0); lcd.print(l1);
  lcd.setCursor(0, 1); lcd.print(l2);
  g_lcdMessageTimer = millis() + durationMs;
  g_isTempMessage = true;
}

void setIdleLCD() {
  g_isTempMessage = false;
  lcd.clear();
  lcd.setCursor(0, 0); 
  lcd.print(F("== SYSTEM READY =="));
  lcd.setCursor(0, 1);
  if (g_mode == Mode::ATTEND) lcd.print(F("Mode: ATTENDANCE"));
  else lcd.print(F("Mode: ENROLLMENT"));
  lcd.setCursor(0, 2);
  lcd.print(F("Waiting for finger.."));
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

void sendOK(const __FlashStringHelper* msg) { Serial.print(F("OK ")); Serial.println(msg); }
void sendERR(int code, const __FlashStringHelper* msg) {
  Serial.print(F("ERR ")); Serial.print(code); Serial.print(F(" ")); Serial.println(msg);
}
void sendEVENT(const __FlashStringHelper* msg) { Serial.print(F("EVENT ")); Serial.println(msg); }

/* ============================================================
   INPUT PARSER (Memory Optimized)
   ============================================================ */
char g_line[64]; // Fixed buffer instead of String object
uint8_t g_lineIdx = 0;

void handleLine(char* line); 

/* ============================================================
   FINGERPRINT OPS
   ============================================================ */
bool ensureSensorReady() {
  if (!finger.verifyPassword()) {
    updateLCD(F("SENSOR ERROR"), "Not Responding", "Check wiring");
    sendERR(100, F("SENSOR_NOT_RESPONDING"));
    return false;
  }
  return true;
}

void startEnroll(uint16_t id) {
  g_enrollId = id;
  g_enrollState = EnrollState::WAIT_FIRST_FINGER;
  g_enrollStateSinceMs = millis();
  lcd.clear();
  lcd.setCursor(0, 0); lcd.print(F("ENROLLING ID: ")); lcd.print(id);
  lcd.setCursor(0, 1); lcd.print(F("Place Finger..."));
}

void resetEnroll(const __FlashStringHelper* why) {
  g_enrollState = EnrollState::IDLE;
  g_enrollId = 0;
  lcd.clear();
  lcd.print(F("ABORTED: ")); lcd.print(why);
  g_lcdMessageTimer = millis() + 3000;
  g_isTempMessage = true;
  Serial.print(F("EVENT ENROLL_FAIL ")); Serial.println(why);
}

bool doScanOnce(bool emitNoMatch) {
  int p = finger.getImage();
  if (p == FINGERPRINT_NOFINGER) return false;

  if (p != FINGERPRINT_OK) {
    showTempLCD(F("SCAN ERROR"), "Failed Image", 2000);
    return true; 
  }

  p = finger.image2Tz();
  if (p != FINGERPRINT_OK) {
    showTempLCD(F("SCAN ERROR"), "Conv. Failed", 2000);
    return true;
  }

  p = finger.fingerSearch();
  uint32_t ts = nowEpoch();

  if (p == FINGERPRINT_OK) {
    showTempLCD(F("VERIFYING..."), "", 2000);
    Serial.print(F("EVENT MATCH "));
    Serial.print(finger.fingerID);
    Serial.print(F(" "));
    Serial.print(finger.confidence);
    Serial.print(F(" "));
    Serial.println(ts); 
  } else if (p == FINGERPRINT_NOTFOUND) {
    showTempLCD(F("NO MATCH FOUND"), "Try again", 2500);
    if (emitNoMatch) {
      Serial.print(F("EVENT NO_MATCH "));
      Serial.println(ts);
    }
  }

  return true;
}

void waitForFingerRemoval() {
  uint32_t start = millis();
  while (finger.getImage() != FINGERPRINT_NOFINGER) {
    if (millis() - start > 5000) break;
    while (Serial.available()) {
      char c = (char)Serial.read();
      if (c == '\n') {
        g_line[g_lineIdx] = '\0';
        handleLine(g_line);
        g_lineIdx = 0;
      } else if (c != '\r' && g_lineIdx < 63) {
        g_line[g_lineIdx++] = c;
      }
    }
    delay(20);
  }
}

/* ============================================================
   ENROLL TICK
   ============================================================ */
void tickEnroll() {
  if (g_enrollState == EnrollState::IDLE) return;
  if (millis() - g_enrollStateSinceMs > 60000UL) { resetEnroll(F("TIMEOUT")); return; }

  int p;  
  switch (g_enrollState) {
    case EnrollState::WAIT_FIRST_FINGER:
      p = finger.getImage();
      if (p == FINGERPRINT_OK) g_enrollState = EnrollState::CONVERT_FIRST;
      break;
    case EnrollState::CONVERT_FIRST:
      if (finger.image2Tz(1) == FINGERPRINT_OK) {
        sendEVENT(F("ENROLL_Step1_OK")); 
        updateLCD(F("REMOVE FINGER"), "Step 2: Remove");
        g_enrollState = EnrollState::WAIT_REMOVE;
      } else resetEnroll(F("CONVERT1_FAIL"));
      break;
    case EnrollState::WAIT_REMOVE:
      if (finger.getImage() == FINGERPRINT_NOFINGER) {
        updateLCD(F("PLACE AGAIN"), "Step 3: Verify");
        g_enrollState = EnrollState::WAIT_SECOND_FINGER;
      }
      break;
    case EnrollState::WAIT_SECOND_FINGER:
      if (finger.getImage() == FINGERPRINT_OK) g_enrollState = EnrollState::CONVERT_SECOND;
      break;
    case EnrollState::CONVERT_SECOND:
      if (finger.image2Tz(2) == FINGERPRINT_OK) {
        sendEVENT(F("ENROLL_Step2_OK")); 
        g_enrollState = EnrollState::CREATE_MODEL;
      } else resetEnroll(F("CONVERT2_FAIL"));
      break;
    case EnrollState::CREATE_MODEL:
      if (finger.createModel() == FINGERPRINT_OK) g_enrollState = EnrollState::STORE_MODEL;
      else resetEnroll(F("MODEL_FAIL"));
      break;
    case EnrollState::STORE_MODEL:
      if (finger.storeModel(g_enrollId) == FINGERPRINT_OK) {
        Serial.print(F("EVENT ENROLL_OK ")); Serial.println(g_enrollId);
        g_enrollState = EnrollState::DONE;
      } else resetEnroll(F("STORE_FAIL"));
      break;
    case EnrollState::DONE:
      showTempLCD(F("ENROLL SUCCESS!"), "ID Saved", 3000);
      g_enrollState = EnrollState::IDLE;
      break;
  }
}

/* ============================================================
   COMMAND HANDLER
   ============================================================ */
void handleLine(char* line) {
  String l = String(line);
  l.trim();
  if (l.length() == 0) return;

  int spaceIdx = l.indexOf(' ');
  String cmd = (spaceIdx > 0) ? l.substring(0, spaceIdx) : l;
  String arg = (spaceIdx > 0) ? l.substring(spaceIdx + 1) : "";
  cmd.toUpperCase();

  if (cmd == F("LCD_INFO")) {
    // Expected arg: empId|name|date|time|status|timeIn|timeOut
    // Split the pipe-separated argument
    int p1 = arg.indexOf('|');
    int p2 = arg.indexOf('|', p1 + 1);
    int p3 = arg.indexOf('|', p2 + 1);
    int p4 = arg.indexOf('|', p3 + 1);
    int p5 = arg.indexOf('|', p4 + 1);
    int p6 = arg.indexOf('|', p5 + 1);

    if (p1 > 0) {
      String id = arg.substring(0, p1);
      String name = arg.substring(p1 + 1, p2);
      String dateStr = arg.substring(p2 + 1, p3);
      String timeStr = arg.substring(p3 + 1, p4);
      String status = arg.substring(p4 + 1, p5);
      String inStr = arg.substring(p5 + 1, p6);
      String outStr = arg.substring(p6 + 1);

      lcd.clear();
      lcd.setCursor(0, 0); lcd.print(status + ": " + name);
      lcd.setCursor(0, 1); lcd.print(dateStr + " " + timeStr);
      lcd.setCursor(0, 2); lcd.print("IN: " + inStr);
      lcd.setCursor(0, 3); lcd.print("OUT: " + outStr);
      
      g_lcdMessageTimer = millis() + 5000;
      g_isTempMessage = true;
    }
    return;
  }

  if (cmd == F("LCD_UNENROLLED")) {
    showTempLCD(F("ACCESS DENIED"), "User Not Enrolled", 3000);
    return;
  }

  if (cmd == F("LCD_BLOCK")) {
    int p1 = arg.indexOf('|');
    String name = (p1 > 0) ? arg.substring(0, p1) : arg;
    String reason = (p1 > 0) ? arg.substring(p1 + 1) : "Blocked";
    lcd.clear();
    lcd.setCursor(0, 0); lcd.print("BLOCKED: " + name);
    lcd.setCursor(0, 1); lcd.print(reason);
    g_lcdMessageTimer = millis() + 4000;
    g_isTempMessage = true;
    return;
  }

  if (cmd == F("PING")) { sendOK(F("PONG")); return; }

  if (cmd == F("MODE")) {
    if (arg == F("ENROLL")) { g_mode = Mode::ENROLL; sendOK(F("MODE_ENROLL")); }
    else { g_mode = Mode::ATTEND; sendOK(F("MODE_ATTEND")); }
    setIdleLCD();
    return;
  }

  if (cmd == F("TIME")) {
    g_epochAtSet = (uint32_t)arg.toInt();
    g_millisAtSet = millis();
    g_timeSet = true;
    sendOK(F("TIME_SET"));
    return;
  }

  if (cmd == F("ENROLL")) {
    if (g_mode != Mode::ENROLL) { sendERR(130, F("NOT_ENROLL_MODE")); return; }
    startEnroll(arg.toInt());
    return;
  }

  if (cmd == F("COUNT")) {
    if (finger.getTemplateCount() == FINGERPRINT_OK) {
      Serial.print(F("OK COUNT ")); Serial.println(finger.templateCount);
    }
    return;
  }
}

void setup() {
  Serial.begin(HOST_BAUD);
  lcd.init(); 
  lcd.backlight();
  lcd.print(F("POWERING UP..."));
  
  fpSerial.begin(FP_BAUD);
  finger.begin(FP_BAUD);
  delay(500);

  if (ensureSensorReady()) {
    sendOK(F("READY"));
    setIdleLCD();
  }
}

void loop() {
  tickLCD();
  while (Serial.available()) {
    char c = (char)Serial.read();
    if (c == '\n') {
      g_line[g_lineIdx] = '\0';
      handleLine(g_line);
      g_lineIdx = 0;
    } else if (c != '\r' && g_lineIdx < 63) {
      g_line[g_lineIdx++] = c;
    }
  }
  if (g_mode == Mode::ATTEND) {
    if (doScanOnce(true)) { waitForFingerRemoval(); setIdleLCD(); }
  } else {
    tickEnroll();
  }
}
