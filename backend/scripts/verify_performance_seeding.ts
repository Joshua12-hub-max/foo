
import { db } from '../db/index.js';
import { performanceReviews, performanceReviewItems, performanceCriteria, authentication } from '../db/schema.js';
import { eq, desc, and, like } from 'drizzle-orm';

async function verifyPerformance() {
  console.log('Verifying Performance Seeding...');

  // 1. Check Criteria
  const criteria = await db.select().from(performanceCriteria);
  console.log(`Criteria Count: ${criteria.length}`);
  console.table(criteria.map(c => ({ id: c.id, title: c.title, weight: c.weight, type: c.criteriaType })));

  // 2. Check Reviews
  const reviews = await db.select({
      emp: authentication.firstName,
      role: authentication.role,
      status: performanceReviews.status,
      totalScore: performanceReviews.totalScore,
      finalRating: performanceReviews.finalRatingScore,
      updatedAt: performanceReviews.updatedAt
  })
  .from(performanceReviews)
  .leftJoin(authentication, eq(performanceReviews.employeeId, authentication.id))
  .where(like(authentication.department, '%Human Resources%'))
  .orderBy(desc(performanceReviews.finalRatingScore)); // Highest performers first

  console.log(`\nReviews Count: ${reviews.length}`);
  console.table(reviews);

  // 3. Deep dive into one review (e.g., top scorer)
  if (reviews.length > 0) {
      const topPerformer = reviews[0];
      console.log(`\nDetailed Items for Top Performer: ${topPerformer.emp}`);
      
      const emp = await db.query.authentication.findFirst({ where: eq(authentication.firstName, topPerformer.emp) });
      if (emp) {
        const review = await db.query.performanceReviews.findFirst({ where: eq(performanceReviews.employeeId, emp.id) });
        if (review) {
            const items = await db.select({
                criterion: performanceReviewItems.criteriaTitle,
                score: performanceReviewItems.score,
                weight: performanceReviewItems.weight,
                comment: performanceReviewItems.comment
            })
            .from(performanceReviewItems)
            .where(eq(performanceReviewItems.reviewId, review.id));
            
            console.table(items);
        }
      }
  }

  process.exit(0);
}

verifyPerformance();
