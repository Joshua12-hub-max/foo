"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except2, desc2) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except2)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc2 = __getOwnPropDesc(from, key)) || desc2.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  addressRefBarangays: () => addressRefBarangays,
  announcements: () => announcements,
  attendanceLogs: () => attendanceLogs,
  authentication: () => authentication,
  bioAttendanceLogs: () => bioAttendanceLogs,
  bioEnrolledUsers: () => bioEnrolledUsers,
  budgetAllocation: () => budgetAllocation,
  chatConversations: () => chatConversations,
  chatMessages: () => chatMessages,
  contactInquiries: () => contactInquiries,
  dailyTimeRecords: () => dailyTimeRecords,
  departments: () => departments,
  dtrCorrections: () => dtrCorrections,
  employeeCustomFields: () => employeeCustomFields,
  employeeDirectory: () => employeeDirectory,
  employeeDocuments: () => employeeDocuments,
  employeeEducation: () => employeeEducation,
  employeeEmergencyContacts: () => employeeEmergencyContacts,
  employeeEmploymentHistory: () => employeeEmploymentHistory,
  employeeMemos: () => employeeMemos,
  employeeNotes: () => employeeNotes,
  employeeSkills: () => employeeSkills,
  events: () => events,
  fingerprints: () => fingerprints,
  googleCalendarTokens: () => googleCalendarTokens,
  holidays: () => holidays,
  internalPolicies: () => internalPolicies,
  leaveApplications: () => leaveApplications,
  leaveBalances: () => leaveBalances,
  leaveCredits: () => leaveCredits,
  leaveLedger: () => leaveLedger,
  leaveMonetizationRequests: () => leaveMonetizationRequests,
  leaveRequests: () => leaveRequests,
  lwopSummary: () => lwopSummary,
  memoSequences: () => memoSequences,
  nepotismRelationships: () => nepotismRelationships,
  notifications: () => notifications,
  pdsEducation: () => pdsEducation,
  pdsEligibility: () => pdsEligibility,
  pdsFamily: () => pdsFamily,
  pdsLearningDevelopment: () => pdsLearningDevelopment,
  pdsOtherInfo: () => pdsOtherInfo,
  pdsReferences: () => pdsReferences,
  pdsVoluntaryWork: () => pdsVoluntaryWork,
  pdsWorkExperience: () => pdsWorkExperience,
  performanceAuditLog: () => performanceAuditLog,
  performanceCriteria: () => performanceCriteria,
  performanceGoals: () => performanceGoals,
  performanceImprovementPlans: () => performanceImprovementPlans,
  performanceReviewCycles: () => performanceReviewCycles,
  performanceReviewItems: () => performanceReviewItems,
  performanceReviews: () => performanceReviews,
  performanceTemplates: () => performanceTemplates,
  plantillaAuditLog: () => plantillaAuditLog,
  plantillaPositionHistory: () => plantillaPositionHistory,
  plantillaPositions: () => plantillaPositions,
  policyViolations: () => policyViolations,
  positionPublications: () => positionPublications,
  qualificationStandards: () => qualificationStandards,
  recruitmentApplicants: () => recruitmentApplicants,
  recruitmentEmailTemplates: () => recruitmentEmailTemplates,
  recruitmentJobs: () => recruitmentJobs,
  salarySchedule: () => salarySchedule,
  salaryTranches: () => salaryTranches,
  schedules: () => schedules,
  serviceRecords: () => serviceRecords,
  socialConnections: () => socialConnections,
  stepIncrementTracker: () => stepIncrementTracker,
  syncedEvents: () => syncedEvents,
  systemSettings: () => systemSettings,
  tardinessSummary: () => tardinessSummary
});
module.exports = __toCommonJS(schema_exports);

// node_modules/drizzle-orm/entity.js
var entityKind = /* @__PURE__ */ Symbol.for("drizzle:entityKind");
function is(value, type) {
  if (!value || typeof value !== "object") {
    return false;
  }
  if (value instanceof type) {
    return true;
  }
  if (!Object.prototype.hasOwnProperty.call(type, entityKind)) {
    throw new Error(
      `Class "${type.name ?? "<unknown>"}" doesn't look like a Drizzle entity. If this is incorrect and the class is provided by Drizzle, please report this as a bug.`
    );
  }
  let cls = Object.getPrototypeOf(value).constructor;
  if (cls) {
    while (cls) {
      if (entityKind in cls && cls[entityKind] === type[entityKind]) {
        return true;
      }
      cls = Object.getPrototypeOf(cls);
    }
  }
  return false;
}

// node_modules/drizzle-orm/column.js
var Column = class {
  constructor(table, config) {
    this.table = table;
    this.config = config;
    this.name = config.name;
    this.keyAsName = config.keyAsName;
    this.notNull = config.notNull;
    this.default = config.default;
    this.defaultFn = config.defaultFn;
    this.onUpdateFn = config.onUpdateFn;
    this.hasDefault = config.hasDefault;
    this.primary = config.primaryKey;
    this.isUnique = config.isUnique;
    this.uniqueName = config.uniqueName;
    this.uniqueType = config.uniqueType;
    this.dataType = config.dataType;
    this.columnType = config.columnType;
    this.generated = config.generated;
    this.generatedIdentity = config.generatedIdentity;
  }
  static [entityKind] = "Column";
  name;
  keyAsName;
  primary;
  notNull;
  default;
  defaultFn;
  onUpdateFn;
  hasDefault;
  isUnique;
  uniqueName;
  uniqueType;
  dataType;
  columnType;
  enumValues = void 0;
  generated = void 0;
  generatedIdentity = void 0;
  config;
  mapFromDriverValue(value) {
    return value;
  }
  mapToDriverValue(value) {
    return value;
  }
  // ** @internal */
  shouldDisableInsert() {
    return this.config.generated !== void 0 && this.config.generated.type !== "byDefault";
  }
};

// node_modules/drizzle-orm/column-builder.js
var ColumnBuilder = class {
  static [entityKind] = "ColumnBuilder";
  config;
  constructor(name, dataType, columnType) {
    this.config = {
      name,
      keyAsName: name === "",
      notNull: false,
      default: void 0,
      hasDefault: false,
      primaryKey: false,
      isUnique: false,
      uniqueName: void 0,
      uniqueType: void 0,
      dataType,
      columnType,
      generated: void 0
    };
  }
  /**
   * Changes the data type of the column. Commonly used with `json` columns. Also, useful for branded types.
   *
   * @example
   * ```ts
   * const users = pgTable('users', {
   * 	id: integer('id').$type<UserId>().primaryKey(),
   * 	details: json('details').$type<UserDetails>().notNull(),
   * });
   * ```
   */
  $type() {
    return this;
  }
  /**
   * Adds a `not null` clause to the column definition.
   *
   * Affects the `select` model of the table - columns *without* `not null` will be nullable on select.
   */
  notNull() {
    this.config.notNull = true;
    return this;
  }
  /**
   * Adds a `default <value>` clause to the column definition.
   *
   * Affects the `insert` model of the table - columns *with* `default` are optional on insert.
   *
   * If you need to set a dynamic default value, use {@link $defaultFn} instead.
   */
  default(value) {
    this.config.default = value;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Adds a dynamic default value to the column.
   * The function will be called when the row is inserted, and the returned value will be used as the column value.
   *
   * **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
   */
  $defaultFn(fn) {
    this.config.defaultFn = fn;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Alias for {@link $defaultFn}.
   */
  $default = this.$defaultFn;
  /**
   * Adds a dynamic update value to the column.
   * The function will be called when the row is updated, and the returned value will be used as the column value if none is provided.
   * If no `default` (or `$defaultFn`) value is provided, the function will be called when the row is inserted as well, and the returned value will be used as the column value.
   *
   * **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
   */
  $onUpdateFn(fn) {
    this.config.onUpdateFn = fn;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Alias for {@link $onUpdateFn}.
   */
  $onUpdate = this.$onUpdateFn;
  /**
   * Adds a `primary key` clause to the column definition. This implicitly makes the column `not null`.
   *
   * In SQLite, `integer primary key` implicitly makes the column auto-incrementing.
   */
  primaryKey() {
    this.config.primaryKey = true;
    this.config.notNull = true;
    return this;
  }
  /** @internal Sets the name of the column to the key within the table definition if a name was not given. */
  setName(name) {
    if (this.config.name !== "") return;
    this.config.name = name;
  }
};

// node_modules/drizzle-orm/table.utils.js
var TableName = /* @__PURE__ */ Symbol.for("drizzle:Name");

// node_modules/drizzle-orm/pg-core/foreign-keys.js
var ForeignKeyBuilder = class {
  static [entityKind] = "PgForeignKeyBuilder";
  /** @internal */
  reference;
  /** @internal */
  _onUpdate = "no action";
  /** @internal */
  _onDelete = "no action";
  constructor(config, actions) {
    this.reference = () => {
      const { name, columns, foreignColumns } = config();
      return { name, columns, foreignTable: foreignColumns[0].table, foreignColumns };
    };
    if (actions) {
      this._onUpdate = actions.onUpdate;
      this._onDelete = actions.onDelete;
    }
  }
  onUpdate(action) {
    this._onUpdate = action === void 0 ? "no action" : action;
    return this;
  }
  onDelete(action) {
    this._onDelete = action === void 0 ? "no action" : action;
    return this;
  }
  /** @internal */
  build(table) {
    return new ForeignKey(table, this);
  }
};
var ForeignKey = class {
  constructor(table, builder) {
    this.table = table;
    this.reference = builder.reference;
    this.onUpdate = builder._onUpdate;
    this.onDelete = builder._onDelete;
  }
  static [entityKind] = "PgForeignKey";
  reference;
  onUpdate;
  onDelete;
  getName() {
    const { name, columns, foreignColumns } = this.reference();
    const columnNames = columns.map((column) => column.name);
    const foreignColumnNames = foreignColumns.map((column) => column.name);
    const chunks = [
      this.table[TableName],
      ...columnNames,
      foreignColumns[0].table[TableName],
      ...foreignColumnNames
    ];
    return name ?? `${chunks.join("_")}_fk`;
  }
};

// node_modules/drizzle-orm/tracing-utils.js
function iife(fn, ...args) {
  return fn(...args);
}

// node_modules/drizzle-orm/pg-core/unique-constraint.js
function uniqueKeyName(table, columns) {
  return `${table[TableName]}_${columns.join("_")}_unique`;
}
var UniqueConstraintBuilder = class {
  constructor(columns, name) {
    this.name = name;
    this.columns = columns;
  }
  static [entityKind] = "PgUniqueConstraintBuilder";
  /** @internal */
  columns;
  /** @internal */
  nullsNotDistinctConfig = false;
  nullsNotDistinct() {
    this.nullsNotDistinctConfig = true;
    return this;
  }
  /** @internal */
  build(table) {
    return new UniqueConstraint(table, this.columns, this.nullsNotDistinctConfig, this.name);
  }
};
var UniqueOnConstraintBuilder = class {
  static [entityKind] = "PgUniqueOnConstraintBuilder";
  /** @internal */
  name;
  constructor(name) {
    this.name = name;
  }
  on(...columns) {
    return new UniqueConstraintBuilder(columns, this.name);
  }
};
var UniqueConstraint = class {
  constructor(table, columns, nullsNotDistinct, name) {
    this.table = table;
    this.columns = columns;
    this.name = name ?? uniqueKeyName(this.table, this.columns.map((column) => column.name));
    this.nullsNotDistinct = nullsNotDistinct;
  }
  static [entityKind] = "PgUniqueConstraint";
  columns;
  name;
  nullsNotDistinct = false;
  getName() {
    return this.name;
  }
};

// node_modules/drizzle-orm/pg-core/utils/array.js
function parsePgArrayValue(arrayString, startFrom, inQuotes) {
  for (let i = startFrom; i < arrayString.length; i++) {
    const char2 = arrayString[i];
    if (char2 === "\\") {
      i++;
      continue;
    }
    if (char2 === '"') {
      return [arrayString.slice(startFrom, i).replace(/\\/g, ""), i + 1];
    }
    if (inQuotes) {
      continue;
    }
    if (char2 === "," || char2 === "}") {
      return [arrayString.slice(startFrom, i).replace(/\\/g, ""), i];
    }
  }
  return [arrayString.slice(startFrom).replace(/\\/g, ""), arrayString.length];
}
function parsePgNestedArray(arrayString, startFrom = 0) {
  const result = [];
  let i = startFrom;
  let lastCharIsComma = false;
  while (i < arrayString.length) {
    const char2 = arrayString[i];
    if (char2 === ",") {
      if (lastCharIsComma || i === startFrom) {
        result.push("");
      }
      lastCharIsComma = true;
      i++;
      continue;
    }
    lastCharIsComma = false;
    if (char2 === "\\") {
      i += 2;
      continue;
    }
    if (char2 === '"') {
      const [value2, startFrom2] = parsePgArrayValue(arrayString, i + 1, true);
      result.push(value2);
      i = startFrom2;
      continue;
    }
    if (char2 === "}") {
      return [result, i + 1];
    }
    if (char2 === "{") {
      const [value2, startFrom2] = parsePgNestedArray(arrayString, i + 1);
      result.push(value2);
      i = startFrom2;
      continue;
    }
    const [value, newStartFrom] = parsePgArrayValue(arrayString, i, false);
    result.push(value);
    i = newStartFrom;
  }
  return [result, i];
}
function parsePgArray(arrayString) {
  const [result] = parsePgNestedArray(arrayString, 1);
  return result;
}
function makePgArray(array) {
  return `{${array.map((item) => {
    if (Array.isArray(item)) {
      return makePgArray(item);
    }
    if (typeof item === "string") {
      return `"${item.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    }
    return `${item}`;
  }).join(",")}}`;
}

// node_modules/drizzle-orm/pg-core/columns/common.js
var PgColumnBuilder = class extends ColumnBuilder {
  foreignKeyConfigs = [];
  static [entityKind] = "PgColumnBuilder";
  array(size) {
    return new PgArrayBuilder(this.config.name, this, size);
  }
  references(ref, actions = {}) {
    this.foreignKeyConfigs.push({ ref, actions });
    return this;
  }
  unique(name, config) {
    this.config.isUnique = true;
    this.config.uniqueName = name;
    this.config.uniqueType = config?.nulls;
    return this;
  }
  generatedAlwaysAs(as) {
    this.config.generated = {
      as,
      type: "always",
      mode: "stored"
    };
    return this;
  }
  /** @internal */
  buildForeignKeys(column, table) {
    return this.foreignKeyConfigs.map(({ ref, actions }) => {
      return iife(
        (ref2, actions2) => {
          const builder = new ForeignKeyBuilder(() => {
            const foreignColumn = ref2();
            return { columns: [column], foreignColumns: [foreignColumn] };
          });
          if (actions2.onUpdate) {
            builder.onUpdate(actions2.onUpdate);
          }
          if (actions2.onDelete) {
            builder.onDelete(actions2.onDelete);
          }
          return builder.build(table);
        },
        ref,
        actions
      );
    });
  }
  /** @internal */
  buildExtraConfigColumn(table) {
    return new ExtraConfigColumn(table, this.config);
  }
};
var PgColumn = class extends Column {
  constructor(table, config) {
    if (!config.uniqueName) {
      config.uniqueName = uniqueKeyName(table, [config.name]);
    }
    super(table, config);
    this.table = table;
  }
  static [entityKind] = "PgColumn";
};
var ExtraConfigColumn = class extends PgColumn {
  static [entityKind] = "ExtraConfigColumn";
  getSQLType() {
    return this.getSQLType();
  }
  indexConfig = {
    order: this.config.order ?? "asc",
    nulls: this.config.nulls ?? "last",
    opClass: this.config.opClass
  };
  defaultConfig = {
    order: "asc",
    nulls: "last",
    opClass: void 0
  };
  asc() {
    this.indexConfig.order = "asc";
    return this;
  }
  desc() {
    this.indexConfig.order = "desc";
    return this;
  }
  nullsFirst() {
    this.indexConfig.nulls = "first";
    return this;
  }
  nullsLast() {
    this.indexConfig.nulls = "last";
    return this;
  }
  /**
   * ### PostgreSQL documentation quote
   *
   * > An operator class with optional parameters can be specified for each column of an index.
   * The operator class identifies the operators to be used by the index for that column.
   * For example, a B-tree index on four-byte integers would use the int4_ops class;
   * this operator class includes comparison functions for four-byte integers.
   * In practice the default operator class for the column's data type is usually sufficient.
   * The main point of having operator classes is that for some data types, there could be more than one meaningful ordering.
   * For example, we might want to sort a complex-number data type either by absolute value or by real part.
   * We could do this by defining two operator classes for the data type and then selecting the proper class when creating an index.
   * More information about operator classes check:
   *
   * ### Useful links
   * https://www.postgresql.org/docs/current/sql-createindex.html
   *
   * https://www.postgresql.org/docs/current/indexes-opclass.html
   *
   * https://www.postgresql.org/docs/current/xindex.html
   *
   * ### Additional types
   * If you have the `pg_vector` extension installed in your database, you can use the
   * `vector_l2_ops`, `vector_ip_ops`, `vector_cosine_ops`, `vector_l1_ops`, `bit_hamming_ops`, `bit_jaccard_ops`, `halfvec_l2_ops`, `sparsevec_l2_ops` options, which are predefined types.
   *
   * **You can always specify any string you want in the operator class, in case Drizzle doesn't have it natively in its types**
   *
   * @param opClass
   * @returns
   */
  op(opClass) {
    this.indexConfig.opClass = opClass;
    return this;
  }
};
var IndexedColumn = class {
  static [entityKind] = "IndexedColumn";
  constructor(name, keyAsName, type, indexConfig) {
    this.name = name;
    this.keyAsName = keyAsName;
    this.type = type;
    this.indexConfig = indexConfig;
  }
  name;
  keyAsName;
  type;
  indexConfig;
};
var PgArrayBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgArrayBuilder";
  constructor(name, baseBuilder, size) {
    super(name, "array", "PgArray");
    this.config.baseBuilder = baseBuilder;
    this.config.size = size;
  }
  /** @internal */
  build(table) {
    const baseColumn = this.config.baseBuilder.build(table);
    return new PgArray(
      table,
      this.config,
      baseColumn
    );
  }
};
var PgArray = class _PgArray extends PgColumn {
  constructor(table, config, baseColumn, range) {
    super(table, config);
    this.baseColumn = baseColumn;
    this.range = range;
    this.size = config.size;
  }
  size;
  static [entityKind] = "PgArray";
  getSQLType() {
    return `${this.baseColumn.getSQLType()}[${typeof this.size === "number" ? this.size : ""}]`;
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      value = parsePgArray(value);
    }
    return value.map((v) => this.baseColumn.mapFromDriverValue(v));
  }
  mapToDriverValue(value, isNestedArray = false) {
    const a = value.map(
      (v) => v === null ? null : is(this.baseColumn, _PgArray) ? this.baseColumn.mapToDriverValue(v, true) : this.baseColumn.mapToDriverValue(v)
    );
    if (isNestedArray) return a;
    return makePgArray(a);
  }
};

// node_modules/drizzle-orm/pg-core/columns/enum.js
var PgEnumObjectColumnBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgEnumObjectColumnBuilder";
  constructor(name, enumInstance) {
    super(name, "string", "PgEnumObjectColumn");
    this.config.enum = enumInstance;
  }
  /** @internal */
  build(table) {
    return new PgEnumObjectColumn(
      table,
      this.config
    );
  }
};
var PgEnumObjectColumn = class extends PgColumn {
  static [entityKind] = "PgEnumObjectColumn";
  enum;
  enumValues = this.config.enum.enumValues;
  constructor(table, config) {
    super(table, config);
    this.enum = config.enum;
  }
  getSQLType() {
    return this.enum.enumName;
  }
};
var isPgEnumSym = /* @__PURE__ */ Symbol.for("drizzle:isPgEnum");
function isPgEnum(obj) {
  return !!obj && typeof obj === "function" && isPgEnumSym in obj && obj[isPgEnumSym] === true;
}
var PgEnumColumnBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgEnumColumnBuilder";
  constructor(name, enumInstance) {
    super(name, "string", "PgEnumColumn");
    this.config.enum = enumInstance;
  }
  /** @internal */
  build(table) {
    return new PgEnumColumn(
      table,
      this.config
    );
  }
};
var PgEnumColumn = class extends PgColumn {
  static [entityKind] = "PgEnumColumn";
  enum = this.config.enum;
  enumValues = this.config.enum.enumValues;
  constructor(table, config) {
    super(table, config);
    this.enum = config.enum;
  }
  getSQLType() {
    return this.enum.enumName;
  }
};

// node_modules/drizzle-orm/subquery.js
var Subquery = class {
  static [entityKind] = "Subquery";
  constructor(sql2, fields, alias, isWith = false, usedTables = []) {
    this._ = {
      brand: "Subquery",
      sql: sql2,
      selectedFields: fields,
      alias,
      isWith,
      usedTables
    };
  }
  // getSQL(): SQL<unknown> {
  // 	return new SQL([this]);
  // }
};
var WithSubquery = class extends Subquery {
  static [entityKind] = "WithSubquery";
};

// node_modules/drizzle-orm/version.js
var version = "0.45.1";

// node_modules/drizzle-orm/tracing.js
var otel;
var rawTracer;
var tracer = {
  startActiveSpan(name, fn) {
    if (!otel) {
      return fn();
    }
    if (!rawTracer) {
      rawTracer = otel.trace.getTracer("drizzle-orm", version);
    }
    return iife(
      (otel2, rawTracer2) => rawTracer2.startActiveSpan(
        name,
        (span) => {
          try {
            return fn(span);
          } catch (e) {
            span.setStatus({
              code: otel2.SpanStatusCode.ERROR,
              message: e instanceof Error ? e.message : "Unknown error"
              // eslint-disable-line no-instanceof/no-instanceof
            });
            throw e;
          } finally {
            span.end();
          }
        }
      ),
      otel,
      rawTracer
    );
  }
};

// node_modules/drizzle-orm/view-common.js
var ViewBaseConfig = /* @__PURE__ */ Symbol.for("drizzle:ViewBaseConfig");

// node_modules/drizzle-orm/table.js
var Schema = /* @__PURE__ */ Symbol.for("drizzle:Schema");
var Columns = /* @__PURE__ */ Symbol.for("drizzle:Columns");
var ExtraConfigColumns = /* @__PURE__ */ Symbol.for("drizzle:ExtraConfigColumns");
var OriginalName = /* @__PURE__ */ Symbol.for("drizzle:OriginalName");
var BaseName = /* @__PURE__ */ Symbol.for("drizzle:BaseName");
var IsAlias = /* @__PURE__ */ Symbol.for("drizzle:IsAlias");
var ExtraConfigBuilder = /* @__PURE__ */ Symbol.for("drizzle:ExtraConfigBuilder");
var IsDrizzleTable = /* @__PURE__ */ Symbol.for("drizzle:IsDrizzleTable");
var Table = class {
  static [entityKind] = "Table";
  /** @internal */
  static Symbol = {
    Name: TableName,
    Schema,
    OriginalName,
    Columns,
    ExtraConfigColumns,
    BaseName,
    IsAlias,
    ExtraConfigBuilder
  };
  /**
   * @internal
   * Can be changed if the table is aliased.
   */
  [TableName];
  /**
   * @internal
   * Used to store the original name of the table, before any aliasing.
   */
  [OriginalName];
  /** @internal */
  [Schema];
  /** @internal */
  [Columns];
  /** @internal */
  [ExtraConfigColumns];
  /**
   *  @internal
   * Used to store the table name before the transformation via the `tableCreator` functions.
   */
  [BaseName];
  /** @internal */
  [IsAlias] = false;
  /** @internal */
  [IsDrizzleTable] = true;
  /** @internal */
  [ExtraConfigBuilder] = void 0;
  constructor(name, schema, baseName) {
    this[TableName] = this[OriginalName] = name;
    this[Schema] = schema;
    this[BaseName] = baseName;
  }
};
function getTableName(table) {
  return table[TableName];
}
function getTableUniqueName(table) {
  return `${table[Schema] ?? "public"}.${table[TableName]}`;
}

// node_modules/drizzle-orm/sql/sql.js
var FakePrimitiveParam = class {
  static [entityKind] = "FakePrimitiveParam";
};
function isSQLWrapper(value) {
  return value !== null && value !== void 0 && typeof value.getSQL === "function";
}
function mergeQueries(queries) {
  const result = { sql: "", params: [] };
  for (const query of queries) {
    result.sql += query.sql;
    result.params.push(...query.params);
    if (query.typings?.length) {
      if (!result.typings) {
        result.typings = [];
      }
      result.typings.push(...query.typings);
    }
  }
  return result;
}
var StringChunk = class {
  static [entityKind] = "StringChunk";
  value;
  constructor(value) {
    this.value = Array.isArray(value) ? value : [value];
  }
  getSQL() {
    return new SQL([this]);
  }
};
var SQL = class _SQL {
  constructor(queryChunks) {
    this.queryChunks = queryChunks;
    for (const chunk of queryChunks) {
      if (is(chunk, Table)) {
        const schemaName = chunk[Table.Symbol.Schema];
        this.usedTables.push(
          schemaName === void 0 ? chunk[Table.Symbol.Name] : schemaName + "." + chunk[Table.Symbol.Name]
        );
      }
    }
  }
  static [entityKind] = "SQL";
  /** @internal */
  decoder = noopDecoder;
  shouldInlineParams = false;
  /** @internal */
  usedTables = [];
  append(query) {
    this.queryChunks.push(...query.queryChunks);
    return this;
  }
  toQuery(config) {
    return tracer.startActiveSpan("drizzle.buildSQL", (span) => {
      const query = this.buildQueryFromSourceParams(this.queryChunks, config);
      span?.setAttributes({
        "drizzle.query.text": query.sql,
        "drizzle.query.params": JSON.stringify(query.params)
      });
      return query;
    });
  }
  buildQueryFromSourceParams(chunks, _config) {
    const config = Object.assign({}, _config, {
      inlineParams: _config.inlineParams || this.shouldInlineParams,
      paramStartIndex: _config.paramStartIndex || { value: 0 }
    });
    const {
      casing,
      escapeName,
      escapeParam,
      prepareTyping,
      inlineParams,
      paramStartIndex
    } = config;
    return mergeQueries(chunks.map((chunk) => {
      if (is(chunk, StringChunk)) {
        return { sql: chunk.value.join(""), params: [] };
      }
      if (is(chunk, Name)) {
        return { sql: escapeName(chunk.value), params: [] };
      }
      if (chunk === void 0) {
        return { sql: "", params: [] };
      }
      if (Array.isArray(chunk)) {
        const result = [new StringChunk("(")];
        for (const [i, p] of chunk.entries()) {
          result.push(p);
          if (i < chunk.length - 1) {
            result.push(new StringChunk(", "));
          }
        }
        result.push(new StringChunk(")"));
        return this.buildQueryFromSourceParams(result, config);
      }
      if (is(chunk, _SQL)) {
        return this.buildQueryFromSourceParams(chunk.queryChunks, {
          ...config,
          inlineParams: inlineParams || chunk.shouldInlineParams
        });
      }
      if (is(chunk, Table)) {
        const schemaName = chunk[Table.Symbol.Schema];
        const tableName = chunk[Table.Symbol.Name];
        return {
          sql: schemaName === void 0 || chunk[IsAlias] ? escapeName(tableName) : escapeName(schemaName) + "." + escapeName(tableName),
          params: []
        };
      }
      if (is(chunk, Column)) {
        const columnName = casing.getColumnCasing(chunk);
        if (_config.invokeSource === "indexes") {
          return { sql: escapeName(columnName), params: [] };
        }
        const schemaName = chunk.table[Table.Symbol.Schema];
        return {
          sql: chunk.table[IsAlias] || schemaName === void 0 ? escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName) : escapeName(schemaName) + "." + escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName),
          params: []
        };
      }
      if (is(chunk, View)) {
        const schemaName = chunk[ViewBaseConfig].schema;
        const viewName = chunk[ViewBaseConfig].name;
        return {
          sql: schemaName === void 0 || chunk[ViewBaseConfig].isAlias ? escapeName(viewName) : escapeName(schemaName) + "." + escapeName(viewName),
          params: []
        };
      }
      if (is(chunk, Param)) {
        if (is(chunk.value, Placeholder)) {
          return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
        }
        const mappedValue = chunk.value === null ? null : chunk.encoder.mapToDriverValue(chunk.value);
        if (is(mappedValue, _SQL)) {
          return this.buildQueryFromSourceParams([mappedValue], config);
        }
        if (inlineParams) {
          return { sql: this.mapInlineParam(mappedValue, config), params: [] };
        }
        let typings = ["none"];
        if (prepareTyping) {
          typings = [prepareTyping(chunk.encoder)];
        }
        return { sql: escapeParam(paramStartIndex.value++, mappedValue), params: [mappedValue], typings };
      }
      if (is(chunk, Placeholder)) {
        return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
      }
      if (is(chunk, _SQL.Aliased) && chunk.fieldAlias !== void 0) {
        return { sql: escapeName(chunk.fieldAlias), params: [] };
      }
      if (is(chunk, Subquery)) {
        if (chunk._.isWith) {
          return { sql: escapeName(chunk._.alias), params: [] };
        }
        return this.buildQueryFromSourceParams([
          new StringChunk("("),
          chunk._.sql,
          new StringChunk(") "),
          new Name(chunk._.alias)
        ], config);
      }
      if (isPgEnum(chunk)) {
        if (chunk.schema) {
          return { sql: escapeName(chunk.schema) + "." + escapeName(chunk.enumName), params: [] };
        }
        return { sql: escapeName(chunk.enumName), params: [] };
      }
      if (isSQLWrapper(chunk)) {
        if (chunk.shouldOmitSQLParens?.()) {
          return this.buildQueryFromSourceParams([chunk.getSQL()], config);
        }
        return this.buildQueryFromSourceParams([
          new StringChunk("("),
          chunk.getSQL(),
          new StringChunk(")")
        ], config);
      }
      if (inlineParams) {
        return { sql: this.mapInlineParam(chunk, config), params: [] };
      }
      return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
    }));
  }
  mapInlineParam(chunk, { escapeString }) {
    if (chunk === null) {
      return "null";
    }
    if (typeof chunk === "number" || typeof chunk === "boolean") {
      return chunk.toString();
    }
    if (typeof chunk === "string") {
      return escapeString(chunk);
    }
    if (typeof chunk === "object") {
      const mappedValueAsString = chunk.toString();
      if (mappedValueAsString === "[object Object]") {
        return escapeString(JSON.stringify(chunk));
      }
      return escapeString(mappedValueAsString);
    }
    throw new Error("Unexpected param value: " + chunk);
  }
  getSQL() {
    return this;
  }
  as(alias) {
    if (alias === void 0) {
      return this;
    }
    return new _SQL.Aliased(this, alias);
  }
  mapWith(decoder) {
    this.decoder = typeof decoder === "function" ? { mapFromDriverValue: decoder } : decoder;
    return this;
  }
  inlineParams() {
    this.shouldInlineParams = true;
    return this;
  }
  /**
   * This method is used to conditionally include a part of the query.
   *
   * @param condition - Condition to check
   * @returns itself if the condition is `true`, otherwise `undefined`
   */
  if(condition) {
    return condition ? this : void 0;
  }
};
var Name = class {
  constructor(value) {
    this.value = value;
  }
  static [entityKind] = "Name";
  brand;
  getSQL() {
    return new SQL([this]);
  }
};
function isDriverValueEncoder(value) {
  return typeof value === "object" && value !== null && "mapToDriverValue" in value && typeof value.mapToDriverValue === "function";
}
var noopDecoder = {
  mapFromDriverValue: (value) => value
};
var noopEncoder = {
  mapToDriverValue: (value) => value
};
var noopMapper = {
  ...noopDecoder,
  ...noopEncoder
};
var Param = class {
  /**
   * @param value - Parameter value
   * @param encoder - Encoder to convert the value to a driver parameter
   */
  constructor(value, encoder = noopEncoder) {
    this.value = value;
    this.encoder = encoder;
  }
  static [entityKind] = "Param";
  brand;
  getSQL() {
    return new SQL([this]);
  }
};
function sql(strings, ...params) {
  const queryChunks = [];
  if (params.length > 0 || strings.length > 0 && strings[0] !== "") {
    queryChunks.push(new StringChunk(strings[0]));
  }
  for (const [paramIndex, param2] of params.entries()) {
    queryChunks.push(param2, new StringChunk(strings[paramIndex + 1]));
  }
  return new SQL(queryChunks);
}
((sql2) => {
  function empty() {
    return new SQL([]);
  }
  sql2.empty = empty;
  function fromList(list) {
    return new SQL(list);
  }
  sql2.fromList = fromList;
  function raw(str) {
    return new SQL([new StringChunk(str)]);
  }
  sql2.raw = raw;
  function join(chunks, separator) {
    const result = [];
    for (const [i, chunk] of chunks.entries()) {
      if (i > 0 && separator !== void 0) {
        result.push(separator);
      }
      result.push(chunk);
    }
    return new SQL(result);
  }
  sql2.join = join;
  function identifier(value) {
    return new Name(value);
  }
  sql2.identifier = identifier;
  function placeholder2(name2) {
    return new Placeholder(name2);
  }
  sql2.placeholder = placeholder2;
  function param2(value, encoder) {
    return new Param(value, encoder);
  }
  sql2.param = param2;
})(sql || (sql = {}));
((SQL2) => {
  class Aliased {
    constructor(sql2, fieldAlias) {
      this.sql = sql2;
      this.fieldAlias = fieldAlias;
    }
    static [entityKind] = "SQL.Aliased";
    /** @internal */
    isSelectionField = false;
    getSQL() {
      return this.sql;
    }
    /** @internal */
    clone() {
      return new Aliased(this.sql, this.fieldAlias);
    }
  }
  SQL2.Aliased = Aliased;
})(SQL || (SQL = {}));
var Placeholder = class {
  constructor(name2) {
    this.name = name2;
  }
  static [entityKind] = "Placeholder";
  getSQL() {
    return new SQL([this]);
  }
};
var IsDrizzleView = /* @__PURE__ */ Symbol.for("drizzle:IsDrizzleView");
var View = class {
  static [entityKind] = "View";
  /** @internal */
  [ViewBaseConfig];
  /** @internal */
  [IsDrizzleView] = true;
  constructor({ name: name2, schema, selectedFields, query }) {
    this[ViewBaseConfig] = {
      name: name2,
      originalName: name2,
      schema,
      selectedFields,
      query,
      isExisting: !query,
      isAlias: false
    };
  }
  getSQL() {
    return new SQL([this]);
  }
};
Column.prototype.getSQL = function() {
  return new SQL([this]);
};
Table.prototype.getSQL = function() {
  return new SQL([this]);
};
Subquery.prototype.getSQL = function() {
  return new SQL([this]);
};

// node_modules/drizzle-orm/alias.js
var ColumnAliasProxyHandler = class {
  constructor(table) {
    this.table = table;
  }
  static [entityKind] = "ColumnAliasProxyHandler";
  get(columnObj, prop) {
    if (prop === "table") {
      return this.table;
    }
    return columnObj[prop];
  }
};
var TableAliasProxyHandler = class {
  constructor(alias, replaceOriginalName) {
    this.alias = alias;
    this.replaceOriginalName = replaceOriginalName;
  }
  static [entityKind] = "TableAliasProxyHandler";
  get(target, prop) {
    if (prop === Table.Symbol.IsAlias) {
      return true;
    }
    if (prop === Table.Symbol.Name) {
      return this.alias;
    }
    if (this.replaceOriginalName && prop === Table.Symbol.OriginalName) {
      return this.alias;
    }
    if (prop === ViewBaseConfig) {
      return {
        ...target[ViewBaseConfig],
        name: this.alias,
        isAlias: true
      };
    }
    if (prop === Table.Symbol.Columns) {
      const columns = target[Table.Symbol.Columns];
      if (!columns) {
        return columns;
      }
      const proxiedColumns = {};
      Object.keys(columns).map((key) => {
        proxiedColumns[key] = new Proxy(
          columns[key],
          new ColumnAliasProxyHandler(new Proxy(target, this))
        );
      });
      return proxiedColumns;
    }
    const value = target[prop];
    if (is(value, Column)) {
      return new Proxy(value, new ColumnAliasProxyHandler(new Proxy(target, this)));
    }
    return value;
  }
};
var RelationTableAliasProxyHandler = class {
  constructor(alias) {
    this.alias = alias;
  }
  static [entityKind] = "RelationTableAliasProxyHandler";
  get(target, prop) {
    if (prop === "sourceTable") {
      return aliasedTable(target.sourceTable, this.alias);
    }
    return target[prop];
  }
};
function aliasedTable(table, tableAlias) {
  return new Proxy(table, new TableAliasProxyHandler(tableAlias, false));
}
function aliasedTableColumn(column, tableAlias) {
  return new Proxy(
    column,
    new ColumnAliasProxyHandler(new Proxy(column.table, new TableAliasProxyHandler(tableAlias, false)))
  );
}
function mapColumnsInAliasedSQLToAlias(query, alias) {
  return new SQL.Aliased(mapColumnsInSQLToAlias(query.sql, alias), query.fieldAlias);
}
function mapColumnsInSQLToAlias(query, alias) {
  return sql.join(query.queryChunks.map((c) => {
    if (is(c, Column)) {
      return aliasedTableColumn(c, alias);
    }
    if (is(c, SQL)) {
      return mapColumnsInSQLToAlias(c, alias);
    }
    if (is(c, SQL.Aliased)) {
      return mapColumnsInAliasedSQLToAlias(c, alias);
    }
    return c;
  }));
}

// node_modules/drizzle-orm/utils.js
function orderSelectedFields(fields, pathPrefix) {
  return Object.entries(fields).reduce((result, [name, field]) => {
    if (typeof name !== "string") {
      return result;
    }
    const newPath = pathPrefix ? [...pathPrefix, name] : [name];
    if (is(field, Column) || is(field, SQL) || is(field, SQL.Aliased) || is(field, Subquery)) {
      result.push({ path: newPath, field });
    } else if (is(field, Table)) {
      result.push(...orderSelectedFields(field[Table.Symbol.Columns], newPath));
    } else {
      result.push(...orderSelectedFields(field, newPath));
    }
    return result;
  }, []);
}
function haveSameKeys(left, right) {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }
  for (const [index2, key] of leftKeys.entries()) {
    if (key !== rightKeys[index2]) {
      return false;
    }
  }
  return true;
}
function applyMixins(baseClass, extendedClasses) {
  for (const extendedClass of extendedClasses) {
    for (const name of Object.getOwnPropertyNames(extendedClass.prototype)) {
      if (name === "constructor") continue;
      Object.defineProperty(
        baseClass.prototype,
        name,
        Object.getOwnPropertyDescriptor(extendedClass.prototype, name) || /* @__PURE__ */ Object.create(null)
      );
    }
  }
}
function getTableColumns(table) {
  return table[Table.Symbol.Columns];
}
function getTableLikeName(table) {
  return is(table, Subquery) ? table._.alias : is(table, View) ? table[ViewBaseConfig].name : is(table, SQL) ? void 0 : table[Table.Symbol.IsAlias] ? table[Table.Symbol.Name] : table[Table.Symbol.BaseName];
}
function getColumnNameAndConfig(a, b) {
  return {
    name: typeof a === "string" && a.length > 0 ? a : "",
    config: typeof a === "object" ? a : b
  };
}
var textDecoder = typeof TextDecoder === "undefined" ? null : new TextDecoder();

// node_modules/drizzle-orm/mysql-core/foreign-keys.js
var ForeignKeyBuilder2 = class {
  static [entityKind] = "MySqlForeignKeyBuilder";
  /** @internal */
  reference;
  /** @internal */
  _onUpdate;
  /** @internal */
  _onDelete;
  constructor(config, actions) {
    this.reference = () => {
      const { name, columns, foreignColumns } = config();
      return { name, columns, foreignTable: foreignColumns[0].table, foreignColumns };
    };
    if (actions) {
      this._onUpdate = actions.onUpdate;
      this._onDelete = actions.onDelete;
    }
  }
  onUpdate(action) {
    this._onUpdate = action;
    return this;
  }
  onDelete(action) {
    this._onDelete = action;
    return this;
  }
  /** @internal */
  build(table) {
    return new ForeignKey2(table, this);
  }
};
var ForeignKey2 = class {
  constructor(table, builder) {
    this.table = table;
    this.reference = builder.reference;
    this.onUpdate = builder._onUpdate;
    this.onDelete = builder._onDelete;
  }
  static [entityKind] = "MySqlForeignKey";
  reference;
  onUpdate;
  onDelete;
  getName() {
    const { name, columns, foreignColumns } = this.reference();
    const columnNames = columns.map((column) => column.name);
    const foreignColumnNames = foreignColumns.map((column) => column.name);
    const chunks = [
      this.table[TableName],
      ...columnNames,
      foreignColumns[0].table[TableName],
      ...foreignColumnNames
    ];
    return name ?? `${chunks.join("_")}_fk`;
  }
};
function foreignKey(config) {
  function mappedConfig() {
    const { name, columns, foreignColumns } = config;
    return {
      name,
      columns,
      foreignColumns
    };
  }
  return new ForeignKeyBuilder2(mappedConfig);
}

// node_modules/drizzle-orm/mysql-core/unique-constraint.js
function unique(name) {
  return new UniqueOnConstraintBuilder2(name);
}
function uniqueKeyName2(table, columns) {
  return `${table[TableName]}_${columns.join("_")}_unique`;
}
var UniqueConstraintBuilder2 = class {
  constructor(columns, name) {
    this.name = name;
    this.columns = columns;
  }
  static [entityKind] = "MySqlUniqueConstraintBuilder";
  /** @internal */
  columns;
  /** @internal */
  build(table) {
    return new UniqueConstraint2(table, this.columns, this.name);
  }
};
var UniqueOnConstraintBuilder2 = class {
  static [entityKind] = "MySqlUniqueOnConstraintBuilder";
  /** @internal */
  name;
  constructor(name) {
    this.name = name;
  }
  on(...columns) {
    return new UniqueConstraintBuilder2(columns, this.name);
  }
};
var UniqueConstraint2 = class {
  constructor(table, columns, name) {
    this.table = table;
    this.columns = columns;
    this.name = name ?? uniqueKeyName2(this.table, this.columns.map((column) => column.name));
  }
  static [entityKind] = "MySqlUniqueConstraint";
  columns;
  name;
  nullsNotDistinct = false;
  getName() {
    return this.name;
  }
};

// node_modules/drizzle-orm/mysql-core/columns/common.js
var MySqlColumnBuilder = class extends ColumnBuilder {
  static [entityKind] = "MySqlColumnBuilder";
  foreignKeyConfigs = [];
  references(ref, actions = {}) {
    this.foreignKeyConfigs.push({ ref, actions });
    return this;
  }
  unique(name) {
    this.config.isUnique = true;
    this.config.uniqueName = name;
    return this;
  }
  generatedAlwaysAs(as, config) {
    this.config.generated = {
      as,
      type: "always",
      mode: config?.mode ?? "virtual"
    };
    return this;
  }
  /** @internal */
  buildForeignKeys(column, table) {
    return this.foreignKeyConfigs.map(({ ref, actions }) => {
      return ((ref2, actions2) => {
        const builder = new ForeignKeyBuilder2(() => {
          const foreignColumn = ref2();
          return { columns: [column], foreignColumns: [foreignColumn] };
        });
        if (actions2.onUpdate) {
          builder.onUpdate(actions2.onUpdate);
        }
        if (actions2.onDelete) {
          builder.onDelete(actions2.onDelete);
        }
        return builder.build(table);
      })(ref, actions);
    });
  }
};
var MySqlColumn = class extends Column {
  constructor(table, config) {
    if (!config.uniqueName) {
      config.uniqueName = uniqueKeyName2(table, [config.name]);
    }
    super(table, config);
    this.table = table;
  }
  static [entityKind] = "MySqlColumn";
};
var MySqlColumnBuilderWithAutoIncrement = class extends MySqlColumnBuilder {
  static [entityKind] = "MySqlColumnBuilderWithAutoIncrement";
  constructor(name, dataType, columnType) {
    super(name, dataType, columnType);
    this.config.autoIncrement = false;
  }
  autoincrement() {
    this.config.autoIncrement = true;
    this.config.hasDefault = true;
    return this;
  }
};
var MySqlColumnWithAutoIncrement = class extends MySqlColumn {
  static [entityKind] = "MySqlColumnWithAutoIncrement";
  autoIncrement = this.config.autoIncrement;
};

// node_modules/drizzle-orm/mysql-core/columns/bigint.js
var MySqlBigInt53Builder = class extends MySqlColumnBuilderWithAutoIncrement {
  static [entityKind] = "MySqlBigInt53Builder";
  constructor(name, unsigned = false) {
    super(name, "number", "MySqlBigInt53");
    this.config.unsigned = unsigned;
  }
  /** @internal */
  build(table) {
    return new MySqlBigInt53(
      table,
      this.config
    );
  }
};
var MySqlBigInt53 = class extends MySqlColumnWithAutoIncrement {
  static [entityKind] = "MySqlBigInt53";
  getSQLType() {
    return `bigint${this.config.unsigned ? " unsigned" : ""}`;
  }
  mapFromDriverValue(value) {
    if (typeof value === "number") {
      return value;
    }
    return Number(value);
  }
};
var MySqlBigInt64Builder = class extends MySqlColumnBuilderWithAutoIncrement {
  static [entityKind] = "MySqlBigInt64Builder";
  constructor(name, unsigned = false) {
    super(name, "bigint", "MySqlBigInt64");
    this.config.unsigned = unsigned;
  }
  /** @internal */
  build(table) {
    return new MySqlBigInt64(
      table,
      this.config
    );
  }
};
var MySqlBigInt64 = class extends MySqlColumnWithAutoIncrement {
  static [entityKind] = "MySqlBigInt64";
  getSQLType() {
    return `bigint${this.config.unsigned ? " unsigned" : ""}`;
  }
  // eslint-disable-next-line unicorn/prefer-native-coercion-functions
  mapFromDriverValue(value) {
    return BigInt(value);
  }
};
function bigint(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config.mode === "number") {
    return new MySqlBigInt53Builder(name, config.unsigned);
  }
  return new MySqlBigInt64Builder(name, config.unsigned);
}

// node_modules/drizzle-orm/mysql-core/columns/binary.js
var MySqlBinaryBuilder = class extends MySqlColumnBuilder {
  static [entityKind] = "MySqlBinaryBuilder";
  constructor(name, length) {
    super(name, "string", "MySqlBinary");
    this.config.length = length;
  }
  /** @internal */
  build(table) {
    return new MySqlBinary(table, this.config);
  }
};
var MySqlBinary = class extends MySqlColumn {
  static [entityKind] = "MySqlBinary";
  length = this.config.length;
  mapFromDriverValue(value) {
    if (typeof value === "string") return value;
    if (Buffer.isBuffer(value)) return value.toString();
    const str = [];
    for (const v of value) {
      str.push(v === 49 ? "1" : "0");
    }
    return str.join("");
  }
  getSQLType() {
    return this.length === void 0 ? `binary` : `binary(${this.length})`;
  }
};
function binary(a, b = {}) {
  const { name, config } = getColumnNameAndConfig(a, b);
  return new MySqlBinaryBuilder(name, config.length);
}

// node_modules/drizzle-orm/mysql-core/columns/boolean.js
var MySqlBooleanBuilder = class extends MySqlColumnBuilder {
  static [entityKind] = "MySqlBooleanBuilder";
  constructor(name) {
    super(name, "boolean", "MySqlBoolean");
  }
  /** @internal */
  build(table) {
    return new MySqlBoolean(
      table,
      this.config
    );
  }
};
var MySqlBoolean = class extends MySqlColumn {
  static [entityKind] = "MySqlBoolean";
  getSQLType() {
    return "boolean";
  }
  mapFromDriverValue(value) {
    if (typeof value === "boolean") {
      return value;
    }
    return value === 1;
  }
};
function boolean(name) {
  return new MySqlBooleanBuilder(name ?? "");
}

// node_modules/drizzle-orm/mysql-core/columns/char.js
var MySqlCharBuilder = class extends MySqlColumnBuilder {
  static [entityKind] = "MySqlCharBuilder";
  constructor(name, config) {
    super(name, "string", "MySqlChar");
    this.config.length = config.length;
    this.config.enum = config.enum;
  }
  /** @internal */
  build(table) {
    return new MySqlChar(
      table,
      this.config
    );
  }
};
var MySqlChar = class extends MySqlColumn {
  static [entityKind] = "MySqlChar";
  length = this.config.length;
  enumValues = this.config.enum;
  getSQLType() {
    return this.length === void 0 ? `char` : `char(${this.length})`;
  }
};
function char(a, b = {}) {
  const { name, config } = getColumnNameAndConfig(a, b);
  return new MySqlCharBuilder(name, config);
}

// node_modules/drizzle-orm/mysql-core/columns/custom.js
var MySqlCustomColumnBuilder = class extends MySqlColumnBuilder {
  static [entityKind] = "MySqlCustomColumnBuilder";
  constructor(name, fieldConfig, customTypeParams) {
    super(name, "custom", "MySqlCustomColumn");
    this.config.fieldConfig = fieldConfig;
    this.config.customTypeParams = customTypeParams;
  }
  /** @internal */
  build(table) {
    return new MySqlCustomColumn(
      table,
      this.config
    );
  }
};
var MySqlCustomColumn = class extends MySqlColumn {
  static [entityKind] = "MySqlCustomColumn";
  sqlName;
  mapTo;
  mapFrom;
  constructor(table, config) {
    super(table, config);
    this.sqlName = config.customTypeParams.dataType(config.fieldConfig);
    this.mapTo = config.customTypeParams.toDriver;
    this.mapFrom = config.customTypeParams.fromDriver;
  }
  getSQLType() {
    return this.sqlName;
  }
  mapFromDriverValue(value) {
    return typeof this.mapFrom === "function" ? this.mapFrom(value) : value;
  }
  mapToDriverValue(value) {
    return typeof this.mapTo === "function" ? this.mapTo(value) : value;
  }
};
function customType(customTypeParams) {
  return (a, b) => {
    const { name, config } = getColumnNameAndConfig(a, b);
    return new MySqlCustomColumnBuilder(name, config, customTypeParams);
  };
}

// node_modules/drizzle-orm/mysql-core/columns/date.js
var MySqlDateBuilder = class extends MySqlColumnBuilder {
  static [entityKind] = "MySqlDateBuilder";
  constructor(name) {
    super(name, "date", "MySqlDate");
  }
  /** @internal */
  build(table) {
    return new MySqlDate(table, this.config);
  }
};
var MySqlDate = class extends MySqlColumn {
  static [entityKind] = "MySqlDate";
  constructor(table, config) {
    super(table, config);
  }
  getSQLType() {
    return `date`;
  }
  mapFromDriverValue(value) {
    return new Date(value);
  }
};
var MySqlDateStringBuilder = class extends MySqlColumnBuilder {
  static [entityKind] = "MySqlDateStringBuilder";
  constructor(name) {
    super(name, "string", "MySqlDateString");
  }
  /** @internal */
  build(table) {
    return new MySqlDateString(
      table,
      this.config
    );
  }
};
var MySqlDateString = class extends MySqlColumn {
  static [entityKind] = "MySqlDateString";
  constructor(table, config) {
    super(table, config);
  }
  getSQLType() {
    return `date`;
  }
};
function date(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config?.mode === "string") {
    return new MySqlDateStringBuilder(name);
  }
  return new MySqlDateBuilder(name);
}

// node_modules/drizzle-orm/mysql-core/columns/datetime.js
var MySqlDateTimeBuilder = class extends MySqlColumnBuilder {
  static [entityKind] = "MySqlDateTimeBuilder";
  constructor(name, config) {
    super(name, "date", "MySqlDateTime");
    this.config.fsp = config?.fsp;
  }
  /** @internal */
  build(table) {
    return new MySqlDateTime(
      table,
      this.config
    );
  }
};
var MySqlDateTime = class extends MySqlColumn {
  static [entityKind] = "MySqlDateTime";
  fsp;
  constructor(table, config) {
    super(table, config);
    this.fsp = config.fsp;
  }
  getSQLType() {
    const precision = this.fsp === void 0 ? "" : `(${this.fsp})`;
    return `datetime${precision}`;
  }
  mapToDriverValue(value) {
    return value.toISOString().replace("T", " ").replace("Z", "");
  }
  mapFromDriverValue(value) {
    return /* @__PURE__ */ new Date(value.replace(" ", "T") + "Z");
  }
};
var MySqlDateTimeStringBuilder = class extends MySqlColumnBuilder {
  static [entityKind] = "MySqlDateTimeStringBuilder";
  constructor(name, config) {
    super(name, "string", "MySqlDateTimeString");
    this.config.fsp = config?.fsp;
  }
  /** @internal */
  build(table) {
    return new MySqlDateTimeString(
      table,
      this.config
    );
  }
};
var MySqlDateTimeString = class extends MySqlColumn {
  static [entityKind] = "MySqlDateTimeString";
  fsp;
  constructor(table, config) {
    super(table, config);
    this.fsp = config.fsp;
  }
  getSQLType() {
    const precision = this.fsp === void 0 ? "" : `(${this.fsp})`;
    return `datetime${precision}`;
  }
};
function datetime(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config?.mode === "string") {
    return new MySqlDateTimeStringBuilder(name, config);
  }
  return new MySqlDateTimeBuilder(name, config);
}

// node_modules/drizzle-orm/mysql-core/columns/decimal.js
var MySqlDecimalBuilder = class extends MySqlColumnBuilderWithAutoIncrement {
  static [entityKind] = "MySqlDecimalBuilder";
  constructor(name, config) {
    super(name, "string", "MySqlDecimal");
    this.config.precision = config?.precision;
    this.config.scale = config?.scale;
    this.config.unsigned = config?.unsigned;
  }
  /** @internal */
  build(table) {
    return new MySqlDecimal(
      table,
      this.config
    );
  }
};
var MySqlDecimal = class extends MySqlColumnWithAutoIncrement {
  static [entityKind] = "MySqlDecimal";
  precision = this.config.precision;
  scale = this.config.scale;
  unsigned = this.config.unsigned;
  mapFromDriverValue(value) {
    if (typeof value === "string") return value;
    return String(value);
  }
  getSQLType() {
    let type = "";
    if (this.precision !== void 0 && this.scale !== void 0) {
      type += `decimal(${this.precision},${this.scale})`;
    } else if (this.precision === void 0) {
      type += "decimal";
    } else {
      type += `decimal(${this.precision})`;
    }
    type = type === "decimal(10,0)" || type === "decimal(10)" ? "decimal" : type;
    return this.unsigned ? `${type} unsigned` : type;
  }
};
var MySqlDecimalNumberBuilder = class extends MySqlColumnBuilderWithAutoIncrement {
  static [entityKind] = "MySqlDecimalNumberBuilder";
  constructor(name, config) {
    super(name, "number", "MySqlDecimalNumber");
    this.config.precision = config?.precision;
    this.config.scale = config?.scale;
    this.config.unsigned = config?.unsigned;
  }
  /** @internal */
  build(table) {
    return new MySqlDecimalNumber(
      table,
      this.config
    );
  }
};
var MySqlDecimalNumber = class extends MySqlColumnWithAutoIncrement {
  static [entityKind] = "MySqlDecimalNumber";
  precision = this.config.precision;
  scale = this.config.scale;
  unsigned = this.config.unsigned;
  mapFromDriverValue(value) {
    if (typeof value === "number") return value;
    return Number(value);
  }
  mapToDriverValue = String;
  getSQLType() {
    let type = "";
    if (this.precision !== void 0 && this.scale !== void 0) {
      type += `decimal(${this.precision},${this.scale})`;
    } else if (this.precision === void 0) {
      type += "decimal";
    } else {
      type += `decimal(${this.precision})`;
    }
    type = type === "decimal(10,0)" || type === "decimal(10)" ? "decimal" : type;
    return this.unsigned ? `${type} unsigned` : type;
  }
};
var MySqlDecimalBigIntBuilder = class extends MySqlColumnBuilderWithAutoIncrement {
  static [entityKind] = "MySqlDecimalBigIntBuilder";
  constructor(name, config) {
    super(name, "bigint", "MySqlDecimalBigInt");
    this.config.precision = config?.precision;
    this.config.scale = config?.scale;
    this.config.unsigned = config?.unsigned;
  }
  /** @internal */
  build(table) {
    return new MySqlDecimalBigInt(
      table,
      this.config
    );
  }
};
var MySqlDecimalBigInt = class extends MySqlColumnWithAutoIncrement {
  static [entityKind] = "MySqlDecimalBigInt";
  precision = this.config.precision;
  scale = this.config.scale;
  unsigned = this.config.unsigned;
  mapFromDriverValue = BigInt;
  mapToDriverValue = String;
  getSQLType() {
    let type = "";
    if (this.precision !== void 0 && this.scale !== void 0) {
      type += `decimal(${this.precision},${this.scale})`;
    } else if (this.precision === void 0) {
      type += "decimal";
    } else {
      type += `decimal(${this.precision})`;
    }
    type = type === "decimal(10,0)" || type === "decimal(10)" ? "decimal" : type;
    return this.unsigned ? `${type} unsigned` : type;
  }
};
function decimal(a, b = {}) {
  const { name, config } = getColumnNameAndConfig(a, b);
  const mode = config?.mode;
  return mode === "number" ? new MySqlDecimalNumberBuilder(name, config) : mode === "bigint" ? new MySqlDecimalBigIntBuilder(name, config) : new MySqlDecimalBuilder(name, config);
}

// node_modules/drizzle-orm/mysql-core/columns/double.js
var MySqlDoubleBuilder = class extends MySqlColumnBuilderWithAutoIncrement {
  static [entityKind] = "MySqlDoubleBuilder";
  constructor(name, config) {
    super(name, "number", "MySqlDouble");
    this.config.precision = config?.precision;
    this.config.scale = config?.scale;
    this.config.unsigned = config?.unsigned;
  }
  /** @internal */
  build(table) {
    return new MySqlDouble(table, this.config);
  }
};
var MySqlDouble = class extends MySqlColumnWithAutoIncrement {
  static [entityKind] = "MySqlDouble";
  precision = this.config.precision;
  scale = this.config.scale;
  unsigned = this.config.unsigned;
  getSQLType() {
    let type = "";
    if (this.precision !== void 0 && this.scale !== void 0) {
      type += `double(${this.precision},${this.scale})`;
    } else if (this.precision === void 0) {
      type += "double";
    } else {
      type += `double(${this.precision})`;
    }
    return this.unsigned ? `${type} unsigned` : type;
  }
};
function double(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  return new MySqlDoubleBuilder(name, config);
}

// node_modules/drizzle-orm/mysql-core/columns/enum.js
var MySqlEnumColumnBuilder = class extends MySqlColumnBuilder {
  static [entityKind] = "MySqlEnumColumnBuilder";
  constructor(name, values) {
    super(name, "string", "MySqlEnumColumn");
    this.config.enumValues = values;
  }
  /** @internal */
  build(table) {
    return new MySqlEnumColumn(
      table,
      this.config
    );
  }
};
var MySqlEnumColumn = class extends MySqlColumn {
  static [entityKind] = "MySqlEnumColumn";
  enumValues = this.config.enumValues;
  getSQLType() {
    return `enum(${this.enumValues.map((value) => `'${value}'`).join(",")})`;
  }
};
var MySqlEnumObjectColumnBuilder = class extends MySqlColumnBuilder {
  static [entityKind] = "MySqlEnumObjectColumnBuilder";
  constructor(name, values) {
    super(name, "string", "MySqlEnumObjectColumn");
    this.config.enumValues = values;
  }
  /** @internal */
  build(table) {
    return new MySqlEnumObjectColumn(
      table,
      this.config
    );
  }
};
var MySqlEnumObjectColumn = class extends MySqlColumn {
  static [entityKind] = "MySqlEnumObjectColumn";
  enumValues = this.config.enumValues;
  getSQLType() {
    return `enum(${this.enumValues.map((value) => `'${value}'`).join(",")})`;
  }
};
function mysqlEnum(a, b) {
  if (typeof a === "string" && Array.isArray(b) || Array.isArray(a)) {
    const name = typeof a === "string" && a.length > 0 ? a : "";
    const values = (typeof a === "string" ? b : a) ?? [];
    if (values.length === 0) {
      throw new Error(`You have an empty array for "${name}" enum values`);
    }
    return new MySqlEnumColumnBuilder(name, values);
  }
  if (typeof a === "string" && typeof b === "object" || typeof a === "object") {
    const name = typeof a === "object" ? "" : a;
    const values = typeof a === "object" ? Object.values(a) : typeof b === "object" ? Object.values(b) : [];
    if (values.length === 0) {
      throw new Error(`You have an empty array for "${name}" enum values`);
    }
    return new MySqlEnumObjectColumnBuilder(name, values);
  }
}

// node_modules/drizzle-orm/mysql-core/columns/float.js
var MySqlFloatBuilder = class extends MySqlColumnBuilderWithAutoIncrement {
  static [entityKind] = "MySqlFloatBuilder";
  constructor(name, config) {
    super(name, "number", "MySqlFloat");
    this.config.precision = config?.precision;
    this.config.scale = config?.scale;
    this.config.unsigned = config?.unsigned;
  }
  /** @internal */
  build(table) {
    return new MySqlFloat(table, this.config);
  }
};
var MySqlFloat = class extends MySqlColumnWithAutoIncrement {
  static [entityKind] = "MySqlFloat";
  precision = this.config.precision;
  scale = this.config.scale;
  unsigned = this.config.unsigned;
  getSQLType() {
    let type = "";
    if (this.precision !== void 0 && this.scale !== void 0) {
      type += `float(${this.precision},${this.scale})`;
    } else if (this.precision === void 0) {
      type += "float";
    } else {
      type += `float(${this.precision})`;
    }
    return this.unsigned ? `${type} unsigned` : type;
  }
};
function float(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  return new MySqlFloatBuilder(name, config);
}

// node_modules/drizzle-orm/mysql-core/columns/int.js
var MySqlIntBuilder = class extends MySqlColumnBuilderWithAutoIncrement {
  static [entityKind] = "MySqlIntBuilder";
  constructor(name, config) {
    super(name, "number", "MySqlInt");
    this.config.unsigned = config ? config.unsigned : false;
  }
  /** @internal */
  build(table) {
    return new MySqlInt(table, this.config);
  }
};
var MySqlInt = class extends MySqlColumnWithAutoIncrement {
  static [entityKind] = "MySqlInt";
  getSQLType() {
    return `int${this.config.unsigned ? " unsigned" : ""}`;
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      return Number(value);
    }
    return value;
  }
};
function int(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  return new MySqlIntBuilder(name, config);
}

// node_modules/drizzle-orm/mysql-core/columns/json.js
var MySqlJsonBuilder = class extends MySqlColumnBuilder {
  static [entityKind] = "MySqlJsonBuilder";
  constructor(name) {
    super(name, "json", "MySqlJson");
  }
  /** @internal */
  build(table) {
    return new MySqlJson(table, this.config);
  }
};
var MySqlJson = class extends MySqlColumn {
  static [entityKind] = "MySqlJson";
  getSQLType() {
    return "json";
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
};
function json(name) {
  return new MySqlJsonBuilder(name ?? "");
}

// node_modules/drizzle-orm/mysql-core/columns/mediumint.js
var MySqlMediumIntBuilder = class extends MySqlColumnBuilderWithAutoIncrement {
  static [entityKind] = "MySqlMediumIntBuilder";
  constructor(name, config) {
    super(name, "number", "MySqlMediumInt");
    this.config.unsigned = config ? config.unsigned : false;
  }
  /** @internal */
  build(table) {
    return new MySqlMediumInt(
      table,
      this.config
    );
  }
};
var MySqlMediumInt = class extends MySqlColumnWithAutoIncrement {
  static [entityKind] = "MySqlMediumInt";
  getSQLType() {
    return `mediumint${this.config.unsigned ? " unsigned" : ""}`;
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      return Number(value);
    }
    return value;
  }
};
function mediumint(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  return new MySqlMediumIntBuilder(name, config);
}

// node_modules/drizzle-orm/mysql-core/columns/real.js
var MySqlRealBuilder = class extends MySqlColumnBuilderWithAutoIncrement {
  static [entityKind] = "MySqlRealBuilder";
  constructor(name, config) {
    super(name, "number", "MySqlReal");
    this.config.precision = config?.precision;
    this.config.scale = config?.scale;
  }
  /** @internal */
  build(table) {
    return new MySqlReal(table, this.config);
  }
};
var MySqlReal = class extends MySqlColumnWithAutoIncrement {
  static [entityKind] = "MySqlReal";
  precision = this.config.precision;
  scale = this.config.scale;
  getSQLType() {
    if (this.precision !== void 0 && this.scale !== void 0) {
      return `real(${this.precision}, ${this.scale})`;
    } else if (this.precision === void 0) {
      return "real";
    } else {
      return `real(${this.precision})`;
    }
  }
};
function real(a, b = {}) {
  const { name, config } = getColumnNameAndConfig(a, b);
  return new MySqlRealBuilder(name, config);
}

// node_modules/drizzle-orm/mysql-core/columns/serial.js
var MySqlSerialBuilder = class extends MySqlColumnBuilderWithAutoIncrement {
  static [entityKind] = "MySqlSerialBuilder";
  constructor(name) {
    super(name, "number", "MySqlSerial");
    this.config.hasDefault = true;
    this.config.autoIncrement = true;
  }
  /** @internal */
  build(table) {
    return new MySqlSerial(table, this.config);
  }
};
var MySqlSerial = class extends MySqlColumnWithAutoIncrement {
  static [entityKind] = "MySqlSerial";
  getSQLType() {
    return "serial";
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      return Number(value);
    }
    return value;
  }
};
function serial(name) {
  return new MySqlSerialBuilder(name ?? "");
}

// node_modules/drizzle-orm/mysql-core/columns/smallint.js
var MySqlSmallIntBuilder = class extends MySqlColumnBuilderWithAutoIncrement {
  static [entityKind] = "MySqlSmallIntBuilder";
  constructor(name, config) {
    super(name, "number", "MySqlSmallInt");
    this.config.unsigned = config ? config.unsigned : false;
  }
  /** @internal */
  build(table) {
    return new MySqlSmallInt(
      table,
      this.config
    );
  }
};
var MySqlSmallInt = class extends MySqlColumnWithAutoIncrement {
  static [entityKind] = "MySqlSmallInt";
  getSQLType() {
    return `smallint${this.config.unsigned ? " unsigned" : ""}`;
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      return Number(value);
    }
    return value;
  }
};
function smallint(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  return new MySqlSmallIntBuilder(name, config);
}

// node_modules/drizzle-orm/mysql-core/columns/text.js
var MySqlTextBuilder = class extends MySqlColumnBuilder {
  static [entityKind] = "MySqlTextBuilder";
  constructor(name, textType, config) {
    super(name, "string", "MySqlText");
    this.config.textType = textType;
    this.config.enumValues = config.enum;
  }
  /** @internal */
  build(table) {
    return new MySqlText(table, this.config);
  }
};
var MySqlText = class extends MySqlColumn {
  static [entityKind] = "MySqlText";
  textType = this.config.textType;
  enumValues = this.config.enumValues;
  getSQLType() {
    return this.textType;
  }
};
function text(a, b = {}) {
  const { name, config } = getColumnNameAndConfig(a, b);
  return new MySqlTextBuilder(name, "text", config);
}
function tinytext(a, b = {}) {
  const { name, config } = getColumnNameAndConfig(a, b);
  return new MySqlTextBuilder(name, "tinytext", config);
}
function mediumtext(a, b = {}) {
  const { name, config } = getColumnNameAndConfig(a, b);
  return new MySqlTextBuilder(name, "mediumtext", config);
}
function longtext(a, b = {}) {
  const { name, config } = getColumnNameAndConfig(a, b);
  return new MySqlTextBuilder(name, "longtext", config);
}

// node_modules/drizzle-orm/mysql-core/columns/time.js
var MySqlTimeBuilder = class extends MySqlColumnBuilder {
  static [entityKind] = "MySqlTimeBuilder";
  constructor(name, config) {
    super(name, "string", "MySqlTime");
    this.config.fsp = config?.fsp;
  }
  /** @internal */
  build(table) {
    return new MySqlTime(table, this.config);
  }
};
var MySqlTime = class extends MySqlColumn {
  static [entityKind] = "MySqlTime";
  fsp = this.config.fsp;
  getSQLType() {
    const precision = this.fsp === void 0 ? "" : `(${this.fsp})`;
    return `time${precision}`;
  }
};
function time(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  return new MySqlTimeBuilder(name, config);
}

// node_modules/drizzle-orm/mysql-core/columns/date.common.js
var MySqlDateColumnBaseBuilder = class extends MySqlColumnBuilder {
  static [entityKind] = "MySqlDateColumnBuilder";
  defaultNow() {
    return this.default(sql`(now())`);
  }
  // "on update now" also adds an implicit default value to the column - https://dev.mysql.com/doc/refman/8.0/en/timestamp-initialization.html
  onUpdateNow() {
    this.config.hasOnUpdateNow = true;
    this.config.hasDefault = true;
    return this;
  }
};
var MySqlDateBaseColumn = class extends MySqlColumn {
  static [entityKind] = "MySqlDateColumn";
  hasOnUpdateNow = this.config.hasOnUpdateNow;
};

// node_modules/drizzle-orm/mysql-core/columns/timestamp.js
var MySqlTimestampBuilder = class extends MySqlDateColumnBaseBuilder {
  static [entityKind] = "MySqlTimestampBuilder";
  constructor(name, config) {
    super(name, "date", "MySqlTimestamp");
    this.config.fsp = config?.fsp;
  }
  /** @internal */
  build(table) {
    return new MySqlTimestamp(
      table,
      this.config
    );
  }
};
var MySqlTimestamp = class extends MySqlDateBaseColumn {
  static [entityKind] = "MySqlTimestamp";
  fsp = this.config.fsp;
  getSQLType() {
    const precision = this.fsp === void 0 ? "" : `(${this.fsp})`;
    return `timestamp${precision}`;
  }
  mapFromDriverValue(value) {
    return /* @__PURE__ */ new Date(value + "+0000");
  }
  mapToDriverValue(value) {
    return value.toISOString().slice(0, -1).replace("T", " ");
  }
};
var MySqlTimestampStringBuilder = class extends MySqlDateColumnBaseBuilder {
  static [entityKind] = "MySqlTimestampStringBuilder";
  constructor(name, config) {
    super(name, "string", "MySqlTimestampString");
    this.config.fsp = config?.fsp;
  }
  /** @internal */
  build(table) {
    return new MySqlTimestampString(
      table,
      this.config
    );
  }
};
var MySqlTimestampString = class extends MySqlDateBaseColumn {
  static [entityKind] = "MySqlTimestampString";
  fsp = this.config.fsp;
  getSQLType() {
    const precision = this.fsp === void 0 ? "" : `(${this.fsp})`;
    return `timestamp${precision}`;
  }
};
function timestamp(a, b = {}) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config?.mode === "string") {
    return new MySqlTimestampStringBuilder(name, config);
  }
  return new MySqlTimestampBuilder(name, config);
}

// node_modules/drizzle-orm/mysql-core/columns/tinyint.js
var MySqlTinyIntBuilder = class extends MySqlColumnBuilderWithAutoIncrement {
  static [entityKind] = "MySqlTinyIntBuilder";
  constructor(name, config) {
    super(name, "number", "MySqlTinyInt");
    this.config.unsigned = config ? config.unsigned : false;
  }
  /** @internal */
  build(table) {
    return new MySqlTinyInt(
      table,
      this.config
    );
  }
};
var MySqlTinyInt = class extends MySqlColumnWithAutoIncrement {
  static [entityKind] = "MySqlTinyInt";
  getSQLType() {
    return `tinyint${this.config.unsigned ? " unsigned" : ""}`;
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      return Number(value);
    }
    return value;
  }
};
function tinyint(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  return new MySqlTinyIntBuilder(name, config);
}

// node_modules/drizzle-orm/mysql-core/columns/varbinary.js
var MySqlVarBinaryBuilder = class extends MySqlColumnBuilder {
  static [entityKind] = "MySqlVarBinaryBuilder";
  /** @internal */
  constructor(name, config) {
    super(name, "string", "MySqlVarBinary");
    this.config.length = config?.length;
  }
  /** @internal */
  build(table) {
    return new MySqlVarBinary(
      table,
      this.config
    );
  }
};
var MySqlVarBinary = class extends MySqlColumn {
  static [entityKind] = "MySqlVarBinary";
  length = this.config.length;
  mapFromDriverValue(value) {
    if (typeof value === "string") return value;
    if (Buffer.isBuffer(value)) return value.toString();
    const str = [];
    for (const v of value) {
      str.push(v === 49 ? "1" : "0");
    }
    return str.join("");
  }
  getSQLType() {
    return this.length === void 0 ? `varbinary` : `varbinary(${this.length})`;
  }
};
function varbinary(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  return new MySqlVarBinaryBuilder(name, config);
}

// node_modules/drizzle-orm/mysql-core/columns/varchar.js
var MySqlVarCharBuilder = class extends MySqlColumnBuilder {
  static [entityKind] = "MySqlVarCharBuilder";
  /** @internal */
  constructor(name, config) {
    super(name, "string", "MySqlVarChar");
    this.config.length = config.length;
    this.config.enum = config.enum;
  }
  /** @internal */
  build(table) {
    return new MySqlVarChar(
      table,
      this.config
    );
  }
};
var MySqlVarChar = class extends MySqlColumn {
  static [entityKind] = "MySqlVarChar";
  length = this.config.length;
  enumValues = this.config.enum;
  getSQLType() {
    return this.length === void 0 ? `varchar` : `varchar(${this.length})`;
  }
};
function varchar(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  return new MySqlVarCharBuilder(name, config);
}

// node_modules/drizzle-orm/mysql-core/columns/year.js
var MySqlYearBuilder = class extends MySqlColumnBuilder {
  static [entityKind] = "MySqlYearBuilder";
  constructor(name) {
    super(name, "number", "MySqlYear");
  }
  /** @internal */
  build(table) {
    return new MySqlYear(table, this.config);
  }
};
var MySqlYear = class extends MySqlColumn {
  static [entityKind] = "MySqlYear";
  getSQLType() {
    return `year`;
  }
};
function year(name) {
  return new MySqlYearBuilder(name ?? "");
}

// node_modules/drizzle-orm/selection-proxy.js
var SelectionProxyHandler = class _SelectionProxyHandler {
  static [entityKind] = "SelectionProxyHandler";
  config;
  constructor(config) {
    this.config = { ...config };
  }
  get(subquery, prop) {
    if (prop === "_") {
      return {
        ...subquery["_"],
        selectedFields: new Proxy(
          subquery._.selectedFields,
          this
        )
      };
    }
    if (prop === ViewBaseConfig) {
      return {
        ...subquery[ViewBaseConfig],
        selectedFields: new Proxy(
          subquery[ViewBaseConfig].selectedFields,
          this
        )
      };
    }
    if (typeof prop === "symbol") {
      return subquery[prop];
    }
    const columns = is(subquery, Subquery) ? subquery._.selectedFields : is(subquery, View) ? subquery[ViewBaseConfig].selectedFields : subquery;
    const value = columns[prop];
    if (is(value, SQL.Aliased)) {
      if (this.config.sqlAliasedBehavior === "sql" && !value.isSelectionField) {
        return value.sql;
      }
      const newValue = value.clone();
      newValue.isSelectionField = true;
      return newValue;
    }
    if (is(value, SQL)) {
      if (this.config.sqlBehavior === "sql") {
        return value;
      }
      throw new Error(
        `You tried to reference "${prop}" field from a subquery, which is a raw SQL field, but it doesn't have an alias declared. Please add an alias to the field using ".as('alias')" method.`
      );
    }
    if (is(value, Column)) {
      if (this.config.alias) {
        return new Proxy(
          value,
          new ColumnAliasProxyHandler(
            new Proxy(
              value.table,
              new TableAliasProxyHandler(this.config.alias, this.config.replaceOriginalName ?? false)
            )
          )
        );
      }
      return value;
    }
    if (typeof value !== "object" || value === null) {
      return value;
    }
    return new Proxy(value, new _SelectionProxyHandler(this.config));
  }
};

// node_modules/drizzle-orm/query-promise.js
var QueryPromise = class {
  static [entityKind] = "QueryPromise";
  [Symbol.toStringTag] = "QueryPromise";
  catch(onRejected) {
    return this.then(void 0, onRejected);
  }
  finally(onFinally) {
    return this.then(
      (value) => {
        onFinally?.();
        return value;
      },
      (reason) => {
        onFinally?.();
        throw reason;
      }
    );
  }
  then(onFulfilled, onRejected) {
    return this.execute().then(onFulfilled, onRejected);
  }
};

// node_modules/drizzle-orm/errors.js
var DrizzleError = class extends Error {
  static [entityKind] = "DrizzleError";
  constructor({ message, cause }) {
    super(message);
    this.name = "DrizzleError";
    this.cause = cause;
  }
};
var TransactionRollbackError = class extends DrizzleError {
  static [entityKind] = "TransactionRollbackError";
  constructor() {
    super({ message: "Rollback" });
  }
};

// node_modules/drizzle-orm/sql/expressions/conditions.js
function bindIfParam(value, column) {
  if (isDriverValueEncoder(column) && !isSQLWrapper(value) && !is(value, Param) && !is(value, Placeholder) && !is(value, Column) && !is(value, Table) && !is(value, View)) {
    return new Param(value, column);
  }
  return value;
}
var eq = (left, right) => {
  return sql`${left} = ${bindIfParam(right, left)}`;
};
var ne = (left, right) => {
  return sql`${left} <> ${bindIfParam(right, left)}`;
};
function and(...unfilteredConditions) {
  const conditions = unfilteredConditions.filter(
    (c) => c !== void 0
  );
  if (conditions.length === 0) {
    return void 0;
  }
  if (conditions.length === 1) {
    return new SQL(conditions);
  }
  return new SQL([
    new StringChunk("("),
    sql.join(conditions, new StringChunk(" and ")),
    new StringChunk(")")
  ]);
}
function or(...unfilteredConditions) {
  const conditions = unfilteredConditions.filter(
    (c) => c !== void 0
  );
  if (conditions.length === 0) {
    return void 0;
  }
  if (conditions.length === 1) {
    return new SQL(conditions);
  }
  return new SQL([
    new StringChunk("("),
    sql.join(conditions, new StringChunk(" or ")),
    new StringChunk(")")
  ]);
}
function not(condition) {
  return sql`not ${condition}`;
}
var gt = (left, right) => {
  return sql`${left} > ${bindIfParam(right, left)}`;
};
var gte = (left, right) => {
  return sql`${left} >= ${bindIfParam(right, left)}`;
};
var lt = (left, right) => {
  return sql`${left} < ${bindIfParam(right, left)}`;
};
var lte = (left, right) => {
  return sql`${left} <= ${bindIfParam(right, left)}`;
};
function inArray(column, values) {
  if (Array.isArray(values)) {
    if (values.length === 0) {
      return sql`false`;
    }
    return sql`${column} in ${values.map((v) => bindIfParam(v, column))}`;
  }
  return sql`${column} in ${bindIfParam(values, column)}`;
}
function notInArray(column, values) {
  if (Array.isArray(values)) {
    if (values.length === 0) {
      return sql`true`;
    }
    return sql`${column} not in ${values.map((v) => bindIfParam(v, column))}`;
  }
  return sql`${column} not in ${bindIfParam(values, column)}`;
}
function isNull(value) {
  return sql`${value} is null`;
}
function isNotNull(value) {
  return sql`${value} is not null`;
}
function exists(subquery) {
  return sql`exists ${subquery}`;
}
function notExists(subquery) {
  return sql`not exists ${subquery}`;
}
function between(column, min, max) {
  return sql`${column} between ${bindIfParam(min, column)} and ${bindIfParam(
    max,
    column
  )}`;
}
function notBetween(column, min, max) {
  return sql`${column} not between ${bindIfParam(
    min,
    column
  )} and ${bindIfParam(max, column)}`;
}
function like(column, value) {
  return sql`${column} like ${value}`;
}
function notLike(column, value) {
  return sql`${column} not like ${value}`;
}
function ilike(column, value) {
  return sql`${column} ilike ${value}`;
}
function notIlike(column, value) {
  return sql`${column} not ilike ${value}`;
}

// node_modules/drizzle-orm/sql/expressions/select.js
function asc(column) {
  return sql`${column} asc`;
}
function desc(column) {
  return sql`${column} desc`;
}

// node_modules/drizzle-orm/relations.js
var Relation = class {
  constructor(sourceTable, referencedTable, relationName) {
    this.sourceTable = sourceTable;
    this.referencedTable = referencedTable;
    this.relationName = relationName;
    this.referencedTableName = referencedTable[Table.Symbol.Name];
  }
  static [entityKind] = "Relation";
  referencedTableName;
  fieldName;
};
var Relations = class {
  constructor(table, config) {
    this.table = table;
    this.config = config;
  }
  static [entityKind] = "Relations";
};
var One = class _One extends Relation {
  constructor(sourceTable, referencedTable, config, isNullable) {
    super(sourceTable, referencedTable, config?.relationName);
    this.config = config;
    this.isNullable = isNullable;
  }
  static [entityKind] = "One";
  withFieldName(fieldName) {
    const relation = new _One(
      this.sourceTable,
      this.referencedTable,
      this.config,
      this.isNullable
    );
    relation.fieldName = fieldName;
    return relation;
  }
};
var Many = class _Many extends Relation {
  constructor(sourceTable, referencedTable, config) {
    super(sourceTable, referencedTable, config?.relationName);
    this.config = config;
  }
  static [entityKind] = "Many";
  withFieldName(fieldName) {
    const relation = new _Many(
      this.sourceTable,
      this.referencedTable,
      this.config
    );
    relation.fieldName = fieldName;
    return relation;
  }
};
function getOperators() {
  return {
    and,
    between,
    eq,
    exists,
    gt,
    gte,
    ilike,
    inArray,
    isNull,
    isNotNull,
    like,
    lt,
    lte,
    ne,
    not,
    notBetween,
    notExists,
    notLike,
    notIlike,
    notInArray,
    or,
    sql
  };
}
function getOrderByOperators() {
  return {
    sql,
    asc,
    desc
  };
}
function normalizeRelation(schema, tableNamesMap, relation) {
  if (is(relation, One) && relation.config) {
    return {
      fields: relation.config.fields,
      references: relation.config.references
    };
  }
  const referencedTableTsName = tableNamesMap[getTableUniqueName(relation.referencedTable)];
  if (!referencedTableTsName) {
    throw new Error(
      `Table "${relation.referencedTable[Table.Symbol.Name]}" not found in schema`
    );
  }
  const referencedTableConfig = schema[referencedTableTsName];
  if (!referencedTableConfig) {
    throw new Error(`Table "${referencedTableTsName}" not found in schema`);
  }
  const sourceTable = relation.sourceTable;
  const sourceTableTsName = tableNamesMap[getTableUniqueName(sourceTable)];
  if (!sourceTableTsName) {
    throw new Error(
      `Table "${sourceTable[Table.Symbol.Name]}" not found in schema`
    );
  }
  const reverseRelations = [];
  for (const referencedTableRelation of Object.values(
    referencedTableConfig.relations
  )) {
    if (relation.relationName && relation !== referencedTableRelation && referencedTableRelation.relationName === relation.relationName || !relation.relationName && referencedTableRelation.referencedTable === relation.sourceTable) {
      reverseRelations.push(referencedTableRelation);
    }
  }
  if (reverseRelations.length > 1) {
    throw relation.relationName ? new Error(
      `There are multiple relations with name "${relation.relationName}" in table "${referencedTableTsName}"`
    ) : new Error(
      `There are multiple relations between "${referencedTableTsName}" and "${relation.sourceTable[Table.Symbol.Name]}". Please specify relation name`
    );
  }
  if (reverseRelations[0] && is(reverseRelations[0], One) && reverseRelations[0].config) {
    return {
      fields: reverseRelations[0].config.references,
      references: reverseRelations[0].config.fields
    };
  }
  throw new Error(
    `There is not enough information to infer relation "${sourceTableTsName}.${relation.fieldName}"`
  );
}

// node_modules/drizzle-orm/mysql-core/indexes.js
var IndexBuilderOn = class {
  constructor(name, unique2) {
    this.name = name;
    this.unique = unique2;
  }
  static [entityKind] = "MySqlIndexBuilderOn";
  on(...columns) {
    return new IndexBuilder(this.name, columns, this.unique);
  }
};
var IndexBuilder = class {
  static [entityKind] = "MySqlIndexBuilder";
  /** @internal */
  config;
  constructor(name, columns, unique2) {
    this.config = {
      name,
      columns,
      unique: unique2
    };
  }
  using(using) {
    this.config.using = using;
    return this;
  }
  algorithm(algorithm) {
    this.config.algorithm = algorithm;
    return this;
  }
  lock(lock) {
    this.config.lock = lock;
    return this;
  }
  /** @internal */
  build(table) {
    return new Index(this.config, table);
  }
};
var Index = class {
  static [entityKind] = "MySqlIndex";
  config;
  constructor(config, table) {
    this.config = { ...config, table };
  }
};
function index(name) {
  return new IndexBuilderOn(name, false);
}

// node_modules/drizzle-orm/mysql-core/columns/all.js
function getMySqlColumnBuilders() {
  return {
    bigint,
    binary,
    boolean,
    char,
    customType,
    date,
    datetime,
    decimal,
    double,
    mysqlEnum,
    float,
    int,
    json,
    mediumint,
    real,
    serial,
    smallint,
    text,
    time,
    timestamp,
    tinyint,
    varbinary,
    varchar,
    year,
    longtext,
    mediumtext,
    tinytext
  };
}

// node_modules/drizzle-orm/mysql-core/table.js
var InlineForeignKeys = /* @__PURE__ */ Symbol.for("drizzle:MySqlInlineForeignKeys");
var MySqlTable = class extends Table {
  static [entityKind] = "MySqlTable";
  /** @internal */
  static Symbol = Object.assign({}, Table.Symbol, {
    InlineForeignKeys
  });
  /** @internal */
  [Table.Symbol.Columns];
  /** @internal */
  [InlineForeignKeys] = [];
  /** @internal */
  [Table.Symbol.ExtraConfigBuilder] = void 0;
};
function mysqlTableWithSchema(name, columns, extraConfig, schema, baseName = name) {
  const rawTable = new MySqlTable(name, schema, baseName);
  const parsedColumns = typeof columns === "function" ? columns(getMySqlColumnBuilders()) : columns;
  const builtColumns = Object.fromEntries(
    Object.entries(parsedColumns).map(([name2, colBuilderBase]) => {
      const colBuilder = colBuilderBase;
      colBuilder.setName(name2);
      const column = colBuilder.build(rawTable);
      rawTable[InlineForeignKeys].push(...colBuilder.buildForeignKeys(column, rawTable));
      return [name2, column];
    })
  );
  const table = Object.assign(rawTable, builtColumns);
  table[Table.Symbol.Columns] = builtColumns;
  table[Table.Symbol.ExtraConfigColumns] = builtColumns;
  if (extraConfig) {
    table[MySqlTable.Symbol.ExtraConfigBuilder] = extraConfig;
  }
  return table;
}
var mysqlTable = (name, columns, extraConfig) => {
  return mysqlTableWithSchema(name, columns, extraConfig, void 0, name);
};

// node_modules/drizzle-orm/mysql-core/primary-keys.js
function primaryKey(...config) {
  if (config[0].columns) {
    return new PrimaryKeyBuilder(config[0].columns, config[0].name);
  }
  return new PrimaryKeyBuilder(config);
}
var PrimaryKeyBuilder = class {
  static [entityKind] = "MySqlPrimaryKeyBuilder";
  /** @internal */
  columns;
  /** @internal */
  name;
  constructor(columns, name) {
    this.columns = columns;
    this.name = name;
  }
  /** @internal */
  build(table) {
    return new PrimaryKey(table, this.columns, this.name);
  }
};
var PrimaryKey = class {
  constructor(table, columns, name) {
    this.table = table;
    this.columns = columns;
    this.name = name;
  }
  static [entityKind] = "MySqlPrimaryKey";
  columns;
  name;
  getName() {
    return this.name ?? `${this.table[MySqlTable.Symbol.Name]}_${this.columns.map((column) => column.name).join("_")}_pk`;
  }
};

// node_modules/drizzle-orm/mysql-core/view-common.js
var MySqlViewConfig = /* @__PURE__ */ Symbol.for("drizzle:MySqlViewConfig");

// node_modules/drizzle-orm/mysql-core/utils.js
function extractUsedTable(table) {
  if (is(table, MySqlTable)) {
    return [`${table[Table.Symbol.BaseName]}`];
  }
  if (is(table, Subquery)) {
    return table._.usedTables ?? [];
  }
  if (is(table, SQL)) {
    return table.usedTables ?? [];
  }
  return [];
}
function convertIndexToString(indexes) {
  return indexes.map((idx) => {
    return typeof idx === "object" ? idx.config.name : idx;
  });
}
function toArray(value) {
  return Array.isArray(value) ? value : [value];
}

// node_modules/drizzle-orm/casing.js
function toSnakeCase(input) {
  const words = input.replace(/['\u2019]/g, "").match(/[\da-z]+|[A-Z]+(?![a-z])|[A-Z][\da-z]+/g) ?? [];
  return words.map((word) => word.toLowerCase()).join("_");
}
function toCamelCase(input) {
  const words = input.replace(/['\u2019]/g, "").match(/[\da-z]+|[A-Z]+(?![a-z])|[A-Z][\da-z]+/g) ?? [];
  return words.reduce((acc, word, i) => {
    const formattedWord = i === 0 ? word.toLowerCase() : `${word[0].toUpperCase()}${word.slice(1)}`;
    return acc + formattedWord;
  }, "");
}
function noopCase(input) {
  return input;
}
var CasingCache = class {
  static [entityKind] = "CasingCache";
  /** @internal */
  cache = {};
  cachedTables = {};
  convert;
  constructor(casing) {
    this.convert = casing === "snake_case" ? toSnakeCase : casing === "camelCase" ? toCamelCase : noopCase;
  }
  getColumnCasing(column) {
    if (!column.keyAsName) return column.name;
    const schema = column.table[Table.Symbol.Schema] ?? "public";
    const tableName = column.table[Table.Symbol.OriginalName];
    const key = `${schema}.${tableName}.${column.name}`;
    if (!this.cache[key]) {
      this.cacheTable(column.table);
    }
    return this.cache[key];
  }
  cacheTable(table) {
    const schema = table[Table.Symbol.Schema] ?? "public";
    const tableName = table[Table.Symbol.OriginalName];
    const tableKey = `${schema}.${tableName}`;
    if (!this.cachedTables[tableKey]) {
      for (const column of Object.values(table[Table.Symbol.Columns])) {
        const columnKey = `${tableKey}.${column.name}`;
        this.cache[columnKey] = this.convert(column.name);
      }
      this.cachedTables[tableKey] = true;
    }
  }
  clearCache() {
    this.cache = {};
    this.cachedTables = {};
  }
};

// node_modules/drizzle-orm/mysql-core/view-base.js
var MySqlViewBase = class extends View {
  static [entityKind] = "MySqlViewBase";
};

// node_modules/drizzle-orm/mysql-core/dialect.js
var MySqlDialect = class {
  static [entityKind] = "MySqlDialect";
  /** @internal */
  casing;
  constructor(config) {
    this.casing = new CasingCache(config?.casing);
  }
  async migrate(migrations, session, config) {
    const migrationsTable = config.migrationsTable ?? "__drizzle_migrations";
    const migrationTableCreate = sql`
			create table if not exists ${sql.identifier(migrationsTable)} (
				id serial primary key,
				hash text not null,
				created_at bigint
			)
		`;
    await session.execute(migrationTableCreate);
    const dbMigrations = await session.all(
      sql`select id, hash, created_at from ${sql.identifier(migrationsTable)} order by created_at desc limit 1`
    );
    const lastDbMigration = dbMigrations[0];
    await session.transaction(async (tx) => {
      for (const migration of migrations) {
        if (!lastDbMigration || Number(lastDbMigration.created_at) < migration.folderMillis) {
          for (const stmt of migration.sql) {
            await tx.execute(sql.raw(stmt));
          }
          await tx.execute(
            sql`insert into ${sql.identifier(migrationsTable)} (\`hash\`, \`created_at\`) values(${migration.hash}, ${migration.folderMillis})`
          );
        }
      }
    });
  }
  escapeName(name) {
    return `\`${name}\``;
  }
  escapeParam(_num) {
    return `?`;
  }
  escapeString(str) {
    return `'${str.replace(/'/g, "''")}'`;
  }
  buildWithCTE(queries) {
    if (!queries?.length) return void 0;
    const withSqlChunks = [sql`with `];
    for (const [i, w] of queries.entries()) {
      withSqlChunks.push(sql`${sql.identifier(w._.alias)} as (${w._.sql})`);
      if (i < queries.length - 1) {
        withSqlChunks.push(sql`, `);
      }
    }
    withSqlChunks.push(sql` `);
    return sql.join(withSqlChunks);
  }
  buildDeleteQuery({ table, where, returning, withList, limit, orderBy }) {
    const withSql = this.buildWithCTE(withList);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
    const whereSql = where ? sql` where ${where}` : void 0;
    const orderBySql = this.buildOrderBy(orderBy);
    const limitSql = this.buildLimit(limit);
    return sql`${withSql}delete from ${table}${whereSql}${orderBySql}${limitSql}${returningSql}`;
  }
  buildUpdateSet(table, set) {
    const tableColumns = table[Table.Symbol.Columns];
    const columnNames = Object.keys(tableColumns).filter(
      (colName) => set[colName] !== void 0 || tableColumns[colName]?.onUpdateFn !== void 0
    );
    const setSize = columnNames.length;
    return sql.join(columnNames.flatMap((colName, i) => {
      const col = tableColumns[colName];
      const onUpdateFnResult = col.onUpdateFn?.();
      const value = set[colName] ?? (is(onUpdateFnResult, SQL) ? onUpdateFnResult : sql.param(onUpdateFnResult, col));
      const res = sql`${sql.identifier(this.casing.getColumnCasing(col))} = ${value}`;
      if (i < setSize - 1) {
        return [res, sql.raw(", ")];
      }
      return [res];
    }));
  }
  buildUpdateQuery({ table, set, where, returning, withList, limit, orderBy }) {
    const withSql = this.buildWithCTE(withList);
    const setSql = this.buildUpdateSet(table, set);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
    const whereSql = where ? sql` where ${where}` : void 0;
    const orderBySql = this.buildOrderBy(orderBy);
    const limitSql = this.buildLimit(limit);
    return sql`${withSql}update ${table} set ${setSql}${whereSql}${orderBySql}${limitSql}${returningSql}`;
  }
  /**
   * Builds selection SQL with provided fields/expressions
   *
   * Examples:
   *
   * `select <selection> from`
   *
   * `insert ... returning <selection>`
   *
   * If `isSingleTable` is true, then columns won't be prefixed with table name
   */
  buildSelection(fields, { isSingleTable = false } = {}) {
    const columnsLen = fields.length;
    const chunks = fields.flatMap(({ field }, i) => {
      const chunk = [];
      if (is(field, SQL.Aliased) && field.isSelectionField) {
        chunk.push(sql.identifier(field.fieldAlias));
      } else if (is(field, SQL.Aliased) || is(field, SQL)) {
        const query = is(field, SQL.Aliased) ? field.sql : field;
        if (isSingleTable) {
          chunk.push(
            new SQL(
              query.queryChunks.map((c) => {
                if (is(c, MySqlColumn)) {
                  return sql.identifier(this.casing.getColumnCasing(c));
                }
                return c;
              })
            )
          );
        } else {
          chunk.push(query);
        }
        if (is(field, SQL.Aliased)) {
          chunk.push(sql` as ${sql.identifier(field.fieldAlias)}`);
        }
      } else if (is(field, Column)) {
        if (isSingleTable) {
          chunk.push(sql.identifier(this.casing.getColumnCasing(field)));
        } else {
          chunk.push(field);
        }
      } else if (is(field, Subquery)) {
        const entries = Object.entries(field._.selectedFields);
        if (entries.length === 1) {
          const entry = entries[0][1];
          const fieldDecoder = is(entry, SQL) ? entry.decoder : is(entry, Column) ? { mapFromDriverValue: (v) => entry.mapFromDriverValue(v) } : entry.sql.decoder;
          if (fieldDecoder) {
            field._.sql.decoder = fieldDecoder;
          }
        }
        chunk.push(field);
      }
      if (i < columnsLen - 1) {
        chunk.push(sql`, `);
      }
      return chunk;
    });
    return sql.join(chunks);
  }
  buildLimit(limit) {
    return typeof limit === "object" || typeof limit === "number" && limit >= 0 ? sql` limit ${limit}` : void 0;
  }
  buildOrderBy(orderBy) {
    return orderBy && orderBy.length > 0 ? sql` order by ${sql.join(orderBy, sql`, `)}` : void 0;
  }
  buildIndex({
    indexes,
    indexFor
  }) {
    return indexes && indexes.length > 0 ? sql` ${sql.raw(indexFor)} INDEX (${sql.raw(indexes.join(`, `))})` : void 0;
  }
  buildSelectQuery({
    withList,
    fields,
    fieldsFlat,
    where,
    having,
    table,
    joins,
    orderBy,
    groupBy,
    limit,
    offset,
    lockingClause,
    distinct,
    setOperators,
    useIndex,
    forceIndex,
    ignoreIndex
  }) {
    const fieldsList = fieldsFlat ?? orderSelectedFields(fields);
    for (const f of fieldsList) {
      if (is(f.field, Column) && getTableName(f.field.table) !== (is(table, Subquery) ? table._.alias : is(table, MySqlViewBase) ? table[ViewBaseConfig].name : is(table, SQL) ? void 0 : getTableName(table)) && !((table2) => joins?.some(
        ({ alias }) => alias === (table2[Table.Symbol.IsAlias] ? getTableName(table2) : table2[Table.Symbol.BaseName])
      ))(f.field.table)) {
        const tableName = getTableName(f.field.table);
        throw new Error(
          `Your "${f.path.join("->")}" field references a column "${tableName}"."${f.field.name}", but the table "${tableName}" is not part of the query! Did you forget to join it?`
        );
      }
    }
    const isSingleTable = !joins || joins.length === 0;
    const withSql = this.buildWithCTE(withList);
    const distinctSql = distinct ? sql` distinct` : void 0;
    const selection = this.buildSelection(fieldsList, { isSingleTable });
    const tableSql = (() => {
      if (is(table, Table) && table[Table.Symbol.IsAlias]) {
        return sql`${sql`${sql.identifier(table[Table.Symbol.Schema] ?? "")}.`.if(table[Table.Symbol.Schema])}${sql.identifier(table[Table.Symbol.OriginalName])} ${sql.identifier(table[Table.Symbol.Name])}`;
      }
      return table;
    })();
    const joinsArray = [];
    if (joins) {
      for (const [index2, joinMeta] of joins.entries()) {
        if (index2 === 0) {
          joinsArray.push(sql` `);
        }
        const table2 = joinMeta.table;
        const lateralSql = joinMeta.lateral ? sql` lateral` : void 0;
        const onSql = joinMeta.on ? sql` on ${joinMeta.on}` : void 0;
        if (is(table2, MySqlTable)) {
          const tableName = table2[MySqlTable.Symbol.Name];
          const tableSchema = table2[MySqlTable.Symbol.Schema];
          const origTableName = table2[MySqlTable.Symbol.OriginalName];
          const alias = tableName === origTableName ? void 0 : joinMeta.alias;
          const useIndexSql2 = this.buildIndex({ indexes: joinMeta.useIndex, indexFor: "USE" });
          const forceIndexSql2 = this.buildIndex({ indexes: joinMeta.forceIndex, indexFor: "FORCE" });
          const ignoreIndexSql2 = this.buildIndex({ indexes: joinMeta.ignoreIndex, indexFor: "IGNORE" });
          joinsArray.push(
            sql`${sql.raw(joinMeta.joinType)} join${lateralSql} ${tableSchema ? sql`${sql.identifier(tableSchema)}.` : void 0}${sql.identifier(origTableName)}${useIndexSql2}${forceIndexSql2}${ignoreIndexSql2}${alias && sql` ${sql.identifier(alias)}`}${onSql}`
          );
        } else if (is(table2, View)) {
          const viewName = table2[ViewBaseConfig].name;
          const viewSchema = table2[ViewBaseConfig].schema;
          const origViewName = table2[ViewBaseConfig].originalName;
          const alias = viewName === origViewName ? void 0 : joinMeta.alias;
          joinsArray.push(
            sql`${sql.raw(joinMeta.joinType)} join${lateralSql} ${viewSchema ? sql`${sql.identifier(viewSchema)}.` : void 0}${sql.identifier(origViewName)}${alias && sql` ${sql.identifier(alias)}`}${onSql}`
          );
        } else {
          joinsArray.push(
            sql`${sql.raw(joinMeta.joinType)} join${lateralSql} ${table2}${onSql}`
          );
        }
        if (index2 < joins.length - 1) {
          joinsArray.push(sql` `);
        }
      }
    }
    const joinsSql = sql.join(joinsArray);
    const whereSql = where ? sql` where ${where}` : void 0;
    const havingSql = having ? sql` having ${having}` : void 0;
    const orderBySql = this.buildOrderBy(orderBy);
    const groupBySql = groupBy && groupBy.length > 0 ? sql` group by ${sql.join(groupBy, sql`, `)}` : void 0;
    const limitSql = this.buildLimit(limit);
    const offsetSql = offset ? sql` offset ${offset}` : void 0;
    const useIndexSql = this.buildIndex({ indexes: useIndex, indexFor: "USE" });
    const forceIndexSql = this.buildIndex({ indexes: forceIndex, indexFor: "FORCE" });
    const ignoreIndexSql = this.buildIndex({ indexes: ignoreIndex, indexFor: "IGNORE" });
    let lockingClausesSql;
    if (lockingClause) {
      const { config, strength } = lockingClause;
      lockingClausesSql = sql` for ${sql.raw(strength)}`;
      if (config.noWait) {
        lockingClausesSql.append(sql` nowait`);
      } else if (config.skipLocked) {
        lockingClausesSql.append(sql` skip locked`);
      }
    }
    const finalQuery = sql`${withSql}select${distinctSql} ${selection} from ${tableSql}${useIndexSql}${forceIndexSql}${ignoreIndexSql}${joinsSql}${whereSql}${groupBySql}${havingSql}${orderBySql}${limitSql}${offsetSql}${lockingClausesSql}`;
    if (setOperators.length > 0) {
      return this.buildSetOperations(finalQuery, setOperators);
    }
    return finalQuery;
  }
  buildSetOperations(leftSelect, setOperators) {
    const [setOperator, ...rest] = setOperators;
    if (!setOperator) {
      throw new Error("Cannot pass undefined values to any set operator");
    }
    if (rest.length === 0) {
      return this.buildSetOperationQuery({ leftSelect, setOperator });
    }
    return this.buildSetOperations(
      this.buildSetOperationQuery({ leftSelect, setOperator }),
      rest
    );
  }
  buildSetOperationQuery({
    leftSelect,
    setOperator: { type, isAll, rightSelect, limit, orderBy, offset }
  }) {
    const leftChunk = sql`(${leftSelect.getSQL()}) `;
    const rightChunk = sql`(${rightSelect.getSQL()})`;
    let orderBySql;
    if (orderBy && orderBy.length > 0) {
      const orderByValues = [];
      for (const orderByUnit of orderBy) {
        if (is(orderByUnit, MySqlColumn)) {
          orderByValues.push(sql.identifier(this.casing.getColumnCasing(orderByUnit)));
        } else if (is(orderByUnit, SQL)) {
          for (let i = 0; i < orderByUnit.queryChunks.length; i++) {
            const chunk = orderByUnit.queryChunks[i];
            if (is(chunk, MySqlColumn)) {
              orderByUnit.queryChunks[i] = sql.identifier(this.casing.getColumnCasing(chunk));
            }
          }
          orderByValues.push(sql`${orderByUnit}`);
        } else {
          orderByValues.push(sql`${orderByUnit}`);
        }
      }
      orderBySql = sql` order by ${sql.join(orderByValues, sql`, `)} `;
    }
    const limitSql = typeof limit === "object" || typeof limit === "number" && limit >= 0 ? sql` limit ${limit}` : void 0;
    const operatorChunk = sql.raw(`${type} ${isAll ? "all " : ""}`);
    const offsetSql = offset ? sql` offset ${offset}` : void 0;
    return sql`${leftChunk}${operatorChunk}${rightChunk}${orderBySql}${limitSql}${offsetSql}`;
  }
  buildInsertQuery({ table, values: valuesOrSelect, ignore, onConflict, select }) {
    const valuesSqlList = [];
    const columns = table[Table.Symbol.Columns];
    const colEntries = Object.entries(columns).filter(
      ([_, col]) => !col.shouldDisableInsert()
    );
    const insertOrder = colEntries.map(([, column]) => sql.identifier(this.casing.getColumnCasing(column)));
    const generatedIdsResponse = [];
    if (select) {
      const select2 = valuesOrSelect;
      if (is(select2, SQL)) {
        valuesSqlList.push(select2);
      } else {
        valuesSqlList.push(select2.getSQL());
      }
    } else {
      const values = valuesOrSelect;
      valuesSqlList.push(sql.raw("values "));
      for (const [valueIndex, value] of values.entries()) {
        const generatedIds = {};
        const valueList = [];
        for (const [fieldName, col] of colEntries) {
          const colValue = value[fieldName];
          if (colValue === void 0 || is(colValue, Param) && colValue.value === void 0) {
            if (col.defaultFn !== void 0) {
              const defaultFnResult = col.defaultFn();
              generatedIds[fieldName] = defaultFnResult;
              const defaultValue = is(defaultFnResult, SQL) ? defaultFnResult : sql.param(defaultFnResult, col);
              valueList.push(defaultValue);
            } else if (!col.default && col.onUpdateFn !== void 0) {
              const onUpdateFnResult = col.onUpdateFn();
              const newValue = is(onUpdateFnResult, SQL) ? onUpdateFnResult : sql.param(onUpdateFnResult, col);
              valueList.push(newValue);
            } else {
              valueList.push(sql`default`);
            }
          } else {
            if (col.defaultFn && is(colValue, Param)) {
              generatedIds[fieldName] = colValue.value;
            }
            valueList.push(colValue);
          }
        }
        generatedIdsResponse.push(generatedIds);
        valuesSqlList.push(valueList);
        if (valueIndex < values.length - 1) {
          valuesSqlList.push(sql`, `);
        }
      }
    }
    const valuesSql = sql.join(valuesSqlList);
    const ignoreSql = ignore ? sql` ignore` : void 0;
    const onConflictSql = onConflict ? sql` on duplicate key ${onConflict}` : void 0;
    return {
      sql: sql`insert${ignoreSql} into ${table} ${insertOrder} ${valuesSql}${onConflictSql}`,
      generatedIds: generatedIdsResponse
    };
  }
  sqlToQuery(sql2, invokeSource) {
    return sql2.toQuery({
      casing: this.casing,
      escapeName: this.escapeName,
      escapeParam: this.escapeParam,
      escapeString: this.escapeString,
      invokeSource
    });
  }
  buildRelationalQuery({
    fullSchema,
    schema,
    tableNamesMap,
    table,
    tableConfig,
    queryConfig: config,
    tableAlias,
    nestedQueryRelation,
    joinOn
  }) {
    let selection = [];
    let limit, offset, orderBy, where;
    const joins = [];
    if (config === true) {
      const selectionEntries = Object.entries(tableConfig.columns);
      selection = selectionEntries.map(([key, value]) => ({
        dbKey: value.name,
        tsKey: key,
        field: aliasedTableColumn(value, tableAlias),
        relationTableTsKey: void 0,
        isJson: false,
        selection: []
      }));
    } else {
      const aliasedColumns = Object.fromEntries(
        Object.entries(tableConfig.columns).map(([key, value]) => [key, aliasedTableColumn(value, tableAlias)])
      );
      if (config.where) {
        const whereSql = typeof config.where === "function" ? config.where(aliasedColumns, getOperators()) : config.where;
        where = whereSql && mapColumnsInSQLToAlias(whereSql, tableAlias);
      }
      const fieldsSelection = [];
      let selectedColumns = [];
      if (config.columns) {
        let isIncludeMode = false;
        for (const [field, value] of Object.entries(config.columns)) {
          if (value === void 0) {
            continue;
          }
          if (field in tableConfig.columns) {
            if (!isIncludeMode && value === true) {
              isIncludeMode = true;
            }
            selectedColumns.push(field);
          }
        }
        if (selectedColumns.length > 0) {
          selectedColumns = isIncludeMode ? selectedColumns.filter((c) => config.columns?.[c] === true) : Object.keys(tableConfig.columns).filter((key) => !selectedColumns.includes(key));
        }
      } else {
        selectedColumns = Object.keys(tableConfig.columns);
      }
      for (const field of selectedColumns) {
        const column = tableConfig.columns[field];
        fieldsSelection.push({ tsKey: field, value: column });
      }
      let selectedRelations = [];
      if (config.with) {
        selectedRelations = Object.entries(config.with).filter((entry) => !!entry[1]).map(([tsKey, queryConfig]) => ({ tsKey, queryConfig, relation: tableConfig.relations[tsKey] }));
      }
      let extras;
      if (config.extras) {
        extras = typeof config.extras === "function" ? config.extras(aliasedColumns, { sql }) : config.extras;
        for (const [tsKey, value] of Object.entries(extras)) {
          fieldsSelection.push({
            tsKey,
            value: mapColumnsInAliasedSQLToAlias(value, tableAlias)
          });
        }
      }
      for (const { tsKey, value } of fieldsSelection) {
        selection.push({
          dbKey: is(value, SQL.Aliased) ? value.fieldAlias : tableConfig.columns[tsKey].name,
          tsKey,
          field: is(value, Column) ? aliasedTableColumn(value, tableAlias) : value,
          relationTableTsKey: void 0,
          isJson: false,
          selection: []
        });
      }
      let orderByOrig = typeof config.orderBy === "function" ? config.orderBy(aliasedColumns, getOrderByOperators()) : config.orderBy ?? [];
      if (!Array.isArray(orderByOrig)) {
        orderByOrig = [orderByOrig];
      }
      orderBy = orderByOrig.map((orderByValue) => {
        if (is(orderByValue, Column)) {
          return aliasedTableColumn(orderByValue, tableAlias);
        }
        return mapColumnsInSQLToAlias(orderByValue, tableAlias);
      });
      limit = config.limit;
      offset = config.offset;
      for (const {
        tsKey: selectedRelationTsKey,
        queryConfig: selectedRelationConfigValue,
        relation
      } of selectedRelations) {
        const normalizedRelation = normalizeRelation(schema, tableNamesMap, relation);
        const relationTableName = getTableUniqueName(relation.referencedTable);
        const relationTableTsName = tableNamesMap[relationTableName];
        const relationTableAlias = `${tableAlias}_${selectedRelationTsKey}`;
        const joinOn2 = and(
          ...normalizedRelation.fields.map(
            (field2, i) => eq(
              aliasedTableColumn(normalizedRelation.references[i], relationTableAlias),
              aliasedTableColumn(field2, tableAlias)
            )
          )
        );
        const builtRelation = this.buildRelationalQuery({
          fullSchema,
          schema,
          tableNamesMap,
          table: fullSchema[relationTableTsName],
          tableConfig: schema[relationTableTsName],
          queryConfig: is(relation, One) ? selectedRelationConfigValue === true ? { limit: 1 } : { ...selectedRelationConfigValue, limit: 1 } : selectedRelationConfigValue,
          tableAlias: relationTableAlias,
          joinOn: joinOn2,
          nestedQueryRelation: relation
        });
        const field = sql`${sql.identifier(relationTableAlias)}.${sql.identifier("data")}`.as(selectedRelationTsKey);
        joins.push({
          on: sql`true`,
          table: new Subquery(builtRelation.sql, {}, relationTableAlias),
          alias: relationTableAlias,
          joinType: "left",
          lateral: true
        });
        selection.push({
          dbKey: selectedRelationTsKey,
          tsKey: selectedRelationTsKey,
          field,
          relationTableTsKey: relationTableTsName,
          isJson: true,
          selection: builtRelation.selection
        });
      }
    }
    if (selection.length === 0) {
      throw new DrizzleError({ message: `No fields selected for table "${tableConfig.tsName}" ("${tableAlias}")` });
    }
    let result;
    where = and(joinOn, where);
    if (nestedQueryRelation) {
      let field = sql`json_array(${sql.join(
        selection.map(
          ({ field: field2, tsKey, isJson }) => isJson ? sql`${sql.identifier(`${tableAlias}_${tsKey}`)}.${sql.identifier("data")}` : is(field2, SQL.Aliased) ? field2.sql : field2
        ),
        sql`, `
      )})`;
      if (is(nestedQueryRelation, Many)) {
        field = sql`coalesce(json_arrayagg(${field}), json_array())`;
      }
      const nestedSelection = [{
        dbKey: "data",
        tsKey: "data",
        field: field.as("data"),
        isJson: true,
        relationTableTsKey: tableConfig.tsName,
        selection
      }];
      const needsSubquery = limit !== void 0 || offset !== void 0 || (orderBy?.length ?? 0) > 0;
      if (needsSubquery) {
        result = this.buildSelectQuery({
          table: aliasedTable(table, tableAlias),
          fields: {},
          fieldsFlat: [
            {
              path: [],
              field: sql.raw("*")
            },
            ...(orderBy?.length ?? 0) > 0 ? [{
              path: [],
              field: sql`row_number() over (order by ${sql.join(orderBy, sql`, `)})`
            }] : []
          ],
          where,
          limit,
          offset,
          setOperators: []
        });
        where = void 0;
        limit = void 0;
        offset = void 0;
        orderBy = void 0;
      } else {
        result = aliasedTable(table, tableAlias);
      }
      result = this.buildSelectQuery({
        table: is(result, MySqlTable) ? result : new Subquery(result, {}, tableAlias),
        fields: {},
        fieldsFlat: nestedSelection.map(({ field: field2 }) => ({
          path: [],
          field: is(field2, Column) ? aliasedTableColumn(field2, tableAlias) : field2
        })),
        joins,
        where,
        limit,
        offset,
        orderBy,
        setOperators: []
      });
    } else {
      result = this.buildSelectQuery({
        table: aliasedTable(table, tableAlias),
        fields: {},
        fieldsFlat: selection.map(({ field }) => ({
          path: [],
          field: is(field, Column) ? aliasedTableColumn(field, tableAlias) : field
        })),
        joins,
        where,
        limit,
        offset,
        orderBy,
        setOperators: []
      });
    }
    return {
      tableTsKey: tableConfig.tsName,
      sql: result,
      selection
    };
  }
  buildRelationalQueryWithoutLateralSubqueries({
    fullSchema,
    schema,
    tableNamesMap,
    table,
    tableConfig,
    queryConfig: config,
    tableAlias,
    nestedQueryRelation,
    joinOn
  }) {
    let selection = [];
    let limit, offset, orderBy = [], where;
    if (config === true) {
      const selectionEntries = Object.entries(tableConfig.columns);
      selection = selectionEntries.map(([key, value]) => ({
        dbKey: value.name,
        tsKey: key,
        field: aliasedTableColumn(value, tableAlias),
        relationTableTsKey: void 0,
        isJson: false,
        selection: []
      }));
    } else {
      const aliasedColumns = Object.fromEntries(
        Object.entries(tableConfig.columns).map(([key, value]) => [key, aliasedTableColumn(value, tableAlias)])
      );
      if (config.where) {
        const whereSql = typeof config.where === "function" ? config.where(aliasedColumns, getOperators()) : config.where;
        where = whereSql && mapColumnsInSQLToAlias(whereSql, tableAlias);
      }
      const fieldsSelection = [];
      let selectedColumns = [];
      if (config.columns) {
        let isIncludeMode = false;
        for (const [field, value] of Object.entries(config.columns)) {
          if (value === void 0) {
            continue;
          }
          if (field in tableConfig.columns) {
            if (!isIncludeMode && value === true) {
              isIncludeMode = true;
            }
            selectedColumns.push(field);
          }
        }
        if (selectedColumns.length > 0) {
          selectedColumns = isIncludeMode ? selectedColumns.filter((c) => config.columns?.[c] === true) : Object.keys(tableConfig.columns).filter((key) => !selectedColumns.includes(key));
        }
      } else {
        selectedColumns = Object.keys(tableConfig.columns);
      }
      for (const field of selectedColumns) {
        const column = tableConfig.columns[field];
        fieldsSelection.push({ tsKey: field, value: column });
      }
      let selectedRelations = [];
      if (config.with) {
        selectedRelations = Object.entries(config.with).filter((entry) => !!entry[1]).map(([tsKey, queryConfig]) => ({ tsKey, queryConfig, relation: tableConfig.relations[tsKey] }));
      }
      let extras;
      if (config.extras) {
        extras = typeof config.extras === "function" ? config.extras(aliasedColumns, { sql }) : config.extras;
        for (const [tsKey, value] of Object.entries(extras)) {
          fieldsSelection.push({
            tsKey,
            value: mapColumnsInAliasedSQLToAlias(value, tableAlias)
          });
        }
      }
      for (const { tsKey, value } of fieldsSelection) {
        selection.push({
          dbKey: is(value, SQL.Aliased) ? value.fieldAlias : tableConfig.columns[tsKey].name,
          tsKey,
          field: is(value, Column) ? aliasedTableColumn(value, tableAlias) : value,
          relationTableTsKey: void 0,
          isJson: false,
          selection: []
        });
      }
      let orderByOrig = typeof config.orderBy === "function" ? config.orderBy(aliasedColumns, getOrderByOperators()) : config.orderBy ?? [];
      if (!Array.isArray(orderByOrig)) {
        orderByOrig = [orderByOrig];
      }
      orderBy = orderByOrig.map((orderByValue) => {
        if (is(orderByValue, Column)) {
          return aliasedTableColumn(orderByValue, tableAlias);
        }
        return mapColumnsInSQLToAlias(orderByValue, tableAlias);
      });
      limit = config.limit;
      offset = config.offset;
      for (const {
        tsKey: selectedRelationTsKey,
        queryConfig: selectedRelationConfigValue,
        relation
      } of selectedRelations) {
        const normalizedRelation = normalizeRelation(schema, tableNamesMap, relation);
        const relationTableName = getTableUniqueName(relation.referencedTable);
        const relationTableTsName = tableNamesMap[relationTableName];
        const relationTableAlias = `${tableAlias}_${selectedRelationTsKey}`;
        const joinOn2 = and(
          ...normalizedRelation.fields.map(
            (field2, i) => eq(
              aliasedTableColumn(normalizedRelation.references[i], relationTableAlias),
              aliasedTableColumn(field2, tableAlias)
            )
          )
        );
        const builtRelation = this.buildRelationalQueryWithoutLateralSubqueries({
          fullSchema,
          schema,
          tableNamesMap,
          table: fullSchema[relationTableTsName],
          tableConfig: schema[relationTableTsName],
          queryConfig: is(relation, One) ? selectedRelationConfigValue === true ? { limit: 1 } : { ...selectedRelationConfigValue, limit: 1 } : selectedRelationConfigValue,
          tableAlias: relationTableAlias,
          joinOn: joinOn2,
          nestedQueryRelation: relation
        });
        let fieldSql = sql`(${builtRelation.sql})`;
        if (is(relation, Many)) {
          fieldSql = sql`coalesce(${fieldSql}, json_array())`;
        }
        const field = fieldSql.as(selectedRelationTsKey);
        selection.push({
          dbKey: selectedRelationTsKey,
          tsKey: selectedRelationTsKey,
          field,
          relationTableTsKey: relationTableTsName,
          isJson: true,
          selection: builtRelation.selection
        });
      }
    }
    if (selection.length === 0) {
      throw new DrizzleError({
        message: `No fields selected for table "${tableConfig.tsName}" ("${tableAlias}"). You need to have at least one item in "columns", "with" or "extras". If you need to select all columns, omit the "columns" key or set it to undefined.`
      });
    }
    let result;
    where = and(joinOn, where);
    if (nestedQueryRelation) {
      let field = sql`json_array(${sql.join(
        selection.map(
          ({ field: field2 }) => is(field2, MySqlColumn) ? sql.identifier(this.casing.getColumnCasing(field2)) : is(field2, SQL.Aliased) ? field2.sql : field2
        ),
        sql`, `
      )})`;
      if (is(nestedQueryRelation, Many)) {
        field = sql`json_arrayagg(${field})`;
      }
      const nestedSelection = [{
        dbKey: "data",
        tsKey: "data",
        field,
        isJson: true,
        relationTableTsKey: tableConfig.tsName,
        selection
      }];
      const needsSubquery = limit !== void 0 || offset !== void 0 || orderBy.length > 0;
      if (needsSubquery) {
        result = this.buildSelectQuery({
          table: aliasedTable(table, tableAlias),
          fields: {},
          fieldsFlat: [
            {
              path: [],
              field: sql.raw("*")
            },
            ...orderBy.length > 0 ? [{
              path: [],
              field: sql`row_number() over (order by ${sql.join(orderBy, sql`, `)})`
            }] : []
          ],
          where,
          limit,
          offset,
          setOperators: []
        });
        where = void 0;
        limit = void 0;
        offset = void 0;
        orderBy = void 0;
      } else {
        result = aliasedTable(table, tableAlias);
      }
      result = this.buildSelectQuery({
        table: is(result, MySqlTable) ? result : new Subquery(result, {}, tableAlias),
        fields: {},
        fieldsFlat: nestedSelection.map(({ field: field2 }) => ({
          path: [],
          field: is(field2, Column) ? aliasedTableColumn(field2, tableAlias) : field2
        })),
        where,
        limit,
        offset,
        orderBy,
        setOperators: []
      });
    } else {
      result = this.buildSelectQuery({
        table: aliasedTable(table, tableAlias),
        fields: {},
        fieldsFlat: selection.map(({ field }) => ({
          path: [],
          field: is(field, Column) ? aliasedTableColumn(field, tableAlias) : field
        })),
        where,
        limit,
        offset,
        orderBy,
        setOperators: []
      });
    }
    return {
      tableTsKey: tableConfig.tsName,
      sql: result,
      selection
    };
  }
};

// node_modules/drizzle-orm/query-builders/query-builder.js
var TypedQueryBuilder = class {
  static [entityKind] = "TypedQueryBuilder";
  /** @internal */
  getSelectedFields() {
    return this._.selectedFields;
  }
};

// node_modules/drizzle-orm/mysql-core/query-builders/select.js
var MySqlSelectBuilder = class {
  static [entityKind] = "MySqlSelectBuilder";
  fields;
  session;
  dialect;
  withList = [];
  distinct;
  constructor(config) {
    this.fields = config.fields;
    this.session = config.session;
    this.dialect = config.dialect;
    if (config.withList) {
      this.withList = config.withList;
    }
    this.distinct = config.distinct;
  }
  from(source, onIndex) {
    const isPartialSelect = !!this.fields;
    let fields;
    if (this.fields) {
      fields = this.fields;
    } else if (is(source, Subquery)) {
      fields = Object.fromEntries(
        Object.keys(source._.selectedFields).map((key) => [key, source[key]])
      );
    } else if (is(source, MySqlViewBase)) {
      fields = source[ViewBaseConfig].selectedFields;
    } else if (is(source, SQL)) {
      fields = {};
    } else {
      fields = getTableColumns(source);
    }
    let useIndex = [];
    let forceIndex = [];
    let ignoreIndex = [];
    if (is(source, MySqlTable) && onIndex && typeof onIndex !== "string") {
      if (onIndex.useIndex) {
        useIndex = convertIndexToString(toArray(onIndex.useIndex));
      }
      if (onIndex.forceIndex) {
        forceIndex = convertIndexToString(toArray(onIndex.forceIndex));
      }
      if (onIndex.ignoreIndex) {
        ignoreIndex = convertIndexToString(toArray(onIndex.ignoreIndex));
      }
    }
    return new MySqlSelectBase(
      {
        table: source,
        fields,
        isPartialSelect,
        session: this.session,
        dialect: this.dialect,
        withList: this.withList,
        distinct: this.distinct,
        useIndex,
        forceIndex,
        ignoreIndex
      }
    );
  }
};
var MySqlSelectQueryBuilderBase = class extends TypedQueryBuilder {
  static [entityKind] = "MySqlSelectQueryBuilder";
  _;
  config;
  joinsNotNullableMap;
  tableName;
  isPartialSelect;
  /** @internal */
  session;
  dialect;
  cacheConfig = void 0;
  usedTables = /* @__PURE__ */ new Set();
  constructor({ table, fields, isPartialSelect, session, dialect, withList, distinct, useIndex, forceIndex, ignoreIndex }) {
    super();
    this.config = {
      withList,
      table,
      fields: { ...fields },
      distinct,
      setOperators: [],
      useIndex,
      forceIndex,
      ignoreIndex
    };
    this.isPartialSelect = isPartialSelect;
    this.session = session;
    this.dialect = dialect;
    this._ = {
      selectedFields: fields,
      config: this.config
    };
    this.tableName = getTableLikeName(table);
    this.joinsNotNullableMap = typeof this.tableName === "string" ? { [this.tableName]: true } : {};
    for (const item of extractUsedTable(table)) this.usedTables.add(item);
  }
  /** @internal */
  getUsedTables() {
    return [...this.usedTables];
  }
  createJoin(joinType, lateral) {
    return (table, a, b) => {
      const isCrossJoin = joinType === "cross";
      let on = isCrossJoin ? void 0 : a;
      const onIndex = isCrossJoin ? a : b;
      const baseTableName = this.tableName;
      const tableName = getTableLikeName(table);
      for (const item of extractUsedTable(table)) this.usedTables.add(item);
      if (typeof tableName === "string" && this.config.joins?.some((join) => join.alias === tableName)) {
        throw new Error(`Alias "${tableName}" is already used in this query`);
      }
      if (!this.isPartialSelect) {
        if (Object.keys(this.joinsNotNullableMap).length === 1 && typeof baseTableName === "string") {
          this.config.fields = {
            [baseTableName]: this.config.fields
          };
        }
        if (typeof tableName === "string" && !is(table, SQL)) {
          const selection = is(table, Subquery) ? table._.selectedFields : is(table, View) ? table[ViewBaseConfig].selectedFields : table[Table.Symbol.Columns];
          this.config.fields[tableName] = selection;
        }
      }
      if (typeof on === "function") {
        on = on(
          new Proxy(
            this.config.fields,
            new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          )
        );
      }
      if (!this.config.joins) {
        this.config.joins = [];
      }
      let useIndex = [];
      let forceIndex = [];
      let ignoreIndex = [];
      if (is(table, MySqlTable) && onIndex && typeof onIndex !== "string") {
        if (onIndex.useIndex) {
          useIndex = convertIndexToString(toArray(onIndex.useIndex));
        }
        if (onIndex.forceIndex) {
          forceIndex = convertIndexToString(toArray(onIndex.forceIndex));
        }
        if (onIndex.ignoreIndex) {
          ignoreIndex = convertIndexToString(toArray(onIndex.ignoreIndex));
        }
      }
      this.config.joins.push({ on, table, joinType, alias: tableName, useIndex, forceIndex, ignoreIndex, lateral });
      if (typeof tableName === "string") {
        switch (joinType) {
          case "left": {
            this.joinsNotNullableMap[tableName] = false;
            break;
          }
          case "right": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
            );
            this.joinsNotNullableMap[tableName] = true;
            break;
          }
          case "cross":
          case "inner": {
            this.joinsNotNullableMap[tableName] = true;
            break;
          }
        }
      }
      return this;
    };
  }
  /**
   * Executes a `left join` operation by adding another table to the current query.
   *
   * Calling this method associates each row of the table with the corresponding row from the joined table, if a match is found. If no matching row exists, it sets all columns of the joined table to null.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#left-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   * @param onIndex index hint.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User; pets: Pet | null; }[] = await db.select()
   *   .from(users)
   *   .leftJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number; petId: number | null; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .leftJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId with use index hint
   * const usersIdsAndPetIds: { userId: number; petId: number | null; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .leftJoin(pets, eq(users.id, pets.ownerId), {
   *     useIndex: ['pets_owner_id_index']
   * })
   * ```
   */
  leftJoin = this.createJoin("left", false);
  /**
   * Executes a `left join lateral` operation by adding subquery to the current query.
   *
   * A `lateral` join allows the right-hand expression to refer to columns from the left-hand side.
   *
   * Calling this method associates each row of the table with the corresponding row from the joined table, if a match is found. If no matching row exists, it sets all columns of the joined table to null.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#left-join-lateral}
   *
   * @param table the subquery to join.
   * @param on the `on` clause.
   */
  leftJoinLateral = this.createJoin("left", true);
  /**
   * Executes a `right join` operation by adding another table to the current query.
   *
   * Calling this method associates each row of the joined table with the corresponding row from the main table, if a match is found. If no matching row exists, it sets all columns of the main table to null.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#right-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   * @param onIndex index hint.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User | null; pets: Pet; }[] = await db.select()
   *   .from(users)
   *   .rightJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number | null; petId: number; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .rightJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId with use index hint
   * const usersIdsAndPetIds: { userId: number; petId: number | null; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .leftJoin(pets, eq(users.id, pets.ownerId), {
   *     useIndex: ['pets_owner_id_index']
   * })
   * ```
   */
  rightJoin = this.createJoin("right", false);
  /**
   * Executes an `inner join` operation, creating a new table by combining rows from two tables that have matching values.
   *
   * Calling this method retrieves rows that have corresponding entries in both joined tables. Rows without matching entries in either table are excluded, resulting in a table that includes only matching pairs.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#inner-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   * @param onIndex index hint.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User; pets: Pet; }[] = await db.select()
   *   .from(users)
   *   .innerJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number; petId: number; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .innerJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId with use index hint
   * const usersIdsAndPetIds: { userId: number; petId: number | null; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .leftJoin(pets, eq(users.id, pets.ownerId), {
   *     useIndex: ['pets_owner_id_index']
   * })
   * ```
   */
  innerJoin = this.createJoin("inner", false);
  /**
   * Executes an `inner join lateral` operation, creating a new table by combining rows from two queries that have matching values.
   *
   * A `lateral` join allows the right-hand expression to refer to columns from the left-hand side.
   *
   * Calling this method retrieves rows that have corresponding entries in both joined tables. Rows without matching entries in either table are excluded, resulting in a table that includes only matching pairs.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#inner-join-lateral}
   *
   * @param table the subquery to join.
   * @param on the `on` clause.
   */
  innerJoinLateral = this.createJoin("inner", true);
  /**
   * Executes a `cross join` operation by combining rows from two tables into a new table.
   *
   * Calling this method retrieves all rows from both main and joined tables, merging all rows from each table.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#cross-join}
   *
   * @param table the table to join.
   * @param onIndex index hint.
   *
   * @example
   *
   * ```ts
   * // Select all users, each user with every pet
   * const usersWithPets: { user: User; pets: Pet; }[] = await db.select()
   *   .from(users)
   *   .crossJoin(pets)
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number; petId: number; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .crossJoin(pets)
   *
   * // Select userId and petId with use index hint
   * const usersIdsAndPetIds: { userId: number; petId: number; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .crossJoin(pets, {
   *     useIndex: ['pets_owner_id_index']
   * })
   * ```
   */
  crossJoin = this.createJoin("cross", false);
  /**
   * Executes a `cross join lateral` operation by combining rows from two queries into a new table.
   *
   * A `lateral` join allows the right-hand expression to refer to columns from the left-hand side.
   *
   * Calling this method retrieves all rows from both main and joined queries, merging all rows from each query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#cross-join-lateral}
   *
   * @param table the query to join.
   */
  crossJoinLateral = this.createJoin("cross", true);
  createSetOperator(type, isAll) {
    return (rightSelection) => {
      const rightSelect = typeof rightSelection === "function" ? rightSelection(getMySqlSetOperators()) : rightSelection;
      if (!haveSameKeys(this.getSelectedFields(), rightSelect.getSelectedFields())) {
        throw new Error(
          "Set operator error (union / intersect / except): selected fields are not the same or are in a different order"
        );
      }
      this.config.setOperators.push({ type, isAll, rightSelect });
      return this;
    };
  }
  /**
   * Adds `union` set operator to the query.
   *
   * Calling this method will combine the result sets of the `select` statements and remove any duplicate rows that appear across them.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#union}
   *
   * @example
   *
   * ```ts
   * // Select all unique names from customers and users tables
   * await db.select({ name: users.name })
   *   .from(users)
   *   .union(
   *     db.select({ name: customers.name }).from(customers)
   *   );
   * // or
   * import { union } from 'drizzle-orm/mysql-core'
   *
   * await union(
   *   db.select({ name: users.name }).from(users),
   *   db.select({ name: customers.name }).from(customers)
   * );
   * ```
   */
  union = this.createSetOperator("union", false);
  /**
   * Adds `union all` set operator to the query.
   *
   * Calling this method will combine the result-set of the `select` statements and keep all duplicate rows that appear across them.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#union-all}
   *
   * @example
   *
   * ```ts
   * // Select all transaction ids from both online and in-store sales
   * await db.select({ transaction: onlineSales.transactionId })
   *   .from(onlineSales)
   *   .unionAll(
   *     db.select({ transaction: inStoreSales.transactionId }).from(inStoreSales)
   *   );
   * // or
   * import { unionAll } from 'drizzle-orm/mysql-core'
   *
   * await unionAll(
   *   db.select({ transaction: onlineSales.transactionId }).from(onlineSales),
   *   db.select({ transaction: inStoreSales.transactionId }).from(inStoreSales)
   * );
   * ```
   */
  unionAll = this.createSetOperator("union", true);
  /**
   * Adds `intersect` set operator to the query.
   *
   * Calling this method will retain only the rows that are present in both result sets and eliminate duplicates.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#intersect}
   *
   * @example
   *
   * ```ts
   * // Select course names that are offered in both departments A and B
   * await db.select({ courseName: depA.courseName })
   *   .from(depA)
   *   .intersect(
   *     db.select({ courseName: depB.courseName }).from(depB)
   *   );
   * // or
   * import { intersect } from 'drizzle-orm/mysql-core'
   *
   * await intersect(
   *   db.select({ courseName: depA.courseName }).from(depA),
   *   db.select({ courseName: depB.courseName }).from(depB)
   * );
   * ```
   */
  intersect = this.createSetOperator("intersect", false);
  /**
   * Adds `intersect all` set operator to the query.
   *
   * Calling this method will retain only the rows that are present in both result sets including all duplicates.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#intersect-all}
   *
   * @example
   *
   * ```ts
   * // Select all products and quantities that are ordered by both regular and VIP customers
   * await db.select({
   *   productId: regularCustomerOrders.productId,
   *   quantityOrdered: regularCustomerOrders.quantityOrdered
   * })
   * .from(regularCustomerOrders)
   * .intersectAll(
   *   db.select({
   *     productId: vipCustomerOrders.productId,
   *     quantityOrdered: vipCustomerOrders.quantityOrdered
   *   })
   *   .from(vipCustomerOrders)
   * );
   * // or
   * import { intersectAll } from 'drizzle-orm/mysql-core'
   *
   * await intersectAll(
   *   db.select({
   *     productId: regularCustomerOrders.productId,
   *     quantityOrdered: regularCustomerOrders.quantityOrdered
   *   })
   *   .from(regularCustomerOrders),
   *   db.select({
   *     productId: vipCustomerOrders.productId,
   *     quantityOrdered: vipCustomerOrders.quantityOrdered
   *   })
   *   .from(vipCustomerOrders)
   * );
   * ```
   */
  intersectAll = this.createSetOperator("intersect", true);
  /**
   * Adds `except` set operator to the query.
   *
   * Calling this method will retrieve all unique rows from the left query, except for the rows that are present in the result set of the right query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#except}
   *
   * @example
   *
   * ```ts
   * // Select all courses offered in department A but not in department B
   * await db.select({ courseName: depA.courseName })
   *   .from(depA)
   *   .except(
   *     db.select({ courseName: depB.courseName }).from(depB)
   *   );
   * // or
   * import { except } from 'drizzle-orm/mysql-core'
   *
   * await except(
   *   db.select({ courseName: depA.courseName }).from(depA),
   *   db.select({ courseName: depB.courseName }).from(depB)
   * );
   * ```
   */
  except = this.createSetOperator("except", false);
  /**
   * Adds `except all` set operator to the query.
   *
   * Calling this method will retrieve all rows from the left query, except for the rows that are present in the result set of the right query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#except-all}
   *
   * @example
   *
   * ```ts
   * // Select all products that are ordered by regular customers but not by VIP customers
   * await db.select({
   *   productId: regularCustomerOrders.productId,
   *   quantityOrdered: regularCustomerOrders.quantityOrdered,
   * })
   * .from(regularCustomerOrders)
   * .exceptAll(
   *   db.select({
   *     productId: vipCustomerOrders.productId,
   *     quantityOrdered: vipCustomerOrders.quantityOrdered,
   *   })
   *   .from(vipCustomerOrders)
   * );
   * // or
   * import { exceptAll } from 'drizzle-orm/mysql-core'
   *
   * await exceptAll(
   *   db.select({
   *     productId: regularCustomerOrders.productId,
   *     quantityOrdered: regularCustomerOrders.quantityOrdered
   *   })
   *   .from(regularCustomerOrders),
   *   db.select({
   *     productId: vipCustomerOrders.productId,
   *     quantityOrdered: vipCustomerOrders.quantityOrdered
   *   })
   *   .from(vipCustomerOrders)
   * );
   * ```
   */
  exceptAll = this.createSetOperator("except", true);
  /** @internal */
  addSetOperators(setOperators) {
    this.config.setOperators.push(...setOperators);
    return this;
  }
  /**
   * Adds a `where` clause to the query.
   *
   * Calling this method will select only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#filtering}
   *
   * @param where the `where` clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be selected.
   *
   * ```ts
   * // Select all cars with green color
   * await db.select().from(cars).where(eq(cars.color, 'green'));
   * // or
   * await db.select().from(cars).where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Select all BMW cars with a green color
   * await db.select().from(cars).where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Select all cars with the green or blue color
   * await db.select().from(cars).where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    if (typeof where === "function") {
      where = where(
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
        )
      );
    }
    this.config.where = where;
    return this;
  }
  /**
   * Adds a `having` clause to the query.
   *
   * Calling this method will select only those rows that fulfill a specified condition. It is typically used with aggregate functions to filter the aggregated data based on a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#aggregations}
   *
   * @param having the `having` clause.
   *
   * @example
   *
   * ```ts
   * // Select all brands with more than one car
   * await db.select({
   * 	brand: cars.brand,
   * 	count: sql<number>`cast(count(${cars.id}) as int)`,
   * })
   *   .from(cars)
   *   .groupBy(cars.brand)
   *   .having(({ count }) => gt(count, 1));
   * ```
   */
  having(having) {
    if (typeof having === "function") {
      having = having(
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
        )
      );
    }
    this.config.having = having;
    return this;
  }
  groupBy(...columns) {
    if (typeof columns[0] === "function") {
      const groupBy = columns[0](
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      this.config.groupBy = Array.isArray(groupBy) ? groupBy : [groupBy];
    } else {
      this.config.groupBy = columns;
    }
    return this;
  }
  orderBy(...columns) {
    if (typeof columns[0] === "function") {
      const orderBy = columns[0](
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
      if (this.config.setOperators.length > 0) {
        this.config.setOperators.at(-1).orderBy = orderByArray;
      } else {
        this.config.orderBy = orderByArray;
      }
    } else {
      const orderByArray = columns;
      if (this.config.setOperators.length > 0) {
        this.config.setOperators.at(-1).orderBy = orderByArray;
      } else {
        this.config.orderBy = orderByArray;
      }
    }
    return this;
  }
  /**
   * Adds a `limit` clause to the query.
   *
   * Calling this method will set the maximum number of rows that will be returned by this query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#limit--offset}
   *
   * @param limit the `limit` clause.
   *
   * @example
   *
   * ```ts
   * // Get the first 10 people from this query.
   * await db.select().from(people).limit(10);
   * ```
   */
  limit(limit) {
    if (this.config.setOperators.length > 0) {
      this.config.setOperators.at(-1).limit = limit;
    } else {
      this.config.limit = limit;
    }
    return this;
  }
  /**
   * Adds an `offset` clause to the query.
   *
   * Calling this method will skip a number of rows when returning results from this query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#limit--offset}
   *
   * @param offset the `offset` clause.
   *
   * @example
   *
   * ```ts
   * // Get the 10th-20th people from this query.
   * await db.select().from(people).offset(10).limit(10);
   * ```
   */
  offset(offset) {
    if (this.config.setOperators.length > 0) {
      this.config.setOperators.at(-1).offset = offset;
    } else {
      this.config.offset = offset;
    }
    return this;
  }
  /**
   * Adds a `for` clause to the query.
   *
   * Calling this method will specify a lock strength for this query that controls how strictly it acquires exclusive access to the rows being queried.
   *
   * See docs: {@link https://dev.mysql.com/doc/refman/8.0/en/innodb-locking-reads.html}
   *
   * @param strength the lock strength.
   * @param config the lock configuration.
   */
  for(strength, config = {}) {
    this.config.lockingClause = { strength, config };
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildSelectQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  as(alias) {
    const usedTables = [];
    usedTables.push(...extractUsedTable(this.config.table));
    if (this.config.joins) {
      for (const it of this.config.joins) usedTables.push(...extractUsedTable(it.table));
    }
    return new Proxy(
      new Subquery(this.getSQL(), this.config.fields, alias, false, [...new Set(usedTables)]),
      new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
    );
  }
  /** @internal */
  getSelectedFields() {
    return new Proxy(
      this.config.fields,
      new SelectionProxyHandler({ alias: this.tableName, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
    );
  }
  $dynamic() {
    return this;
  }
  $withCache(config) {
    this.cacheConfig = config === void 0 ? { config: {}, enable: true, autoInvalidate: true } : config === false ? { enable: false } : { enable: true, autoInvalidate: true, ...config };
    return this;
  }
};
var MySqlSelectBase = class extends MySqlSelectQueryBuilderBase {
  static [entityKind] = "MySqlSelect";
  prepare() {
    if (!this.session) {
      throw new Error("Cannot execute a query on a query builder. Please use a database instance instead.");
    }
    const fieldsList = orderSelectedFields(this.config.fields);
    const query = this.session.prepareQuery(this.dialect.sqlToQuery(this.getSQL()), fieldsList, void 0, void 0, void 0, {
      type: "select",
      tables: [...this.usedTables]
    }, this.cacheConfig);
    query.joinsNotNullableMap = this.joinsNotNullableMap;
    return query;
  }
  execute = (placeholderValues) => {
    return this.prepare().execute(placeholderValues);
  };
  createIterator = () => {
    const self = this;
    return async function* (placeholderValues) {
      yield* self.prepare().iterator(placeholderValues);
    };
  };
  iterator = this.createIterator();
};
applyMixins(MySqlSelectBase, [QueryPromise]);
function createSetOperator(type, isAll) {
  return (leftSelect, rightSelect, ...restSelects) => {
    const setOperators = [rightSelect, ...restSelects].map((select) => ({
      type,
      isAll,
      rightSelect: select
    }));
    for (const setOperator of setOperators) {
      if (!haveSameKeys(leftSelect.getSelectedFields(), setOperator.rightSelect.getSelectedFields())) {
        throw new Error(
          "Set operator error (union / intersect / except): selected fields are not the same or are in a different order"
        );
      }
    }
    return leftSelect.addSetOperators(setOperators);
  };
}
var getMySqlSetOperators = () => ({
  union,
  unionAll,
  intersect,
  intersectAll,
  except,
  exceptAll
});
var union = createSetOperator("union", false);
var unionAll = createSetOperator("union", true);
var intersect = createSetOperator("intersect", false);
var intersectAll = createSetOperator("intersect", true);
var except = createSetOperator("except", false);
var exceptAll = createSetOperator("except", true);

// node_modules/drizzle-orm/mysql-core/query-builders/query-builder.js
var QueryBuilder = class {
  static [entityKind] = "MySqlQueryBuilder";
  dialect;
  dialectConfig;
  constructor(dialect) {
    this.dialect = is(dialect, MySqlDialect) ? dialect : void 0;
    this.dialectConfig = is(dialect, MySqlDialect) ? void 0 : dialect;
  }
  $with = (alias, selection) => {
    const queryBuilder = this;
    const as = (qb) => {
      if (typeof qb === "function") {
        qb = qb(queryBuilder);
      }
      return new Proxy(
        new WithSubquery(
          qb.getSQL(),
          selection ?? ("getSelectedFields" in qb ? qb.getSelectedFields() ?? {} : {}),
          alias,
          true
        ),
        new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
      );
    };
    return { as };
  };
  with(...queries) {
    const self = this;
    function select(fields) {
      return new MySqlSelectBuilder({
        fields: fields ?? void 0,
        session: void 0,
        dialect: self.getDialect(),
        withList: queries
      });
    }
    function selectDistinct(fields) {
      return new MySqlSelectBuilder({
        fields: fields ?? void 0,
        session: void 0,
        dialect: self.getDialect(),
        withList: queries,
        distinct: true
      });
    }
    return { select, selectDistinct };
  }
  select(fields) {
    return new MySqlSelectBuilder({ fields: fields ?? void 0, session: void 0, dialect: this.getDialect() });
  }
  selectDistinct(fields) {
    return new MySqlSelectBuilder({
      fields: fields ?? void 0,
      session: void 0,
      dialect: this.getDialect(),
      distinct: true
    });
  }
  // Lazy load dialect to avoid circular dependency
  getDialect() {
    if (!this.dialect) {
      this.dialect = new MySqlDialect(this.dialectConfig);
    }
    return this.dialect;
  }
};

// node_modules/drizzle-orm/mysql-core/view.js
var ViewBuilderCore = class {
  constructor(name, schema) {
    this.name = name;
    this.schema = schema;
  }
  static [entityKind] = "MySqlViewBuilder";
  config = {};
  algorithm(algorithm) {
    this.config.algorithm = algorithm;
    return this;
  }
  sqlSecurity(sqlSecurity) {
    this.config.sqlSecurity = sqlSecurity;
    return this;
  }
  withCheckOption(withCheckOption) {
    this.config.withCheckOption = withCheckOption ?? "cascaded";
    return this;
  }
};
var ViewBuilder = class extends ViewBuilderCore {
  static [entityKind] = "MySqlViewBuilder";
  as(qb) {
    if (typeof qb === "function") {
      qb = qb(new QueryBuilder());
    }
    const selectionProxy = new SelectionProxyHandler({
      alias: this.name,
      sqlBehavior: "error",
      sqlAliasedBehavior: "alias",
      replaceOriginalName: true
    });
    const aliasedSelection = new Proxy(qb.getSelectedFields(), selectionProxy);
    return new Proxy(
      new MySqlView({
        mysqlConfig: this.config,
        config: {
          name: this.name,
          schema: this.schema,
          selectedFields: aliasedSelection,
          query: qb.getSQL().inlineParams()
        }
      }),
      selectionProxy
    );
  }
};
var ManualViewBuilder = class extends ViewBuilderCore {
  static [entityKind] = "MySqlManualViewBuilder";
  columns;
  constructor(name, columns, schema) {
    super(name, schema);
    this.columns = getTableColumns(mysqlTable(name, columns));
  }
  existing() {
    return new Proxy(
      new MySqlView({
        mysqlConfig: void 0,
        config: {
          name: this.name,
          schema: this.schema,
          selectedFields: this.columns,
          query: void 0
        }
      }),
      new SelectionProxyHandler({
        alias: this.name,
        sqlBehavior: "error",
        sqlAliasedBehavior: "alias",
        replaceOriginalName: true
      })
    );
  }
  as(query) {
    return new Proxy(
      new MySqlView({
        mysqlConfig: this.config,
        config: {
          name: this.name,
          schema: this.schema,
          selectedFields: this.columns,
          query: query.inlineParams()
        }
      }),
      new SelectionProxyHandler({
        alias: this.name,
        sqlBehavior: "error",
        sqlAliasedBehavior: "alias",
        replaceOriginalName: true
      })
    );
  }
};
var MySqlView = class extends MySqlViewBase {
  static [entityKind] = "MySqlView";
  [MySqlViewConfig];
  constructor({ mysqlConfig, config }) {
    super(config);
    this[MySqlViewConfig] = mysqlConfig;
  }
};
function mysqlViewWithSchema(name, selection, schema) {
  if (selection) {
    return new ManualViewBuilder(name, selection, schema);
  }
  return new ViewBuilder(name, schema);
}
function mysqlView(name, selection) {
  return mysqlViewWithSchema(name, selection, void 0);
}

// db/tables/hr.ts
var departments = mysqlTable(
  "departments",
  {
    id: int().autoincrement().notNull(),
    name: varchar({ length: 100 }).notNull(),
    description: text(),
    headOfDepartment: varchar("head_of_department", { length: 100 }),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().onUpdateNow(),
    budget: decimal({ precision: 15, scale: 2 }).default("0.00"),
    parentDepartmentId: int("parent_department_id"),
    location: varchar({ length: 255 })
  },
  (table) => [
    foreignKey({
      columns: [table.parentDepartmentId],
      foreignColumns: [table.id],
      name: "fk_parent_dept"
    }).onDelete("set null"),
    primaryKey({ columns: [table.id], name: "departments_id" }),
    unique("name").on(table.name)
  ]
);
var budgetAllocation = mysqlTable(
  "budget_allocation",
  {
    id: int().autoincrement().notNull(),
    year: int().notNull(),
    department: varchar({ length: 255 }).notNull(),
    totalBudget: decimal("total_budget", { precision: 15, scale: 2 }).notNull(),
    utilizedBudget: decimal("utilized_budget", { precision: 15, scale: 2 }).default("0.00"),
    remainingBudget: decimal("remaining_budget", { precision: 15, scale: 2 }).generatedAlwaysAs(sql`(\`total_budget\` - \`utilized_budget\`)`, { mode: "stored" }),
    utilizationRate: decimal("utilization_rate", { precision: 5, scale: 2 }).generatedAlwaysAs(sql`((\`utilized_budget\` / \`total_budget\`) * 100)`, { mode: "stored" }),
    notes: text(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().onUpdateNow()
  },
  (table) => [
    index("idx_year").on(table.year),
    index("idx_department").on(table.department),
    primaryKey({ columns: [table.id], name: "budget_allocation_id" }),
    unique("unique_year_dept").on(table.year, table.department)
  ]
);
var nepotismRelationships = mysqlTable(
  "nepotism_relationships",
  {
    id: int().autoincrement().notNull(),
    employeeId1: int("employee_id_1").notNull(),
    employeeId2: int("employee_id_2").notNull(),
    relationshipType: mysqlEnum("relationship_type", ["Parent", "Child", "Sibling", "Spouse", "Uncle/Aunt", "Nephew/Niece", "Cousin", "Grandparent", "Grandchild", "In-Law"]).notNull(),
    degree: int().notNull(),
    verifiedBy: int("verified_by"),
    verifiedAt: timestamp("verified_at", { mode: "string" }),
    notes: text(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow()
  },
  (table) => [
    index("idx_employee_1").on(table.employeeId1),
    index("idx_employee_2").on(table.employeeId2),
    index("idx_degree").on(table.degree),
    index("verified_by").on(table.verifiedBy),
    primaryKey({ columns: [table.id], name: "nepotism_relationships_id" })
  ]
);

// db/tables/plantilla.ts
var qualificationStandards = mysqlTable(
  "qualification_standards",
  {
    id: int().autoincrement().notNull(),
    positionTitle: varchar("position_title", { length: 255 }).notNull(),
    salaryGrade: int("salary_grade").notNull(),
    educationRequirement: text("education_requirement").notNull(),
    experienceYears: int("experience_years").default(0),
    trainingHours: int("training_hours").default(0),
    eligibilityRequired: varchar("eligibility_required", { length: 255 }).notNull(),
    competencyRequirements: text("competency_requirements"),
    isActive: tinyint("is_active").default(1),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().onUpdateNow()
  },
  (table) => [
    index("idx_position_title").on(table.positionTitle),
    index("idx_salary_grade").on(table.salaryGrade),
    primaryKey({ columns: [table.id], name: "qualification_standards_id" }),
    unique("unique_position_sg").on(table.positionTitle, table.salaryGrade)
  ]
);
var plantillaPositions = mysqlTable(
  "plantilla_positions",
  {
    id: int().autoincrement().notNull(),
    itemNumber: varchar("item_number", { length: 50 }).notNull(),
    positionTitle: varchar("position_title", { length: 100 }).notNull(),
    salaryGrade: int("salary_grade").notNull(),
    stepIncrement: int("step_increment").default(1),
    department: varchar({ length: 100 }),
    departmentId: int("department_id").references(() => departments.id, { onDelete: "set null" }),
    isVacant: tinyint("is_vacant").default(1),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    incumbentId: int("incumbent_id"),
    monthlySalary: decimal("monthly_salary", { precision: 12, scale: 2 }),
    filledDate: date("filled_date", { mode: "string" }),
    vacatedDate: date("vacated_date", { mode: "string" }),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().onUpdateNow(),
    ordinanceNumber: varchar("ordinance_number", { length: 100 }),
    ordinanceDate: date("ordinance_date", { mode: "string" }),
    abolishmentOrdinance: varchar("abolishment_ordinance", { length: 100 }),
    abolishmentDate: date("abolishment_date", { mode: "string" }),
    qualificationStandardsId: int("qualification_standards_id"),
    budgetSource: varchar("budget_source", { length: 100 }).default("Regular"),
    isCoterminous: tinyint("is_coterminous").default(0),
    status: mysqlEnum(["Active", "Abolished", "Frozen"]).default("Active"),
    areaCode: varchar("area_code", { length: 50 }),
    areaType: mysqlEnum("area_type", ["R", "P", "D", "M", "F", "B"]),
    areaLevel: mysqlEnum("area_level", ["K", "T", "S", "A"]),
    lastPromotionDate: date("last_promotion_date", { mode: "string" })
  },
  (table) => [
    foreignKey({
      columns: [table.qualificationStandardsId],
      foreignColumns: [qualificationStandards.id],
      name: "fk_pp_qs"
    }).onDelete("set null"),
    primaryKey({ columns: [table.id], name: "plantilla_positions_id" }),
    unique("item_number").on(table.itemNumber)
  ]
);
var plantillaAuditLog = mysqlTable(
  "plantilla_audit_log",
  {
    id: int().autoincrement().notNull(),
    positionId: int("position_id").notNull(),
    action: varchar({ length: 50 }).notNull(),
    actorId: int("actor_id").notNull(),
    oldValues: json("old_values"),
    newValues: json("new_values"),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow()
  },
  (table) => [
    index("idx_position_id").on(table.positionId),
    index("idx_actor_id").on(table.actorId),
    index("idx_action").on(table.action),
    primaryKey({ columns: [table.id], name: "plantilla_audit_log_id" })
  ]
);
var plantillaPositionHistory = mysqlTable(
  "plantilla_position_history",
  {
    id: int().autoincrement().notNull(),
    positionId: int("position_id").notNull(),
    employeeId: int("employee_id").notNull(),
    employeeName: varchar("employee_name", { length: 255 }),
    positionTitle: varchar("position_title", { length: 100 }),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }),
    reason: varchar({ length: 100 }),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow()
  },
  (table) => [
    index("idx_position_id").on(table.positionId),
    index("idx_employee_id").on(table.employeeId),
    primaryKey({ columns: [table.id], name: "plantilla_position_history_id" })
  ]
);
var positionPublications = mysqlTable(
  "position_publications",
  {
    id: int().autoincrement().notNull(),
    positionId: int("position_id").notNull(),
    publicationDate: date("publication_date", { mode: "string" }).notNull(),
    closingDate: date("closing_date", { mode: "string" }).notNull(),
    publicationMedium: varchar("publication_medium", { length: 255 }).default("CSC Bulletin, LGU Website"),
    form9Path: varchar("form_9_path", { length: 500 }),
    status: mysqlEnum(["Draft", "Published", "Closed", "Filled"]).default("Draft"),
    applicantsCount: int("applicants_count").default(0),
    notes: text(),
    createdBy: int("created_by"),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().onUpdateNow()
  },
  (table) => [
    index("idx_position").on(table.positionId),
    index("idx_status").on(table.status),
    index("idx_publication_date").on(table.publicationDate),
    index("created_by").on(table.createdBy),
    primaryKey({ columns: [table.id], name: "position_publications_id" })
  ]
);

// db/tables/auth.ts
var authentication = mysqlTable(
  "authentication",
  {
    id: int().autoincrement().notNull(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    suffix: varchar("suffix", { length: 20 }),
    email: varchar({ length: 255 }).notNull(),
    role: varchar({ length: 50 }).notNull(),
    department: varchar({ length: 100 }),
    // Made nullable to match controller usage
    departmentId: int("department_id").references(() => departments.id, { onDelete: "set null" }),
    employeeId: varchar("employee_id", { length: 50 }).notNull(),
    rfidCardUid: varchar("rfid_card_uid", { length: 50 }),
    passwordHash: varchar("password_hash", { length: 255 }),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    isVerified: tinyint("is_verified").default(0),
    verificationToken: varchar("verification_token", { length: 255 }),
    resetPasswordToken: varchar("reset_password_token", { length: 255 }),
    resetPasswordExpires: datetime("reset_password_expires", { mode: "string" }),
    googleId: varchar("google_id", { length: 255 }),
    avatarUrl: varchar("avatar_url", { length: 500 }),
    jobTitle: varchar("job_title", { length: 100 }),
    employmentStatus: mysqlEnum("employment_status", ["Active", "Probationary", "Terminated", "Resigned", "On Leave", "Suspended", "Verbal Warning", "Written Warning", "Show Cause"]).default("Active"),
    employmentType: varchar("employment_type", { length: 50 }).default("Probationary"),
    dateHired: date("date_hired", { mode: "string" }),
    contractEndDate: date("contract_end_date", { mode: "string" }),
    regularizationDate: date("regularization_date", { mode: "string" }),
    isRegular: tinyint("is_regular").default(0),
    managerId: int("manager_id"),
    birthDate: date("birth_date", { mode: "string" }),
    gender: mysqlEnum(["Male", "Female"]),
    civilStatus: mysqlEnum("civil_status", ["Single", "Married", "Widowed", "Separated", "Annulled"]),
    nationality: varchar({ length: 50 }).default("Filipino"),
    bloodType: varchar("blood_type", { length: 5 }),
    heightCm: decimal("height_cm", { precision: 5, scale: 2 }),
    weightKg: decimal("weight_kg", { precision: 5, scale: 2 }),
    phoneNumber: varchar("phone_number", { length: 20 }),
    address: text(),
    permanentAddress: text("permanent_address"),
    emergencyContact: varchar("emergency_contact", { length: 100 }),
    emergencyContactNumber: varchar("emergency_contact_number", { length: 20 }),
    umidNo: varchar("umid_no", { length: 50 }),
    philhealthNumber: varchar("philhealth_number", { length: 20 }),
    pagibigNumber: varchar("pagibig_number", { length: 20 }),
    tinNumber: varchar("tin_number", { length: 20 }),
    gsisNumber: varchar("gsis_number", { length: 20 }),
    salaryGrade: varchar("salary_grade", { length: 10 }),
    stepIncrement: int("step_increment").default(1),
    appointmentType: mysqlEnum("appointment_type", ["Permanent", "Contractual", "Casual", "Job Order", "Coterminous", "Temporary", "Contract of Service", "JO", "COS"]),
    officeAddress: text("office_address"),
    station: varchar({ length: 100 }),
    positionTitle: varchar("position_title", { length: 100 }),
    itemNumber: varchar("item_number", { length: 50 }),
    positionId: int("position_id").references(() => plantillaPositions.id, { onDelete: "set null" }),
    firstDayOfService: date("first_day_of_service", { mode: "string" }),
    supervisor: varchar({ length: 100 }),
    refreshToken: text("refresh_token"),
    twoFactorEnabled: tinyint("two_factor_enabled").default(0),
    twoFactorOtp: varchar("two_factor_otp", { length: 6 }),
    twoFactorOtpExpires: datetime("two_factor_otp_expires", { mode: "string" }),
    eligibilityType: varchar("eligibility_type", { length: 255 }),
    eligibilityNumber: varchar("eligibility_number", { length: 100 }),
    eligibilityDate: date("eligibility_date", { mode: "string" }),
    highestEducation: varchar("highest_education", { length: 255 }),
    educationalBackground: text("educational_background"),
    yearsOfExperience: int("years_of_experience").default(0),
    placeOfBirth: varchar("place_of_birth", { length: 255 }),
    dateOfBirth: date("date_of_birth", { mode: "string" }),
    heightM: decimal("height_m", { precision: 4, scale: 2 }),
    gsisIdNo: varchar("gsis_id_no", { length: 50 }),
    pagibigIdNo: varchar("pagibig_id_no", { length: 50 }),
    philhealthNo: varchar("philhealth_no", { length: 50 }),
    philsysId: varchar("philsys_id", { length: 50 }),
    tinNo: varchar("tin_no", { length: 50 }),
    agencyEmployeeNo: varchar("agency_employee_no", { length: 50 }),
    citizenship: varchar({ length: 50 }).default("Filipino"),
    citizenshipType: mysqlEnum("citizenship_type", ["By Birth", "By Naturalization"]).default("By Birth"),
    dualCitizenshipCountry: varchar("dual_citizenship_country", { length: 100 }),
    residentialAddress: text("residential_address"),
    residentialZipCode: varchar("residential_zip_code", { length: 50 }),
    permanentZipCode: varchar("permanent_zip_code", { length: 50 }),
    telephoneNo: varchar("telephone_no", { length: 50 }),
    mobileNo: varchar("mobile_no", { length: 50 }),
    originalAppointmentDate: date("original_appointment_date", { mode: "string" }),
    lastPromotionDate: date("last_promotion_date", { mode: "string" }),
    middleName: varchar("middle_name", { length: 100 }),
    facebookUrl: varchar("facebook_url", { length: 255 }),
    linkedinUrl: varchar("linkedin_url", { length: 255 }),
    twitterHandle: varchar("twitter_handle", { length: 100 }),
    dutyType: mysqlEnum("duty_type", ["Standard", "Irregular"]).default("Standard"),
    dailyTargetHours: decimal("daily_target_hours", { precision: 4, scale: 2 }).default("8.00"),
    salaryBasis: mysqlEnum("salary_basis", ["Daily", "Hourly"]).default("Daily"),
    loginAttempts: int("login_attempts").default(0),
    lockUntil: datetime("lock_until", { mode: "string" })
  },
  (table) => [
    foreignKey({
      columns: [table.managerId],
      foreignColumns: [table.id],
      name: "fk_manager"
    }).onDelete("set null"),
    primaryKey({ columns: [table.id], name: "authentication_id" }),
    unique("email").on(table.email),
    unique("employee_id").on(table.employeeId),
    unique("google_id").on(table.googleId),
    unique("rfid_card_uid").on(table.rfidCardUid)
  ]
);
var googleCalendarTokens = mysqlTable(
  "google_calendar_tokens",
  {
    userId: int("user_id").notNull().references(() => authentication.id, { onDelete: "cascade" }),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token").notNull(),
    tokenExpiry: datetime("token_expiry", { mode: "string" }).notNull(),
    syncEnabled: tinyint("sync_enabled").default(1),
    calendarId: varchar("calendar_id", { length: 255 }).default("primary"),
    lastSync: datetime("last_sync", { mode: "string" }).default(sql`(CURRENT_TIMESTAMP)`),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().onUpdateNow()
  },
  (table) => [
    primaryKey({ columns: [table.userId], name: "google_calendar_tokens_user_id" })
  ]
);
var socialConnections = mysqlTable(
  "social_connections",
  {
    id: int().autoincrement().notNull(),
    userId: int("user_id").notNull().references(() => authentication.id, { onDelete: "cascade" }),
    provider: mysqlEnum(["facebook", "jobstreet"]).notNull(),
    providerUserId: varchar("provider_user_id", { length: 100 }).notNull(),
    providerUserName: varchar("provider_user_name", { length: 255 }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    expiresAt: datetime("expires_at", { mode: "string" }),
    metadata: json(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().onUpdateNow()
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "social_connections_id" }),
    unique("unique_user_provider").on(table.userId, table.provider)
  ]
);

// db/tables/attendance.ts
var attendanceLogs = mysqlTable(
  "attendance_logs",
  {
    id: int().autoincrement().notNull(),
    employeeId: varchar("employee_id", { length: 50 }).notNull(),
    scanTime: datetime("scan_time", { mode: "string" }).notNull(),
    type: mysqlEnum(["IN", "OUT"]).notNull(),
    source: varchar({ length: 50 }).default("BIOMETRIC"),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow()
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "attendance_logs_id" })
  ]
);
var dailyTimeRecords = mysqlTable(
  "daily_time_records",
  {
    id: int().autoincrement().notNull(),
    employeeId: varchar("employee_id", { length: 50 }).notNull(),
    date: date({ mode: "string" }).notNull(),
    timeIn: datetime("time_in", { mode: "string" }),
    timeOut: datetime("time_out", { mode: "string" }),
    lateMinutes: int("late_minutes").default(0),
    undertimeMinutes: int("undertime_minutes").default(0),
    overtimeMinutes: int("overtime_minutes").default(0),
    status: varchar({ length: 50 }).default("Present"),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().onUpdateNow()
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "daily_time_records_id" }),
    unique("unique_dtr").on(table.employeeId, table.date)
  ]
);
var dtrCorrections = mysqlTable(
  "dtr_corrections",
  {
    id: int().autoincrement().notNull(),
    employeeId: varchar("employee_id", { length: 50 }).notNull(),
    dateTime: date("date_time", { mode: "string" }).notNull(),
    originalTimeIn: datetime("original_time_in", { mode: "string" }),
    originalTimeOut: datetime("original_time_out", { mode: "string" }),
    correctedTimeIn: datetime("corrected_time_in", { mode: "string" }),
    correctedTimeOut: datetime("corrected_time_out", { mode: "string" }),
    reason: text(),
    status: mysqlEnum(["Pending", "Approved", "Rejected"]).default("Pending"),
    rejectionReason: text("rejection_reason"),
    approvedBy: varchar("approved_by", { length: 50 }),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().onUpdateNow()
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "dtr_corrections_id" })
  ]
);
var fingerprints = mysqlTable(
  "fingerprints",
  {
    fingerprintId: int("fingerprint_id").notNull(),
    employeeId: varchar("employee_id", { length: 50 }).notNull(),
    template: longtext(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow()
  },
  (table) => [
    primaryKey({ columns: [table.fingerprintId], name: "fingerprints_fingerprint_id" }),
    unique("employee_id").on(table.employeeId)
  ]
);
var schedules = mysqlTable(
  "schedules",
  {
    id: int().autoincrement().notNull(),
    employeeId: varchar("employee_id", { length: 50 }).notNull(),
    scheduleTitle: varchar("schedule_title", { length: 255 }).default("Regular Schedule"),
    startDate: date("start_date", { mode: "string" }),
    endDate: date("end_date", { mode: "string" }),
    dayOfWeek: varchar("day_of_week", { length: 20 }).notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    repeatPattern: varchar("repeat_pattern", { length: 50 }).default("Weekly"),
    // isRestDay: tinyint("is_rest_day").default(0), // Removed as it caused unknown column error during seeding
    // isSpecial: tinyint("is_special").default(0), // Removed as it caused unknown column error during seeding
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().onUpdateNow()
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "schedules_id" }),
    index("idx_employee_day").on(table.employeeId, table.dayOfWeek)
  ]
);
var tardinessSummary = mysqlTable(
  "tardiness_summary",
  {
    id: int().autoincrement().notNull(),
    employeeId: varchar("employee_id", { length: 50 }).notNull(),
    year: int().notNull(),
    month: int().notNull(),
    totalLateMinutes: int("total_late_minutes").default(0),
    totalUndertimeMinutes: int("total_undertime_minutes").default(0),
    totalLateCount: int("total_late_count").default(0),
    totalUndertimeCount: int("total_undertime_count").default(0),
    totalAbsenceCount: int("total_absence_count").default(0),
    totalMinutes: int("total_minutes").generatedAlwaysAs(sql`(\`total_late_minutes\` + \`total_undertime_minutes\`)`, { mode: "stored" }),
    daysEquivalent: decimal("days_equivalent", { precision: 5, scale: 3 }).default("0.000"),
    deductedFromVl: decimal("deducted_from_vl", { precision: 5, scale: 3 }).default("0.000"),
    chargedAsLwop: decimal("charged_as_lwop", { precision: 5, scale: 3 }).default("0.000"),
    processedAt: timestamp("processed_at", { mode: "string" }),
    processedBy: varchar("processed_by", { length: 50 }),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().onUpdateNow()
  },
  (table) => [
    index("idx_employee").on(table.employeeId),
    primaryKey({ columns: [table.id], name: "tardiness_summary_id" }),
    unique("unique_tardiness").on(table.employeeId, table.year, table.month)
  ]
);
var bioEnrolledUsers = mysqlTable(
  "bio_enrolled_users",
  {
    employeeId: int("employee_id").notNull(),
    fullName: varchar("full_name", { length: 150 }).notNull(),
    department: varchar({ length: 100 }),
    userStatus: mysqlEnum("user_status", ["active", "inactive"]).notNull().default("active"),
    enrolledAt: datetime("enrolled_at", { mode: "string" }).default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: datetime("updated_at", { mode: "string" }).default(sql`(CURRENT_TIMESTAMP)`)
  },
  (table) => [
    primaryKey({ columns: [table.employeeId], name: "bio_enrolled_users_pk" })
  ]
);
var bioAttendanceLogs = mysqlTable(
  "bio_attendance_logs",
  {
    id: bigint({ mode: "number" }).autoincrement().notNull(),
    employeeId: int("employee_id").notNull(),
    cardType: mysqlEnum("card_type", ["IN", "OUT"]).notNull(),
    logDate: date("log_date", { mode: "string" }).notNull(),
    logTime: time("log_time").notNull(),
    createdAt: datetime("created_at", { mode: "string" }).default(sql`(CURRENT_TIMESTAMP)`)
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "bio_attendance_logs_pk" }),
    index("idx_emp_date").on(table.employeeId, table.logDate),
    index("idx_date_time").on(table.logDate, table.logTime)
  ]
);

// db/tables/leave.ts
var leaveApplications = mysqlTable(
  "leave_applications",
  {
    id: int().autoincrement().notNull(),
    employeeId: varchar("employee_id", { length: 50 }).notNull(),
    leaveType: mysqlEnum("leave_type", ["Vacation Leave", "Sick Leave", "Special Privilege Leave", "Forced Leave", "Maternity Leave", "Paternity Leave", "Solo Parent Leave", "Study Leave", "Special Emergency Leave", "VAWC Leave", "Rehabilitation Leave", "Special Leave Benefits for Women", "Wellness Leave", "Adoption Leave"]).notNull(),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }).notNull(),
    workingDays: decimal("working_days", { precision: 10, scale: 3 }).notNull(),
    isWithPay: tinyint("is_with_pay").default(1).notNull(),
    actualPaymentStatus: mysqlEnum("actual_payment_status", ["WITH_PAY", "WITHOUT_PAY", "PARTIAL"]).default("WITH_PAY").notNull(),
    daysWithPay: decimal("days_with_pay", { precision: 10, scale: 3 }).default("0.000"),
    daysWithoutPay: decimal("days_without_pay", { precision: 10, scale: 3 }).default("0.000"),
    crossChargedFrom: varchar("cross_charged_from", { length: 50 }),
    reason: text().notNull(),
    medicalCertificatePath: varchar("medical_certificate_path", { length: 255 }),
    status: mysqlEnum(["Pending", "Processing", "Finalizing", "Approved", "Rejected", "Cancelled"]).default("Pending"),
    attachmentPath: varchar("attachment_path", { length: 255 }),
    adminFormPath: varchar("admin_form_path", { length: 255 }),
    finalAttachmentPath: varchar("final_attachment_path", { length: 255 }),
    rejectionReason: text("rejection_reason"),
    approvedBy: varchar("approved_by", { length: 50 }),
    approvedAt: timestamp("approved_at", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().onUpdateNow()
  },
  (table) => [
    index("idx_employee_status").on(table.employeeId, table.status),
    index("idx_dates").on(table.startDate, table.endDate),
    index("idx_leave_type").on(table.leaveType),
    primaryKey({ columns: [table.id], name: "leave_applications_id" })
  ]
);
var leaveBalances = mysqlTable(
  "leave_balances",
  {
    id: int().autoincrement().notNull(),
    employeeId: varchar("employee_id", { length: 50 }).notNull(),
    creditType: mysqlEnum("credit_type", ["Vacation Leave", "Sick Leave", "Special Privilege Leave", "Forced Leave", "Maternity Leave", "Paternity Leave", "Solo Parent Leave", "Study Leave", "Adoption Leave"]).notNull(),
    balance: decimal({ precision: 10, scale: 3 }).default("0.000").notNull(),
    year: int().notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().onUpdateNow()
  },
  (table) => [
    index("idx_employee").on(table.employeeId),
    primaryKey({ columns: [table.id], name: "leave_balances_id" }),
    unique("unique_balance").on(table.employeeId, table.creditType, table.year)
  ]
);
var leaveCredits = mysqlTable(
  "leave_credits",
  {
    id: int().autoincrement().notNull(),
    employeeId: varchar("employee_id", { length: 255 }).notNull(),
    creditType: varchar("credit_type", { length: 50 }).notNull(),
    balance: decimal({ precision: 10, scale: 2 }).default("0.00"),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().onUpdateNow()
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "leave_credits_id" }),
    unique("unique_credit").on(table.employeeId, table.creditType)
  ]
);
var leaveLedger = mysqlTable(
  "leave_ledger",
  {
    id: int().autoincrement().notNull(),
    employeeId: varchar("employee_id", { length: 50 }).notNull(),
    creditType: mysqlEnum("credit_type", ["Vacation Leave", "Sick Leave", "Special Privilege Leave", "Forced Leave", "Maternity Leave", "Paternity Leave", "Solo Parent Leave", "Study Leave", "Adoption Leave"]).notNull(),
    transactionType: mysqlEnum("transaction_type", ["ACCRUAL", "DEDUCTION", "ADJUSTMENT", "MONETIZATION", "FORFEITURE", "UNDERTIME_DEDUCTION", "TARDINESS_DEDUCTION"]).notNull(),
    amount: decimal({ precision: 10, scale: 3 }).notNull(),
    balanceAfter: decimal("balance_after", { precision: 10, scale: 3 }).notNull(),
    referenceId: int("reference_id"),
    referenceType: mysqlEnum("reference_type", ["leave_application", "monetization", "dtr", "manual"]),
    remarks: text(),
    createdBy: varchar("created_by", { length: 50 }),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow()
  },
  (table) => [
    index("idx_employee_credit").on(table.employeeId, table.creditType),
    index("idx_created").on(table.createdAt),
    index("idx_reference").on(table.referenceId, table.referenceType),
    primaryKey({ columns: [table.id], name: "leave_ledger_id" })
  ]
);
var leaveMonetizationRequests = mysqlTable(
  "leave_monetization_requests",
  {
    id: int().autoincrement().notNull(),
    employeeId: varchar("employee_id", { length: 50 }).notNull(),
    creditType: mysqlEnum("credit_type", ["Vacation Leave", "Sick Leave"]).notNull(),
    requestedDays: decimal("requested_days", { precision: 10, scale: 3 }).notNull(),
    dailyRate: decimal("daily_rate", { precision: 12, scale: 2 }).notNull(),
    totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
    purpose: mysqlEnum(["Health", "Medical", "Financial Emergency"]).notNull(),
    status: mysqlEnum(["Pending", "Approved", "Rejected"]).default("Pending"),
    approvedBy: varchar("approved_by", { length: 50 }),
    remarks: text(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().onUpdateNow()
  },
  (table) => [
    index("idx_employee").on(table.employeeId),
    index("idx_status").on(table.status),
    primaryKey({ columns: [table.id], name: "leave_monetization_requests_id" })
  ]
);
var leaveRequests = mysqlTable(
  "leave_requests",
  {
    id: int().autoincrement().notNull(),
    employeeId: varchar("employee_id", { length: 50 }).notNull(),
    leaveType: varchar("leave_type", { length: 50 }).notNull(),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }).notNull(),
    reason: text(),
    status: mysqlEnum(["Pending", "Processing", "Finalizing", "Approved", "Rejected"]).default("Pending"),
    rejectionReason: text("rejection_reason"),
    approvedBy: varchar("approved_by", { length: 50 }),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().onUpdateNow(),
    attachmentPath: varchar("attachment_path", { length: 255 }),
    adminFormPath: varchar("admin_form_path", { length: 255 }),
    finalAttachmentPath: varchar("final_attachment_path", { length: 255 }),
    withPay: tinyint("with_pay").default(0)
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "leave_requests_id" })
  ]
);
var lwopSummary = mysqlTable(
  "lwop_summary",
  {
    id: int().autoincrement().notNull(),
    employeeId: varchar("employee_id", { length: 50 }).notNull(),
    year: int().notNull(),
    totalLwopDays: decimal("total_lwop_days", { precision: 10, scale: 3 }).default("0.000"),
    salaryDeduction: decimal("salary_deduction", { precision: 12, scale: 2 }).default("0.00"),
    cumulativeLwopDays: decimal("cumulative_lwop_days", { precision: 10, scale: 3 }).default("0.000"),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().onUpdateNow()
  },
  (table) => [
    index("idx_employee").on(table.employeeId),
    primaryKey({ columns: [table.id], name: "lwop_summary_id" }),
    unique("unique_lwop").on(table.employeeId, table.year)
  ]
);

// db/tables/recruitment.ts
var chatConversations = mysqlTable(
  "chat_conversations",
  {
    id: int().autoincrement().notNull(),
    applicantName: varchar("applicant_name", { length: 100 }).notNull(),
    applicantEmail: varchar("applicant_email", { length: 255 }).notNull(),
    status: mysqlEnum(["Active", "Closed", "Archived"]).default("Active"),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().onUpdateNow()
  },
  (table) => [
    index("idx_applicant_email").on(table.applicantEmail),
    index("idx_status").on(table.status),
    primaryKey({ columns: [table.id], name: "chat_conversations_id" })
  ]
);
var chatMessages = mysqlTable(
  "chat_messages",
  {
    id: int().autoincrement().notNull(),
    conversationId: int("conversation_id").notNull().references(() => chatConversations.id, { onDelete: "cascade" }),
    senderType: mysqlEnum("sender_type", ["Applicant", "Admin"]).notNull(),
    senderId: int("sender_id"),
    message: text().notNull(),
    isRead: tinyint("is_read").default(0),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow()
  },
  (table) => [
    index("idx_conversation").on(table.conversationId),
    index("idx_is_read").on(table.isRead),
    primaryKey({ columns: [table.id], name: "chat_messages_id" })
  ]
);
var contactInquiries = mysqlTable(
  "contact_inquiries",
  {
    id: int().autoincrement().notNull(),
    first_name: varchar("first_name", { length: 100 }).notNull(),
    last_name: varchar("last_name", { length: 100 }).notNull(),
    email: varchar({ length: 255 }).notNull(),
    message: text().notNull(),
    status: mysqlEnum(["Pending", "Read", "Replied", "Archived"]).default("Pending"),
    admin_notes: text("admin_notes"),
    created_at: timestamp("created_at", { mode: "string" }).defaultNow(),
    updated_at: timestamp("updated_at", { mode: "string" }).defaultNow().onUpdateNow()
  },
  (table) => [
    index("idx_status").on(table.status),
    index("idx_email").on(table.email),
    index("idx_created_at").on(table.created_at),
    primaryKey({ columns: [table.id], name: "contact_inquiries_id" })
  ]
);
var recruitmentJobs = mysqlTable(
  "recruitment_jobs",
  {
    id: int().autoincrement().notNull(),
    title: varchar({ length: 255 }).notNull(),
    department: varchar({ length: 100 }).notNull(),
    job_description: text("job_description").notNull(),
    requirements: text(),
    location: varchar({ length: 100 }).default("Main Office"),
    employment_type: mysqlEnum("employment_type", ["Full-time", "Part-time", "Contractual", "Job Order", "Coterminous", "Temporary", "Probationary", "Casual", "Permanent"]).default("Full-time"),
    status: mysqlEnum(["Open", "Closed", "On Hold"]).default("Open"),
    application_email: varchar("application_email", { length: 255 }),
    posted_by: int("posted_by"),
    posted_at: datetime("posted_at", { mode: "string" }),
    fb_post_id: varchar("fb_post_id", { length: 100 }),
    linkedin_post_id: varchar("linkedin_post_id", { length: 255 }),
    created_at: timestamp("created_at", { mode: "string" }).defaultNow(),
    updated_at: timestamp("updated_at", { mode: "string" }).defaultNow().onUpdateNow(),
    attachment_path: varchar("attachment_path", { length: 255 }),
    require_civil_service: tinyint("require_civil_service").default(0),
    require_government_ids: tinyint("require_government_ids").default(0),
    require_education_experience: tinyint("require_education_experience").default(0)
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "recruitment_jobs_id" })
  ]
);
var recruitmentApplicants = mysqlTable(
  "recruitment_applicants",
  {
    id: int().autoincrement().notNull(),
    job_id: int("job_id").references(() => recruitmentJobs.id, { onDelete: "set null" }),
    first_name: varchar("first_name", { length: 100 }).notNull(),
    last_name: varchar("last_name", { length: 100 }).notNull(),
    email: varchar({ length: 100 }).notNull(),
    phone_number: varchar("phone_number", { length: 20 }),
    resume_path: varchar("resume_path", { length: 255 }),
    photo_path: varchar("photo_path", { length: 255 }),
    status: mysqlEnum(["Applied", "Screening", "Interview", "Offer", "Hired", "Rejected"]).default("Applied"),
    source: mysqlEnum(["web", "email"]).default("web"),
    email_subject: varchar("email_subject", { length: 255 }),
    email_received_at: datetime("email_received_at", { mode: "string" }),
    created_at: timestamp("created_at", { mode: "string" }).defaultNow(),
    stage: mysqlEnum(["Applied", "Screening", "Initial Interview", "Final Interview", "Offer", "Hired", "Rejected"]).default("Applied"),
    interview_date: datetime("interview_date", { mode: "string" }),
    interview_link: varchar("interview_link", { length: 500 }),
    interview_platform: mysqlEnum("interview_platform", ["Jitsi Meet", "Google Meet", "Zoom", "Other"]).default("Google Meet"),
    interview_notes: text("interview_notes"),
    interviewer_id: int("interviewer_id").references(() => authentication.id, { onDelete: "set null" }),
    middle_name: varchar("middle_name", { length: 100 }),
    suffix: varchar("suffix", { length: 10 }),
    zip_code: varchar("zip_code", { length: 10 }),
    birth_date: datetime("birth_date", { mode: "string" }),
    birth_place: varchar("birth_place", { length: 255 }),
    sex: mysqlEnum("sex", ["Male", "Female"]),
    civil_status: mysqlEnum("civil_status", ["Single", "Married", "Widowed", "Separated", "Annulled"]),
    height: varchar("height", { length: 20 }),
    weight: varchar("weight", { length: 20 }),
    blood_type: varchar("blood_type", { length: 10 }),
    gsis_no: varchar("gsis_no", { length: 50 }),
    pagibig_no: varchar("pagibig_no", { length: 50 }),
    philhealth_no: varchar("philhealth_no", { length: 50 }),
    umid_no: varchar("umid_no", { length: 50 }),
    philsys_id: varchar("philsys_id", { length: 50 }),
    tin_no: varchar("tin_no", { length: 50 }),
    eligibility: text(),
    eligibility_type: varchar("eligibility_type", { length: 100 }),
    eligibility_date: datetime("eligibility_date", { mode: "string" }),
    eligibility_rating: varchar("eligibility_rating", { length: 50 }),
    eligibility_place: varchar("eligibility_place", { length: 255 }),
    license_no: varchar("license_no", { length: 50 }),
    eligibility_path: varchar("eligibility_path", { length: 255 }),
    total_experience_years: int("total_experience_years"),
    address: text(),
    permanent_address: text("permanent_address"),
    permanent_zip_code: varchar("permanent_zip_code", { length: 10 }),
    education: text(),
    experience: text(),
    skills: text(),
    hired_date: datetime("hired_date", { mode: "string" }),
    is_meycauayan_resident: tinyint("is_meycauayan_resident").default(0)
  },
  (table) => [
    index("job_id").on(table.job_id),
    primaryKey({ columns: [table.id], name: "recruitment_applicants_id" })
  ]
);
var recruitmentEmailTemplates = mysqlTable(
  "recruitment_email_templates",
  {
    id: int().autoincrement().notNull(),
    stage_name: varchar("stage_name", { length: 50 }).notNull(),
    subject_template: varchar("subject_template", { length: 255 }).notNull(),
    body_template: text("body_template").notNull(),
    available_variables: text("available_variables"),
    updated_at: timestamp("updated_at", { mode: "string" }).defaultNow().onUpdateNow()
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "recruitment_email_templates_id" }),
    unique("stage_name").on(table.stage_name)
  ]
);

// db/tables/performance.ts
var performanceCriteria = mysqlTable(
  "performance_criteria",
  {
    id: int().autoincrement().notNull(),
    title: varchar({ length: 255 }).notNull(),
    description: text(),
    category: varchar({ length: 100 }).default("General"),
    criteriaType: mysqlEnum("criteria_type", ["core_function", "support_function", "core_competency", "organizational_competency"]).default("core_function"),
    weight: decimal({ precision: 5, scale: 2 }).default("1.00"),
    maxScore: int("max_score").default(5),
    // Rating Matrix Definitions
    ratingDefinition5: text("rating_definition_5"),
    ratingDefinition4: text("rating_definition_4"),
    ratingDefinition3: text("rating_definition_3"),
    ratingDefinition2: text("rating_definition_2"),
    ratingDefinition1: text("rating_definition_1"),
    // Evidence Support
    evidenceRequirements: text("evidence_requirements"),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    isActive: tinyint("is_active").default(1)
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "performance_criteria_id" })
  ]
);
var performanceReviewCycles = mysqlTable(
  "performance_review_cycles",
  {
    id: int().autoincrement().notNull(),
    title: varchar({ length: 255 }).notNull(),
    description: text(),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }).notNull(),
    status: mysqlEnum(["Draft", "Active", "Completed", "Archived"]).default("Draft"),
    createdBy: int("created_by").references(() => authentication.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    ratingPeriod: mysqlEnum("rating_period", ["1st_sem", "2nd_sem", "annual"]).default("annual"),
    isActive: tinyint("is_active").default(1),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().onUpdateNow()
  },
  (table) => [
    index("created_by").on(table.createdBy),
    primaryKey({ columns: [table.id], name: "performance_review_cycles_id" })
  ]
);
var performanceReviews = mysqlTable(
  "performance_reviews",
  {
    id: int().autoincrement().notNull(),
    employeeId: int("employee_id").notNull().references(() => authentication.id),
    reviewerId: int("reviewer_id").notNull().references(() => authentication.id),
    reviewPeriodStart: date("review_period_start", { mode: "string" }).notNull(),
    reviewPeriodEnd: date("review_period_end", { mode: "string" }).notNull(),
    status: mysqlEnum(["Draft", "Self-Rated", "Submitted", "Acknowledged", "Approved", "Finalized"]).default("Draft"),
    totalScore: decimal("total_score", { precision: 5, scale: 2 }),
    selfRatingScore: decimal("self_rating_score", { precision: 3, scale: 2 }),
    supervisorRatingScore: decimal("supervisor_rating_score", { precision: 3, scale: 2 }),
    finalRatingScore: decimal("final_rating_score", { precision: 3, scale: 2 }),
    selfRatingStatus: mysqlEnum("self_rating_status", ["pending", "submitted"]).default("pending"),
    overallFeedback: text("overall_feedback"),
    supervisorRemarks: text("supervisor_remarks"),
    employeeRemarks: text("employee_remarks"),
    headRemarks: text("head_remarks"),
    disagreeRemarks: text("disagree_remarks"),
    approvedBy: int("approved_by"),
    approvedAt: timestamp("approved_at", { mode: "string" }),
    disagreed: tinyint().default(0),
    ratingPeriod: mysqlEnum("rating_period", ["1st_sem", "2nd_sem", "annual"]).default("annual"),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().onUpdateNow(),
    reviewCycleId: int("review_cycle_id").references(() => performanceReviewCycles.id, { onDelete: "set null" }),
    isSelfAssessment: tinyint("is_self_assessment").default(0),
    cycleId: int("cycle_id"),
    evaluationMode: mysqlEnum("evaluation_mode", ["CSC", "IPCR"]).default("CSC")
  },
  (table) => [
    index("employee_id").on(table.employeeId),
    index("reviewer_id").on(table.reviewerId),
    primaryKey({ columns: [table.id], name: "performance_reviews_id" })
  ]
);
var performanceAuditLog = mysqlTable(
  "performance_audit_log",
  {
    id: int().autoincrement().notNull(),
    reviewId: int("review_id").notNull().references(() => performanceReviews.id, { onDelete: "cascade" }),
    action: varchar({ length: 50 }).notNull(),
    actorId: int("actor_id").notNull().references(() => authentication.id, { onDelete: "cascade" }),
    details: text(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow()
  },
  (table) => [
    index("review_id").on(table.reviewId),
    index("actor_id").on(table.actorId),
    primaryKey({ columns: [table.id], name: "performance_audit_log_id" })
  ]
);
var performanceGoals = mysqlTable(
  "performance_goals",
  {
    id: int().autoincrement().notNull(),
    employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" }),
    reviewCycleId: int("review_cycle_id"),
    title: varchar({ length: 255 }).notNull(),
    description: text(),
    metric: varchar({ length: 255 }),
    targetValue: decimal("target_value", { precision: 10, scale: 2 }),
    currentValue: decimal("current_value", { precision: 10, scale: 2 }).default("0.00"),
    weight: decimal({ precision: 5, scale: 2 }).default("1.00"),
    startDate: date("start_date", { mode: "string" }),
    dueDate: date("due_date", { mode: "string" }),
    status: mysqlEnum(["Not Started", "In Progress", "Completed", "Cancelled"]).default("Not Started"),
    progress: int().default(0),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow()
  },
  (table) => [
    index("employee_id").on(table.employeeId),
    index("review_cycle_id").on(table.reviewCycleId),
    foreignKey({
      columns: [table.reviewCycleId],
      foreignColumns: [performanceReviewCycles.id],
      name: "fk_pg_rc"
    }).onDelete("set null"),
    primaryKey({ columns: [table.id], name: "performance_goals_id" })
  ]
);
var performanceImprovementPlans = mysqlTable(
  "performance_improvement_plans",
  {
    id: int().autoincrement().notNull(),
    employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" }),
    supervisorId: int("supervisor_id").notNull().references(() => authentication.id, { onDelete: "cascade" }),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }).notNull(),
    areasOfConcern: text("areas_of_concern").notNull(),
    actionPlan: text("action_plan").notNull(),
    status: mysqlEnum(["Active", "Completed", "Failed", "Terminated"]).default("Active"),
    outcomeNotes: text("outcome_notes"),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow()
  },
  (table) => [
    index("employee_id").on(table.employeeId),
    index("supervisor_id").on(table.supervisorId),
    primaryKey({ columns: [table.id], name: "performance_improvement_plans_id" })
  ]
);
var performanceReviewItems = mysqlTable(
  "performance_review_items",
  {
    id: int().autoincrement().notNull(),
    reviewId: int("review_id").notNull().references(() => performanceReviews.id, { onDelete: "cascade" }),
    criteriaId: int("criteria_id").references(() => performanceCriteria.id, { onDelete: "set null" }),
    score: decimal({ precision: 5, scale: 2 }),
    selfScore: decimal("self_score", { precision: 3, scale: 2 }),
    actualAccomplishments: text("actual_accomplishments"),
    comment: text(),
    qScore: decimal("q_score", { precision: 5, scale: 2 }),
    eScore: decimal("e_score", { precision: 5, scale: 2 }),
    tScore: decimal("t_score", { precision: 5, scale: 2 }),
    criteriaTitle: varchar("criteria_title", { length: 255 }),
    criteriaDescription: text("criteria_description"),
    weight: decimal({ precision: 5, scale: 2 }).default("0.00"),
    maxScore: int("max_score").default(5),
    category: varchar({ length: 100 }).default("General"),
    // Evidence / MOV
    evidenceFilePath: text("evidence_file_path"),
    // JSON string or comma-separated paths
    evidenceDescription: text("evidence_description")
  },
  (table) => [
    index("review_id").on(table.reviewId),
    primaryKey({ columns: [table.id], name: "performance_review_items_id" })
  ]
);
var performanceTemplates = mysqlTable(
  "performance_templates",
  {
    id: int().autoincrement().notNull(),
    title: varchar({ length: 255 }).notNull(),
    description: text(),
    sections: json(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow()
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "performance_templates_id" })
  ]
);

// db/tables/pds.ts
var pdsEducation = mysqlTable(
  "pds_education",
  {
    id: int().autoincrement().notNull(),
    employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" }),
    level: mysqlEnum(["Elementary", "Secondary", "Vocational", "College", "Graduate Studies"]).notNull(),
    schoolName: varchar("school_name", { length: 255 }).notNull(),
    degreeCourse: varchar("degree_course", { length: 255 }),
    yearGraduated: int("year_graduated"),
    unitsEarned: varchar("units_earned", { length: 50 }),
    dateFrom: int("date_from"),
    dateTo: int("date_to"),
    honors: varchar({ length: 255 }),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow()
  },
  (table) => [
    index("employee_id").on(table.employeeId),
    primaryKey({ columns: [table.id], name: "pds_education_id" })
  ]
);
var pdsEligibility = mysqlTable(
  "pds_eligibility",
  {
    id: int().autoincrement().notNull(),
    employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" }),
    eligibilityName: varchar("eligibility_name", { length: 255 }).notNull(),
    rating: decimal({ precision: 5, scale: 2 }),
    examDate: date("exam_date", { mode: "string" }),
    examPlace: varchar("exam_place", { length: 255 }),
    licenseNumber: varchar("license_number", { length: 50 }),
    validityDate: date("validity_date", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow()
  },
  (table) => [
    index("employee_id").on(table.employeeId),
    primaryKey({ columns: [table.id], name: "pds_eligibility_id" })
  ]
);
var pdsFamily = mysqlTable(
  "pds_family",
  {
    id: int().autoincrement().notNull(),
    employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" }),
    relationType: mysqlEnum("relation_type", ["Spouse", "Father", "Mother", "Child"]).notNull(),
    lastName: varchar("last_name", { length: 100 }),
    firstName: varchar("first_name", { length: 100 }),
    middleName: varchar("middle_name", { length: 100 }),
    nameExtension: varchar("name_extension", { length: 10 }),
    occupation: varchar({ length: 100 }),
    employer: varchar({ length: 100 }),
    businessAddress: varchar("business_address", { length: 255 }),
    telephoneNo: varchar("telephone_no", { length: 50 }),
    dateOfBirth: date("date_of_birth", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow()
  },
  (table) => [
    index("idx_emp").on(table.employeeId),
    primaryKey({ columns: [table.id], name: "pds_family_id" })
  ]
);
var pdsLearningDevelopment = mysqlTable(
  "pds_learning_development",
  {
    id: int().autoincrement().notNull(),
    employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" }),
    title: varchar({ length: 255 }).notNull(),
    dateFrom: date("date_from", { mode: "string" }),
    dateTo: date("date_to", { mode: "string" }),
    hoursNumber: int("hours_number"),
    typeOfLd: varchar("type_of_ld", { length: 50 }),
    conductedBy: varchar("conducted_by", { length: 255 }),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow()
  },
  (table) => [
    index("employee_id").on(table.employeeId),
    primaryKey({ columns: [table.id], name: "pds_learning_development_id" })
  ]
);
var pdsOtherInfo = mysqlTable(
  "pds_other_info",
  {
    id: int().autoincrement().notNull(),
    employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" }),
    type: mysqlEnum(["Skill", "Recognition", "Membership"]).notNull(),
    description: varchar({ length: 255 }).notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow()
  },
  (table) => [
    index("employee_id").on(table.employeeId),
    primaryKey({ columns: [table.id], name: "pds_other_info_id" })
  ]
);
var pdsReferences = mysqlTable(
  "pds_references",
  {
    id: int().autoincrement().notNull(),
    employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" }),
    name: varchar({ length: 255 }).notNull(),
    address: varchar({ length: 255 }),
    telNo: varchar("tel_no", { length: 50 }),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow()
  },
  (table) => [
    index("employee_id").on(table.employeeId),
    primaryKey({ columns: [table.id], name: "pds_references_id" })
  ]
);
var pdsVoluntaryWork = mysqlTable(
  "pds_voluntary_work",
  {
    id: int().autoincrement().notNull(),
    employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" }),
    organizationName: varchar("organization_name", { length: 255 }).notNull(),
    address: varchar({ length: 255 }),
    dateFrom: date("date_from", { mode: "string" }),
    dateTo: date("date_to", { mode: "string" }),
    hoursNumber: int("hours_number"),
    position: varchar({ length: 100 }),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow()
  },
  (table) => [
    index("employee_id").on(table.employeeId),
    primaryKey({ columns: [table.id], name: "pds_voluntary_work_id" })
  ]
);
var pdsWorkExperience = mysqlTable(
  "pds_work_experience",
  {
    id: int().autoincrement().notNull(),
    employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" }),
    dateFrom: date("date_from", { mode: "string" }).notNull(),
    dateTo: date("date_to", { mode: "string" }),
    positionTitle: varchar("position_title", { length: 255 }).notNull(),
    companyName: varchar("company_name", { length: 255 }).notNull(),
    monthlySalary: decimal("monthly_salary", { precision: 12, scale: 2 }),
    salaryGrade: varchar("salary_grade", { length: 20 }),
    appointmentStatus: varchar("appointment_status", { length: 50 }),
    isGovernment: tinyint("is_government").default(0),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow()
  },
  (table) => [
    index("employee_id").on(table.employeeId),
    primaryKey({ columns: [table.id], name: "pds_work_experience_id" })
  ]
);
var employeeCustomFields = mysqlTable(
  "employee_custom_fields",
  {
    id: int().autoincrement().notNull(),
    employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" }),
    section: varchar({ length: 255 }).notNull(),
    fieldName: varchar("field_name", { length: 255 }).notNull(),
    fieldValue: text("field_value"),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().onUpdateNow()
  },
  (table) => [
    index("employee_id").on(table.employeeId),
    primaryKey({ columns: [table.id], name: "employee_custom_fields_id" })
  ]
);
var employeeDocuments = mysqlTable(
  "employee_documents",
  {
    id: int().autoincrement().notNull(),
    employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" }),
    documentName: varchar("document_name", { length: 255 }).notNull(),
    documentType: varchar("document_type", { length: 50 }),
    filePath: varchar("file_path", { length: 255 }).notNull(),
    fileSize: int("file_size"),
    mimeType: varchar("mime_type", { length: 100 }),
    uploadedBy: int("uploaded_by").references(() => authentication.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow()
  },
  (table) => [
    index("employee_id").on(table.employeeId),
    index("uploaded_by").on(table.uploadedBy),
    primaryKey({ columns: [table.id], name: "employee_documents_id" })
  ]
);
var employeeEducation = mysqlTable(
  "employee_education",
  {
    id: int().autoincrement().notNull(),
    employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" }),
    institution: varchar({ length: 255 }).notNull(),
    degree: varchar({ length: 255 }),
    fieldOfStudy: varchar("field_of_study", { length: 255 }),
    startDate: date("start_date", { mode: "string" }),
    endDate: date("end_date", { mode: "string" }),
    isCurrent: tinyint("is_current").default(0),
    description: text(),
    type: mysqlEnum(["Education", "Certification", "Training"]).default("Education"),
    expiryDate: date("expiry_date", { mode: "string" }),
    credentialUrl: varchar("credential_url", { length: 255 }),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow()
  },
  (table) => [
    index("employee_id").on(table.employeeId),
    primaryKey({ columns: [table.id], name: "employee_education_id" })
  ]
);
var employeeEmergencyContacts = mysqlTable(
  "employee_emergency_contacts",
  {
    id: int().autoincrement().notNull(),
    employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" }),
    name: varchar({ length: 100 }).notNull(),
    relationship: varchar({ length: 50 }).notNull(),
    phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
    email: varchar({ length: 100 }),
    address: text(),
    isPrimary: tinyint("is_primary").default(0),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow()
  },
  (table) => [
    index("employee_id").on(table.employeeId),
    primaryKey({ columns: [table.id], name: "employee_emergency_contacts_id" })
  ]
);
var employeeEmploymentHistory = mysqlTable(
  "employee_employment_history",
  {
    id: int().autoincrement().notNull(),
    employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" }),
    companyName: varchar("company_name", { length: 255 }).notNull(),
    jobTitle: varchar("job_title", { length: 100 }).notNull(),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }),
    isCurrent: tinyint("is_current").default(0),
    description: text(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow()
  },
  (table) => [
    index("employee_id").on(table.employeeId),
    primaryKey({ columns: [table.id], name: "employee_employment_history_id" })
  ]
);
var employeeMemos = mysqlTable(
  "employee_memos",
  {
    id: int().autoincrement().notNull(),
    memoNumber: varchar("memo_number", { length: 50 }).notNull(),
    employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" }),
    authorId: int("author_id").notNull().references(() => authentication.id, { onDelete: "cascade" }),
    memoType: mysqlEnum("memo_type", ["Verbal Warning", "Written Warning", "Reprimand", "Suspension Notice", "Termination Notice", "Show Cause"]).default("Written Warning").notNull(),
    subject: varchar({ length: 255 }).notNull(),
    content: text().notNull(),
    priority: mysqlEnum(["Low", "Normal", "High", "Urgent"]).default("Normal").notNull(),
    severity: mysqlEnum("severity", ["minor", "moderate", "major", "grave", "terminal"]).default("minor").notNull(),
    effectiveDate: date("effective_date", { mode: "string" }),
    acknowledgmentRequired: tinyint("acknowledgment_required").default(0),
    acknowledgedAt: datetime("acknowledged_at", { mode: "string" }),
    status: mysqlEnum(["Draft", "Sent", "Acknowledged", "Archived"]).default("Draft").notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().onUpdateNow()
  },
  (table) => [
    index("author_id").on(table.authorId),
    index("idx_memo_employee").on(table.employeeId),
    index("idx_memo_type").on(table.memoType),
    index("idx_memo_status").on(table.status),
    primaryKey({ columns: [table.id], name: "employee_memos_id" }),
    unique("memo_number").on(table.memoNumber)
  ]
);
var employeeNotes = mysqlTable(
  "employee_notes",
  {
    id: int().autoincrement().notNull(),
    employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" }),
    authorId: int("author_id").notNull().references(() => authentication.id, { onDelete: "cascade" }),
    noteContent: text("note_content").notNull(),
    category: varchar({ length: 50 }).default("General"),
    isPrivate: tinyint("is_private").default(1),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow()
  },
  (table) => [
    index("employee_id").on(table.employeeId),
    index("author_id").on(table.authorId),
    primaryKey({ columns: [table.id], name: "employee_notes_id" })
  ]
);
var employeeSkills = mysqlTable(
  "employee_skills",
  {
    id: int().autoincrement().notNull(),
    employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" }),
    skillName: varchar("skill_name", { length: 100 }).notNull(),
    category: varchar({ length: 50 }).default("Technical"),
    proficiencyLevel: mysqlEnum("proficiency_level", ["Beginner", "Intermediate", "Advanced", "Expert"]).default("Intermediate"),
    yearsExperience: decimal("years_experience", { precision: 4, scale: 1 }),
    endorsements: int().default(0),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow()
  },
  (table) => [
    index("employee_id").on(table.employeeId),
    primaryKey({ columns: [table.id], name: "employee_skills_id" })
  ]
);
var serviceRecords = mysqlTable(
  "service_records",
  {
    id: int().autoincrement().notNull(),
    employeeId: varchar("employee_id", { length: 50 }).notNull(),
    eventType: mysqlEnum("event_type", ["Appointment", "Promotion", "Leave", "LWOP", "Return from Leave", "Transfer", "Suspension", "Resignation", "Retirement", "Other"]).notNull(),
    eventDate: date("event_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }),
    leaveType: varchar("leave_type", { length: 50 }),
    daysCount: decimal("days_count", { precision: 5, scale: 1 }),
    isWithPay: tinyint("is_with_pay").default(1),
    remarks: text(),
    referenceId: int("reference_id"),
    referenceType: varchar("reference_type", { length: 50 }),
    processedBy: varchar("processed_by", { length: 50 }),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().onUpdateNow()
  },
  (table) => [
    index("idx_employee").on(table.employeeId),
    index("idx_event_type").on(table.eventType),
    index("idx_event_date").on(table.eventDate),
    primaryKey({ columns: [table.id], name: "service_records_id" })
  ]
);

// db/tables/payroll.ts
var salarySchedule = mysqlTable(
  "salary_schedule",
  {
    id: int().autoincrement().notNull(),
    salaryGrade: int("salary_grade").notNull(),
    step: int().notNull(),
    monthlySalary: decimal("monthly_salary", { precision: 12, scale: 2 }).notNull(),
    tranche: int().default(2).notNull()
  },
  (table) => [
    index("idx_grade").on(table.salaryGrade),
    index("idx_salary_schedule_tranche").on(table.tranche),
    primaryKey({ columns: [table.id], name: "salary_schedule_id" }),
    unique("unique_grade_step_tranche").on(table.salaryGrade, table.step, table.tranche)
  ]
);
var salaryTranches = mysqlTable(
  "salary_tranches",
  {
    id: int().autoincrement().notNull(),
    trancheNumber: int("tranche_number").notNull(),
    name: varchar({ length: 100 }).notNull(),
    circularNumber: varchar("circular_number", { length: 100 }),
    effectiveDate: date("effective_date", { mode: "string" }),
    dateIssued: date("date_issued", { mode: "string" }),
    applicableTo: varchar("applicable_to", { length: 255 }),
    isActive: tinyint("is_active").default(0),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().onUpdateNow()
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "salary_tranches_id" }),
    unique("tranche_number").on(table.trancheNumber)
  ]
);
var stepIncrementTracker = mysqlTable(
  "step_increment_tracker",
  {
    id: int().autoincrement().notNull(),
    employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" }),
    positionId: int("position_id").notNull(),
    currentStep: int("current_step").notNull(),
    previousStep: int("previous_step"),
    eligibleDate: date("eligible_date", { mode: "string" }).notNull(),
    status: mysqlEnum(["Pending", "Approved", "Denied", "Processed"]).default("Pending"),
    processedAt: timestamp("processed_at", { mode: "string" }),
    processedBy: int("processed_by").references(() => authentication.id, { onDelete: "set null" }),
    remarks: text(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().onUpdateNow()
  },
  (table) => [
    index("idx_employee").on(table.employeeId),
    index("idx_status").on(table.status),
    index("idx_eligible_date").on(table.eligibleDate),
    index("processed_by").on(table.processedBy),
    primaryKey({ columns: [table.id], name: "step_increment_tracker_id" })
  ]
);

// db/tables/internal_policies.ts
var internalPolicies = mysqlTable(
  "internal_policies",
  {
    id: int().autoincrement().notNull(),
    category: mysqlEnum("category", ["hours", "tardiness", "penalties", "csc", "leave", "plantilla"]).notNull(),
    title: varchar({ length: 255 }).notNull(),
    content: text().notNull(),
    // JSON content
    versionLabel: varchar("version_label", { length: 50 }),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().onUpdateNow()
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "internal_policies_id" })
  ]
);

// db/tables/violations.ts
var policyViolations = mysqlTable(
  "policy_violations",
  {
    id: int().autoincrement().notNull(),
    employeeId: varchar("employee_id", { length: 50 }).notNull(),
    type: mysqlEnum("type", ["habitual_tardiness", "habitual_undertime", "consecutive_lateness", "loafing", "absence", "misconduct", "others"]).notNull(),
    violationSubtype: varchar("violation_subtype", { length: 50 }),
    offenseLevel: int("offense_level").default(1),
    // Legacy tracking, but keeping it
    offenseNumber: int("offense_number").default(1).notNull(),
    triggeredMonths: text("triggered_months"),
    // JSON array of YYYY-MM
    fingerprint: varchar("fingerprint", { length: 255 }),
    // Hash to prevent duplicate penalties
    details: text().notNull(),
    // JSON with dates, counts, or remarks
    memoId: int("memoId"),
    // Link to employee_memos.id
    status: mysqlEnum("status", ["pending", "notified", "resolved", "cancelled"]).default("pending"),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow()
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "policy_violations_id" }),
    index("idx_employee_violation").on(table.employeeId, table.type, table.memoId),
    unique("unique_fingerprint_violation").on(table.fingerprint)
  ]
);

// db/tables/common.ts
var announcements = mysqlTable(
  "announcements",
  {
    id: int().autoincrement().notNull(),
    title: varchar({ length: 255 }).notNull(),
    content: text().notNull(),
    priority: mysqlEnum(["normal", "high", "urgent"]).default("normal"),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    startDate: date("start_date", { mode: "string" }),
    endDate: date("end_date", { mode: "string" }),
    startTime: time("start_time"),
    endTime: time("end_time")
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "announcements_id" })
  ]
);
var events = mysqlTable(
  "events",
  {
    id: int().autoincrement().notNull(),
    title: varchar({ length: 255 }).notNull(),
    date: date({ mode: "string" }).notNull(),
    startDate: date("start_date", { mode: "string" }),
    endDate: date("end_date", { mode: "string" }),
    department: varchar({ length: 100 }),
    time: int().default(9),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    recurringPattern: varchar("recurring_pattern", { length: 50 }).default("none"),
    recurringEndDate: date("recurring_end_date", { mode: "string" }),
    description: text()
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "events_id" })
  ]
);
var holidays = mysqlTable(
  "holidays",
  {
    id: int().autoincrement().notNull(),
    name: varchar({ length: 100 }).notNull(),
    date: date({ mode: "string" }).notNull(),
    type: mysqlEnum(["Regular", "Special Non-Working", "Special Working"]).notNull(),
    year: int().notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow()
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "holidays_id" }),
    unique("unique_holiday").on(table.date)
  ]
);
var memoSequences = mysqlTable(
  "memo_sequences",
  {
    id: int().autoincrement().notNull(),
    year: int().notNull(),
    lastNumber: int("last_number").default(0).notNull()
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "memo_sequences_id" }),
    unique("unique_year").on(table.year)
  ]
);
var notifications = mysqlTable(
  "notifications",
  {
    notificationId: int("notification_id").autoincrement().notNull(),
    recipientId: varchar("recipient_id", { length: 50 }).notNull(),
    senderId: varchar("sender_id", { length: 50 }),
    title: varchar({ length: 255 }),
    message: text(),
    type: varchar({ length: 50 }),
    referenceId: int("reference_id"),
    status: mysqlEnum(["read", "unread"]).default("unread"),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow()
  },
  (table) => [
    primaryKey({ columns: [table.notificationId], name: "notifications_notification_id" })
  ]
);
var syncedEvents = mysqlTable(
  "synced_events",
  {
    id: int().autoincrement().notNull(),
    localEventId: int("local_event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
    googleEventId: varchar("google_event_id", { length: 255 }).notNull(),
    lastSynced: datetime("last_synced", { mode: "string" }).default(sql`(CURRENT_TIMESTAMP)`)
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "synced_events_id" }),
    unique("local_event_id").on(table.localEventId)
  ]
);
var systemSettings = mysqlTable(
  "system_settings",
  {
    settingKey: varchar("setting_key", { length: 255 }).notNull(),
    settingValue: text("setting_value"),
    description: varchar({ length: 255 }),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().onUpdateNow()
  },
  (table) => [
    primaryKey({ columns: [table.settingKey], name: "system_settings_setting_key" })
  ]
);
var employeeDirectory = mysqlView("employee_directory", {
  id: int().default(0).notNull(),
  employeeId: varchar("employee_id", { length: 50 }).notNull(),
  rfidCardUid: varchar("rfid_card_uid", { length: 50 }),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  fullName: varchar("full_name", { length: 201 }),
  email: varchar({ length: 255 }).notNull(),
  role: varchar({ length: 50 }).notNull(),
  jobTitle: varchar("job_title", { length: 100 }),
  employmentStatus: mysqlEnum("employment_status", ["Active", "Probationary", "Terminated", "Resigned", "On Leave", "Suspended", "Verbal Warning", "Written Warning", "Show Cause"]).default("Active"),
  avatarUrl: varchar("avatar_url", { length: 500 }),
  departmentId: int("department_id").default(0),
  departmentName: varchar("department_name", { length: 100 }),
  departmentLocation: varchar("department_location", { length: 255 }),
  phoneNumber: varchar("phone_number", { length: 20 }),
  positionTitle: varchar("position_title", { length: 100 })
}).algorithm("undefined").sqlSecurity("definer").as(sql`select \`a\`.\`id\` AS \`id\`,\`a\`.\`employee_id\` AS \`employee_id\`,\`a\`.\`rfid_card_uid\` AS \`rfid_card_uid\`,\`a\`.\`first_name\` AS \`first_name\`,\`a\`.\`last_name\` AS \`last_name\`,concat(\`a\`.\`first_name\`,' ',\`a\`.\`last_name\`) AS \`full_name\`,\`a\`.\`email\` AS \`email\`,\`a\`.\`role\` AS \`role\`,\`a\`.\`job_title\` AS \`job_title\`,\`a\`.\`employment_status\` AS \`employment_status\`,\`a\`.\`avatar_url\` AS \`avatar_url\`,\`d\`.\`id\` AS \`department_id\`,\`d\`.\`name\` AS \`department_name\`,\`d\`.\`location\` AS \`department_location\`,\`a\`.\`phone_number\` AS \`phone_number\`,\`a\`.\`position_title\` AS \`position_title\` from (\`chrmo_db\`.\`authentication\` \`a\` left join \`chrmo_db\`.\`departments\` \`d\` on((\`a\`.\`department_id\` = \`d\`.\`id\`))) where (\`a\`.\`employment_status\` <> 'Terminated')`);
var addressRefBarangays = mysqlTable(
  "address_ref_barangays",
  {
    id: int().autoincrement().notNull(),
    name: varchar({ length: 100 }).notNull(),
    zipCode: varchar("zip_code", { length: 10 }).notNull()
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "address_ref_barangays_id" }),
    unique("unique_barangay_name").on(table.name)
  ]
);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  addressRefBarangays,
  announcements,
  attendanceLogs,
  authentication,
  bioAttendanceLogs,
  bioEnrolledUsers,
  budgetAllocation,
  chatConversations,
  chatMessages,
  contactInquiries,
  dailyTimeRecords,
  departments,
  dtrCorrections,
  employeeCustomFields,
  employeeDirectory,
  employeeDocuments,
  employeeEducation,
  employeeEmergencyContacts,
  employeeEmploymentHistory,
  employeeMemos,
  employeeNotes,
  employeeSkills,
  events,
  fingerprints,
  googleCalendarTokens,
  holidays,
  internalPolicies,
  leaveApplications,
  leaveBalances,
  leaveCredits,
  leaveLedger,
  leaveMonetizationRequests,
  leaveRequests,
  lwopSummary,
  memoSequences,
  nepotismRelationships,
  notifications,
  pdsEducation,
  pdsEligibility,
  pdsFamily,
  pdsLearningDevelopment,
  pdsOtherInfo,
  pdsReferences,
  pdsVoluntaryWork,
  pdsWorkExperience,
  performanceAuditLog,
  performanceCriteria,
  performanceGoals,
  performanceImprovementPlans,
  performanceReviewCycles,
  performanceReviewItems,
  performanceReviews,
  performanceTemplates,
  plantillaAuditLog,
  plantillaPositionHistory,
  plantillaPositions,
  policyViolations,
  positionPublications,
  qualificationStandards,
  recruitmentApplicants,
  recruitmentEmailTemplates,
  recruitmentJobs,
  salarySchedule,
  salaryTranches,
  schedules,
  serviceRecords,
  socialConnections,
  stepIncrementTracker,
  syncedEvents,
  systemSettings,
  tardinessSummary
});
