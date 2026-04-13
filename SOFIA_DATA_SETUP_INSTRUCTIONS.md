# Sofia Complete Data Setup Instructions

**Date**: 2025-04-14
**Purpose**: Insert comprehensive PDS data for Sofia Reyes to test complete frontend display

---

## 📋 **Prerequisites**

- MySQL/MariaDB database running
- Database name: `nebr_db`
- Backend server configured and ready

---

## 🚀 **Step-by-Step Instructions**

### **Step 1: Insert Sofia's Complete Data**

Run the SQL script to populate all PDS sections:

```bash
# Option 1: Using MySQL command line
mysql -u root -p nebr_db < backend/scripts/insert-sofia-complete-data.sql

# Option 2: Using your database client (DBeaver, phpMyAdmin, etc.)
# Open: backend/scripts/insert-sofia-complete-data.sql
# Execute against: nebr_db database
```

**What this script does:**
- Creates/updates Sofia's authentication record (Emp-001)
- Inserts complete HR details (Administrative Officer IV, SG 15)
- Populates all personal information fields
- Adds family background (spouse, father, mother, 2 children)
- Inserts 4 education records (Elementary to Graduate Studies)
- Adds 2 civil service eligibilities
- Creates 3 work experience entries
- Adds 2 voluntary work records
- Inserts 4 learning & development trainings
- Populates 7 other information entries (skills, recognitions, memberships)
- Adds 3 references
- Completes declarations section
- Creates 2 emergency contacts

---

### **Step 2: Verify Data Insertion**

Run the verification script to confirm all data is present:

```bash
cd C:\Users\Joshua\project\nebr
npx tsx backend/scripts/verify-sofia-data.ts
```

**Expected Output:**
```
✅ Found Sofia: Sofia Reyes (ID: X)
   Email: sofia.reyes@meycauayan.gov.ph
   Role: Employee

================================================================================
DATA VERIFICATION RESULTS
================================================================================

✅ HR Details                      COMPLETE
✅ Personal Information            COMPLETE
✅ Family Background               COMPLETE
✅ Educational Background          COMPLETE
✅ Civil Service Eligibility       COMPLETE
✅ Work Experience                 COMPLETE
✅ Voluntary Work                  COMPLETE
✅ Learning & Development          COMPLETE
✅ Other Information               COMPLETE
✅ References                      COMPLETE
✅ Declarations                    COMPLETE
✅ Emergency Contacts              COMPLETE

================================================================================
✅ ALL DATA COMPLETE - Sofia's profile is ready for frontend testing!
```

---

### **Step 3: Test Frontend Display**

#### **A. Start Backend Server**
```bash
cd C:\Users\Joshua\project\nebr\backend
npm run dev
```

#### **B. Start Frontend**
```bash
cd C:\Users\Joshua\project\nebr\frontend
npm start
```

#### **C. Login as Sofia**
- **Email**: `sofia.reyes@meycauayan.gov.ph`
- **Password**: Use the password you set or reset it via backend

---

### **Step 4: Frontend Verification Checklist**

Navigate through Sofia's profile and verify each section displays correctly:

#### **✓ Personal Information Tab**
- [x] Full Name: Sofia Martinez Reyes
- [x] Birth Date: March 15, 1995
- [x] Place of Birth: Meycauayan, Bulacan
- [x] Gender: Female
- [x] Civil Status: Married
- [x] Height: 1.65 m
- [x] Weight: 58 kg
- [x] Blood Type: O+
- [x] Citizenship: Filipino (by birth)
- [x] Contact: (044) 123-4567, 09171234567
- [x] Email: sofia.reyes@meycauayan.gov.ph

#### **✓ Government IDs**
- [x] GSIS: 1234567890
- [x] Pag-IBIG: 1212-3434-5656
- [x] PhilHealth: 01-123456789-0
- [x] SSS: (if displayed)
- [x] TIN: 123-456-789-000
- [x] UMID: 0001-0123456-1
- [x] PhilSys: 1234-5678-9012-3456
- [x] Employee No: Employee-001-2020

#### **✓ Address Information**
**Residential:**
- [x] House/Block/Lot: Blk 3 Lot 8
- [x] Street: Maharlika Street
- [x] Subdivision: Banga Homes Phase 2
- [x] Barangay: Banga
- [x] City: Meycauayan
- [x] Province: Bulacan
- [x] Region: Region III (Central Luzon)
- [x] ZIP: 3020

**Permanent:** (Same as residential)

#### **✓ Family Background Tab**
- [x] Spouse: Juan Santos Reyes (Software Engineer)
- [x] Father: Carlos Dela Cruz Martinez Sr.
- [x] Mother: Maria Santos Martinez
- [x] Children:
  - [x] Isabella Sofia Reyes (Born: May 10, 2020)
  - [x] Lucas Miguel Reyes (Born: August 15, 2022)

#### **✓ Educational Background Tab**
- [x] Elementary: Meycauayan Central School (2001-2007) - With Honors
- [x] Secondary: Meycauayan National High School (2007-2011) - With High Honors
- [x] College: Bulacan State University - BS Public Administration (2011-2015) - Cum Laude
- [x] Graduate: PUP - Master in Public Administration (2016-2019) - Outstanding Thesis Award

#### **✓ Civil Service Eligibility Tab**
- [x] Career Service Professional (85.50%) - March 20, 2015
- [x] RA 1080 Board/Bar (87.25%) - October 15, 2015

#### **✓ Work Experience Tab**
- [x] Administrative Aide III (June 2015 - Dec 2017) - ₱15,000
- [x] Administrative Officer II (Jan 2018 - Dec 2019) - ₱22,000
- [x] Administrative Officer IV (Jan 2020 - Present) - ₱35,000 - SG 15

#### **✓ Voluntary Work Tab**
- [x] Meycauayan Youth Council (2016-2017) - 240 hours
- [x] Red Cross Bulacan Chapter (2017-2018) - 160 hours

#### **✓ Learning & Development Tab**
- [x] Basic Records Management Training (2016) - 40 hours
- [x] Human Resource Management Training (2018) - 40 hours
- [x] Strategic Performance Management System (2019) - 40 hours
- [x] Digital Transformation for Government (2021) - 24 hours

#### **✓ Other Information Tab**
**Skills:**
- [x] MS Office Suite (Advanced)
- [x] Records Management Systems
- [x] Public Speaking

**Recognitions:**
- [x] Outstanding Employee of the Year 2019
- [x] Service Award - 5 Years of Dedicated Service

**Memberships:**
- [x] PAPAE (Philippine Association of Public Administration Educators)
- [x] Civil Service Commission Alumni Association

#### **✓ References Tab**
- [x] Dr. Maria Elena Santos - BSU, Malolos
- [x] Atty. Roberto Cruz - City Legal Office
- [x] Ms. Carmen Aquino - PUP Manila

#### **✓ Declarations Tab**
- [x] All questions answered (mostly "No")
- [x] Government ID: PhilSys ID - 1234-5678-9012-3456
- [x] Date Accomplished: January 15, 2025

#### **✓ Emergency Contacts**
- [x] Juan Reyes (Spouse) - 09171234567 - Primary
- [x] Maria Martinez (Mother) - 09189876543

#### **✓ HR Details** (Admin/HR view)
- [x] Position: Administrative Officer IV
- [x] Item Number: CHRMO-AO4-001
- [x] Salary Grade: 15
- [x] Step Increment: 3
- [x] Employment Status: Active
- [x] Appointment Type: Permanent
- [x] Duty Type: Standard
- [x] Date Hired: January 15, 2020

---

### **Step 5: Test Data Flows**

After verifying static display, test these operations:

#### **A. Profile Update**
1. Edit Sofia's mobile number
2. Save changes
3. Refresh page
4. Verify change persisted

#### **B. Document Upload** (if applicable)
1. Upload a test document (PDS, certificate, etc.)
2. Verify it appears in Sofia's document gallery

#### **C. Export Profile** (if feature exists)
1. Export Sofia's PDS to PDF/Excel
2. Verify all sections are included
3. Check formatting is correct

---

## 🔧 **Troubleshooting**

### **Problem: Verification script shows MISSING data**

**Solution:**
1. Check if SQL script ran successfully
2. Look for error messages in SQL output
3. Verify database connection settings
4. Re-run SQL script

### **Problem: Frontend shows blank sections**

**Solution:**
1. Check browser console for API errors
2. Verify backend server is running
3. Check API endpoints are fetching correct employee ID
4. Inspect Network tab for failed requests

### **Problem: Data displays incorrectly**

**Solution:**
1. Check coordinate mapping in `pdsCoordinateMap.ts`
2. Verify data transformation in `PDSParserService.ts`
3. Check if garbage detection is filtering valid data
4. Inspect database values directly

---

## 📊 **Data Summary**

### **Sofia Reyes (Emp-001) Profile Completeness**

| Section | Records | Status |
|---------|---------|--------|
| Authentication | 1 | ✅ Complete |
| HR Details | 1 | ✅ Complete |
| Personal Information | 1 | ✅ Complete |
| Family Background | 4 | ✅ Complete |
| Education | 4 | ✅ Complete |
| Civil Service Eligibility | 2 | ✅ Complete |
| Work Experience | 3 | ✅ Complete |
| Voluntary Work | 2 | ✅ Complete |
| Learning & Development | 4 | ✅ Complete |
| Other Information | 7 | ✅ Complete |
| References | 3 | ✅ Complete |
| Declarations | 1 | ✅ Complete |
| Emergency Contacts | 2 | ✅ Complete |
| **TOTAL** | **33 records** | **100% Complete** |

---

## ✅ **Success Criteria**

Sofia's data is successfully set up when:

1. ✅ Verification script shows "ALL DATA COMPLETE"
2. ✅ All 12 profile sections display data in frontend
3. ✅ No blank fields in critical sections (personal info, education, work experience)
4. ✅ All dates display in correct format
5. ✅ All numeric fields (salary, SG, step) show correct values
6. ✅ Family members display with correct relationships
7. ✅ Education shows all 4 levels with year ranges
8. ✅ Work experience shows progression with "Present" for current job
9. ✅ References show 3 complete entries
10. ✅ HR details show correct position and salary grade

---

## 🎉 **After Successful Verification**

Once all checks pass:

1. **Document Results**: Take screenshots of each profile section
2. **Test Other Users**: Repeat for other test accounts if needed
3. **Production Readiness**: If Sofia's data displays perfectly, the parser fix is production-ready
4. **Cleanup**: Remove test scripts (audit script already removed)

---

## 📞 **Support**

If you encounter issues:
1. Check the `PDS_PARSER_FIX_SUMMARY.md` document
2. Review the verification script output
3. Inspect browser console and network tab
4. Check backend logs for errors

---

**Next**: After successful verification, you can safely remove these test scripts:
- ✅ `backend/scripts/test-pds-audit.ts` (will be removed automatically)
- ⏳ `backend/scripts/verify-sofia-data.ts` (keep for now, useful for debugging)
- ⏳ `backend/scripts/insert-sofia-complete-data.sql` (keep for future testing)
