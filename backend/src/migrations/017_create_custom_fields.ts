import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('employee_custom_fields')
    .addColumn('id', 'serial', (col: unknown) => col.primaryKey())
    .addColumn('employee_id', 'integer', (col: unknown) => col.references('employees.id').onDelete('cascade').notNull())
    .addColumn('section', 'varchar(100)', (col: unknown) => col.notNull()) // e.g., 'Personal Information', 'Employment Record'
    .addColumn('field_name', 'varchar(255)', (col: unknown) => col.notNull())
    .addColumn('field_value', 'text')
    // Metadata
    .addColumn('created_at', 'timestamp', (col: unknown) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'timestamp', (col: unknown) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  // Index for faster lookups by employee and section
  await db.schema
    .createIndex('idx_custom_fields_employee_section')
    .on('employee_custom_fields')
    .columns(['employee_id', 'section'])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('employee_custom_fields').execute();
}
