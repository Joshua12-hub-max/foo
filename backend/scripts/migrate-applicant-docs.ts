import { db } from '../db/index.js';
import { recruitmentApplicants, applicantDocuments } from '../db/tables/recruitment.js';
import { sql, isNotNull, or } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

async function migrate() {
    console.log('🚀 Starting Applicant Documents Migration...');
    
    try {
        // 1. Find all applicants with legacy file paths
        const applicants = await db.select()
            .from(recruitmentApplicants)
            .where(or(
                isNotNull(recruitmentApplicants.resumePath),
                isNotNull(recruitmentApplicants.photoPath),
                isNotNull(recruitmentApplicants.photo1x1Path),
                isNotNull(recruitmentApplicants.eligibilityPath)
            ));

        console.log(`Found ${applicants.length} applicants with legacy files.`);

        const uploadDir = path.join(process.cwd(), 'uploads/resumes');

        for (const app of applicants) {
            console.log(`Processing Applicant ID: ${app.id} (${app.firstName} ${app.lastName})`);
            
            const docsToInsert = [];

            // Helper to check and add document
            const addDoc = (fileName: string | null | undefined, type: string) => {
                if (!fileName) return;
                
                const fullPath = path.join(uploadDir, fileName);
                let size = 0;
                if (fs.existsSync(fullPath)) {
                    size = fs.statSync(fullPath).size;
                }

                docsToInsert.push({
                    applicantId: app.id,
                    documentName: fileName.split('-').slice(2).join('-') || fileName, // Attempt to get original name
                    documentType: type,
                    filePath: fileName,
                    fileSize: size,
                    mimeType: fileName.endsWith('.pdf') ? 'application/pdf' : 'image/webp',
                    uploadedAt: app.createdAt
                });
            };

            addDoc(app.resumePath, 'Resume');
            addDoc(app.photoPath, 'Photo');
            addDoc(app.photo1x1Path, 'Photo1x1');
            addDoc(app.eligibilityPath, 'EligibilityCert');

            if (docsToInsert.length > 0) {
                // Check if they already exist in new table to prevent duplicates
                for (const doc of docsToInsert) {
                    const existing = await db.select()
                        .from(applicantDocuments)
                        .where(sql`applicant_id = ${doc.applicantId} AND document_type = ${doc.documentType} AND file_path = ${doc.filePath}`)
                        .limit(1);
                    
                    if (existing.length === 0) {
                        await db.insert(applicantDocuments).values(doc);
                        console.log(`   ✅ Migrated ${doc.documentType}: ${doc.filePath}`);
                    } else {
                        console.log(`   ℹ️ Skipping existing ${doc.documentType}: ${doc.filePath}`);
                    }
                }
            }
        }

        console.log('✅ Migration completed successfully.');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        process.exit(0);
    }
}

migrate();
