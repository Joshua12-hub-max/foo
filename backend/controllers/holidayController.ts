import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { holidays } from '../db/schema.js';
import { eq, and, gte, asc } from 'drizzle-orm';

export const getHolidays = async (req: Request, res: Response): Promise<void> => {
  try {
    const { year } = req.query;
    const currentYear = year ? parseInt(year as string) : new Date().getFullYear();

    // Fetch holidays for the specified year or upcoming holidays
    const today = new Date().toISOString().split('T')[0];

    const results = await db.select()
      .from(holidays)
      .where(and(
        eq(holidays.year, currentYear),
        gte(holidays.date, today)
      ))
      .orderBy(asc(holidays.date));

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('getHolidays error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch holidays'
    });
  }
};
