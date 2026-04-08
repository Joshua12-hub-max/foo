# Troubleshooting: Why Fields Are Not Displaying in UI

## ✅ What We've Verified

1. **Database**: All fields are present and populated ✓
   - Birth Date: 2000-01-15
   - Gender: Male
   - Civil Status: Single
   - Blood Type: O+
   - PhilSys ID: 1234-5678-9012-3456
   - All address components (Region, Province, City, Barangay, etc.)

2. **Backend API**: Returns all fields correctly ✓
   - Tested with `test-joshua-api-response.ts`
   - Confirmed API endpoint `/api/employees/15` returns complete data

3. **Frontend Types**: All fields defined correctly ✓
   - `Employee` interface includes all address fields
   - `EmployeeDetailed` extends Employee
   - `Profile` type includes all fields

4. **Frontend Components**: Set up to display all fields ✓
   - `InformationGrid.tsx` has been updated
   - Contact Information section now shows detailed address breakdown
   - Build completed successfully with no TypeScript errors

## 🔧 Solution Steps

### Step 1: Restart Frontend Dev Server

**If using npm/pnpm:**
```bash
# Stop the current dev server (Ctrl+C)
cd frontend
npm run dev
# or
pnpm dev
```

**If using a different terminal/process:**
- Find and stop the frontend dev server process
- Restart with `npm run dev` or `pnpm dev`

### Step 2: Hard Refresh Browser

**Windows/Linux:**
- Press `Ctrl + Shift + R`
- Or `Ctrl + F5`

**Mac:**
- Press `Cmd + Shift + R`
- Or `Cmd + Option + R`

### Step 3: Clear Browser Cache

**Chrome/Edge:**
1. Press `F12` to open DevTools
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

**Firefox:**
1. Press `Ctrl + Shift + Delete` (Windows) or `Cmd + Shift + Delete` (Mac)
2. Select "Cached Web Content"
3. Click "Clear Now"

### Step 4: Log Out and Log Back In

1. Log out of the application
2. Close all browser tabs for the application
3. Open a new tab
4. Log back in as joshuapalero111@gmail.com

### Step 5: Check Browser Console for Errors

1. Press `F12` to open Developer Tools
2. Go to the "Console" tab
3. Look for any red error messages
4. Check the "Network" tab to see if API calls are succeeding
5. Look for the `/api/employees/15` request and verify the response contains all fields

## 🔍 Debugging: What to Check in Browser Console

### Check if Data is Being Fetched

1. Open DevTools (F12) → Network tab
2. Navigate to Settings > My Profile
3. Look for API calls:
   - `GET /api/auth/me`
   - `GET /api/employees/15`
4. Click on the `/api/employees/15` request
5. Go to "Response" or "Preview" tab
6. Verify these fields are present in the response:
   ```json
   {
     "birthDate": "2000-01-15",
     "gender": "Male",
     "civilStatus": "Single",
     "bloodType": "O+",
     "philsysId": "1234-5678-9012-3456",
     "resRegion": "Region III (Central Luzon)",
     "resProvince": "Bulacan",
     "resCity": "Meycauayan City",
     "resBarangay": "Lawa",
     ...
   }
   ```

### Check if Profile Object Has Data

1. Open DevTools (F12) → Console tab
2. On the My Profile page, type:
   ```javascript
   // This will show you what's in the profile object
   console.log('Profile data:', window.localStorage.getItem('userData'));
   ```
3. Or add a temporary console.log in the component by editing:
   `frontend/src/pages/Settings/MyProfile.tsx`
   ```typescript
   // Add this after line 18
   console.log('Profile data:', profile);
   ```

## 📊 Expected vs Actual

### Expected Display (After Fix)

**Contact Information Section:**
- Email Address
- Mobile Number
- Telephone Number

**Residential Address:**
- House/Block/Lot: Blk.3 Lot-7
- Street: Egreet Street
- Subdivision/Village: Meyland Homes Phase 2
- Barangay: Lawa
- City/Municipality: Meycauayan City
- Province: Bulacan
- Region: Region III (Central Luzon)
- Full Address: [concatenated string]

**Permanent Address:**
- (Same structure as Residential)

**Emergency Contact:**
- Emergency Contact: [name]
- Emergency Number: [phone]

**Personal Information Section:**
- Birth Date: 2000-01-15
- Sex / Gender: Male
- Civil Status: Single

**Government Identifiers Section:**
- UMID Number: 1234-5678901-2
- PhilSys ID: 1234-5678-9012-3456
- PhilHealth Number: 01-023456789-1
- Pag-IBIG Number: 1212-3434-5656
- TIN Number: 123-456-789-000
- GSIS BP Number: — (empty)

**Physical Characteristics Section:**
- Height (m): 1.73
- Weight (kg): 68
- Blood Type: O+

### If Fields Show Dashes (—)

The `InfoItem` component shows a dash (—) when:
- The field value is `null`
- The field value is `undefined`
- The field value is an empty string `""`
- The field doesn't exist on the profile object

This means the data is not being passed through correctly.

## 🚨 Common Issues and Fixes

### Issue 1: Old Version of Code Running

**Symptoms:**
- Fields still not showing
- No detailed address breakdown visible

**Fix:**
- Kill all Node processes
- Delete `frontend/node_modules/.vite` cache
- Restart dev server

```bash
# Windows PowerShell
Get-Process node | Stop-Process -Force
cd frontend
rm -r -fo node_modules\.vite
npm run dev

# Mac/Linux
killall node
cd frontend
rm -rf node_modules/.vite
npm run dev
```

### Issue 2: TypeScript Cache Issues

**Fix:**
```bash
cd frontend
rm -rf node_modules/.vite
rm -rf dist
npm run build
npm run dev
```

### Issue 3: Browser Service Worker Cache

**Fix:**
1. Open DevTools (F12)
2. Go to Application tab → Service Workers
3. Unregister all service workers
4. Go to Application tab → Storage
5. Click "Clear site data"
6. Hard refresh the page

### Issue 4: API Not Returning Full Data

**Check:**
```bash
cd backend
npx tsx test-joshua-api-response.ts
```

Expected output should show all fields present.

### Issue 5: Frontend Not Fetching Employee Details

**Check in browser console if this API call succeeds:**
- `/api/employees/15` should return status 200
- Response should include all fields

**If it fails:**
- Check if user is authenticated (JWT token valid)
- Check backend server is running
- Check network connectivity

## 🎯 Quick Verification Checklist

After performing the fixes, verify:

1. ☐ Navigate to http://localhost:5173 (or your frontend URL)
2. ☐ Log in as joshuapalero111@gmail.com
3. ☐ Go to Settings > My Profile
4. ☐ Scroll to "Contact Information" section
5. ☐ Verify you see "Residential Address" and "Permanent Address" subsections
6. ☐ Under each address, verify you see:
   - House/Block/Lot
   - Street
   - Subdivision/Village
   - Barangay
   - City/Municipality
   - Province
   - Region
   - Full Address
7. ☐ Scroll to "Personal Information" section
8. ☐ Verify you see Birth Date, Sex/Gender, Civil Status
9. ☐ Scroll to "Government Identifiers" section
10. ☐ Verify you see PhilSys ID with value: 1234-5678-9012-3456
11. ☐ Scroll to "Physical Characteristics" section
12. ☐ Verify you see Blood Type with value: O+

## 📞 If Still Not Working

If after all these steps the fields are still not displaying:

1. **Capture Screenshots:**
   - Settings > My Profile page
   - Browser DevTools Console tab (any errors?)
   - Browser DevTools Network tab (API responses)

2. **Share Information:**
   - Browser and version
   - Any console errors
   - Network tab showing API response for `/api/employees/15`

3. **Temporary Debug:**
   Add this to `frontend/src/pages/Settings/MyProfile.tsx` after line 18:
   ```typescript
   useEffect(() => {
     console.log('=== DEBUG PROFILE DATA ===');
     console.log('Profile object:', profile);
     console.log('resRegion:', profile?.resRegion);
     console.log('resProvince:', profile?.resProvince);
     console.log('resCity:', profile?.resCity);
     console.log('resBarangay:', profile?.resBarangay);
     console.log('birthDate:', profile?.birthDate);
     console.log('gender:', profile?.gender);
     console.log('civilStatus:', profile?.civilStatus);
     console.log('bloodType:', profile?.bloodType);
     console.log('philsysId:', profile?.philsysId);
   }, [profile]);
   ```

   This will log the actual data being passed to the component.

## ✅ Success Indicators

You'll know it's working when you see:
- **Residential Address** subsection with 8 labeled fields
- **Permanent Address** subsection with 8 labeled fields
- All values populated (not showing dashes)
- Birth Date showing "2000-01-15" or custom date
- Gender showing "Male"
- Civil Status showing "Single"
- Blood Type showing "O+"
- PhilSys ID showing "1234-5678-9012-3456"
- Region showing "Region III (Central Luzon)"
- Province showing "Bulacan"
- City showing "Meycauayan City"
- Barangay showing "Lawa"

---

## Summary

The backend and frontend code are both correct. The most likely issue is that:
1. The frontend dev server is running an old version of the code
2. The browser has cached the old version

**Solution:** Restart dev server + Hard refresh browser (Ctrl+Shift+R)
