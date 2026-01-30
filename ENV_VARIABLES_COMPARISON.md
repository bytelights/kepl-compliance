# 📁 Environment Variables - Frontend vs Backend

## **Summary of What Each Project Needs**

---

## 🎨 **FRONTEND** (`apps/frontend-angular/.env.example`)

### **✅ Variables Needed: 4 Total**

```env
# Microsoft Entra ID
MICROSOFT_CLIENT_ID="your-client-id"
MICROSOFT_TENANT_ID="your-tenant-id"
MICROSOFT_REDIRECT_URI="http://localhost:4200"

# Backend API
BACKEND_API_URL="http://localhost:3000"
```

### **Purpose:**

| Variable | Used For | Required? |
|----------|----------|-----------|
| `MICROSOFT_CLIENT_ID` | MSAL browser authentication (currently not used, backend handles auth) | ⚠️ Optional |
| `MICROSOFT_TENANT_ID` | MSAL configuration (currently not used) | ⚠️ Optional |
| `MICROSOFT_REDIRECT_URI` | Frontend redirect (currently not used) | ⚠️ Optional |
| `BACKEND_API_URL` | API calls to backend | ✅ **Required** |

**Note:** The frontend currently uses backend-only authentication (OAuth redirect flow), so Microsoft variables are optional. Only `BACKEND_API_URL` is actually used.

---

## 🔧 **BACKEND** (`apps/backend-nest/.env.example`)

### **✅ Variables Needed: 16 Total**

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/compliance_db"

# Microsoft Entra ID (Azure AD)
MICROSOFT_CLIENT_ID="your-client-id"
MICROSOFT_CLIENT_SECRET="your-client-secret"
MICROSOFT_TENANT_ID="your-tenant-id"
MICROSOFT_REDIRECT_URI="http://localhost:3000/auth/microsoft/callback"

# SharePoint (for evidence file uploads)
SHAREPOINT_TENANT_ID="your-tenant-id"
SHAREPOINT_SITE_ID="your-sharepoint-site-id"
SHAREPOINT_DRIVE_ID="your-document-library-drive-id"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Session
SESSION_SECRET="your-super-secret-session-key-change-this-in-production"

# App
NODE_ENV="development"
PORT=3000
FRONTEND_URL="http://localhost:4200"

# Encryption (for sensitive config values)
ENCRYPTION_KEY="your-32-character-encryption-key-change-this"

# Default Workspace
DEFAULT_WORKSPACE_ID="00000000-0000-0000-0000-000000000001"
```

---

## 📊 **Complete Backend Variables Breakdown**

### **🗄️ Database (1)**

| Variable | Required | Used For |
|----------|----------|----------|
| `DATABASE_URL` | ✅ **YES** | All data storage - users, tasks, audit logs, etc. |

---

### **🔐 Authentication (4)**

| Variable | Required | Used For |
|----------|----------|----------|
| `MICROSOFT_CLIENT_ID` | ✅ **YES** | Microsoft SSO login + SharePoint access |
| `MICROSOFT_CLIENT_SECRET` | ✅ **YES** | OAuth token exchange + SharePoint auth |
| `MICROSOFT_TENANT_ID` | ✅ **YES** | Organization identification |
| `MICROSOFT_REDIRECT_URI` | ✅ **YES** | OAuth callback URL |

---

### **📁 SharePoint (3) - FOR EVIDENCE FILE UPLOADS**

| Variable | Required | Used For | Can Configure Later? |
|----------|----------|----------|---------------------|
| `SHAREPOINT_TENANT_ID` | ⚠️ **For file uploads** | SharePoint API authentication | ✅ Yes, same as MICROSOFT_TENANT_ID |
| `SHAREPOINT_SITE_ID` | ⚠️ **For file uploads** | Which SharePoint site to use | ✅ Yes, via Admin UI |
| `SHAREPOINT_DRIVE_ID` | ⚠️ **For file uploads** | Which document library to use | ✅ Yes, via Admin UI |

**Important:** 
- ✅ **App works WITHOUT these** - You can skip evidence uploads initially
- ✅ **Configurable via Admin UI** - Can set later at `/admin/integrations`
- ✅ **Used in:** `apps/backend-nest/src/evidence/sharepoint.service.ts`

---

### **🔑 Security (3)**

| Variable | Required | Used For |
|----------|----------|----------|
| `JWT_SECRET` | ✅ **YES** | User session tokens |
| `JWT_EXPIRES_IN` | ⚠️ Optional (default 7d) | Token expiration |
| `ENCRYPTION_KEY` | ⚠️ **For Teams integration** | Encrypting webhook URLs in DB |

---

### **🖥️ Application (4)**

| Variable | Required | Used For |
|----------|----------|----------|
| `NODE_ENV` | ⚠️ Optional (default dev) | Environment mode |
| `PORT` | ⚠️ Optional (default 3000) | Backend server port |
| `FRONTEND_URL` | ✅ **YES** | OAuth redirects + CORS |
| `DEFAULT_WORKSPACE_ID` | ✅ **YES** | User workspace assignment |

---

## 🎯 **What You MUST Configure to Start**

### **Minimum Required (App will run):**

```env
# Backend MUST have:
DATABASE_URL="..."                    # ✅ REQUIRED
MICROSOFT_CLIENT_ID="..."             # ✅ REQUIRED  
MICROSOFT_CLIENT_SECRET="..."         # ✅ REQUIRED
MICROSOFT_TENANT_ID="..."             # ✅ REQUIRED
MICROSOFT_REDIRECT_URI="..."          # ✅ REQUIRED
JWT_SECRET="..."                      # ✅ REQUIRED
FRONTEND_URL="http://localhost:4200"  # ✅ REQUIRED
DEFAULT_WORKSPACE_ID="..."            # ✅ REQUIRED

# Frontend MUST have:
BACKEND_API_URL="http://localhost:3000"  # ✅ REQUIRED
```

### **Can Skip Initially (Add Later):**

```env
# SharePoint (for file uploads) - configure via Admin UI later
SHAREPOINT_TENANT_ID="..."   # ⏭️ Skip initially
SHAREPOINT_SITE_ID="..."     # ⏭️ Skip initially
SHAREPOINT_DRIVE_ID="..."    # ⏭️ Skip initially

# Encryption (for Teams integration)
ENCRYPTION_KEY="..."         # ⏭️ Skip initially
```

---

## 🔍 **SharePoint Keys - Where They're Used**

### **Files That Use SharePoint Variables:**

1. **`apps/backend-nest/src/evidence/sharepoint.service.ts`**
   - Lines 18-30: Client credential authentication
   - Uses: `SHAREPOINT_TENANT_ID`, `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`

2. **`apps/backend-nest/src/evidence/evidence.service.ts`**
   - Calls SharePoint service for file operations
   - Uses: `SHAREPOINT_SITE_ID`, `SHAREPOINT_DRIVE_ID`

3. **`apps/backend-nest/src/integrations/integrations.service.ts`**
   - Admin UI configuration storage
   - Can update SharePoint settings at runtime

### **Functionality Affected:**
- ✅ **Evidence File Uploads** - `POST /tasks/:taskId/evidence/upload-session`
- ✅ **Evidence Management** - Viewing/deleting uploaded files
- ✅ **Task Completion** - Requires evidence files

### **What Happens Without SharePoint Keys:**
- ❌ Users cannot upload evidence files
- ❌ Tasks cannot be completed (requires evidence)
- ✅ Everything else works (login, view tasks, create tasks, etc.)

---

## 📝 **Quick Setup Guide**

### **1. Start with Minimum Config:**

```bash
# Backend
cd apps/backend-nest
cp .env.example .env
# Edit .env with: DATABASE_URL, MICROSOFT_*, JWT_SECRET, FRONTEND_URL

# Frontend
cd apps/frontend-angular  
cp .env.example .env
# Edit .env with: BACKEND_API_URL
```

### **2. Test Basic Functionality:**
- ✅ Login works
- ✅ View dashboard
- ✅ Create tasks
- ✅ View tasks

### **3. Add SharePoint Later:**

**Option A: Via Environment Variables**
```bash
# Add to backend .env:
SHAREPOINT_TENANT_ID="..."
SHAREPOINT_SITE_ID="..."
SHAREPOINT_DRIVE_ID="..."
```

**Option B: Via Admin UI**
1. Login as admin
2. Go to `/admin/integrations`
3. Configure SharePoint settings
4. Test connection

---

## ✅ **Updated Files**

I've updated `apps/backend-nest/.env.example` to include SharePoint variables that were missing!

**What changed:**
- ✅ Added `SHAREPOINT_TENANT_ID`
- ✅ Added `SHAREPOINT_SITE_ID`  
- ✅ Added `SHAREPOINT_DRIVE_ID`
- ✅ Added comments explaining usage

---

## 🎯 **Summary Table**

| Variable | Frontend | Backend | Required? | Used For |
|----------|----------|---------|-----------|----------|
| `DATABASE_URL` | ❌ | ✅ | ✅ **YES** | All data storage |
| `MICROSOFT_CLIENT_ID` | ⚠️ | ✅ | ✅ **YES** | Login + SharePoint |
| `MICROSOFT_CLIENT_SECRET` | ❌ | ✅ | ✅ **YES** | OAuth tokens |
| `MICROSOFT_TENANT_ID` | ⚠️ | ✅ | ✅ **YES** | Organization ID |
| `MICROSOFT_REDIRECT_URI` | ⚠️ | ✅ | ✅ **YES** | OAuth callback |
| `SHAREPOINT_TENANT_ID` | ❌ | ✅ | ⚠️ For uploads | File storage auth |
| `SHAREPOINT_SITE_ID` | ❌ | ✅ | ⚠️ For uploads | SharePoint site |
| `SHAREPOINT_DRIVE_ID` | ❌ | ✅ | ⚠️ For uploads | Document library |
| `JWT_SECRET` | ❌ | ✅ | ✅ **YES** | User sessions |
| `FRONTEND_URL` | ❌ | ✅ | ✅ **YES** | Redirects |
| `BACKEND_API_URL` | ✅ | ❌ | ✅ **YES** | API calls |
| `ENCRYPTION_KEY` | ❌ | ✅ | ⚠️ For Teams | Config encryption |
| `DEFAULT_WORKSPACE_ID` | ❌ | ✅ | ✅ **YES** | User workspace |

---

**🎉 Now you have complete .env.example files in both projects with all necessary variables!**
