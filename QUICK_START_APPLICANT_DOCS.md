# Quick Start: Applicant Documents Feature

## What This Feature Does

Tracks uploaded applicant documents (resume, photo, eligibility certificates) in a dedicated table with full metadata (file size, MIME type, original filename).

## Quick Test

### 1. Verify Installation
```bash
cd backend
npx tsx scripts/verify-applicant-documents.ts
```

Should show:
```
✅ applicant_documents table exists
✅ Foreign key constraint exists
✅ Index on applicant_id exists
```

### 2. Test with New Application

1. Start servers:
   ```bash
   # Terminal 1
   cd backend && npm run dev

   # Terminal 2
   cd frontend && npm run dev
   ```

2. Go to: http://localhost:3000/jobs (or your public jobs page)

3. Submit application with files:
   - Upload resume (PDF)
   - Upload photo (JPG/PNG)
   - Upload eligibility certificate (PDF)
   - Fill out form and submit

4. Verify documents were tracked:
   ```bash
   cd backend
   npx tsx scripts/verify-applicant-documents.ts
   ```

   Should now show:
   ```
   - Documents in new table: 4
   ```
   (4 documents = Resume + Photo + Photo1x1 + EligibilityCert)

### 3. Test API Endpoint

Get admin token first, then:

```bash
# Replace [TOKEN] and [ID] with actual values
curl http://localhost:5000/api/recruitment/applicants/[ID]/documents \
  -H "Authorization: Bearer [TOKEN]"
```

Response:
```json
{
  "success": true,
  "documents": [
    {
      "id": 1,
      "documentType": "Resume",
      "documentName": "john_doe_resume.pdf",
      "filePath": "resumes-1234567890.pdf",
      "fileSize": 45678,
      "fileSizeKB": "44.61",
      "downloadUrl": "http://localhost:5000/uploads/resumes/resumes-1234567890.pdf"
    }
  ]
}
```

## Integration in Admin Panel (Optional)

To display documents in applicant detail view:

```typescript
// Import component
import { ApplicantDocumentList } from '@/features/Recruitment/components/ApplicantDocumentList';

// Add to JSX
<ApplicantDocumentList applicantId={applicant.id} />
```

## Key Files

- **Backend:**
  - `backend/db/tables/recruitment.ts` - Table definition
  - `backend/controllers/recruitmentController.ts` - Dual-write logic + API endpoint
  - `backend/routes/recruitmentRoutes.ts` - Route definition
  - `backend/scripts/verify-applicant-documents.ts` - Verification script

- **Frontend:**
  - `frontend/src/features/Recruitment/components/ApplicantDocumentList.tsx` - Display component

## Troubleshooting

### No documents appearing after submission

1. Check backend logs for errors during submission
2. Verify files were uploaded to `backend/uploads/resumes/`
3. Check database:
   ```sql
   SELECT * FROM applicant_documents ORDER BY id DESC LIMIT 5;
   ```

### API endpoint returns empty array

1. Verify applicant ID is correct
2. Check applicant has documents:
   ```bash
   npx tsx scripts/verify-applicant-documents.ts
   ```
3. Check admin authentication token is valid

### Foreign key error when creating applicant

- Database migration may have failed
- Verify table structure:
  ```sql
  DESCRIBE applicant_documents;
  SHOW CREATE TABLE applicant_documents;
  ```

## Documentation

Full documentation: `APPLICANT_DOCUMENTS_IMPLEMENTATION.md`

## Support

Questions? Check:
1. Verification script output
2. Backend server logs
3. Database tables with SQL queries
4. Full documentation file
