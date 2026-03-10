# Engineering Foundational Mandates

This project follows the strict standards defined in `.agents/workflows/deepthink.md`. These rules are automatic and mandatory for all agent interactions.

## 1. Zero Type Erasure
- **Strictly No `any` or `unknown`.**
- All data points must be 100% explicitly typed or strictly inferred.
- Interfaces and types must be used for all backend responses and frontend data flows.

## 2. Technical Integrity & Validation
- **Validation Protocol:** 100% verification of all code changes and logic before delivery.
- **Systemic Analysis:** Always analyze architectural impacts to ensure system integrity.
- **Syntax Integrity:** Triple-check syntax for 100% compliance with latest standards.

## 3. Security & Data Flow
- **Security First:** Identify and eliminate all potential loopholes.
- **Type-Safe Data Flow:** 100% pure type safety and accurate data propagation.
- **Consistency:** Maintain strict implementation of Zod, RHF + Zod, React Query, Zustand, and Axios.
- **Naming Convention:** Strictly verify camelCase (frontend/JSON) and snake_case (database) mappings at all costs.

## 4. MCP Filesystem Usage
- Use `grep_search` and `glob` for deep codebase analysis.
- Use `read_file` and `replace` with precision.
- Never assume a file's state; always verify via MCP tools before making changes.

## 5. "Deep Thinking" Reasoning
- All technical responses must be grounded in detailed reasoning, precise calculations, and total assurance of logic.
