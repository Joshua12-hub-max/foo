import { MandateEngine } from './mandate_engine.js';
import { LogicAnalyzer } from './logic_analyzer.js';
import fs from 'fs';

const tool = process.argv[2];
const argsPath = process.argv[3];

async function run() {
    const mandateEngine = new MandateEngine();
    const logicAnalyzer = new LogicAnalyzer();
    
    let bridgeArgs = {};
    if (argsPath && fs.existsSync(argsPath)) {
        bridgeArgs = JSON.parse(fs.readFileSync(argsPath, 'utf8').replace(/\\/g, '/'));
    }

    if (tool === 'get_system_mandates') {
        process.stdout.write(JSON.stringify(mandateEngine.getMandates(), null, 2));
    } else if (tool === 'analyze_data_flow') {
        const result = await logicAnalyzer.analyzeDataFlow(bridgeArgs.filePath);
        process.stdout.write(JSON.stringify(result, null, 2));
    } else if (tool === 'verify_user_intent') {
        const result = logicAnalyzer.verifyUserIntent(bridgeArgs.logic, bridgeArgs.intent);
        process.stdout.write(JSON.stringify(result, null, 2));
    }
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
