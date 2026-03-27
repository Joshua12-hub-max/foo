import { db } from '../db/index.js';
import { internalPolicies } from '../db/schema.js';
import { eq } from 'drizzle-orm';

async function seedLeavePolicy() {
    try {
        const leavePolicy = {
            types: [
                "Vacation Leave",
                "Sick Leave",
                "Special Privilege Leave",
                "Maternity Leave",
                "Paternity Leave",
                "Study Leave",
                "Rehabilitation Leave",
                "Special Emergency Leave",
                "Special Leave Benefits for Women"
            ],
            annualLimits: {
                "Special Privilege Leave": 3,
                "Special Emergency Leave": 5
            },
            advanceFilingDays: {
                days: 5,
                appliesTo: ["Vacation Leave"],
                description: "Vacation leave must be filed 5 days in advance."
            },
            sickLeaveWindow: {
                maxDaysAfterReturn: 5,
                description: "Sick leave must be filed within 5 days of return."
            },
            crossChargeMap: {
                "Sick Leave": "Vacation Leave"
            },
            leaveToCreditMap: {
                "Vacation Leave": "Vacation Leave",
                "Sick Leave": "Sick Leave",
                "Special Privilege Leave": "Special Privilege Leave"
            },
            specialLeavesNoDeduction: [
                "Maternity Leave",
                "Paternity Leave",
                "Study Leave",
                "Rehabilitation Leave",
                "Special Leave Benefits for Women"
            ],
            requiredAttachments: {
                "Sick Leave": {
                    condition: "duration > 3",
                    required: "Medical Certificate"
                }
            },
            forcedLeaveRule: {
                minimumVLRequired: 5,
                description: "Mandatory 5 days forced leave if VL balance >= 10."
            },
            deemedApprovalGracePeriod: 5,
            deemedApproval: {
                days: 5,
                description: "CSC Rule: Applications not acted upon within 5 days are deemed approved.",
                reference: "CSC MC No. 41, s. 1998"
            },
            sickLeaveType: "Sick Leave",
            initialAllocations: {
                "Vacation Leave": 15.0,
                "Sick Leave": 15.0,
                "Special Privilege Leave": 3.0
            },
            workingDaysPerMonth: 22,
            monthlyAccrual: {
                accruingTypes: ["Permanent", "Contractual"],
                accrualRuleType: "CSC_STANDARD",
                accrualCreditTypes: ["Vacation Leave", "Sick Leave"]
            }
        };

        const existing = await db.select().from(internalPolicies).where(eq(internalPolicies.category, 'leave')).limit(1);
        
        if (existing.length > 0) {
            console.log("Updating existing leave policy...");
            await db.update(internalPolicies)
                .set({ content: JSON.stringify(leavePolicy), updatedAt: new Date() })
                .where(eq(internalPolicies.id, existing[0].id));
        } else {
            console.log("Inserting new leave policy...");
            await db.insert(internalPolicies).values({
                category: 'leave',
                title: 'Standard Leave Policy',
                content: JSON.stringify(leavePolicy),
                createdBy: 'SYSTEM',
                isActive: true
            });
        }

        console.log("Leave policy seeded successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Error seeding leave policy:", err);
        process.exit(1);
    }
}

seedLeavePolicy();
