# WORKSPACE REMOVAL - CONTINUATION GUIDE

**Current Status:** 75% Complete - All Services Done ✅

---

## ✅ WHAT'S COMPLETED

### 1. Prisma Schema - DONE
- Workspace model removed
- workspaceId removed from all 13 models
- All indexes and constraints updated

### 2. Backend Interfaces - DONE
- JwtPayload updated (no workspaceId)
- Auth service updated (no DEFAULT_WORKSPACE_ID)

### 3. ALL Backend Services - DONE (10 files)
All service methods now work without workspaceId parameter

### 4. DTOs - DONE
- create-user.dto.ts updated

---

## ⏳ REMAINING WORK (25%)

### CRITICAL: Update All Controllers

**Pattern to follow for EVERY controller:**

```typescript
// BEFORE:
@Get()
async getAll(@CurrentUser() user: JwtPayload) {
  return this.service.findAll(user.workspaceId);
}

// AFTER:
@Get()
async getAll() {
  return this.service.findAll();
}
```

**Controllers to Update (15 files):**

1. **tasks.controller.ts** (CRITICAL - most used)
   - Remove `user.workspaceId` from: findAll, findById, create, update, delete, completeTask, skipTask

2. **users.controller.ts**
   - Remove `user.workspaceId` from: findAll, updateRole

3. **master-data.controller.ts**
   - Remove `user.workspaceId` from: getAllEntities, getAllDepartments, getAllLaws, getAllCompliances
   - Remove from create/update/delete methods

4. **evidence.controller.ts**
   - Remove `user.workspaceId` from: createUploadSession, completeUpload, findAll, delete

5. **csv-import.controller.ts**
   - Remove `user.workspaceId` from: parseAndValidate, getImportJobs, getImportJobDetails

6. **audit.controller.ts**
   - Remove `user.workspaceId` from: findAll

7. **integrations.controller.ts**
   - Remove `user.workspaceId` from: updateSharePointConfig, getSharePointConfig, updateTeamsConfig, getTeamsConfig

8. **dashboard.controller.ts**
   - Remove `user.workspaceId` from: getTaskOwnerDashboard (keep userId), getReviewerDashboard, getAdminDashboard

9. **reports.controller.ts**
   - Remove `user.workspaceId` from: triggerWeeklyReport, testTeamsWebhook, exportComplianceSummary, exportDepartmentReport, exportOverdueTasks

10. **auth.controller.ts**
    - Already updated (auth.service handles it)

---

### Frontend Updates (Minimal)

**2 files only:**

1. **apps/frontend-angular/src/app/core/models/index.ts**
   ```typescript
   // Find and remove workspaceId from User interface if it exists
   export interface User {
     id: string;
     email: string;
     name: string;
     role: string;
     // workspaceId: string; ← Remove this line if exists
   }
   ```

2. **apps/frontend-angular/src/app/core/services/auth.service.ts**
   - Remove any workspaceId references from user model

---

### Environment Files

Remove DEFAULT_WORKSPACE_ID from:
1. `/Users/krishna/Documents/bytelights/kelp/apps/backend-nest/.env.example`
2. `/Users/krishna/Documents/bytelights/kelp/.env.example` (if it exists there)

---

### Generate Prisma Migration

**IMPORTANT:** Do this AFTER all code updates:

```bash
cd apps/backend-nest
npx prisma migrate dev --name remove_workspace
```

This will create a migration that:
- Drops workspace foreign keys
- Drops workspace_id columns
- Drops workspaces table
- Updates unique constraints

---

## ESTIMATED TIME

- Controllers update: 2-3 hours (systematic find-replace)
- Frontend: 15 minutes
- .env files: 5 minutes
- Migration + Testing: 1 hour

**Total remaining: 3-4 hours**

---

## TESTING CHECKLIST

After all updates:
- [ ] Backend compiles (`npm run build`)
- [ ] Frontend compiles (`npm run build`)
- [ ] Prisma migration runs successfully
- [ ] Can create user (Microsoft SSO)
- [ ] Can create task
- [ ] Can upload evidence
- [ ] Can view dashboard
- [ ] CSV import works
- [ ] Reports work

---

**You're 75% done! The hardest part (services) is complete. Controllers are systematic find-replace work.**
