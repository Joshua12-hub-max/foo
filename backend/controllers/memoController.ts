import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { employeeMemos, authentication, memoSequences, plantillaPositions, departments } from '../db/schema.js';
import { eq, and, sql, desc, or, like, count } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { createNotification } from './notificationController.js';
import type { AuthenticatedRequest, MemoType, MemoStatus, MemoPriority, EmploymentStatus } from '../types/index.js';
import { formatFullName } from '../utils/nameUtils.js';

/* eslint-disable @typescript-eslint/naming-convention */
const MEMO_TYPE_TO_STATUS: Record<MemoType, EmploymentStatus | undefined> = {
  'Termination Notice': 'Terminated',
  'Suspension Notice': 'Suspended',
  'Verbal Warning': 'Verbal Warning',
  'Written Warning': 'Written Warning',
  'Show Cause': 'Show Cause'
};
/* eslint-enable @typescript-eslint/naming-convention */

const generateMemoNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  
  return await db.transaction(async (tx) => {
     const existing = await tx.select().from(memoSequences).where(eq(memoSequences.year, year));
    
    let nextNumber: number;
    if (existing.length === 0) {
      await tx.insert(memoSequences).values({ year, lastNumber: 1 });
      nextNumber = 1;
    } else {
      nextNumber = existing[0].lastNumber + 1;
      await tx.update(memoSequences)
        .set({ lastNumber: nextNumber })
        .where(eq(memoSequences.year, year));
    }
    
    return `MEMO-${year}-${String(nextNumber).padStart(4, '0')}`;
  });
};

const getStatusFromMemoType = (memoType: MemoType): EmploymentStatus | undefined => MEMO_TYPE_TO_STATUS[memoType];

const updateEmployeeStatus = async (employeeId: number, newStatus: string): Promise<void> => {
  await db.update(authentication)
    .set({ employmentStatus: newStatus as EmploymentStatus })
    .where(eq(authentication.id, employeeId));

  if (newStatus === 'Terminated') {
    const emp = await db.query.authentication.findFirst({
      where: eq(authentication.id, employeeId),
      columns: { itemNumber: true }
    });
    
    if (emp && emp.itemNumber && emp.itemNumber !== 'N/A') {
      await db.update(plantillaPositions)
        .set({ isVacant: true })
        .where(eq(plantillaPositions.itemNumber, emp.itemNumber));
    }
  }
};

const notifyEmployeeOfMemo = async (employeeId: number, authorId: number, memoType: string, subject: string, memoId: number): Promise<void> => {
  try {
    const empData = await db.query.authentication.findFirst({
      where: eq(authentication.id, employeeId),
      columns: { employeeId: true }
    });
    const authorData = await db.query.authentication.findFirst({
      where: eq(authentication.id, authorId),
      columns: { employeeId: true }
    });

    if (empData && authorData) {
      await createNotification({ 
        recipientId: empData.employeeId || '', 
        senderId: authorData.employeeId, 
        title: `New ${memoType}`, 
        message: `You have received a ${memoType}: ${subject}`, 
        type: 'memo_received', 
        referenceId: memoId 
      });
    }
  } catch (_error) { 
      /* empty */

  }
};

const notifyAuthorOfAcknowledgment = async (employeeId: number, authorId: number, memoType: string, memoSubject: string, memoId: number): Promise<void> => {
  try {
    const empData = await db.query.authentication.findFirst({
      where: eq(authentication.id, employeeId),
      columns: { employeeId: true, firstName: true, lastName: true, middleName: true, suffix: true }
    });
    const authorData = await db.query.authentication.findFirst({
      where: eq(authentication.id, authorId),
      columns: { employeeId: true }
    });

    if (empData && authorData) {
      const empName = formatFullName(empData.lastName, empData.firstName, empData.middleName, empData.suffix);
      await createNotification({ 
        recipientId: authorData.employeeId || '', 
        senderId: empData.employeeId, 
        title: 'Memo Acknowledged', 
        message: `${empName} has acknowledged the ${memoType}: ${memoSubject}`, 
        type: 'memo_acknowledged', 
        referenceId: memoId 
      });
    }
  } catch (_error) { 
      /* empty */

  }
};

export const getAllMemos = async (req: Request, res: Response): Promise<void> => {
  try {
    const memoTypeInput = (req.query.memoType || req.query.memo_type) as string;
    const employeeIdInput = (req.query.employeeId || req.query.employee_id) as string;
    const { status, search, page = '1', limit = '20' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    // Aliases for joins
    const employee = alias(authentication, 'employee');
    const author = alias(authentication, 'author');
    const department = alias(departments, 'department');

    const conditions = [];
    if (memoTypeInput && memoTypeInput !== 'all') conditions.push(eq(employeeMemos.memoType, memoTypeInput as MemoType));
    if (status && status !== 'all') conditions.push(eq(employeeMemos.status, status as MemoStatus));
    if (employeeIdInput && employeeIdInput !== 'all') conditions.push(eq(employeeMemos.employeeId, Number(employeeIdInput)));
    if (search) {
      const searchStr = `%${search}%`;
      conditions.push(or(
        like(employeeMemos.subject, searchStr),
        like(employeeMemos.memoNumber, searchStr),
        like(employee.firstName, searchStr),
        like(employee.lastName, searchStr)
      ));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    // Count
    const [countResult] = await db.select({ total: count() })
      .from(employeeMemos)
      .innerJoin(employee, eq(employeeMemos.employeeId, employee.id))
      .innerJoin(author, eq(employeeMemos.authorId, author.id))
      .where(where);
      
    const total = Number(countResult.total);
    const totalPages = Math.ceil(total / Number(limit));

    // Data
    const memos = await db.select({
      id: employeeMemos.id,
      memoNumber: employeeMemos.memoNumber,
      employeeId: employeeMemos.employeeId,
      authorId: employeeMemos.authorId,
      memoType: employeeMemos.memoType,
      subject: employeeMemos.subject,
      content: employeeMemos.content,
      status: employeeMemos.status,
      priority: employeeMemos.priority,
      effectiveDate: employeeMemos.effectiveDate,
      acknowledgmentRequired: employeeMemos.acknowledgmentRequired,
      acknowledgedAt: employeeMemos.acknowledgedAt,
      createdAt: employeeMemos.createdAt,
      updatedAt: employeeMemos.updatedAt,
      firstName: employee.firstName,
      lastName: employee.lastName,
      middleName: employee.middleName,
      suffix: employee.suffix,
      employeeNumber: employee.employeeId,
      department: sql<string>`COALESCE(${department.name}, 'N/A')`,
      authorFirstName: author.firstName,
      authorLastName: author.lastName,
      authorMiddleName: author.middleName,
      authorSuffix: author.suffix
    })
    .from(employeeMemos)
    .leftJoin(employee, eq(employeeMemos.employeeId, employee.id))
    .leftJoin(department, eq(employee.departmentId, department.id))
    .leftJoin(author, eq(employeeMemos.authorId, author.id))
    .where(where)
    .orderBy(desc(employeeMemos.createdAt))
    .limit(Number(limit))
    .offset(offset);

    const formattedMemos = memos.map(m => ({
        ...m,
        employeeName: formatFullName(m.lastName, m.firstName, m.middleName, m.suffix),
        authorName: formatFullName(m.authorLastName, m.authorFirstName, m.authorMiddleName, m.authorSuffix)
    }));

    res.json({ success: true, memos: formattedMemos, pagination: { total, page: Number(page), limit: Number(limit), totalPages } });
  } catch (_error) { 

    res.status(500).json({ success: false, message: 'Failed to fetch memos' }); 
  }
};


export const getMyMemos = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest; 
    // The database column `employeeMemos.employeeId` actually stores the surrogate integer `id` of the `authentication` row, NOT the string 'EMP-XX'
    const reqEmployeeId = authReq.user.id;
    const author = alias(authentication, 'author');

    const memos = await db.select({
      id: employeeMemos.id,
      memoNumber: employeeMemos.memoNumber,
      employeeId: employeeMemos.employeeId,
      authorId: employeeMemos.authorId,
      memoType: employeeMemos.memoType,
      subject: employeeMemos.subject,
      content: employeeMemos.content,
      status: employeeMemos.status,
      priority: employeeMemos.priority,
      effectiveDate: employeeMemos.effectiveDate,
      acknowledgmentRequired: employeeMemos.acknowledgmentRequired,
      acknowledgedAt: employeeMemos.acknowledgedAt,
      createdAt: employeeMemos.createdAt,
      authorFirstName: author.firstName,
      authorLastName: author.lastName,
      authorMiddleName: author.middleName,
      authorSuffix: author.suffix
    })
    .from(employeeMemos)
    .innerJoin(author, eq(employeeMemos.authorId, author.id))
    .where(and(
      eq(employeeMemos.employeeId, reqEmployeeId),
      or(eq(employeeMemos.status, 'Sent'), eq(employeeMemos.status, 'Acknowledged'))
    ))
    .orderBy(desc(employeeMemos.createdAt));

    const formattedMemos = memos.map(m => ({
        ...m,
        authorName: formatFullName(m.authorLastName, m.authorFirstName, m.authorMiddleName, m.authorSuffix)
    }));

    res.json({ success: true, memos: formattedMemos });
  } catch (_error) { 
    res.status(500).json({ success: false, message: 'Failed to fetch memos' }); 
  }
};

export const getMemoById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const employee = alias(authentication, 'employee');
    const author = alias(authentication, 'author');
    const department = alias(departments, 'department');

    const result = await db.select({
      id: employeeMemos.id,
      memoNumber: employeeMemos.memoNumber,
      employeeId: employeeMemos.employeeId,
      authorId: employeeMemos.authorId,
      memoType: employeeMemos.memoType,
      subject: employeeMemos.subject,
      content: employeeMemos.content,
      status: employeeMemos.status,
      priority: employeeMemos.priority,
      effectiveDate: employeeMemos.effectiveDate,
      acknowledgmentRequired: employeeMemos.acknowledgmentRequired,
      acknowledgedAt: employeeMemos.acknowledgedAt,
      createdAt: employeeMemos.createdAt,
      firstName: employee.firstName,
      lastName: employee.lastName,
      middleName: employee.middleName,
      suffix: employee.suffix,
      employeeNumber: employee.employeeId,
      employeeEmail: employee.email,
      department: department.name,
      authorFirstName: author.firstName,
      authorLastName: author.lastName,
      authorMiddleName: author.middleName,
      authorSuffix: author.suffix
    })
    .from(employeeMemos)
    .innerJoin(employee, eq(employeeMemos.employeeId, employee.id))
    .leftJoin(department, eq(employee.departmentId, department.id))
    .innerJoin(author, eq(employeeMemos.authorId, author.id))
    .where(eq(employeeMemos.id, Number(id)));

    if (result.length === 0) { 
      res.status(404).json({ success: false, message: 'Memo not found' }); 
      return; 
    }
    
    const m = result[0];
    const formattedMemo = {
        ...m,
        employeeName: formatFullName(m.lastName, m.firstName, m.middleName, m.suffix),
        authorName: formatFullName(m.authorLastName, m.authorFirstName, m.authorMiddleName, m.authorSuffix)
    };


    res.json({ success: true, memo: formattedMemo });
  } catch (_error) { 
    res.status(500).json({ success: false, message: 'Failed to fetch memo' }); 
  }
};

export const createMemo = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { employeeId, memoType, subject, content, priority = 'Normal', effectiveDate, acknowledgmentRequired = false, status = 'Draft' } = req.body as { employeeId: number; memoType: string; subject: string; content: string; priority?: string; effectiveDate?: string; acknowledgmentRequired?: boolean; status?: string };
    const authorId = authReq.user.id; 
    const memoNumber = await generateMemoNumber();

    const [result] = await db.insert(employeeMemos).values({
      memoNumber: memoNumber,
      employeeId: employeeId,
      authorId: authorId,
      memoType: memoType as 'Verbal Warning' | 'Written Warning' | 'Reprimand' | 'Suspension Notice' | 'Termination Notice' | 'Show Cause',
      subject,
      content,
      priority: priority as MemoPriority,
      effectiveDate: effectiveDate || null,
      acknowledgmentRequired: acknowledgmentRequired ? true : false,
      status: status as MemoStatus
    });

    if (status === 'Sent') { 
      const newStatus = getStatusFromMemoType(memoType as MemoType); 
      if (newStatus) await updateEmployeeStatus(employeeId, newStatus); 
      await notifyEmployeeOfMemo(employeeId, authorId, memoType, subject, result.insertId); 
    }
    
    res.status(201).json({ success: true, message: 'Memo created successfully', memo: { id: result.insertId, memoNumber } });
  } catch (_error) { 

    res.status(500).json({ success: false, message: 'Failed to create memo' }); 
  }
};


export const updateMemo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { employeeId, memoType, subject, content, priority, effectiveDate, acknowledgmentRequired, status } = req.body as { employeeId?: number; memoType?: string; subject?: string; content?: string; priority?: string; effectiveDate?: string; acknowledgmentRequired?: boolean; status?: string };

    // Use a simpler approach than COALESCE logic if possible, or explicit check
    // We can conditionally build the update object
    const currentMemo = await db.query.employeeMemos.findFirst({
      where: eq(employeeMemos.id, Number(id))
    });

    if (!currentMemo) {
      res.status(404).json({ success: false, message: 'Memo not found' });
      return;
    }

    const updates: Partial<typeof employeeMemos.$inferInsert> = {};
    if (employeeId) updates.employeeId = employeeId;
    if (memoType) updates.memoType = memoType as MemoType;
    if (subject) updates.subject = subject;
    if (content) updates.content = content;
    if (priority) updates.priority = priority as MemoPriority;
    if (effectiveDate !== undefined) updates.effectiveDate = effectiveDate;
    if (acknowledgmentRequired !== undefined) updates.acknowledgmentRequired = acknowledgmentRequired ? true : false;
    if (status) updates.status = status as MemoStatus;

    await db.update(employeeMemos)
      .set(updates)
      .where(eq(employeeMemos.id, Number(id)));

    if (status === 'Sent' && currentMemo.status !== 'Sent') {
      const targetType = memoType || currentMemo.memoType;
      const targetSubject = subject || currentMemo.subject;
      const targetEmpId = employeeId || currentMemo.employeeId;
      const targetAuthorId = currentMemo.authorId;

      const newStatus = getStatusFromMemoType(targetType as MemoType);
      if (newStatus) await updateEmployeeStatus(targetEmpId, newStatus);
      await notifyEmployeeOfMemo(targetEmpId, targetAuthorId, targetType, targetSubject, Number(id));
    }

    res.json({ success: true, message: 'Memo updated successfully' });
  } catch (_error) { 
    res.status(500).json({ success: false, message: 'Failed to update memo' }); 
  }
};


export const deleteMemo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await db.delete(employeeMemos).where(eq(employeeMemos.id, Number(id)));
    res.json({ success: true, message: 'Memo deleted successfully' });
  } catch (_error) { 
    res.status(500).json({ success: false, message: 'Failed to delete memo' }); 
  }
};

export const acknowledgeMemo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params; 
    const authReq = req as AuthenticatedRequest; 
    const employeeId = authReq.user.id;

    const memo = await db.query.employeeMemos.findFirst({
      where: and(
        eq(employeeMemos.id, Number(id)),
        eq(employeeMemos.employeeId, employeeId)
      )
    });

    if (!memo) { 
      res.status(404).json({ success: false, message: 'Memo not found' }); 
      return; 
    }
    if (memo.acknowledgedAt) { 
      res.status(400).json({ success: false, message: 'Memo already acknowledged' }); 
      return; 
    }

    await db.update(employeeMemos)
      .set({ 
        acknowledgedAt: new Date().toISOString(),
        status: 'Acknowledged'
      })
      .where(eq(employeeMemos.id, Number(id)));

    await notifyAuthorOfAcknowledgment(employeeId, memo.authorId, memo.memoType, memo.subject, Number(id));
    
    res.json({ success: true, message: 'Memo acknowledged successfully' });
  } catch (_error) { 
    res.status(500).json({ success: false, message: 'Failed to acknowledge memo' }); 
  }
};



