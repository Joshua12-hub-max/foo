import { db } from './db/index.js';
import { authentication } from './db/tables/auth.js';
import { recruitmentApplicants, applicantDocuments } from './db/tables/recruitment.js';
import { employeeDocuments } from './db/tables/pds.js';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function run() {
  try {
    console.log('--- MANUAL DOCUMENT SYNC FOR CHRISTIAN PAUL RAMOS (Auth ID: 17, App ID: 1) ---');
    
    const [applicant] = await db.select().from(recruitmentApplicants).where(eq(recruitmentApplicants.id, 1));
    if (!applicant) {
      console.error('Applicant 1 not found');
      return;
    }

    const [user] = await db.select().from(authentication).where(eq(authentication.id, 17));
    if (!user) {
      console.error('User 17 not found');
      return;
    }

    const docsToSync = [];
    const lastName = user.lastName;
    const employeeId = user.employeeId;
    const userId = user.id;

    if (applicant.resumePath) {
      docsToSync.push({
        employeeId: userId,
        documentType: 'Resume',
        documentName: `Resume_${lastName}_${employeeId}${path.extname(applicant.resumePath)}`,
        filePath: `/uploads/resumes/${applicant.resumePath}`,
        mimeType: 'application/pdf'
      });
    }

    const photoFile = applicant.photo1x1Path || applicant.photoPath;
    if (photoFile) {
      docsToSync.push({
        employeeId: userId,
        documentType: '2x2 ID Photo',
        documentName: `Photo2x2_${lastName}_${employeeId}${path.extname(photoFile)}`,
        filePath: `/uploads/resumes/${photoFile}`,
        mimeType: photoFile.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg'
      });
      
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
      const avatarUrl = `${backendUrl}/uploads/resumes/${photoFile}`;
      await db.update(authentication).set({ avatarUrl }).where(eq(authentication.id, userId));
      console.log('Updated Avatar URL to:', avatarUrl);
    }

    if (applicant.eligibilityPath) {
      docsToSync.push({
        employeeId: userId,
        documentType: 'Eligibility Certificate',
        documentName: `Eligibility_${lastName}_${employeeId}${path.extname(applicant.eligibilityPath)}`,
        filePath: `/uploads/resumes/${applicant.eligibilityPath}`,
        mimeType: 'application/pdf'
      });
    }

    // Extra docs
    const extraDocs = await db.select().from(applicantDocuments).where(eq(applicantDocuments.applicantId, 1));
    for (const doc of extraDocs) {
       docsToSync.push({
         employeeId: userId,
         documentType: doc.documentType || 'Other Applicant Document',
         documentName: doc.documentName,
         filePath: `/uploads/resumes/${doc.filePath}`,
         mimeType: doc.mimeType
       });
    }

    if (docsToSync.length > 0) {
      await db.delete(employeeDocuments).where(eq(employeeDocuments.employeeId, userId));
      await db.insert(employeeDocuments).values(docsToSync as any[]);
      console.log(`Successfully synced ${docsToSync.length} documents.`);
    }

  } catch (error) {
    console.error('Manual migration failed:', error);
  } finally {
    process.exit(0);
  }
}

run();
