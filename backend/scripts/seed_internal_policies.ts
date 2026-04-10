import { db } from '../db/index.js';
import { internalPolicies } from '../db/schema.js';
import { eq } from 'drizzle-orm';

async function seed() {
    console.log('🚀 Seeding Internal Policies...');

    const policies = [
        {
            category: 'tardiness',
            title: 'CSC Habitual Tardiness & Undertime Rules',
            content: JSON.stringify({
                tardiness: {
                    maxLatesPerMonth: 10,
                    minMonthsForOffense: 2,
                    pattern: 'consecutiveOrSemester'
                },
                undertime: {
                    maxUndertimesPerMonth: 10,
                    minMonthsForOffense: 2,
                    pattern: 'consecutiveOrSemester'
                },
                absence: {
                    maxAbsencesPerMonth: 2.5,
                    minMonthsForOffense: 3,
                    pattern: 'consecutiveOrSemester'
                }
            })
        },
        {
            category: 'penalties',
            title: 'Unified Disciplinary Matrix (CSC MC No. 1, s. 2017)',
            content: JSON.stringify({
                matrix: {
                    habitualTardiness: {
                        regular: [
                            { penalty: 'Reprimand (Stern Warning)', memoType: 'Reprimand', severity: 'minor' },
                            { penalty: 'Suspension of 1 to 30 days', memoType: 'Suspension Notice', severity: 'major' },
                            { penalty: 'Dismissal from the Service', memoType: 'Termination Notice', severity: 'terminal' }
                        ],
                        joCos: [
                            { penalty: 'Written Warning', memoType: 'Written Warning', severity: 'minor' },
                            { penalty: 'Reprimand', memoType: 'Reprimand', severity: 'moderate' },
                            { penalty: 'Termination of Contract', memoType: 'Termination Notice', severity: 'terminal' }
                        ]
                    },
                    absence: {
                        regular: [
                            { penalty: 'Suspension of 6 months and 1 day', memoType: 'Suspension Notice', severity: 'grave' },
                            { penalty: 'Dismissal from the Service', memoType: 'Termination Notice', severity: 'terminal' },
                            { penalty: 'Dismissal from the Service', memoType: 'Termination Notice', severity: 'terminal' }
                        ],
                        joCos: [
                            { penalty: 'Reprimand', memoType: 'Reprimand', severity: 'moderate' },
                            { penalty: 'Termination of Contract', memoType: 'Termination Notice', severity: 'terminal' },
                            { penalty: 'Termination of Contract', memoType: 'Termination Notice', severity: 'terminal' }
                        ]
                    },
                    habitualUndertime: {
                        regular: [
                            { penalty: 'Reprimand (Stern Warning)', memoType: 'Reprimand', severity: 'minor' },
                            { penalty: 'Suspension of 1 to 30 days', memoType: 'Suspension Notice', severity: 'major' },
                            { penalty: 'Dismissal from the Service', memoType: 'Termination Notice', severity: 'terminal' }
                        ],
                        joCos: [
                            { penalty: 'Written Warning', memoType: 'Written Warning', severity: 'minor' },
                            { penalty: 'Reprimand', memoType: 'Reprimand', severity: 'moderate' },
                            { penalty: 'Termination of Contract', memoType: 'Termination Notice', severity: 'terminal' }
                        ]
                    }
                }
            })
        },
        {
            category: 'leave',
            title: 'CSC Leave Administration Policy',
            content: JSON.stringify({
                types: [
                    'Vacation Leave', 'Sick Leave', 'Special Privilege Leave', 'Maternity Leave', 
                    'Paternity Leave', 'Solo Parent Leave', 'Study Leave', 'VAWC Leave', 
                    'Rehabilitation Leave', 'Special Leave Benefits for Women', 'Adoption Leave',
                    'Monetization', 'Terminal Leave', 'Other'
                ],
                leaveToCreditMap: {
                    'Vacation Leave': 'Vacation Leave',
                    'Sick Leave': 'Sick Leave',
                    'Special Privilege Leave': 'Vacation Leave'
                },
                crossChargeMap: {
                    'Sick Leave': 'Vacation Leave'
                },
                annualLimits: {
                    'Special Privilege Leave': 3,
                    'Solo Parent Leave': 7
                },
                specialLeavesNoDeduction: [
                    'Maternity Leave', 'Paternity Leave', 'VAWC Leave', 'Rehabilitation Leave', 'Adoption Leave'
                ],
                initialAllocations: {
                    'Vacation Leave': 0.000,
                    'Sick Leave': 0.000
                },
                deemedApprovalGracePeriod: 5,
                advanceFilingDays: {
                    days: 5,
                    appliesTo: ['Vacation Leave', 'Special Privilege Leave']
                },
                sickLeaveWindow: {
                    maxDaysAfterReturn: 5
                },
                monthlyAccrual: {
                    accruingTypes: ['Permanent', 'Contractual'],
                    accrualRuleType: 'CSC_STANDARD',
                    accrualCreditTypes: ['Vacation Leave', 'Sick Leave']
                }
            })
        }
    ];

    for (const policy of policies) {
        const existing = await db.select().from(internalPolicies).where(eq(internalPolicies.category, policy.category as any)).limit(1);
        if (existing.length > 0) {
            await db.update(internalPolicies).set(policy as any).where(eq(internalPolicies.id, existing[0].id));
            console.log(`✅ Updated ${policy.category} policy.`);
        } else {
            await db.insert(internalPolicies).values(policy as any);
            console.log(`✅ Inserted ${policy.category} policy.`);
        }
    }

    console.log('🏁 Seeding completed.');
    process.exit(0);
}

seed().catch(err => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
});
