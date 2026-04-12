
import { db } from '../db/index.js';
import { authentication, pdsHrDetails, employeeEmergencyContacts } from '../db/schema.js';
import { pdsPersonalInformation } from '../db/tables/pds.js';
import { eq, or, and, gt, sql, desc } from 'drizzle-orm';


type NewUser = typeof authentication.$inferInsert;
type UpdateUser = Partial<NewUser>;

import jwt from 'jsonwebtoken';

export class AuthService {
  /**
   * Generates a 100% Secure, short-lived (60s) token for direct file downloads
   * which bypasses the need for httpOnly cookies in window.open calls.
   */
  static generateDownloadToken(userId: number): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET missing');
    
    return jwt.sign(
      { sub: userId, type: 'download' },
      secret,
      { expiresIn: '60s' }
    );
  }

  /**
   * Verifies a download token from a URL query parameter.
   */
  static verifyDownloadToken(token: string): number | null {
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) return null;
      
      const decoded = jwt.verify(token, secret) as unknown as { sub: number; type: string };
      if (decoded.type !== 'download') return null;
      
      return decoded.sub;
    } catch {
      return null;
    }
  }

  /**
   * Generates a secure, short-lived (10 mins) token for OAuth state parameter.
   * This allows authentication to persist through cross-origin redirects
   * when cookies might be blocked by browser COOP/SameSite policies.
   */
  static generateOAuthStateToken(userId: number): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET missing');
    
    return jwt.sign(
      { sub: userId, type: 'oauth_state' },
      secret,
      { expiresIn: '10m' }
    );
  }

  /**
   * Verifies an OAuth state token.
   */
  static verifyOAuthStateToken(token: string): number | null {
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) return null;
      
      const decoded = jwt.verify(token, secret) as unknown as { sub: number; type: string };
      if (decoded.type !== 'oauth_state') return null;
      
      return decoded.sub;
    } catch {
      return null;
    }
  }

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

    // Simplified query without complex lateral joins - fetch base user first
    const user = await db.query.authentication.findFirst({
      where: or(...conditions)
    });

    if (!user) return null;

    // Fetch related data separately - with individual error handling
    let hrDetailsResult = null;
    let personalInfoResult = null;
    let emergencyContactsResult: any[] = [];

    try {
      hrDetailsResult = await db.query.pdsHrDetails.findFirst({
        where: eq(pdsHrDetails.employeeId, user.id),
        with: {
          department: true,
          position: true,
        }
      });
    } catch (err) {
      console.error('[AuthService] Failed to fetch hrDetails:', err instanceof Error ? err.message : err);
    }

    try {
      const rows = await db.select()
        .from(pdsPersonalInformation)
        .where(eq(pdsPersonalInformation.employeeId, user.id))
        .limit(1);
      personalInfoResult = rows[0] || null;
    } catch (err) {
      console.error('[AuthService] Failed to fetch personalInformation:', err);
      console.error('[AuthService] Full error:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
    }

    try {
      emergencyContactsResult = await db.select()
        .from(employeeEmergencyContacts)
        .where(eq(employeeEmergencyContacts.employeeId, user.id))
        .limit(1);
    } catch (err) {
      console.error('[AuthService] Failed to fetch emergencyContacts:', err instanceof Error ? err.message : err);
    }

    return {
      ...user,
      hrDetails: hrDetailsResult || null,
      personalInformation: personalInfoResult || null,
      employeeEmergencyContacts: emergencyContactsResult || []
    };
  }

  static async findUserById(id: number) {
    const user = await db.query.authentication.findFirst({
      where: eq(authentication.id, id)
    });

    if (!user) return null;

    let hrDetailsResult = null;
    let personalInfoResult = null;
    let emergencyContactsResult: any[] = [];

    try {
      hrDetailsResult = await db.query.pdsHrDetails.findFirst({
        where: eq(pdsHrDetails.employeeId, user.id),
        with: {
          department: true,
          position: true,
        }
      });
    } catch (err) {
      console.error('[AuthService] Failed to fetch hrDetails for user by ID:', err instanceof Error ? err.message : err);
    }

    try {
      const rows = await db.select()
        .from(pdsPersonalInformation)
        .where(eq(pdsPersonalInformation.employeeId, user.id))
        .limit(1);
      personalInfoResult = rows[0] || null;
    } catch (err) {
      console.error('[AuthService] Failed to fetch personalInformation for user by ID:', err instanceof Error ? err.message : err);
    }

    try {
      emergencyContactsResult = await db.select()
        .from(employeeEmergencyContacts)
        .where(eq(employeeEmergencyContacts.employeeId, user.id))
        .limit(1);
    } catch (err) {
      console.error('[AuthService] Failed to fetch emergencyContacts for user by ID:', err instanceof Error ? err.message : err);
    }

    return {
      ...user,
      hrDetails: hrDetailsResult || null,
      personalInformation: personalInfoResult || null,
      employeeEmergencyContacts: emergencyContactsResult || []
    };
  }

  static async findUserByEmail(email: string) {
    const user = await db.query.authentication.findFirst({
      where: eq(authentication.email, email)
    });

    if (!user) return null;

    let hrDetailsResult = null;
    let personalInfoResult = null;
    let emergencyContactsResult: any[] = [];

    try {
      hrDetailsResult = await db.query.pdsHrDetails.findFirst({
        where: eq(pdsHrDetails.employeeId, user.id),
        with: {
          department: true,
          position: true,
        }
      });
    } catch (err) {
      console.error('[AuthService] Failed to fetch hrDetails for user by email:', err instanceof Error ? err.message : err);
    }

    try {
      const rows = await db.select()
        .from(pdsPersonalInformation)
        .where(eq(pdsPersonalInformation.employeeId, user.id))
        .limit(1);
      personalInfoResult = rows[0] || null;
    } catch (err) {
      console.error('[AuthService] Failed to fetch personalInformation for user by email:', err instanceof Error ? err.message : err);
    }

    try {
      emergencyContactsResult = await db.select()
        .from(employeeEmergencyContacts)
        .where(eq(employeeEmergencyContacts.employeeId, user.id))
        .limit(1);
    } catch (err) {
      console.error('[AuthService] Failed to fetch emergencyContacts for user by email:', err instanceof Error ? err.message : err);
    }

    return {
      ...user,
      hrDetails: hrDetailsResult || null,
      personalInformation: personalInfoResult || null,
      employeeEmergencyContacts: emergencyContactsResult || []
    };
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
