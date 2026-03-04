const fs = require('fs');
const path = require('path');

const jobDetailPath = path.join(__dirname, 'src', 'pages', 'Public', 'JobDetail.tsx');
const adminRegisterPath = path.join(__dirname, 'src', 'pages', 'EmployeeManagementAdmin', 'AdminRegister.tsx');

function fixJobDetail() {
    let content = fs.readFileSync(jobDetailPath, 'utf8');
    
    // 1. Add red asterisks to known required fields in JobDetail
    const requiredLabels = [
        'Last name', 'First name', 'Birth date', 'Place of birth', 
        'Gender', 'Civil status', 'Email address', 'Contact number'
    ];
    
    requiredLabels.forEach(label => {
        // Find: >Label text</label>
        // Replace with: >Label text <span className="text-red-500">*</span></label>
        const regex = new RegExp(`>(${label})<\/label>`, 'g');
        content = content.replace(regex, '>$1 <span className="text-red-500">*</span></label>');
    });

    // 2. Add error styling to sex and civil_status
    content = content.replace(
        /<select \{\.\.\.register\('sex'\)\} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md outline-none font-medium text-sm text-slate-700">/g,
        '<select {...register(\'sex\')} className={`w-full px-3 py-2 bg-white border ${errors.sex ? \'border-red-500 ring-2 ring-red-100\' : \'border-gray-200\'} rounded-md outline-none font-medium text-sm text-slate-700`}>'
    );
    
    content = content.replace(
        /<select \{\.\.\.register\('civil_status'\)\} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md outline-none font-medium text-sm text-slate-700">/g,
        '<select {...register(\'civil_status\')} className={`w-full px-3 py-2 bg-white border ${errors.civil_status ? \'border-red-500 ring-2 ring-red-100\' : \'border-gray-200\'} rounded-md outline-none font-medium text-sm text-slate-700`}>'
    );
    
    // Add missing asterisks for GSIS, Pag-IBIG, PhilHealth, etc. conditionally
    const idFields = [
        { name: 'gsis_no', label: 'GSIS Number' },
        { name: 'pagibig_no', label: 'Pag-IBIG Number' },
        { name: 'philhealth_no', label: 'PhilHealth Number' },
        { name: 'umid_no', label: 'UMID Number' },
        { name: 'philsys_id', label: 'PhilSys ID (National ID)' },
        { name: 'tin_no', label: 'TIN Number' },
    ];
    idFields.forEach(f => {
        const regex = new RegExp(`>(${f.label.replace('(', '\\(').replace(')', '\\)')})<\/label>`, 'g');
        content = content.replace(regex, `>$1 {requireIds && <span className="text-red-500 ml-1">*</span>}</label>`);
    });

    const eligibilityFields = [
        { name: 'eligibility', label: 'Eligibility Name / Title' },
        { name: 'eligibility_type', label: 'Eligibility Category' },
        { name: 'eligibility_date', label: 'Date of Release / Validity' },
        { name: 'eligibility_place', label: 'Place of Examination / Issue' },
        { name: 'license_no', label: 'License / ID Number' },
    ];
    eligibilityFields.forEach(f => {
        const regex = new RegExp(`>(${f.label.replace('/', '\\/')})<\/label>`, 'g');
        content = content.replace(regex, `>$1 {requireCsc && <span className="text-red-500 ml-1">*</span>}</label>`);
    });
    
    // Also, fix `PhilippineAddressSelector` to pass `isMeycauayanOnly` properly if needed, but it already has errors prop.
    // Address selector fields already get errors passed.

    fs.writeFileSync(jobDetailPath, content, 'utf8');
    console.log('Fixed JobDetail.tsx');
}

function fixAdminRegister() {
    let content = fs.readFileSync(adminRegisterPath, 'utf8');
    
    // AdminRegister's inputClass has `border-gray-300` hardcoded.
    // Let's replace `const errorClass = "border-red-500";` with `const errorClass = "!border-red-500 ring-2 ring-red-100";`
    content = content.replace(
        /const errorClass = "border-red-500";/g, 
        'const errorClass = "!border-red-500 ring-2 ring-red-100";'
    );
    
    // Ensure standard inputs like placeOfBirth, position, etc. get the error class and asterisks
    const fieldsToFix = [
        // name, label
        { name: 'placeOfBirth', label: 'Place of Birth'},
        { name: 'gender', label: 'Gender' },
        { name: 'civilStatus', label: 'Civil Status' },
        { name: 'emergencyContact', label: 'Emergency Contact Person' },
        { name: 'emergencyContactNumber', label: 'Emergency Phone Number' },
        { name: 'educationalBackground', label: 'Highest Degree\\/Level Attained' }, // changed to match exact text
    ];
    
    // Update inputs to add error class
    fieldsToFix.forEach(f => {
        // Add asterisk if not present
        const labelRegex = new RegExp(`>(${f.label.replace('/', '\\/')})<\/label>`, 'g');
        content = content.replace(labelRegex, `>$1 <span className="text-red-500">*</span></label>`);
        
        // Add errorClass into className (if there's an input/select for it)
        const inputRegex1 = new RegExp(`(register\\("${f.name}"\\).*?className=)(?:"(.*?inputClass.*?)")`, 'g');
        content = content.replace(inputRegex1, `$1{\`$2 \${errors.${f.name} ? errorClass : ''}\`}`);
        
        const inputRegex2 = new RegExp(`(register\\("${f.name}"\\).*?className=)(\\{\`.*?\`\\})`, 'g');
        content = content.replace(inputRegex2, (match, p1, p2) => {
            if (p2.includes(`errors.${f.name}`)) return match; // already has error
            return `${p1}{\`${p2.replace(/`/g, '')} \${errors.${f.name} ? errorClass : ''}\`}`;
        });
    });

    // Special fix for position component which is a Combobox
    // Combobox already handles error={!!errors.position} but lacks asterisk sometimes
    
    // Fix regular selects
    content = content.replace(
        /<select \{\.\.\.register\("gender"\)\} className=\{\`\$\{inputClass\}\`\}>/g,
        '<select {...register("gender")} className={`\\${inputClass} \\${errors.gender ? errorClass : \'\'}`}>'
    );
    content = content.replace(
        /<select \{\.\.\.register\("civilStatus"\)\} className=\{\`\$\{inputClass\}\`\}>/g,
        '<select {...register("civilStatus")} className={`\\${inputClass} \\${errors.civilStatus ? errorClass : \'\'}`}>'
    );
    content = content.replace(
        /<select \{\.\.\.register\("bloodType"\)\} className=\{\`\$\{inputClass\}\`\}>/g,
        '<select {...register("bloodType")} className={`\\${inputClass} \\${errors.bloodType ? errorClass : \'\'}`}>'
    );
    
    // Fix textareas
    content = content.replace(
        /<textarea \{\.\.\.register\("educationalBackground"\)\} (.*?) className=\{\`(.*?)\`\} (.*?)\/>/g,
        '<textarea {...register("educationalBackground")} $1 className={`$2 \\${errors.educationalBackground ? errorClass : \'\'}`} $3/>'
    );

    fs.writeFileSync(adminRegisterPath, content, 'utf8');
    console.log('Fixed AdminRegister.tsx');
}

fixJobDetail();
fixAdminRegister();
