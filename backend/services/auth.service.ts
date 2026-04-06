
import { db } from '../db/index.js';
import { authentication } from '../db/schema.js';
import { eq, or, and, gt, sql, desc } from 'drizzle-orm';


type NewUser = typeof authentication.$inferInsert;
type UpdateUser = Partial<NewUser>;

export class AuthService {
  static async findUserByIdentifier(identifier: string) {
    const lowerIdentifier = identifier.toLowerCase();
    
    // Normalize ID: remove 'emp-' prefix and leading zeros to match raw DB ID (e.g. "EMP-001" -> "1")
    const normalizedId = lowerIdentifier.replace(/^emp-/i, '').replace(/^0+/, '');
    
    const conditions = [];
    
    // Direct matches for email
    conditions.push(eq(authentication.email, identifier));
    // Sometimes the database might have a different case for the email or employeeId
    conditions.push(sql`LOWER(${authentication.email}) = ${lowerIdentifier}`);
    conditions.push(sql`LOWER(${authentication.employeeId}) = ${lowerIdentifier}`);

    // If normalized ID looks like a number and matches the raw ID format
    if (normalizedId !== lowerIdentifier && /^\d+$/.test(normalizedId)) {
      conditions.push(eq(authentication.employeeId, normalizedId));
    }

    // fallback: just check direct equality to employeeId
    conditions.push(eq(authentication.employeeId, identifier));

    return await db.query.authentication.findFirst({
      where: or(...conditions),
      with: {
        hrDetails: {
          with: {
            department: true,
            position: true,
          }
        },
        personalInformation: true,
        employeeEmergencyContacts: true,
        pdsEducations: {
          orderBy: (edu, { desc }) => [desc(edu.dateFrom)]
        },
        pdsWorkExperiences: {
          orderBy: (we, { desc }) => [desc(we.dateFrom)]
        },
        pdsEligibilities: true,
        pdsLearningDevelopments: {
          orderBy: (ld, { desc }) => [desc(ld.dateFrom)]
        },
        pdsVoluntaryWorks: {
          orderBy: (vw, { desc }) => [desc(vw.dateFrom)]
        },
        pdsReferences: true,
        pdsOtherInfos: true,
        pdsFamilies: true
      }
    });
  }

  static async findUserById(id: number) {
    return await db.query.authentication.findFirst({
      where: eq(authentication.id, id),
      with: {
        hrDetails: {
          with: {
            department: true,
            position: true,
          }
        },
        personalInformation: true,
        employeeEmergencyContacts: true,
        pdsEducations: {
          orderBy: (edu, { desc }) => [desc(edu.dateFrom)]
        },
        pdsWorkExperiences: {
          orderBy: (work, { desc }) => [desc(work.dateFrom)]
        },
        pdsEligibilities: true,
        pdsLearningDevelopments: {
          orderBy: (ld, { desc }) => [desc(ld.dateFrom)]
        },
        pdsVoluntaryWorks: {
          orderBy: (vw, { desc }) => [desc(vw.dateFrom)]
        },
        pdsReferences: true,
        pdsOtherInfos: true,
        pdsFamilies: true
      }
    });
  }

  static async findUserByEmail(email: string) {
    return await db.query.authentication.findFirst({
      where: eq(authentication.email, email),
      with: {
        hrDetails: {
          with: {
            department: true,
            position: true,
          }
        },
        personalInformation: true,
        employeeEmergencyContacts: true,
        pdsEducations: {
          orderBy: (edu, { desc }) => [desc(edu.dateFrom)]
        },
        pdsWorkExperiences: {
          orderBy: (work, { desc }) => [desc(work.dateFrom)]
        },
        pdsEligibilities: true,
        pdsLearningDevelopments: {
          orderBy: (ld, { desc }) => [desc(ld.dateFrom)]
        },
        pdsVoluntaryWorks: {
          orderBy: (vw, { desc }) => [desc(vw.dateFrom)]
        },
        pdsReferences: true,
        pdsOtherInfos: true,
        pdsFamilies: true
      }
    });
  }

  static async createUser(data: NewUser) {
    return await db.insert(authentication).values(data);
  }

  static async updateUser(id: number, data: UpdateUser) {
    return await db.update(authentication)
      .set(data)
      .where(eq(authentication.id, id));
  }

  static async findUserByVerificationOTP(email: string, otp: string) {
    return await db.query.authentication.findFirst({
      where: and(
        eq(authentication.email, email),
        eq(authentication.verificationToken, otp)
      )
    });
  }

  static async findUserByResetToken(token: string) {
    return await db.query.authentication.findFirst({
      where: and(
        eq(authentication.resetPasswordToken, token),
        gt(authentication.resetPasswordExpires, sql`NOW()`)
      )
    });
  }
  static async getNextEmployeeId() {
    const latestSmallUser = await db.select({ 
        employeeId: authentication.employeeId 
     })
     .from(authentication)
     .where(and(
        sql`${authentication.employeeId} REGEXP '^[0-9]+$'`,
        sql`CAST(${authentication.employeeId} AS UNSIGNED) <= 200`
     ))
     .orderBy(desc(sql`CAST(${authentication.employeeId} AS UNSIGNED)`))
     .limit(1);

    if (latestSmallUser.length > 0 && !isNaN(parseInt(latestSmallUser[0].employeeId || '0'))) {
      return (parseInt(latestSmallUser[0].employeeId || '0') + 1).toString();
    }
    return '1';
  }
}
