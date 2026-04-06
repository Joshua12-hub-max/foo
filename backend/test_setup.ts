import { db } from './db/index.js';
import { departments, plantillaPositions } from './db/schema.js';

async function test() {
  const dept = await db.query.departments.findFirst();
  const position = await db.query.plantillaPositions.findFirst({
    where: (positions, { eq }) => eq(positions.departmentId, dept!.id)
  });

  console.log(`Found Dept: ${dept?.id}, Position: ${position?.id}`);

  const payload = {
    firstName: "TestAdmin",
    lastName: "User",
    email: "test_admin_" + Date.now() + "@test.com",
    password: "password123",
    departmentId: dept!.id,
    positionId: position!.id
  };

  try {
    const res = await fetch('http://127.0.0.1:5000/api/auth/setup-portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const text = await res.text();
    console.log(`HTTP ${res.status}: ${text}`);
  } catch (e) {
    console.error("Fetch failed", e);
  }
  process.exit(0);
}

test();
