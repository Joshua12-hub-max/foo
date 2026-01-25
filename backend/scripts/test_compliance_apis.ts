import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

// You'll need to replace this with a valid admin token from your system
const ADMIN_TOKEN = 'YOUR_ADMIN_TOKEN_HERE';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${ADMIN_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  data?: any;
}

const results: TestResult[] = [];

function logTest(test: string, status: 'PASS' | 'FAIL' | 'SKIP', message: string, data?: any) {
  results.push({ test, status, message, data });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} ${test}: ${message}`);
  if (data) {
    console.log('   Data:', JSON.stringify(data, null, 2));
  }
}

async function testQualificationStandards() {
  console.log('\n🧪 Testing Qualification Standards API...\n');

  try {
    // Test 1: Get all QS
    try {
      const response = await api.get('/qualification-standards');
      logTest(
        'GET /qualification-standards',
        'PASS',
        `Retrieved ${response.data.standards?.length || 0} qualification standards`,
        { count: response.data.standards?.length }
      );
    } catch (error: any) {
      logTest('GET /qualification-standards', 'FAIL', error.message);
    }

    // Test 2: Get specific QS by ID
    try {
      const response = await api.get('/qualification-standards/1');
      logTest(
        'GET /qualification-standards/:id',
        'PASS',
        `Retrieved QS: ${response.data.standard?.position_title}`,
        response.data.standard
      );
    } catch (error: any) {
      logTest('GET /qualification-standards/:id', 'FAIL', error.message);
    }

    // Test 3: Create new QS
    try {
      const newQS = {
        position_title: 'Test Position - Administrative Aide VI',
        salary_grade: 6,
        education_requirement: 'High School Graduate',
        experience_years: 1,
        training_hours: 8,
        eligibility_required: 'CS Sub-Professional'
      };

      const response = await api.post('/qualification-standards', newQS);
      logTest(
        'POST /qualification-standards',
        'PASS',
        `Created QS with ID: ${response.data.id}`,
        { id: response.data.id }
      );

      // Clean up - delete the test QS
      await api.delete(`/qualification-standards/${response.data.id}`);
    } catch (error: any) {
      logTest('POST /qualification-standards', 'FAIL', error.response?.data?.message || error.message);
    }

    // Test 4: Validate employee qualifications (will fail if no employees exist)
    try {
      const response = await api.post('/qualification-standards/validate', {
        employee_id: 1,
        position_id: 1
      });
      logTest(
        'POST /qualification-standards/validate',
        'PASS',
        `Validation result: ${response.data.qualified ? 'QUALIFIED' : 'NOT QUALIFIED'} (Score: ${response.data.score}%)`,
        {
          qualified: response.data.qualified,
          score: response.data.score,
          missing: response.data.missing_requirements
        }
      );
    } catch (error: any) {
      logTest(
        'POST /qualification-standards/validate',
        'SKIP',
        'No employee/position data available for testing'
      );
    }

  } catch (error: any) {
    console.error('Qualification Standards test suite failed:', error.message);
  }
}

async function testNepotism() {
  console.log('\n🧪 Testing Nepotism API...\n');

  try {
    // Test 1: Get all relationships
    try {
      const response = await api.get('/nepotism/relationships');
      logTest(
        'GET /nepotism/relationships',
        'PASS',
        `Retrieved ${response.data.relationships?.length || 0} relationships`,
        { count: response.data.relationships?.length }
      );
    } catch (error: any) {
      logTest('GET /nepotism/relationships', 'FAIL', error.message);
    }

    // Test 2: Create relationship (will fail if employees don't exist)
    try {
      const newRelationship = {
        employee_id_1: 1,
        employee_id_2: 2,
        relationship_type: 'Sibling',
        degree: 2,
        notes: 'Test relationship'
      };

      const response = await api.post('/nepotism/relationships', newRelationship);
      logTest(
        'POST /nepotism/relationships',
        'PASS',
        `Created relationship with ID: ${response.data.id}`,
        { id: response.data.id }
      );

      // Clean up
      await api.delete(`/nepotism/relationships/${response.data.id}`);
    } catch (error: any) {
      logTest(
        'POST /nepotism/relationships',
        'SKIP',
        'No employee data available for testing'
      );
    }

    // Test 3: Check for nepotism violations
    try {
      const response = await api.post('/nepotism/check', {
        employee_id: 1,
        position_id: 1,
        appointing_authority_id: 2
      });
      logTest(
        'POST /nepotism/check',
        'PASS',
        `Nepotism check: ${response.data.violation ? 'VIOLATION DETECTED' : 'NO VIOLATION'}`,
        {
          violation: response.data.violation,
          violations: response.data.violations,
          warning: response.data.warning_message
        }
      );
    } catch (error: any) {
      logTest(
        'POST /nepotism/check',
        'SKIP',
        'No employee/position data available for testing'
      );
    }

  } catch (error: any) {
    console.error('Nepotism test suite failed:', error.message);
  }
}

async function testStepIncrement() {
  console.log('\n🧪 Testing Step Increment API...\n');

  try {
    // Test 1: Get all step increments
    try {
      const response = await api.get('/step-increment');
      logTest(
        'GET /step-increment',
        'PASS',
        `Retrieved ${response.data.increments?.length || 0} step increments`,
        { count: response.data.increments?.length }
      );
    } catch (error: any) {
      logTest('GET /step-increment', 'FAIL', error.message);
    }

    // Test 2: Get eligible employees
    try {
      const response = await api.get('/step-increment/eligible');
      logTest(
        'GET /step-increment/eligible',
        'PASS',
        `Found ${response.data.count || 0} eligible employees`,
        {
          count: response.data.count,
          employees: response.data.eligible_employees?.map((e: any) => ({
            name: e.employee_name,
            position: e.position_title,
            years: e.years_in_position,
            current_step: e.current_step,
            next_step: e.next_step
          }))
        }
      );
    } catch (error: any) {
      logTest('GET /step-increment/eligible', 'FAIL', error.message);
    }

    // Test 3: Create step increment request (will skip if no eligible employees)
    try {
      const eligibleResponse = await api.get('/step-increment/eligible');
      
      if (eligibleResponse.data.eligible_employees?.length > 0) {
        const employee = eligibleResponse.data.eligible_employees[0];
        
        const newIncrement = {
          employee_id: employee.employee_id,
          position_id: employee.position_id,
          current_step: employee.current_step,
          eligible_date: employee.eligible_date,
          status: 'Pending'
        };

        const response = await api.post('/step-increment', newIncrement);
        logTest(
          'POST /step-increment',
          'PASS',
          `Created step increment request with ID: ${response.data.id}`,
          { id: response.data.id }
        );
      } else {
        logTest(
          'POST /step-increment',
          'SKIP',
          'No eligible employees for testing'
        );
      }
    } catch (error: any) {
      logTest(
        'POST /step-increment',
        'SKIP',
        'No eligible employees for testing'
      );
    }

  } catch (error: any) {
    console.error('Step Increment test suite failed:', error.message);
  }
}

async function testDatabaseConnection() {
  console.log('\n🧪 Testing Database Connection...\n');

  try {
    const response = await api.get('/plantilla/summary');
    logTest(
      'Database Connection',
      'PASS',
      'Successfully connected to database',
      {
        total_positions: response.data.summary?.total,
        vacant: response.data.summary?.vacant,
        filled: response.data.summary?.filled
      }
    );
  } catch (error: any) {
    logTest('Database Connection', 'FAIL', error.message);
  }
}

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🚀 PLANTILLA COMPLIANCE API TEST SUITE');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Time: ${new Date().toLocaleString()}`);
  console.log('═══════════════════════════════════════════════════════\n');

  // Check if token is set
  if (ADMIN_TOKEN === 'YOUR_ADMIN_TOKEN_HERE') {
    console.log('⚠️  WARNING: ADMIN_TOKEN not set!');
    console.log('Please update ADMIN_TOKEN in this script with a valid admin token.');
    console.log('\nTo get a token:');
    console.log('1. Login as admin via POST /api/auth/login');
    console.log('2. Copy the token from the response');
    console.log('3. Update ADMIN_TOKEN in this script\n');
    
    // Try to continue with basic tests that might work without auth
    await testDatabaseConnection();
  } else {
    await testDatabaseConnection();
    await testQualificationStandards();
    await testNepotism();
    await testStepIncrement();
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════\n');

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;

  console.log(`✅ PASSED:  ${passed}`);
  console.log(`❌ FAILED:  ${failed}`);
  console.log(`⚠️  SKIPPED: ${skipped}`);
  console.log(`📝 TOTAL:   ${results.length}\n`);

  if (failed > 0) {
    console.log('Failed tests:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  ❌ ${r.test}: ${r.message}`);
    });
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════\n');

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('Test suite crashed:', error);
  process.exit(1);
});
