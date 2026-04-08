/**
 * Verification Script for Applicant Documents Feature
 *
 * This script verifies that the applicant_documents table is properly set up
 * and demonstrates the document tracking functionality.
 *
 * Usage: npx tsx scripts/verify-applicant-documents.ts
 */

import { db } from '../db/index.js';
import { applicantDocuments, recruitmentApplicants } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';

async function verify() {
  console.log('='.repeat(70));
  console.log('APPLICANT DOCUMENTS VERIFICATION');
  console.log('='.repeat(70));

  // 1. Check table exists
  console.log('\n1️⃣  Checking if table exists...');
  try {
    await db.select().from(applicantDocuments).limit(1);
    console.log('   ✅ applicant_documents table exists and is accessible');
  } catch (error: any) {
    console.log('   ❌ Table does not exist');
    console.log('   Error:', error.message);
    process.exit(1);
  }

  // 2. Check foreign key constraint
  console.log('\n2️⃣  Checking foreign key constraint...');
  try {
    const fks = await db.execute(sql`
      SELECT
        CONSTRAINT_NAME,
        REFERENCED_TABLE_NAME,
        DELETE_RULE
      FROM information_schema.REFERENTIAL_CONSTRAINTS
      WHERE TABLE_NAME = 'applicant_documents'
      AND CONSTRAINT_SCHEMA = DATABASE()
    `);

    if (fks.length > 0) {
      console.log('   ✅ Foreign key constraint exists');
      console.log(`   - References: ${fks[0].REFERENCED_TABLE_NAME}`);
      console.log(`   - On Delete: ${fks[0].DELETE_RULE}`);
    } else {
      console.log('   ⚠️  No foreign key found');
    }
  } catch (error) {
    console.log('   ⚠️  Could not verify foreign key');
  }

  // 3. Check index
  console.log('\n3️⃣  Checking indexes...');
  try {
    const indexes = await db.execute(sql`
      SHOW INDEX FROM applicant_documents
      WHERE Column_name = 'applicant_id'
    `);

    if (indexes.length > 0) {
      console.log('   ✅ Index on applicant_id exists');
    } else {
      console.log('   ⚠️  No index on applicant_id found');
    }
  } catch (error) {
    console.log('   ⚠️  Could not verify index');
  }

  // 4. Count applicants and documents
  console.log('\n4️⃣  Checking data...');
  const applicantCount = await db.select().from(recruitmentApplicants);
  const documentCount = await db.select().from(applicantDocuments);

  console.log(`   - Total applicants: ${applicantCount.length}`);
  console.log(`   - Total documents: ${documentCount.length}`);

  // 5. Show sample documents (if any)
  console.log('\n5️⃣  Sample documents:');
  const sampleDocs = await db.select().from(applicantDocuments).limit(5);

  if (sampleDocs.length === 0) {
    console.log('   ℹ️  No documents yet. Submit a new application to test.');
  } else {
    console.log('');
    sampleDocs.forEach((doc, i) => {
      console.log(`   ${i + 1}. Applicant ${doc.applicantId} - ${doc.documentType}`);
      console.log(`      File: ${doc.documentName} (${(doc.fileSize || 0) / 1024} KB)`);
    });
  }

  // 6. Show applicants with document counts
  console.log('\n6️⃣  Applicants with document tracking:');
  const applicants = await db.select().from(recruitmentApplicants).limit(5);

  if (applicants.length === 0) {
    console.log('   ℹ️  No applicants yet');
  } else {
    console.log('');
    for (const app of applicants) {
      const docs = await db.select().from(applicantDocuments)
        .where(eq(applicantDocuments.applicantId, app.id));
      const legacy = [app.resumePath, app.photoPath, app.eligibilityPath].filter(Boolean).length;
      console.log(`   • Applicant ${app.id}: ${app.firstName} ${app.lastName}`);
      console.log(`     - Documents in new table: ${docs.length}`);
      console.log(`     - Legacy path fields: ${legacy}`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ VERIFICATION COMPLETE');
  console.log('='.repeat(70));
  console.log('\nNext Steps:');
  console.log('1. Submit a new job application with file uploads');
  console.log('2. Run this script again to see documents tracked');
  console.log('3. Test API: GET /api/recruitment/applicants/:id/documents');
  console.log('');

  process.exit(0);
}

verify().catch((error) => {
  console.error('\n❌ Verification failed:', error);
  process.exit(1);
});
