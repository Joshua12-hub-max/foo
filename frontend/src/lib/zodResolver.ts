/**
 * Typed zodResolver wrapper for Zod v4 + @hookform/resolvers compatibility.
 * 
 * @hookform/resolvers v5.2.2 ships with types for Zod v3, creating a type
 * mismatch with Zod v4 schemas. This helper centralises the cast so that
 * individual form files don't have to use `as any`.
 */
import { zodResolver as baseZodResolver } from '@hookform/resolvers/zod';
import type { Resolver, FieldValues } from 'react-hook-form';
import type { ZodType } from 'zod';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function zodResolver<T extends FieldValues>(schema: ZodType<T>): Resolver<T> {
  return baseZodResolver(schema as any) as unknown as Resolver<T>;
}
