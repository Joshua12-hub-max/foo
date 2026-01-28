#include <Adafruit_Fingerprint.h>

/**
 * NEBR - Arduino Biometric System (R307s)
 * 
 * Hardware:
 * - Arduino Uno / Nano / Mega
 * - R307s Fingerprint Sensor
 * 
 * Wiring:
 * - Red (VCC) -> 3.3V (preferred) or 5V
 * - Black (GND) -> GND
 * - Green (TX) -> Digital 2 (RX)
 * - White (RX) -> Digital 3 (TX)
 * 
 * Protocol (Serial 57600):
 * - OUT_CMD: ENROLL:ID         -> Start enrollment for ID
 * - OUT_CMD: DELETE:ID         -> Delete ID
 * - OUT_CMD: DELETE_ALL        -> Delete all
 * 
 * - IN_CMD: SCAN:ID:CONFIDENCE -> Fingerprint matched
 * - IN_CMD: ENROLL_SUCCESS:ID  -> Enrollment complete
 * - IN_CMD: ENROLL_FAIL:REASON -> Enrollment failed
 * - IN_CMD: READY              -> System ready
 */
#include <SoftwareSerial.h>
// Software Serial for Sensor (RX, TX)
// Sensor Green Wire -> Pin 2
// Sensor White Wire -> Pin 3
SoftwareSerial mySerial(2, 3);
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&mySerial);
// Globals
enum Mode {
  MODE_SCAN,
  MODE_ENROLL_1,
  MODE_ENROLL_2,
  MODE_ENROLL_CONFIRM
};
Mode currentMode = MODE_SCAN;
uint16_t enrollId = 0; // Changed to 16-bit to support up to 1000 IDs
unsigned long opStart = 0;
const unsigned long OP_TIMEOUT = 20000; // 20s timeout for actions
void setup() {
  Serial.begin(115200); // Communication with PC
  
  // Initialize Sensor
  finger.begin(57600);
  
  if (finger.verifyPassword()) {
    Serial.println("READY");
  } else {
    Serial.println("ERROR:NO_SENSOR");
    while (1) { delay(1); }
  }
  // Set LED control if supported
  finger.LEDcontrol(FINGERPRINT_LED_ON, 0, FINGERPRINT_LED_BLUE);
}
void loop() {
  processSerialCommands();
  switch (currentMode) {
    case MODE_SCAN:
      scanFingerprint();
      break;
    case MODE_ENROLL_1:
    case MODE_ENROLL_2:
    case MODE_ENROLL_CONFIRM:
      processEnrollment();
      break;
  }
  
  delay(50);
}
void deleteFinger(int id) {
  uint8_t p = finger.deleteModel(id);
  if (p == FINGERPRINT_OK) {
     Serial.print("DELETE_SUCCESS:");
     Serial.println(id);
  } else {
     Serial.print("DELETE_FAIL:ERR_");
     Serial.println(p);
  }
}

// ==================================================
// Command Global State
// ==================================================
const int TEMPLATE_SIZE = 512;
uint8_t templateBuffer[TEMPLATE_SIZE];
int templateBufferLen = 0;
bool isReceivingTemplate = false;
int receivingForId = 0;
unsigned long performRxTime = 0;

void processSerialCommands() {
  // If we are in the middle of receiving raw binary data, don't parse strings
  if (isReceivingTemplate) {
    while (Serial.available() > 0) {
      int b = Serial.read();
      if (templateBufferLen < TEMPLATE_SIZE) {
        templateBuffer[templateBufferLen++] = (uint8_t)b;
      }
      
      // Check if done
      if (templateBufferLen >= TEMPLATE_SIZE) {
        saveTemplateToSensor(receivingForId);
        isReceivingTemplate = false;
        templateBufferLen = 0;
        return;
      }
    }
    
    // Timeout check (3 seconds)
    if (millis() - performRxTime > 3000) {
      Serial.println("STORE_FAIL:TIMEOUT");
      isReceivingTemplate = false;
      templateBufferLen = 0;
    }
    return;
  }

  // Normal Command Processing
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd.length() == 0) return;
    
    if (cmd.startsWith("ENROLL:")) {
      int id = cmd.substring(7).toInt();
      if (id > 0 && id <= 1000) { // Limit set to 1000 for R307s
        startEnroll(id);
      } else {
        Serial.println("ENROLL_FAIL:INVALID_ID");
      }
    } else if (cmd.startsWith("DELETE:")) {
      int id = cmd.substring(7).toInt();
      deleteFinger(id);
    } else if (cmd == "DELETE_ALL") {
      finger.emptyDatabase();
      Serial.println("DELETE_ALL_SUCCESS");
    } else if (cmd.startsWith("UPLOAD:")) {
      // Protocol change: UPLOAD:ID
      // This tells Arduino to get ready for 512 bytes of raw binary
      int id = cmd.substring(7).toInt();
      if (id > 0 && id <= 1000) { // Limit set to 1000 for R307s
        receivingForId = id;
        isReceivingTemplate = true;
        templateBufferLen = 0;
        performRxTime = millis();
        Serial.println("READY_FOR_DATA");
      } else {
        Serial.println("UPLOAD_FAIL:BAD_ID");
      }
    } else if (cmd == "GET_COUNT") {
      uint8_t p = finger.getTemplateCount();
      if (p == FINGERPRINT_OK) {
        Serial.print("TEMPLATE_COUNT:");
        Serial.println(finger.templateCount);
      } else {
        Serial.println("TEMPLATE_COUNT:ERROR");
      }
    }
  }
}

// Write the buffered template to the sensor
void saveTemplateToSensor(int id) {
  // 1. Upload data to logic buffer 1 of Sensor
  // Packet format for "Write to Character Buffer": 
  // Header(2) + Address(4) + Type(1) + Len(2) + Inst(1) + BufferID(1) + Checksum ...
  // BUT Adafruit library keeps raw packet writing internal.
  // We will assume standard "Download" (Host -> Sensor) command 0x09 is needed
  // Or we can manually construct packets like the previous code did, but safer.

  Serial.println("DEBUG:SAVING_TO_SENSOR");

  // We need to send the templateBuffer data to the sensor in chunks
  // The sensor expects the command: [Header] [Addr] [Type] [Len] [Cmd: 0x09] [Buffer: 0x01] ... data ...
  // Actually, Adafruit library has `writeStructuredPacket`. 
  // But to be raw-compatible with R307/R305 documentation for "Download to Buffer 1":
  
  // Handshake to prepare sensor buffer 1
  uint8_t cmdInit[] = {0xEF, 0x01, 0xFF, 0xFF, 0xFF, 0xFF, 0x01, 0x00, 0x04, 0x09, 0x01, 0x00, 0x0F};
  for(int i=0; i<13; i++) mySerial.write(cmdInit[i]);
  
  // Wait for confirmation
  unsigned long st = millis();
  bool confirmed = false;
  uint8_t resp[12];
  int rLen = 0;
  
  while(millis() - st < 500) {
    while(mySerial.available()) {
      resp[rLen++] = mySerial.read();
      if (rLen >= 12) break; // usually response is shorter
    }
    if (rLen >= 9) { // minimal valid response
      if (resp[6] == 0x07 && resp[9] == 0x00) { // Cmd 0x09 (Download) response, code 0x00 (OK)
         confirmed = true;
         break;
      }
    }
  }
  
  if (!confirmed) {
    Serial.println("STORE_FAIL:SENSOR_NO_ACK");
    return;
  }
  
  // Send Data in packets of 128 bytes
  // Content must be split into data packets
  // Total 512 bytes
  int offset = 0;
  while (offset < 512) {
    int chunkSize = 128;
    bool isLast = (offset + chunkSize >= 512);
    
    // Packet Header
    mySerial.write(0xEF); mySerial.write(0x01);
    mySerial.write(0xFF); mySerial.write(0xFF); mySerial.write(0xFF); mySerial.write(0xFF);
    
    uint8_t pid = isLast ? 0x08 : 0x02; // 0x02 = Data, 0x08 = End of Data
    mySerial.write(pid); 
    
    uint16_t packLen = chunkSize + 2; // Data + Checksum
    mySerial.write(highByte(packLen));
    mySerial.write(lowByte(packLen));
    
    uint16_t sum = pid + highByte(packLen) + lowByte(packLen);
    
    for (int i=0; i<chunkSize; i++) {
       uint8_t val = templateBuffer[offset + i];
       mySerial.write(val);
       sum += val;
     }
     
     mySerial.write(highByte(sum));
     mySerial.write(lowByte(sum));
     
     offset += chunkSize;
     delay(10); // small inter-packet delay
  }
  
  // Now "Store" from Buffer 1 to Flash ID
  delay(50);
  uint8_t p = finger.storeModel(id);
  
  if (p == FINGERPRINT_OK) {
    Serial.print("STORE_SUCCESS:"); Serial.println(id);
  } else {
    Serial.print("STORE_FAIL:F_ERR_"); Serial.println(p);
  }
}

// ==================================================
// Scanning Logic
// ==================================================
// ==================================================
// Scanning Logic
// ==================================================
void scanFingerprint() {
  uint8_t p = finger.getImage();
  if (p == FINGERPRINT_NOFINGER) return;
  
  if (p != FINGERPRINT_OK) {
    Serial.println("DEBUG:GET_IMAGE_FAIL");
    return;
  }
  Serial.println("DEBUG:FINGER_DETECTED");
  
  // Convert image to template with retry for transient errors
  p = finger.image2Tz();
  if (p != FINGERPRINT_OK) {
    // Retry once on conversion failure
    delay(100);
    p = finger.image2Tz();
    if (p != FINGERPRINT_OK) {
      Serial.println("DEBUG:IMAGE_CONVERSION_FAIL");
      return;
    }
  }
  
  // Search with retry for ERR_23 (communication error)
  uint8_t retries = 0;
  const uint8_t MAX_RETRIES = 2;
  
  while (retries <= MAX_RETRIES) {
    p = finger.fingerFastSearch();
    
    if (p == FINGERPRINT_OK) {
      Serial.print("SCAN:");
      Serial.print(finger.fingerID);
      Serial.print(":");
      Serial.println(finger.confidence);
      
      // Simple debounce / wait to lift finger
      delay(1500);
      return;
    } else if (p == FINGERPRINT_NOTFOUND) {
      // Check template count to provide better diagnostics
      uint8_t tc = finger.getTemplateCount();
      if (tc == FINGERPRINT_OK) {
        Serial.print("SCAN_FAIL:NOT_MATCHED_");
        Serial.print(finger.templateCount);
        Serial.println("_TEMPLATES");
      } else {
        Serial.println("SCAN_FAIL:NOT_MATCHED");
      }
      delay(1000);
      return;
    } else if (p == 0x17 || p == 23) {
      // ERR_23: Communication/packet error - retry
      retries++;
      if (retries <= MAX_RETRIES) {
        Serial.println("DEBUG:RETRYING_SEARCH");
        delay(200);
        continue;
      }
    }
    
    // Other errors
    Serial.print("SCAN_FAIL:ERR_");
    Serial.println(p);
    delay(1000);
    return;
  }
}
// ==================================================
// Enrollment Logic
// ==================================================
void startEnroll(int id) {
  enrollId = id;
  currentMode = MODE_ENROLL_1;
  opStart = millis();
}
void processEnrollment() {
  if (millis() - opStart > OP_TIMEOUT) {
    Serial.println("ENROLL_FAIL:TIMEOUT");
    currentMode = MODE_SCAN;
    return;
  }
  uint8_t p;
  
  switch (currentMode) {
    case MODE_ENROLL_1:
      // Wait for finger 1
      p = finger.getImage();
      if (p == FINGERPRINT_NOFINGER) return;
      if (p == FINGERPRINT_OK) {
        p = finger.image2Tz(1);
        if (p == FINGERPRINT_OK) {
          // Success step 1
          currentMode = MODE_ENROLL_2;
          Serial.println("DEBUG:ENROLL_1_OK_REMOVE_FINGER");
          
          // Wait for finger to be removed
          while (finger.getImage() != FINGERPRINT_NOFINGER) {
             delay(50);
             if (millis() - opStart > OP_TIMEOUT) return;
          }
        }
      }
      break;
    case MODE_ENROLL_2:
       // Wait for finger 2 (same finger)
       p = finger.getImage();
       if (p == FINGERPRINT_NOFINGER) return;
       if (p == FINGERPRINT_OK) {
         p = finger.image2Tz(2);
         if (p == FINGERPRINT_OK) {
           currentMode = MODE_ENROLL_CONFIRM;
           Serial.println("DEBUG:ENROLL_2_OK_CONFIRMING");
         }
       }
       break;
    case MODE_ENROLL_CONFIRM:
      p = finger.createModel();
      if (p == FINGERPRINT_OK) {
        p = finger.storeModel(enrollId);
        if (p == FINGERPRINT_OK) {
          Serial.print("ENROLL_SUCCESS:");
          Serial.println(enrollId);
          
          // Send the template data
          delay(100);
          sendTemplate(enrollId);
        } else {
          Serial.println("ENROLL_FAIL:STORAGE_ERROR");
        }
      } else {
        Serial.println("ENROLL_FAIL:MISMATCH_OR_BAD_IMAGE");
      }
      currentMode = MODE_SCAN;
      break;
  }
}
void sendTemplate(int id) {
  uint8_t p = finger.loadModel(id);
  if (p != FINGERPRINT_OK) {
    Serial.print("DEBUG:LOAD_FAIL_"); Serial.println(p);
    return;
  }
  p = finger.getModel();
  if (p != FINGERPRINT_OK) {
    Serial.print("DEBUG:GET_FAIL_"); Serial.println(p);
    return;
  }
  
  // R307s template is 512 bytes data + headers = 556 bytes
  uint8_t buffer[560];
  uint16_t bytesRead = 0;
  unsigned long startWait = millis();
  
  // Read all bytes from sensor first to avoid blocking HardwareSerial
  while (bytesRead < 560 && (millis() - startWait < 2000)) {
    while (mySerial.available()) {
      buffer[bytesRead++] = mySerial.read();
      startWait = millis();
    }
  }
  
  if (bytesRead < 500) {
    Serial.print("DEBUG:READ_SHORT_"); Serial.println(bytesRead);
    // Don't return, print what we have anyway for debugging
  }

  Serial.print("TEMPLATE:");
  Serial.print(id);
  Serial.print(":");
  for (uint16_t i = 0; i < bytesRead; i++) {
    if (buffer[i] < 0x10) Serial.print("0");
    Serial.print(buffer[i], HEX);
  }
  Serial.println();
  Serial.print("DEBUG:SENT_"); Serial.println(bytesRead);
}


  


