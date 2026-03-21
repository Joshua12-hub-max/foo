import path from 'node:path';

export class MandateEngine {
    private mandates: string[] = [
        "Zero Type Erasure: 100% strictly typed. Absolutely no 'any' or 'unknown' types allowed.",
        "Strictly No 'as any' casting.",
        "Precision: Every data point must be 100% explicitly typed or strictly inferred.",
        "ID Integrity: 'Emp-001' format (Emp-{id:D3}) is hardcoded and must NOT be changed.",
        "Data Mapping: verify camelCase (frontend/JSON) and snake_case (database) mappings.",
        "Library Consistency: Use Zod, RHF + Zod, React Query, Zustand, and Axios ONLY.",
        "Security: Identify and eliminate 100% of loopholes.",
        "Validation: 100% verification of all code changes and logic.",
        "Biometric Cooldown: 60-second hardware cooldown (MATCH_COOLDOWN_SEC = 60).",
        "Axios Only: HTTP requests must use Axios, no raw fetch.",
        "Drizzle ORM: typescript 'number' must match MySQL 'int', 'string' match 'varchar'.",
        "Strict Error Handling: Use 'catch (error: unknown)' and 'axios.isAxiosError' for all API calls.",
        "Zod Validation: All API payloads and responses must be validated via Zod schemas.",
        "Mandatory Libraries: Axios, Zustand, Zod, Zod + RHF, React Query must be used 100%."
    ];

    public getMandates(): string[] {
        return this.mandates;
    }

    public verifyCompliance(code: string): { compliant: boolean; violations: string[] } {
        const violations: string[] = [];
        
        if (code.includes(': any ') || code.includes(':any') || code.includes('<any>')) {
            violations.push("Violation: Use of 'any' type detected.");
        }
        
        if (code.includes('as any')) {
            violations.push("Violation: Use of 'as any' casting detected.");
        }

        if (code.includes('fetch(') && !code.includes('axios')) {
            violations.push("Violation: Potential use of raw fetch() instead of Axios.");
        }

        if (code.includes('catch (err: any)') || code.includes('catch (error: any)')) {
            violations.push("Violation: Unsafe 'any' in catch block. Use 'unknown' and type guards.");
        }

        if (code.includes('// @ts-ignore') || code.includes('// @ts-nocheck')) {
            violations.push("Violation: Use of @ts-ignore or @ts-nocheck detected.");
        }

        return {
            compliant: violations.length === 0,
            violations
        };
    }
}
