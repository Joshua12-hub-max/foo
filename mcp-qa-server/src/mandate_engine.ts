import path from 'node:path';

export class MandateEngine {
    private mandates: string[] = [
        "Zero Type Erasure: 100% strictly typed. No 'any' or 'unknown' allowed.",
        "Strictly No 'as any' casting.",
        "Data Mapping: verify camelCase (frontend/JSON) and snake_case (database) mappings.",
        "Database: schema is strictly defined in backend/db/schema.ts.",
        "Consistenty: Use Zod, RHF + Zod, React Query, Zustand, and Axios.",
        "Naming: Verify camelCase for frontend and snake_case for database.",
        "Security: Identify and eliminate 100% of loopholes.",
        "Validation: 100% verification of all code changes and logic.",
        "Biometric Cooldown: 60-second hardware cooldown (MATCH_COOLDOWN_SEC = 60).",
        "Axios Only: HTTP requests must use Axios, no raw fetch.",
        "Drizzle ORM: typescript 'number' must match MySQL 'int', 'string' match 'varchar'."
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

        return {
            compliant: violations.length === 0,
            violations
        };
    }
}
