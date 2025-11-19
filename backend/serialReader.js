import SerialPort from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";
import EventEmitter from "events";
import dotenv from "dotenv";

dotenv.config();

class SerialReader extends EventEmitter {
  constructor() {
    super();

    const portPath = process.env.SERIAL_PORT;
    const baudRate = parseInt(process.env.SERIAL_BAUD || "57600", 10);

    if (!portPath) {
      console.warn("⚠ SERIAL_PORT missing — Fingerprint scanner disabled");
      this.port = null;
      return;
    }

    this.port = new SerialPort({ path: portPath, baudRate, autoOpen: false });
    this.parser = this.port.pipe(new ReadlineParser({ delimiter: "\n" }));

    this.port.on("open", () => console.log("✓ Serial Port opened:", portPath));
    this.port.on("error", err => console.error("Serial Error:", err.message));

    this.parser.on("data", line => {
      line = line.trim();
      console.log("[SERIAL RAW]", line);

      if (line.startsWith("MATCH:")) {
        const id = Number(line.split(":")[1]);
        this.emit("match", id);
      }

      if (line.startsWith("ENROLL_OK:")) {
        this.emit("enroll_ok", Number(line.split(":")[1]));
      }

      if (line.startsWith("ENROLL_FAIL:")) {
        this.emit("enroll_fail", line.split(":")[1]);
      }
    });
  }

  open() {
    return new Promise((resolve, reject) => {
      if (!this.port) return resolve();
      this.port.open(err => (err ? reject(err) : resolve()));
    });
  }

  sendEnrollCommand(templateId) {
    if (!this.port?.isOpen) throw new Error("Serial port is not open");
    this.port.write(`ENROLL,${templateId}\n`);
  }
}

export default SerialReader;
