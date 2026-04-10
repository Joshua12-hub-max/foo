import { checkDuplicateApplication } from './services/recruitmentService.js';

async function test() {
    try {
        console.log('Testing duplicate check...');
        const results = await checkDuplicateApplication({
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            birthDate: '1990-01-01'
        });
        console.log('Success! Results:', results.length);
        process.exit(0);
    } catch (err) {
        console.error('Test failed with error:', err);
        process.exit(1);
    }
}

test();
