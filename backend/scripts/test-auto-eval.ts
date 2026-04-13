import { checkAndActivateCycles, generateReviewsForCycle } from '../jobs/performanceReviewGenerator.js';
import { db } from '../db/index.js';
import { performanceReviewCycles } from '../db/schema.js';
import { eq } from 'drizzle-orm';

async function testAutomation() {
  console.log('🚀 Testing Performance Automation...');

  try {
    // 1. Create a mock cycle starting today if none exists
    const today = new Date().toISOString().split('T')[0];
    const testTitle = `Test Auto Cycle ${today}`;
    
    let cycle = await db.query.performanceReviewCycles.findFirst({
      where: eq(performanceReviewCycles.title, testTitle)
    });

    if (!cycle) {
      console.log('Creating test cycle...');
      const [result] = await db.insert(performanceReviewCycles).values({
        title: testTitle,
        description: 'Test cycle for automation',
        startDate: today,
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'Draft',
        ratingPeriod: 'annual'
      });
      cycle = await db.query.performanceReviewCycles.findFirst({
        where: eq(performanceReviewCycles.id, result.insertId)
      });
    }

    if (!cycle) throw new Error('Failed to create/find test cycle');

    console.log(`Running checkAndActivateCycles for cycle: ${cycle.title}`);
    await checkAndActivateCycles();

    console.log('✨ Test completed! Check the logs/database for created reviews.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testAutomation();
