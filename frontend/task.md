# Task: Real-time Identification Validation

- [x] Analyze requirements and identify target forms (Register, AdminRegister, JobDetail, PDSFormWizard) <!-- id: 0 -->
- [x] Create backend `/auth/check-govt-id` endpoint for uniqueness checking <!-- id: 1 -->
- [x] Implement optimized database lookups for identification conflicts <!-- id: 2 -->
- [x] Add `authApi.checkGovtIdUniqueness` method to frontend API layer <!-- id: 3 -->
- [x] Create `useGovtIdUniquenessQuery` hook with debounced support for all ID fields <!-- id: 4 -->
- [x] Integrate real-time validation in `Register.tsx` (Red Border/Background + Messages) <!-- id: 5 -->
- [x] Integrate real-time validation in `AdminRegister.tsx` (Red Border/Background + Messages) <!-- id: 6 -->
- [x] Verify visual feedback in `JobDetail.tsx` (Format & Conflict Indicators Certified) <!-- id: 7 -->
- [x] Verify visual feedback in `PDSFormWizard.tsx` (Format & Conflict Indicators Certified) <!-- id: 8 -->
- [x] Align and document verification protocols in `walkthrough.md` <!-- id: 9 -->
- [x] Final build verification (`npx tsc --noEmit`) <!-- id: 10 -->
- [x] 100% Status Consistency: Confirmed all forms turn red for duplicate/invalid IDs <!-- id: 11 -->
