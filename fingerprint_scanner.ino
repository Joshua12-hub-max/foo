#include <Adafruit_Fingerprint.h>
#include <SoftwareSerial.h>

// --- Configuration ---
// RX/TX pins for SoftwareSerial (Connect to Sensor TX/RX)
// Arduino RX (2) <-> Sensor TX
// Arduino TX (3) <-> Sensor RX
SoftwareSerial mySerial(2, 3);
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&mySerial);

// --- State Variables ---
String inputString = "";         // Holds incoming Serial data
boolean stringComplete = false;  // Flag for string reception
unsigned long lastScanTime = 0;  // Debounce timer
const int SCAN_DELAY = 500;      // 500ms between scans (Faster response)

// --- LED Pins (Optional) ---
#define LED_GREEN 8
#define LED_RED 9

void setup() {
  // 1. Initialize Serial for PC communication (USB)
  Serial.begin(9600);
  inputString.reserve(200); 

  // 2. Initialize Fingerprint Sensor Serial
  finger.begin(57600);
  
  // 3. Setup LEDs
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  
  // 4. Check Sensor
  if (finger.verifyPassword()) {
    // Blink Green to indicate ready
    blinkLed(LED_GREEN, 2);
    Serial.println("### SENSOR_READY ###");
  } else {
    // Blink Red forever if sensor missing
    while (1) {
      blinkLed(LED_RED, 1);
      delay(500);
    }
  }
}

void loop() {
  // 1. Handle Incoming Commands from Backend (Enrollment)
  if (stringComplete) {
    processCommand(inputString);
    // Reset buffer
    inputString = "";
    stringComplete = false;
  }

  // 2. Routine Fingerprint Scanning
  // Only scan if enough time has passed (Debounce)
  if (millis() - lastScanTime > SCAN_DELAY) {
    int fingerprintID = getFingerprintIDez();
    
    if (fingerprintID > 0) {
      // Valid fingerprint found
      sendScanData(fingerprintID);
      blinkLed(LED_GREEN, 1);
      lastScanTime = millis();
    }
  }
}

// --- Serial Event Interrupt ---
// Reads data from PC/Backend one char at a time
void serialEvent() {
  while (Serial.available()) {
    char inChar = (char)Serial.read();
    inputString += inChar;
    if (inChar == '\n') {
      stringComplete = true;
      return; // Stop reading to allow main loop to process this line
    }
  }
}

// --- Core Logic ---

// Process commands sent from Backend
// Expected Format for Enrollment: "1\n<ID>\n<Name>\n<EmpID>\n<Dept>"
void processCommand(String command) {
  command.trim(); // Remove whitespace
  
  if (command == "1") {
    // Start Enrollment Mode
    // We need to read the next 4 lines for details
    int id = readIntSerial();
    String name = readStringSerial();
    String empId = readStringSerial();
    String dept = readStringSerial();
    
    if (id > 0) {
      enrollFingerprint(id, name, empId, dept);
    }
  }
}

// Helper to read next line as String (Blocking with timeout)
String readStringSerial() {
  unsigned long start = millis();
  String ret = "";
  while (millis() - start < 5000) { // 5 sec timeout
    if (Serial.available()) {
      char c = Serial.read();
      if (c == '\n') {
        ret.trim(); // Clean up the string
        return ret;
      }
      ret += c;
    }
  }
  ret.trim();
  return ret; 
}

// Helper to read next line as Int
int readIntSerial() {
  String s = readStringSerial();
  return s.toInt();
}

// Send "SCAN" JSON to Backend
void sendScanData(int id) {
  Serial.println(F("### JSON_DATA_START ###"));
  Serial.print(F("{\"action\":\"SCAN\",\"fingerprint_id\":"));
  Serial.print(id);
  Serial.println(F("}"));
  Serial.println(F("### JSON_DATA_END ###"));
}

// Send "ENROLL" JSON to Backend (Success Confirmation)
void sendEnrollData(int id, String empId) {
  Serial.println(F("### JSON_DATA_START ###"));
  Serial.print(F("{\"action\":\"ENROLL\",\"fingerprint_id\":"));
  Serial.print(id);
  Serial.print(F(",\"employee_id\":\""));
  Serial.print(empId);
  Serial.println(F("\"}"));
  Serial.println(F("### JSON_DATA_END ###"));
}

// Send "ERROR" JSON to Backend
void sendErrorData(String msg) {
  Serial.println(F("### JSON_DATA_START ###"));
  Serial.print(F("{\"action\":\"ERROR\",\"message\":\""));
  Serial.print(msg);
  Serial.println(F("\"}"));
  Serial.println(F("### JSON_DATA_END ###"));
}

// --- Fingerprint Functions ---

// Quick search for existing fingerprint
int getFingerprintIDez() {
  uint8_t p = finger.getImage();
  if (p != FINGERPRINT_OK)  return -1;

  p = finger.image2Tz(1); // Modified: Added slot 1
  if (p != FINGERPRINT_OK)  return -1;

  p = finger.fingerSearch();
  if (p != FINGERPRINT_OK)  return -1;
  
  // Found a match!
  return finger.fingerID;
}

// Enrollment Process (Blocking)
void enrollFingerprint(int id, String name, String empId, String dept) {
  int p = -1;
  
  // 1. Wait for valid finger
  unsigned long start = millis();
  while (p != FINGERPRINT_OK) {
    if (millis() - start > 15000) {
      sendErrorData("Timeout waiting for finger");
      return; 
    }
    p = finger.getImage();
  }

  p = finger.image2Tz(1);
  if (p != FINGERPRINT_OK) {
    blinkLed(LED_RED, 2);
    sendErrorData("Image conversion failed");
    return;
  }
  
  // 2. Remove finger
  p = 0;
  while (p != FINGERPRINT_NOFINGER) {
    p = finger.getImage();
  }
  
  // 3. Place same finger again
  // Optional: Blink LED to signal "Place again"
  blinkLed(LED_GREEN, 1); 
  delay(500); // Give user a moment
  
  p = -1;
  start = millis();
  while (p != FINGERPRINT_OK) {
    if (millis() - start > 15000) {
      sendErrorData("Timeout waiting for finger confirmation");
      return;
    }
    p = finger.getImage();
  }

  p = finger.image2Tz(2);
  if (p != FINGERPRINT_OK) {
    blinkLed(LED_RED, 2);
    sendErrorData("Image conversion failed");
    return;
  }
  
  // 4. Create Model
  p = finger.createModel();
  if (p != FINGERPRINT_OK) {
    blinkLed(LED_RED, 2);
    sendErrorData("Failed to create model");
    return;
  }
  
  // 5. Store Model
  p = finger.storeModel(id);
  if (p == FINGERPRINT_OK) {
    // Success!
    blinkLed(LED_GREEN, 3);
    sendEnrollData(id, empId);
  } else {
    blinkLed(LED_RED, 3);
    sendErrorData("Failed to store model");
  }
}

void blinkLed(int pin, int times) {
  for (int i=0; i<times; i++) {
    digitalWrite(pin, HIGH);
    delay(100);
    digitalWrite(pin, LOW);
    delay(100);
  }
}
