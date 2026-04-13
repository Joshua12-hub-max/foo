import { db } from '../db/index.js';
import { performanceCriteria, performanceReviewCycles } from '../db/schema.js';
import { eq } from 'drizzle-orm';

async function seedPerformanceDefaults() {
  console.log('🌱 Seeding performance defaults...');

  try {
    // 1. Seed Criteria
    const defaultCriteria = [
      {
        title: 'Core Function: Quality of Work',
        description: 'Degree of excellence of the work performed.',
        category: 'Core Functions',
        criteriaType: 'core_function',
        weight: '0.40',
        maxScore: 5,
        ratingDefinition5: 'Exceeds standard quality in all aspects.',
        ratingDefinition4: 'Standard quality exceeded in most aspects.',
        ratingDefinition3: 'Met all quality standards.',
        ratingDefinition2: 'Failed to meet quality standards in some aspects.',
        ratingDefinition1: 'Failed to meet all quality standards.',
        evidenceRequirements: 'Output reports, peer reviews, error logs.'
      },
      {
        title: 'Core Function: Timeliness',
        description: 'Completing work within the required timeframe.',
        category: 'Core Functions',
        criteriaType: 'core_function',
        weight: '0.30',
        maxScore: 5,
        ratingDefinition5: 'Tasks completed significantly ahead of schedule.',
        ratingDefinition4: 'Tasks completed ahead of schedule.',
        ratingDefinition3: 'Tasks completed on schedule.',
        ratingDefinition2: 'Some tasks delayed.',
        ratingDefinition1: 'Most tasks consistently delayed.',
        evidenceRequirements: 'Submission logs, project timelines.'
      },
      {
        title: 'Support Function: Attendance and Punctuality',
        description: 'Regularity in reporting for work.',
        category: 'Support Functions',
        criteriaType: 'support_function',
        weight: '0.20',
        maxScore: 5,
        ratingDefinition5: 'Zero absences and tardiness.',
        ratingDefinition4: 'Minimal absences and tardiness (less than 2 days).',
        ratingDefinition3: 'Standard attendance (3-5 days of leave/tardiness).',
        ratingDefinition2: 'Frequent absences or tardiness.',
        ratingDefinition1: 'Habitual absenteeism or tardiness.',
        evidenceRequirements: 'DTR logs, attendance records.'
      },
      {
        title: 'Core Competency: Teamwork',
        description: 'Ability to work effectively with others.',
        category: 'General',
        criteriaType: 'core_competency',
        weight: '0.10',
        maxScore: 5,
        ratingDefinition5: 'Exceptional team player, inspires others.',
        ratingDefinition4: 'Highly cooperative and helpful.',
        ratingDefinition3: 'Works well with the team.',
        ratingDefinition2: 'Has occasional difficulty working with others.',
        ratingDefinition1: 'Consistent difficulty in team collaboration.',
        evidenceRequirements: 'Peer feedback, project collaboration notes.'
      }
    ];

    for (const criteria of defaultCriteria) {
      const existing = await db.query.performanceCriteria.findFirst({
        where: eq(performanceCriteria.title, criteria.title)
      });

      if (!existing) {
        await db.insert(performanceCriteria).values(criteria as any);
        console.log(`✅ Created criteria: ${criteria.title}`);
      } else {
        console.log(`ℹ️ Criteria already exists: ${criteria.title}`);
      }
    }

    // 2. Seed Review Cycle
    const today = new Date();
    const currentYear = today.getFullYear();
    
    const defaultCycles = [
      {
        title: `1st Semester ${currentYear}`,
        description: `Performance evaluation period for January to June ${currentYear}.`,
        startDate: `${currentYear}-01-01`,
        endDate: `${currentYear}-06-30`,
        ratingPeriod: '1st_sem',
        status: 'Active'
      },
      {
        title: `2nd Semester ${currentYear}`,
        description: `Performance evaluation period for July to December ${currentYear}.`,
        startDate: `${currentYear}-07-01`,
        endDate: `${currentYear}-12-31`,
        ratingPeriod: '2nd_sem',
        status: 'Draft'
      }
    ];

    for (const cycle of defaultCycles) {
      const existing = await db.query.performanceReviewCycles.findFirst({
        where: eq(performanceReviewCycles.title, cycle.title)
      });

      if (!existing) {
        await db.insert(performanceReviewCycles).values(cycle as any);
        console.log(`✅ Created cycle: ${cycle.title}`);
      } else {
        console.log(`ℹ️ Cycle already exists: ${cycle.title}`);
      }
    }

    console.log('✨ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedPerformanceDefaults();
