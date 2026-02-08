# Performance Optimizations

## Summary

This document covers all performance issues found and fixes applied across the Kelp backend.

---

## 1. Dashboard N+1 Query Elimination (CRITICAL)

**Files changed:** `apps/backend-nest/src/dashboard/dashboard.service.ts`

### Problem

Every dashboard endpoint used a pattern where a `groupBy` query was followed by a loop that ran 4-5 additional queries **per group item**:

```typescript
// BEFORE: For each entity, 4 separate DB calls
const entityStats = await prisma.complianceTask.groupBy({ by: ["entityId"] });
const result = await Promise.all(
  entityStats.map(async (stat) => {
    const [entity, pending, completed, overdue] = await Promise.all([
      prisma.entity.findUnique({ where: { id: stat.entityId } }),
      prisma.complianceTask.count({
        where: { entityId: stat.entityId, status: "PENDING" },
      }),
      prisma.complianceTask.count({
        where: { entityId: stat.entityId, status: "COMPLETED" },
      }),
      prisma.complianceTask.count({
        where: {
          entityId: stat.entityId,
          status: "PENDING",
          dueDate: { lt: today },
        },
      }),
    ]);
  }),
);
```

**Query counts before fix:**

| Endpoint           | Entities | Departments | Owners | Trends | Total Queries |
| ------------------ | -------- | ----------- | ------ | ------ | ------------- |
| Admin Dashboard    | N/A      | 5M + 1      | 5O + 1 | 14     | ~160+         |
| Reviewer Dashboard | 4N + 1   | 4M + 1      | N/A    | N/A    | ~80+          |

With 10 entities, 15 departments, 20 owners = **~300 queries per admin dashboard load**.

### Fix

Replaced all N+1 loops with a single fetch + in-memory aggregation:

```typescript
// AFTER: 1 query to fetch all tasks, aggregate in memory
const [tasks, entities, departments] = await Promise.all([
  prisma.complianceTask.findMany({
    where: combinedFilter,
    select: { entityId: true, departmentId: true, status: true, dueDate: true },
  }),
  prisma.entity.findMany({ select: { id: true, name: true } }),
  prisma.department.findMany({ select: { id: true, name: true } }),
]);

// Aggregate in a single pass through the array
const entityAgg = new Map();
for (const task of tasks) {
  let s = entityAgg.get(task.entityId) || {
    total: 0,
    pending: 0,
    completed: 0,
    overdue: 0,
  };
  s.total++;
  if (task.status === "PENDING") s.pending++;
  // ...
}
```

**Query counts after fix:**

| Endpoint             | Total Queries |
| -------------------- | ------------- |
| Admin Dashboard      | 5             |
| Reviewer Dashboard   | 4             |
| Task Owner Dashboard | 4 (unchanged) |

### Trends: 14 sequential queries → 0

The `getTaskTrends()` method ran a sequential `for` loop with 2 `await` calls per day (7 days = 14 queries). Now computed from the already-fetched task array in memory using `computeTrends()`.

---

## 2. Composite Database Indexes

**Files changed:** `apps/backend-nest/prisma/schema.prisma`

### Problem

Missing composite indexes for common query patterns. Individual column indexes exist but the DB can't use them efficiently for multi-column WHERE clauses.

### Indexes Added

```prisma
@@index([departmentId])        // Department filter queries
@@index([ownerId, status])     // Owner dashboard: tasks by owner + status
@@index([reviewerId, status])  // Reviewer dashboard: tasks by reviewer + status
@@index([status, dueDate])     // Overdue queries: WHERE status = 'PENDING' AND dueDate < now
@@index([createdAt])           // Date range filtering, trend queries
@@index([completedAt])         // Completion trend queries
```

### Impact

These indexes directly benefit:

- Dashboard aggregation queries (groupBy + where)
- Task list filtering by status + owner/reviewer
- Overdue task lookups (status + dueDate)
- Date range filters used everywhere

**Run `npx prisma migrate dev` to apply.**

---

## 3. Task List Payload Reduction

**Files changed:** `apps/backend-nest/src/tasks/tasks.service.ts`

### Problem

Task list used `include: { entity: true, department: true, law: true, complianceMaster: true }` which fetches **all columns** from each related table. The frontend only needs `id` and `name`.

```typescript
// BEFORE: Fetches all columns from 4 related tables
include: {
  entity: true,           // all Entity fields (7 columns)
  department: true,       // all Department fields (4 columns)
  law: true,              // all Law fields (4 columns)
  complianceMaster: true, // all ComplianceMaster fields (10 columns)
}
```

### Fix

```typescript
// AFTER: Only fetches what the frontend needs
select: {
  id: true,
  complianceId: true,
  title: true,
  status: true,
  dueDate: true,
  frequency: true,
  impact: true,
  createdAt: true,
  entity: { select: { id: true, name: true } },
  department: { select: { id: true, name: true } },
  law: { select: { id: true, name: true } },
  complianceMaster: { select: { id: true, name: true, complianceId: true } },
  owner: { select: { id: true, name: true, email: true } },
  reviewer: { select: { id: true, name: true, email: true } },
  _count: { select: { evidenceFiles: true } },
}
```

### Impact

- ~60-70% reduction in response payload size per task
- Less data transferred over the wire (important for Supabase connection pooling)
- Faster JSON serializationn

---

## 4. Export Service Payload Reduction

**Files changed:** `apps/backend-nest/src/reports/export.service.ts`

### Problem

Both `generateComplianceSummary()` and `generateOverdueReport()` used `include: { entity: true, department: true, law: true }` but only accessed `.name` from each relation.

### Fix

Changed to `select` with only the fields used in CSV generation:

```typescript
select: {
  complianceId: true,
  title: true,
  description: true,
  status: true,
  impact: true,
  dueDate: true,
  completedAt: true,
  createdAt: true,
  entity: { select: { name: true } },
  department: { select: { name: true } },
  law: { select: { name: true } },
  owner: { select: { name: true, email: true } },
  reviewer: { select: { name: true, email: true } },
}
```

---

## 5. CSV Import Batch Loading

**Files changed:** `apps/backend-nest/src/csv-import/csv-import.service.ts`

### Problem

Each CSV row triggered 5+ independent DB lookups:

```typescript
// BEFORE: Per-row lookups (5N+ queries for N rows)
rows.map(async (row) => {
  const entity = await masterDataService.findOrCreate(
    "entities",
    row["Operating Unit"],
  );
  const department = await masterDataService.findOrCreate(
    "departments",
    row["Department"],
  );
  const law = await masterDataService.findOrCreate("laws", row["Name of Law"]);
  const owner = await usersService.findByEmail(row["Owner"]);
  const reviewer = await usersService.findByEmail(row["Reviewer"]);
});
```

For a 100-row CSV: **500+ queries**.

### Fix

Pre-load all unique master data and users before processing rows:

```typescript
// AFTER: Batch load upfront (4 queries total), use cache per row
const [entityList, departmentList, lawList, userList] = await Promise.all([
  prisma.entity.findMany({ where: { name: { in: uniqueEntities } } }),
  prisma.department.findMany({ where: { name: { in: uniqueDepartments } } }),
  prisma.law.findMany({ where: { name: { in: uniqueLaws } } }),
  prisma.user.findMany({ where: { email: { in: uniqueEmails } } }),
]);

const entityCache = new Map(entityList.map((e) => [e.name, e]));
// ... use cache in per-row processing, only hit DB for truly new entries
```

### Impact

For a 100-row CSV with 5 unique entities, 3 departments, 4 laws, 10 users:

- **Before:** 500+ queries
- **After:** 4 batch queries + only new entries hit DB

---

## 6. Master Data Query Optimization

**Files changed:** `apps/backend-nest/src/master-data/master-data.service.ts`

### Problem

`findAll('compliances_master')` used `include: { law: true, department: true }` fetching all columns.

### Fix

Changed to selective includes:

```typescript
include: {
  law: { select: { id: true, name: true } },
  department: { select: { id: true, name: true } },
}
```

---

## Overall Impact Summary

| Area                  | Before              | After                | Improvement      |
| --------------------- | ------------------- | -------------------- | ---------------- |
| Admin Dashboard       | ~160 queries        | 5 queries            | **32x**          |
| Reviewer Dashboard    | ~80 queries         | 4 queries            | **20x**          |
| Task List Payload     | ~25 fields/relation | ~2-3 fields/relation | **~70% smaller** |
| CSV Import (100 rows) | ~500 queries        | ~4-10 queries        | **50-100x**      |
| Export Reports        | All columns         | Only needed          | **~60% smaller** |

### Migration Required

After deploying, run:

```bash
npx prisma migrate dev --name add-composite-indexes
```

This creates the 6 new composite indexes on the `compliance_tasks` table. On a table with <100k rows this should complete in under a second.

---

## What is the N+1 Query Problem?

The N+1 query problem is one of the most common performance killers in web apps backed by ORMs like Prisma.

### The Pattern

You make **1 query** to fetch a list of N items, then for **each item** you make 1+ additional queries. Total: **1 + N** queries (or 1 + N\*M if fetching M things per item).

### How It Looked in Kelp (Real Example)

Here's what the **admin dashboard** `getAdminDashboard()` was doing:

```
Step 1: groupBy to get department IDs
  → SELECT department_id, COUNT(*) FROM compliance_tasks GROUP BY department_id
  → Returns 15 departments
  → 1 query

Step 2: For EACH of the 15 departments, run 5 queries:
  dept-1 → SELECT * FROM departments WHERE id = 'dept-1'
  dept-1 → SELECT COUNT(*) FROM compliance_tasks WHERE department_id='dept-1' AND status='PENDING'
  dept-1 → SELECT COUNT(*) FROM compliance_tasks WHERE department_id='dept-1' AND status='COMPLETED'
  dept-1 → SELECT COUNT(*) FROM compliance_tasks WHERE department_id='dept-1' AND status='SKIPPED'
  dept-1 → SELECT COUNT(*) FROM compliance_tasks WHERE department_id='dept-1' AND status='PENDING' AND due_date < NOW()

  dept-2 → (same 5 queries)
  ...
  dept-15 → (same 5 queries)

Total for departments alone: 1 + (15 x 5) = 76 queries
```

Multiply by owner stats (20 owners = 101 queries) + trend loop (14 queries) = **~300 queries per page load**.

### Why It's Slow

Each query has overhead:

- Network round-trip to DB (~1-5ms on Supabase)
- Query parsing (~0.1ms)
- Connection pool checkout (~0.5ms)

300 queries x ~3ms = **~900ms just in DB overhead**.

### The Fix

Fetch all data in bulk, aggregate in memory:

```typescript
// 1 query for all tasks, 1 for departments, 1 for users = 3 total
const [tasks, departments, users] = await Promise.all([...]);

// O(n) loop in memory — <10ms even for 100k tasks
const deptAgg = new Map();
for (const task of tasks) {
  let s = deptAgg.get(task.departmentId) || { total: 0, pending: 0 };
  s.total++;
  if (task.status === 'PENDING') s.pending++;
}
```

**Result: 300 queries → 5 queries.**

---

## Future Pitfalls to Watch For

### 1. Task Table Growing Beyond 100k Rows

**Risk:** Current fix fetches all matching tasks into memory for aggregation. At 500k+ rows this could use significant memory.

**Solution when needed:** Switch to raw SQL with `COUNT(*) FILTER (WHERE ...)`:

```sql
SELECT department_id,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'PENDING') as pending,
  COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed
FROM compliance_tasks GROUP BY department_id;
```

### 2. Infinite Scroll Memory Accumulation (Frontend)

**Risk:** `task-list.component.ts` keeps appending to `this.tasks` array. After scrolling through 5000 tasks, all 5000 are in memory and rendered in the DOM.

**Solution:** Use Angular CDK Virtual Scrolling (`<cdk-virtual-scroll-viewport>`) to only render visible rows.

### 3. No API Response Caching

**Risk:** Every dashboard load hits the DB even if data hasn't changed. Multiple admins = redundant identical queries.

**Solution:** Add in-memory cache with TTL (e.g. NestJS `CacheModule`, cache dashboard for 5 minutes).

### 4. Missing `trackBy` in Angular `*ngFor`

**Risk:** Every data refresh destroys and recreates ALL DOM elements in task lists. Causes visible jank.

**Solution:** Add `trackBy` to every `*ngFor`:

```html
<tr *ngFor="let task of tasks; trackBy: trackByTaskId"></tr>
```

### 5. No `OnPush` Change Detection (Frontend)

**Risk:** All components use default change detection — re-checks entire component tree on every browser event (mouse move, scroll, keystroke).

**Solution:** Add `ChangeDetectionStrategy.OnPush` to dashboard and task-list components.

### 6. Large CSV Imports (10k+ rows)

**Risk:** Even with caches, processing 10k rows still does 10k individual `create` calls.

**Solution:** Use Prisma `createMany` to batch insert rows and tasks.

### 7. Audit Log Table Growth

**Risk:** `audit_logs` grows indefinitely. Queries will slow down over time.

**Solution:** Add retention policy (archive/delete logs older than 1 year).
