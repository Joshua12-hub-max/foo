#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "node:fs/promises";
import path from "node:path";

const server = new Server(
  {
    name: "mcp-filesystem",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "read_file",
        description: "Read the complete contents of a file.",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "Absolute path to the file" },
            encoding: { type: "string", description: "Encoding (default: utf8)", default: "utf8" }
          },
          required: ["path"],
        },
      },
      {
        name: "write_file",
        description: "Write complete content to a file, overwriting existing content.",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "Absolute path to write the file to" },
            content: { type: "string", description: "Content to write" },
          },
          required: ["path", "content"],
        },
      },
      {
        name: "list_directory",
        description: "List all files and folders in a directory.",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "Absolute path to the directory" }
          },
          required: ["path"],
        },
      },
      {
        name: "create_directory",
        description: "Create a directory, including any necessary but nonexistent parent directories.",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "Absolute path to the directory to create" }
          },
          required: ["path"],
        },
      },
      {
        name: "get_file_info",
        description: "Get metadata about a file or directory (size, created/modified times, type).",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "Absolute path to check" }
          },
          required: ["path"],
        },
      }
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const name = request.params.name;
  const args = request.params.arguments || {};

  try {
    switch (name) {
      case "read_file": {
        const p = String(args.path);
        const enc = (args.encoding as BufferEncoding) || "utf8";
        const content = await fs.readFile(p, { encoding: enc });
        return {
          content: [{ type: "text", text: content }],
        };
      }
      
      case "write_file": {
        const p = String(args.path);
        const content = String(args.content);
        await fs.mkdir(path.dirname(p), { recursive: true });
        await fs.writeFile(p, content, { encoding: "utf8" });
        return {
          content: [{ type: "text", text: `Successfully wrote to ${p}` }],
        };
      }

      case "list_directory": {
        const p = String(args.path);
        const entries = await fs.readdir(p, { withFileTypes: true });
        const files = entries.map(e => ({
          name: e.name,
          isDirectory: e.isDirectory(),
          isFile: e.isFile(),
          isSymlink: e.isSymbolicLink()
        }));
        return {
          content: [{ type: "text", text: JSON.stringify(files, null, 2) }],
        };
      }

      case "create_directory": {
        const p = String(args.path);
        await fs.mkdir(p, { recursive: true });
        return {
          content: [{ type: "text", text: `Successfully created directory ${p}` }],
        };
      }

      case "get_file_info": {
        const p = String(args.path);
        const stats = await fs.stat(p);
        const info = {
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          isDirectory: stats.isDirectory(),
          isFile: stats.isFile(),
          isSymlink: stats.isSymbolicLink()
        };
        return {
          content: [{ type: "text", text: JSON.stringify(info, null, 2) }],
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error: any) {
    if (error instanceof McpError) throw error;
    
    return {
      content: [{ type: "text", text: `Error executing ${name}: ${error?.message || String(error)}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("mcp-filesystem server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
