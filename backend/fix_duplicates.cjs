const fs = require('fs');
const file = 'controllers/recruitmentController.ts';
let code = fs.readFileSync(file, 'utf8');

const startMarker = '// 5. Duplicate & Identity Fraud Check (Pre-Parsing Verification)';
const endMarker = '    // Process Application 100% PRECISION: Use Transaction for Relational Consistency';

const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.log('Markers not found');
  process.exit(1);
}

const newBlock = `// 5. Identity Fraud & Per-Job Duplicate Check
    try {
        const existingApplication = await checkDuplicateApplication({
            firstName, lastName, middleName, suffix, email, birthDate, tinNumber, gsisNumber, philsysId
        });

        if (existingApplication) {
            // Identity Fraud: Same email or ID, but completely different name
            const isIdentityFraud = 
                ((existingApplication.tinNumber === tinNumber && tinNumber) ||
                 (existingApplication.gsisNumber === gsisNumber && gsisNumber) ||
                 (existingApplication.email === email)) &&
                (existingApplication.firstName.toLowerCase() !== firstName.toLowerCase() || 
                 existingApplication.lastName.toLowerCase() !== lastName.toLowerCase());

            if (isIdentityFraud) {
                await logSecurityViolation({
                    jobId: Number(jobId), firstName: firstName, lastName: lastName, email,
                    violationType: 'Identity Fraud', details: \`Mismatched identity details with existing records\`,
                    ipAddress: req.ip || 'Unknown'
                });
                res.status(409).json({ success: false, message: 'Identity verification failed. These identifiers belong to another person.' });
                return;
            }

            // Per-Job Duplicate Check: Only block if applying for the exact same job
            if (existingApplication.jobId === Number(jobId)) {
                res.status(409).json({ success: false, message: 'You have recently applied for this position. Please wait before submitting a new application.' });
                return;
            }
            
            // Otherwise, it's the same person applying to a DIFFERENT job, which is ALLOWED!
        }
    } catch (err: unknown) {
        console.error('[RECRUITMENT] Duplicate check failed:', err instanceof Error ? err.message : 'Unknown error');
        res.status(500).json({ success: false, message: 'Internal server error during verification' });
        return;
    }

    // Email Domain Audit
    if (isDisposableEmail(email)) {
        await logSecurityViolation({
            jobId: Number(jobId), firstName, lastName, email,
            violationType: 'Disposable Email', details: \`Blocked temporary mail provider\`,
            ipAddress: req.ip || 'Unknown'
        });
        res.status(400).json({ success: false, message: 'Disposable email addresses are not allowed.' });
        return;
    }

    if (!(await verifyEmailDomain(email))) {
        await logSecurityViolation({
            jobId: Number(jobId), firstName, lastName, email,
            violationType: 'Invalid Email Domain', details: \`No MX records found\`,
            ipAddress: req.ip || 'Unknown'
        });
        res.status(400).json({ success: false, message: 'Invalid email domain. Please use a verified provider.' });
        return;
    }

`;

code = code.substring(0, startIndex) + newBlock + code.substring(endIndex);
fs.writeFileSync(file, code);
console.log('Fixed recruitmentController.ts');
