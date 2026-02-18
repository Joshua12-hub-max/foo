import { db } from '../db/index.js';
import { authentication } from '../db/schema.js';
import { eq, or, and, gt, sql } from 'drizzle-orm';


type NewUser = typeof authentication.$inferInsert;
type UpdateUser = Partial<NewUser>;

export class AuthService {
  static async findUserByIdentifier(identifier: string) {
    const lowerIdentifier = identifier.toLowerCase();
    return await db.query.authentication.findFirst({
      where: or(
        eq(sql`LOWER(${authentication.email})`, lowerIdentifier),
        eq(sql`LOWER(${authentication.employeeId})`, lowerIdentifier)
      )
    });
  }

  static async findUserById(id: number) {
    return await db.query.authentication.findFirst({
      where: eq(authentication.id, id)
    });
  }

  static async findUserByEmail(email: string) {
    return await db.query.authentication.findFirst({
      where: eq(authentication.email, email)
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
}
