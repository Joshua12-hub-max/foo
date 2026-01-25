
import { SerialPort } from 'serialport';

async function listPorts() {
  console.log('Scanning for Serial Ports...');
  try {
    const ports = await SerialPort.list();
    if (ports.length === 0) {
      console.log('No ports found.');
      return;
    }
    
    console.log(`Found ${ports.length} ports:`);
    ports.forEach(port => {
      console.log('--------------------------------------------------');
      console.log(`Path: ${port.path}`);
      console.log(`Manufacturer: ${port.manufacturer}`);
      console.log(`Serial Number: ${port.serialNumber}`);
      console.log(`PnP ID: ${port.pnpId}`);
      console.log(`Location: ${port.locationId}`);
      console.log('--------------------------------------------------');
    });

    const arduinoPort = ports.find(
      (p: any) => p.manufacturer?.includes('Arduino') || p.path.includes('USB') || p.path.includes('COM')
    );

    if (arduinoPort) {
        console.log(`\nPotential Arduino Port identified: ${arduinoPort.path}`);
        
        console.log(`Attempting to open ${arduinoPort.path}...`);
        const port = new SerialPort({ path: arduinoPort.path, baudRate: 9600 });
        
        port.on('open', () => {
            console.log('SUCCESS: Port opened successfully!');
            setTimeout(() => {
                console.log('Closing port...');
                port.close();
                process.exit(0);
            }, 2000);
        });

        port.on('error', (err) => {
            console.error('ERROR: Failed to open port:', err.message);
            process.exit(1);
        });

    } else {
        console.log('\nNo obvious Arduino port found in list.');
    }

  } catch (err) {
    console.error('Error listing ports:', err);
  }
}

listPorts();
