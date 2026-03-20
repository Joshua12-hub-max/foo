import { db } from '../db/index.js';
import { internalPolicies } from '../db/schema.js';



async function seedPolicies() {
  console.log('[SEED] Seeding Internal Policies...');

  const policies = [
    // ===== HOURS =====
    {
      category: 'hours' as const,
      title: 'Standard Working Hours',
      versionLabel: 'v1.0 - CGM 2026',
      content: JSON.stringify({
        standardDuty: {
          label: 'Regular / Plantilla',
          schedule: 'Monday to Friday',
          startTime: '08:00',
          endTime: '17:00',
          lunchBreak: { start: '12:00', end: '13:00' },
          totalHours: 8,
          totalMinutesPerDay: 480
        },
        irregularDuty: {
          label: 'JO / COS / Casual',
          schedule: 'As scheduled by department head',
          note: 'May include weekends and holidays depending on assignment',
          totalHours: 8,
          totalMinutesPerDay: 480
        },
        notes: [
          'All employees must complete 8 hours of work per day.',
          'Flexible working arrangements subject to department head approval.',
          'Overtime requires prior written authorization.'
        ]
      })
    },

    // ===== TARDINESS =====
    {
      category: 'tardiness' as const,
      title: 'Tardiness Policy (CSC MC No. 1, s. 2017 & CGM Internal)',
      versionLabel: 'v2.0 - CSC 2017',
      content: JSON.stringify({
        gracePeriod: 0,
        definition: 'An employee is considered tardy when they report for work after the prescribed time of arrival.',
        habitualThreshold: {
          instancesPerMonth: 10,
          requiredMonths: 2,
          pattern: 'consecutive_or_same_semester',
          description: '10 or more times of tardiness in a month for at least 2 months in a semester, whether consecutive or not.'
        },
        penalties: {
          regular: [
            { offense: '1st', penalty: 'Reprimand (Stern Warning)', severity: 'minor' },
            { offense: '2nd', penalty: 'Suspension of one (1) to thirty (30) days', severity: 'major' },
            { offense: '3rd', penalty: 'Dismissal from the Service', severity: 'terminal' }
          ],
          jo_cos: [
            { offense: '1st', penalty: 'Warning', severity: 'minor' },
            { offense: '2nd', penalty: 'Reprimand', severity: 'moderate' },
            { offense: '3rd', penalty: 'Termination of Contract', severity: 'terminal' }
          ]
        },
        deduction: {
          formula: 'Total Late Minutes / 480 = Days Equivalent',
          deductFrom: 'Vacation Leave first, then LWOP',
          reference: 'CSC MC No. 17, s. 2010'
        }
      })
    },

    // ===== UNDERTIME =====
    {
      category: 'tardiness' as const,
      title: 'Undertime Policy (CSC MC No. 1, s. 2017 & CGM Internal)',
      versionLabel: 'v2.0 - CSC 2017',
      content: JSON.stringify({
        definition: 'An employee is considered on undertime when they leave the office before the prescribed end of office hours.',
        habitualThreshold: {
          instancesPerMonth: 10,
          requiredMonths: 2,
          pattern: 'consecutive_or_same_semester',
          description: '10 or more incurrences of undertime in a month for at least 2 months in a semester.'
        },
        subtypes: {
          simpleMisconduct: {
            label: 'Simple Misconduct',
            description: 'Default classification for habitual undertime.',
            penalties: {
              regular: [
                { offense: '1st', penalty: 'Reprimand (Stern Warning)', severity: 'minor' },
                { offense: '2nd', penalty: 'Suspension of one (1) to thirty (30) days', severity: 'major' },
                { offense: '3rd', penalty: 'Dismissal from the Service', severity: 'terminal' }
              ],
              jo_cos: [
                { offense: '1st', penalty: 'Warning', severity: 'minor' },
                { offense: '2nd', penalty: 'Reprimand', severity: 'moderate' },
                { offense: '3rd', penalty: 'Termination of Contract', severity: 'terminal' }
              ]
            }
          },
          prejudicialToService: {
            label: 'Conduct Prejudicial to Best Interest of the Service',
            description: 'Requires manual admin tagging. Used when undertime adversely affects public service.',
            penalties: {
              regular: [
                { offense: '1st', penalty: 'Suspension of six (6) months and one (1) day to one (1) year', severity: 'grave' },
                { offense: '2nd', penalty: 'Dismissal from the Service', severity: 'terminal' }
              ],
              jo_cos: [
                { offense: '1st', penalty: 'Reprimand', severity: 'moderate' },
                { offense: '2nd', penalty: 'Termination of Contract', severity: 'terminal' }
              ]
            }
          }
        },
        deduction: {
          formula: 'Total Undertime Minutes / 480 = Days Equivalent',
          deductFrom: 'Vacation Leave first, then LWOP',
          reference: 'CSC MC No. 17, s. 2010'
        }
      })
    },

    // ===== ABSENTEEISM =====
    {
      category: 'penalties' as const,
      title: 'Habitual Absenteeism Policy (CSC MC No. 1, s. 2017)',
      versionLabel: 'v2.0 - CSC 2017',
      content: JSON.stringify({
        definition: 'An employee is habitually absent when they incur unauthorized absences exceeding allowable limits within the prescribed monitoring period.',
        habitualThreshold: {
          daysPerMonth: 2.5,
          requiredMonths: 3,
          pattern: 'consecutive_or_same_semester',
          description: 'Unauthorized absences exceeding 2.5 days in a month for at least 3 months in a semester.'
        },
        penalties: {
          regular: [
            { offense: '1st', penalty: 'Suspension of six (6) months and one (1) day', severity: 'grave' },
            { offense: '2nd', penalty: 'Dismissal from the Service', severity: 'terminal' }
          ],
          jo_cos: [
            { offense: '1st', penalty: 'Reprimand', severity: 'moderate' },
            { offense: '2nd', penalty: 'Termination of Contract', severity: 'terminal' }
          ]
        },
        awolRule: {
          threshold: 30,
          unit: 'consecutive_working_days',
          consequence: 'Dropped from the rolls without prior notice (CSC MC No. 38, s. 1993)',
          appliesTo: 'all'
        }
      })
    },

    // ===== CSC PENALTY MATRIX =====
    {
      category: 'csc' as const,
      title: 'CSC Progressive Discipline Matrix',
      versionLabel: 'v1.0 - CSC MC No.1 s.2017',
      content: JSON.stringify({
        reference: 'CSC Memorandum Circular No. 1, s. 2017 - Rules on Administrative Cases in the Civil Service (2017-RACCS)',
        employeeTypes: {
          standard: { label: 'Regular / Permanent / Plantilla', dutyType: 'Standard' },
          irregular: { label: 'Job Order / Contract of Service / Casual', dutyType: 'Irregular' }
        },
        severityLevels: [
          { level: 'minor', maxRating: 3, description: 'Reprimand level. Rating ceiling: Satisfactory.' },
          { level: 'moderate', maxRating: 2, description: 'Suspension level. Rating ceiling: Unsatisfactory.' },
          { level: 'major', maxRating: 1, description: 'Major suspension. Rating ceiling: Poor.' },
          { level: 'grave', maxRating: 1, description: 'Long suspension / near dismissal.' },
          { level: 'terminal', maxRating: 0, description: 'Dismissal / Termination of contract.' }
        ],
        performanceRatingScale: [
          { score: 5, label: 'Outstanding', minInstances: 0, maxLateMinutes: 0, maxAbsences: 0 },
          { score: 4, label: 'Very Satisfactory', maxInstances: 5, maxLateMinutes: 60, maxAbsences: 0 },
          { score: 3, label: 'Satisfactory', maxInstances: 10, maxLateMinutes: 120, maxAbsences: 1 },
          { score: 2, label: 'Unsatisfactory', maxInstances: 15, maxAbsences: 2 },
          { score: 1, label: 'Poor', description: 'All others' }
        ]
      })
    },

    // ===== LEAVE POLICIES =====
    {
      category: 'leave' as const,
      title: 'Leave Filing & Approval Policies (CGM Internal + CSC)',
      versionLabel: 'v2.1 - CGM 2026',
      content: JSON.stringify({
        types: [
          'Vacation Leave',
          'Sick Leave',
          'Special Privilege Leave',
          'Forced Leave',
          'Maternity Leave',
          'Paternity Leave',
          'Solo Parent Leave',
          'Study Leave',
          'Special Emergency Leave',
          'VAWC Leave',
          'Rehabilitation Leave',
          'Special Leave Benefits for Women',
          'Wellness Leave',
          'Adoption Leave'
        ],
        annualLimits: {
          'Special Privilege Leave': 3,
          'Forced Leave': 5,
          'Special Emergency Leave': 5,
          'Adoption Leave': 60,
          'Solo Parent Leave': 7,
          'Paternity Leave': 7,
          'VAWC Leave': 10,
          'Special Leave Benefits for Women': 60,
          'Maternity Leave': 105,
          'Rehabilitation Leave': 180,
          'Wellness Leave': 1,
          'Study Leave': 180
        },
        advanceFilingDays: {
          days: 5,
          appliesTo: [
            'Vacation Leave', 'Forced Leave', 'Adoption Leave',
            'Special Privilege Leave', 'Solo Parent Leave',
            'Special Leave Benefits for Women', 'Paternity Leave',
            'Rehabilitation Leave', 'Wellness Leave'
          ],
          description: 'Must be filed at least 5 working days before the intended start date.'
        },
        sickLeaveWindow: {
          maxDaysAfterReturn: 3,
          description: 'Sick Leave application must be filed within 3 working days of returning to work.'
        },
        crossChargeMap: {
          'Sick Leave': 'Vacation Leave',
          'Forced Leave': 'Vacation Leave'
        },
        leaveToCreditMap: {
          'Vacation Leave': 'Vacation Leave',
          'Sick Leave': 'Sick Leave',
          'Special Privilege Leave': 'Special Privilege Leave',
          'Forced Leave': 'Vacation Leave',
          'Maternity Leave': 'Maternity Leave',
          'Paternity Leave': 'Paternity Leave',
          'Solo Parent Leave': 'Solo Parent Leave',
          'Study Leave': 'Study Leave',
          'Adoption Leave': 'Adoption Leave',
          'Special Emergency Leave': 'Special Emergency Leave',
          'VAWC Leave': 'VAWC Leave',
          'Rehabilitation Leave': 'Rehabilitation Leave',
          'Special Leave Benefits for Women': 'Special Leave Benefits for Women',
          'Wellness Leave': 'Wellness Leave'
        },
        specialLeavesNoDeduction: [
          'Special Privilege Leave',
          'Special Emergency Leave',
          'Wellness Leave',
          'Study Leave',
          'VAWC Leave',
          'Rehabilitation Leave',
          'Maternity Leave',
          'Paternity Leave',
          'Solo Parent Leave',
          'Special Leave Benefits for Women',
          'Adoption Leave'
        ],
        requiredAttachments: {
          sickLeave5Days: {
            condition: 'Sick Leave of 5 or more consecutive working days',
            required: 'Medical Certificate from attending physician',
            reference: 'CSC MC No. 41, s. 1998'
          },
          maternityLeave: {
            condition: 'All Maternity Leave applications',
            required: 'Medical Certificate confirming pregnancy/delivery'
          },
          specialLeaveWomen: {
            condition: 'Special Leave Benefits for Women (RA 9710)',
            required: 'Medical Certificate or proof of qualifying condition'
          },
          vawcLeave: {
            condition: 'VAWC Leave (RA 9262)',
            required: 'Barangay Protection Order, Temporary Protection Order, or police report'
          },
          adoptionLeave: {
            condition: 'Adoption Leave (RA 8552)',
            required: 'Proof of legal adoption process (DSWD endorsement or court order)'
          }
        },
        deemedApprovalGracePeriod: 5,
        deemedApproval: {
          days: 5,
          description: 'Any leave application pending action for 5 or more days is automatically deemed approved per CSC rules.',
          reference: 'CSC MC No. 41, s. 1998, Section 49'
        },
        forcedLeaveRule: {
          minimumVLRequired: 10,
          description: 'Employees with 10 or more Vacation Leave credits must use at least 5 days as Forced Leave annually.',
          reference: 'CSC MC No. 41, s. 1998, Section 25'
        },
        monthlyAccrual: {
          vacationLeave: 1.25,
          sickLeave: 1.25,
          total: 2.5,
          accrualRuleType: 'CSC_STANDARD',
          accruingTypes: ['Permanent', 'Contractual', 'Casual', 'Temporary', 'Coterminous'],
          description: 'Regular employees earn 1.25 days VL and 1.25 days SL per month (15 days each per year).',
          reference: 'EO No. 292 (Administrative Code of 1987)'
        }
      })
    },

    // ===== PLANTILLA =====
    {
      category: 'plantilla' as const,
      title: 'Plantilla & Employment Classification',
      versionLabel: 'v1.0 - CGM 2026',
      content: JSON.stringify({
        appointmentTypes: [
          { type: 'Permanent', dutyType: 'Standard', penaltyTrack: 'regular', hasLeaveCredits: true },
          { type: 'Contractual', dutyType: 'Standard', penaltyTrack: 'regular', hasLeaveCredits: true },
          { type: 'Casual', dutyType: 'Irregular', penaltyTrack: 'jo_cos', hasLeaveCredits: true },
          { type: 'Temporary', dutyType: 'Standard', penaltyTrack: 'regular', hasLeaveCredits: true },
          { type: 'Coterminous', dutyType: 'Standard', penaltyTrack: 'regular', hasLeaveCredits: true },
          { type: 'Job Order', dutyType: 'Irregular', penaltyTrack: 'jo_cos', hasLeaveCredits: false },
          { type: 'Contract of Service', dutyType: 'Irregular', penaltyTrack: 'jo_cos', hasLeaveCredits: false },
          { type: 'JO', dutyType: 'Irregular', penaltyTrack: 'jo_cos', hasLeaveCredits: false },
          { type: 'COS', dutyType: 'Irregular', penaltyTrack: 'jo_cos', hasLeaveCredits: false }
        ],
        notes: [
          'Standard Duty = Regular Mon-Fri 8AM-5PM schedule',
          'Irregular Duty = Schedule assigned by department head, may include weekends',
          'JO/COS do not earn leave credits under CSC rules',
          'Penalty track for JO/COS is shorter (Warning → Termination of Contract)'
        ]
      })
    }
  ];

  try {
    // Clear existing policies first
    await db.delete(internalPolicies);
    console.log('[SEED] Cleared existing policies.');

    // Insert all policies
    for (const policy of policies) {
      await db.insert(internalPolicies).values(policy);
      console.log(`[SEED] Inserted: ${policy.title}`);
    }

    console.log(`\n[SEED] Successfully seeded ${policies.length} internal policies.`);
  } catch (error) {
    console.error('[SEED] Error seeding policies:', error);
  } finally {
    process.exit(0);
  }
}

seedPolicies();
