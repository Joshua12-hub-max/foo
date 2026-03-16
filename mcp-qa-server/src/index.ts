import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { MandateEngine } from "./mandate_engine.js";
import { LogicAnalyzer } from "./logic_analyzer.js";

const server = new Server(
  { name: "nebr-qa-expert", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

const mandateEngine = new MandateEngine();
const logicAnalyzer = new LogicAnalyzer();

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "analyze_data_flow",
        description: "100% mapping of data from Frontend to DB, spotting logic bottlenecks.",
        inputSchema: {
          type: "object",
          properties: {
            filePath: { type: "string", description: "Absolute path to the file to analyze" },
          },
          required: ["filePath"],
        },
      },
      {
        name: "deep_problem_analysis",
        description: "Investigates complex, multi-file problems to find the real root cause 100%.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "The problem description" },
            files: { type: "array", items: { type: "string" }, description: "List of related file paths" },
          },
          required: ["query", "files"],
        },
      },
      {
        name: "verify_user_intent",
        description: "Flags when the code is 'wrong' because it doesn't match what the user actually wanted.",
        inputSchema: {
          type: "object",
          properties: {
            logic: { type: "string", description: "The implementation code/logic" },
            intent: { type: "string", description: "The user's intended behavior or flavor" },
          },
          required: ["logic", "intent"],
        },
      },
      {
        name: "get_system_mandates",
        description: "Provides the definitive 100% list of Dos and Don'ts for the NEBR system.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "analyze_data_flow": {
        const { filePath } = z.object({ filePath: z.string() }).parse(args);
        const result = await logicAnalyzer.analyzeDataFlow(filePath);
        return { content: [{ type: "text", text: result }] };
      }
      case "deep_problem_analysis": {
        const { query, files } = z.object({ query: z.string(), files: z.array(z.string()) }).parse(args);
        const result = await logicAnalyzer.deepProblemAnalysis(query, files);
        return { content: [{ type: "text", text: result }] };
      }
      case "verify_user_intent": {
        const { logic, intent } = z.object({ logic: z.string(), intent: z.string() }).parse(args);
        const result = logicAnalyzer.verifyUserIntent(logic, intent);
        return { content: [{ type: "text", text: result }] };
      }
      case "get_system_mandates": {
        const mandates = mandateEngine.getMandates();
        const formatted = mandates.map((m, i) => `${i + 1}. ${m}`).join('\n');
        return { content: [{ type: "text", text: `NEBR 100% Development Mandates (Dos & Don'ts):\n\n${formatted}` }] };
      }
      default:
        throw new Error(`Tool not found: ${name}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        content: [{ type: "text", text: `Validation Error: ${JSON.stringify(error.issues)}` }],
        isError: true
      };
    }
    return {
        content: [{ type: "text", text: `System Error: ${(error as Error).message}` }],
        isError: true
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
