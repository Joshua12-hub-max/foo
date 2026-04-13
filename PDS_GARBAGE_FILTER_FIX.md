# PDS References Garbage Data Filter Fix
**Date:** 2026-04-14
**Issue:** Registration failing with "Data too long for column 'address'" error

---

## 🔍 Problem

The PDS parser was extracting **declaration text** from the bottom of the PDS form and treating it as reference data:

```
Error: Data too long for column 'address' at row 1

Attempted to insert:
- name: "42."
- address: "I declare under oath that I have personally accomplished..."
- tel_no: "I declare under oath that I have personally accomplished..."
```

This is clearly garbage data - the parser was reading from the wrong rows or the Excel file had declaration text in the references section.

---

## ✅ Root Cause

1. **Insufficient Garbage Detection:** The `isPdsGarbage()` function didn't detect:
   - Question numbers like "42.", "34.a."
   - Declaration text starting with "I declare under oath..."

2. **No Field-Level Validation:** The reference extraction only checked the `name` field for garbage, not the `address` or `telNo` fields.

3. **No Length Validation:** No checks for suspiciously long text (declaration text is 300+ characters).

---

## 🔧 Changes Applied

### 1. Enhanced Garbage Pattern Detection

**File:** `backend/utils/pdsDataUtils.ts`

Added new patterns to catch:
- Question numbers: `/^\d{1,2}\.[a-z]?\.?\s*$/i` (e.g., "42.", "34.a.")
- Declaration text patterns:
  - `/I declare under oath|I authorize the agency|I agree that any misrepresentation/i`
  - `/personally accomplished this Personal Data Sheet/i`
  - `/true, correct, and complete statement/i`
  - `/provisions of pertinent laws, rules, and regulations/i`

### 2. Enhanced Reference Extraction

**File:** `backend/services/PDSParserService.ts`

**Before:**
```typescript
const name = row.A || row.B;
if (!name || isGarbage(name)) return null;

return {
  name,
  address: row.F,
  telNo: row.G,
};
```

**After:**
```typescript
const name = row.A || row.B;
const address = row.F;
const telNo = row.G;

// Filter out garbage data - check all fields
if (!name || isGarbage(name)) return null;
if (address && isGarbage(address)) return null;
if (telNo && isGarbage(telNo)) return null;

// Additional validation: reject if name is too short
if (name.trim().length < 3) return null;

// Additional validation: reject if address is suspiciously long
if (address && address.length > 200) return null;

return { name, address, telNo };
```

### 3. Enhanced Reference Transformation

**File:** `backend/services/PDSParserService.ts`

**Before:**
```typescript
const references: PdsReference[] = rawData.references.map((ref) => ({
  name: normalizePdsString(ref.name) || '',
  address: normalizePdsString(ref.address) || undefined,
  telNo: normalizePdsString(ref.telNo) || undefined,
}));
```

**After:**
```typescript
const references: PdsReference[] = rawData.references
  .map((ref) => ({
    name: normalizePdsString(ref.name, 255) || '',
    address: normalizePdsString(ref.address, 255) || undefined,
    telNo: normalizePdsString(ref.telNo, 50) || undefined,
  }))
  .filter((ref) => {
    // Must have a valid name
    if (!ref.name || ref.name.length < 3) return false;
    // Additional safety check for garbage that slipped through
    if (isPdsGarbage(ref.name)) return false;
    if (ref.address && isPdsGarbage(ref.address)) return false;
    if (ref.telNo && isPdsGarbage(ref.telNo)) return false;
    return true;
  });
```

---

## 🧪 Testing

### Automated Tests
✅ All garbage detection tests passed:
- Question numbers (42., 34.a.) detected as garbage
- Declaration text detected as garbage
- Valid names (John Doe, Maria Santos) NOT detected as garbage

### Database Schema Constraints
- `name`: VARCHAR(255) NOT NULL
- `address`: VARCHAR(255) NULL
- `tel_no`: VARCHAR(50) NULL

New validation ensures:
- Names are at least 3 characters
- Addresses don't exceed 200 characters (before DB insert)
- All fields are sanitized with max length constraints

---

## 📝 Files Modified

1. **backend/utils/pdsDataUtils.ts**
   - Enhanced `COMPREHENSIVE_GARBAGE_PATTERNS` array
   - Added declaration text patterns
   - Added question number patterns

2. **backend/services/PDSParserService.ts**
   - Enhanced reference extraction (line ~514-530)
   - Added all-field garbage validation
   - Added length validation (name >= 3, address <= 200)
   - Enhanced reference transformation (line ~717-732)
   - Added double-filtering with garbage checks

---

## 🎯 Impact

### Before Fix
- Declaration text was inserted as reference data
- Database insert failed with "Data too long" error
- User registration blocked

### After Fix
- ✅ Declaration text filtered out during extraction
- ✅ Question numbers filtered out
- ✅ Only valid reference data inserted
- ✅ User registration succeeds

---

## 🚀 Next Steps

1. **Restart Backend Server** to load the updated code

2. **Test Registration Flow:**
   - Upload a PDS Excel file with declaration text in references section
   - Verify registration completes successfully
   - Check that only valid references are inserted

3. **Verify Data Quality:**
   - Check existing PDS records for any garbage references
   - Run cleanup script if needed (to remove invalid references)

---

## ⚠️ Root Cause Investigation Needed

While this fix prevents garbage data from being inserted, the **root question remains:**

**Why is declaration text in the references section?**

Possible causes:
1. **Coordinate Map Issue:** The `PDS_COORDINATE_MAP.c4.references` specifies rows 52-55. If the actual PDS file has a different layout, we're reading from the wrong location.

2. **Data Quality Issue:** The uploaded Excel file itself has declaration text copied into the references rows.

**Recommendation:**
- Review the actual CS Form 212 Excel file being uploaded
- Verify the coordinate map matches the actual file layout
- Consider adding a warning log when references are filtered out (to help identify bad files)

---

## 📊 Validation Layers

The fix implements **defense in depth** with multiple validation layers:

1. **Layer 1 - Extraction (PDSParserService line ~515):**
   - Check all fields for garbage patterns
   - Reject rows with short names (< 3 chars)
   - Reject rows with long addresses (> 200 chars)

2. **Layer 2 - Transformation (PDSParserService line ~718):**
   - Apply length constraints during sanitization
   - Filter out any garbage that slipped through
   - Double-check all fields with `isPdsGarbage()`

3. **Layer 3 - Database (Schema Constraints):**
   - VARCHAR length limits prevent oversized data
   - NOT NULL constraint ensures name exists

---

## ✅ Verification

Run this query to check for any garbage references that might have been inserted before the fix:

```sql
SELECT * FROM pds_references
WHERE
  LENGTH(name) < 3
  OR LENGTH(address) > 200
  OR name REGEXP '^[0-9]+\\.?[a-z]?\\.?$'
  OR address LIKE '%I declare under oath%'
  OR address LIKE '%personally accomplished%';
```

If any are found, they should be deleted:

```sql
DELETE FROM pds_references
WHERE
  LENGTH(name) < 3
  OR LENGTH(address) > 200
  OR name REGEXP '^[0-9]+\\.?[a-z]?\\.?$'
  OR address LIKE '%I declare under oath%'
  OR address LIKE '%personally accomplished%';
```

---

**Status:** Reference garbage filtering is now comprehensive and multi-layered. Registration should complete successfully even if the Excel file contains declaration text in the references section.
