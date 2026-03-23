/**
 * Typed zodResolver wrapper for Zod v4 + @hookform/resolvers compatibility.
 * 
 * @hookform/resolvers v5.2.2 ships with types for Zod v3, creating a type
 * mismatch with Zod v4 schemas. This helper centralises the cast so that
 * individual form files don't have to use `as never`.
 */
import { zodResolver as baseZodResolver } from '@hookform/resolvers/zod';
import type { Resolver, FieldValues } from 'react-hook-form';
import type { ZodType } from 'zod';

export function zodResolver<T extends FieldValues>(schema: ZodType<T>): Resolver<T> {
  return baseZodResolver(schema as Parameters<typeof baseZodResolver>[0]) as Resolver<T>;
}
