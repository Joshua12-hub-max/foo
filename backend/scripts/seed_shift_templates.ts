import { db } from '../db/index.js';
import { shiftTemplates } from '../db/schema.js';

const templates = [
  {
    name: 'Regular Shift (8-5)',
    startTime: '08:00:00',
    endTime: '17:00:00',
    description: 'Standard office hours: 8:00 AM to 5:00 PM'
  },
  {
    name: 'Early Shift (7-4)',
    startTime: '07:00:00',
    endTime: '16:00:00',
    description: 'Early morning shift: 7:00 AM to 4:00 PM'
  },
  {
    name: 'Mid Shift (10-7)',
    startTime: '10:00:00',
    endTime: '19:00:00',
    description: 'Mid-day shift: 10:00 AM to 7:00 PM'
  },
  {
    name: 'Night Shift (10-6)',
    startTime: '22:00:00',
    endTime: '06:00:00',
    description: 'Overnight shift: 10:00 PM to 6:00 AM'
  }
];

async function seedShiftTemplates() {
  console.log('Seeding shift templates...');
  try {
    for (const temp of templates) {
      await db.insert(shiftTemplates).values(temp).onDuplicateKeyUpdate({
          set: {
              startTime: temp.startTime,
              endTime: temp.endTime,
              description: temp.description
          }
      });
    }
    console.log('Shift templates seeded successfully.');
  } catch (error) {
    console.error('Error seeding shift templates:', error);
  } finally {
      process.exit(0);
  }
}

seedShiftTemplates();
