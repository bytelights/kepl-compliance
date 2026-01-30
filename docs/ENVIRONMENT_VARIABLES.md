# Environment Variables Reference

## Complete List of Environment Variables

### Backend (`apps/backend-nest/.env`)

```env
# ============================================================================
# DATABASE
# ============================================================================
DATABASE_URL="postgresql://user:password@localhost:5432/compliance_db"
# For Supabase:
# DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres"

# ============================================================================
# MICROSOFT ENTRA ID (AZURE AD)
# ============================================================================
MICROSOFT_CLIENT_ID="your-application-client-id"
MICROSOFT_CLIENT_SECRET="your-client-secret-value"
MICROSOFT_TENANT_ID="your-tenant-id"
MICROSOFT_REDIRECT_URI="http://localhost:3000/auth/microsoft/callback"
# Production: "https://your-domain.com/auth/microsoft/callback"

# ============================================================================
# SHAREPOINT (for evidence file storage)
# ============================================================================
SHAREPOINT_SITE_ID="your-sharepoint-site-id"
SHAREPOINT_DRIVE_ID="your-document-library-drive-id"
# Note: These can also be configured via Admin UI after deployment

# ============================================================================
# JWT & SECURITY
# ============================================================================
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

JWT_EXPIRES_IN="7d"
# Options: "7d", "30d", "1h", etc.

SESSION_SECRET="your-super-secret-session-key-change-this-in-production"
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

ENCRYPTION_KEY="your-32-character-encryption-key"
# Generate with: node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
# Must be exactly 32 characters

# ============================================================================
# APPLICATION
# ============================================================================
NODE_ENV="development"
# Options: development, production

PORT=3000
# Backend server port

FRONTEND_URL="http://localhost:4200"
# Production: "https://your-domain.com"

# ============================================================================
# WORKSPACE
# ============================================================================
DEFAULT_WORKSPACE_ID="00000000-0000-0000-0000-000000000001"
# Default workspace UUID (created by seed script)
```

---

## Frontend (`apps/frontend-angular/.env`)

```env
# ============================================================================
# BACKEND API
# ============================================================================
BACKEND_API_URL="http://localhost:3000/api"
# Production: "https://api.your-domain.com/api"

# Note: Frontend environment variables are optional
# The environment.ts files handle configuration
```

---

## How to Get These Values

### 1. DATABASE_URL

#### Option A: Local PostgreSQL
```bash
# Install PostgreSQL
brew install postgresql  # macOS
# or
sudo apt-get install postgresql  # Linux

# Create database
createdb compliance_db

# Connection string format:
postgresql://username:password@localhost:5432/compliance_db
```

#### Option B: Supabase (Recommended)
1. Go to https://supabase.com
2. Create new project
3. Go to Settings → Database
4. Copy "Connection String (Direct)"
5. Replace `[YOUR-PASSWORD]` with your database password

Example:
```
postgresql://postgres:your-password@db.abc123xyz.supabase.co:5432/postgres
```

---

### 2. Microsoft Entra ID Values

#### Step-by-Step:

1. **Go to Azure Portal**
   - Navigate to https://portal.azure.com
   - Sign in with your Microsoft account

2. **Register Application**
   - Go to "Microsoft Entra ID"
   - Click "App registrations"
   - Click "New registration"
   - Enter:
     - Name: "Compliance Management System"
     - Supported account types: "Single tenant"
     - Redirect URI: Web → `http://localhost:3000/auth/microsoft/callback`
   - Click "Register"

3. **Get Client ID (Application ID)**
   - On the Overview page
   - Copy "Application (client) ID"
   - This is your `MICROSOFT_CLIENT_ID`

4. **Get Tenant ID**
   - On the Overview page
   - Copy "Directory (tenant) ID"
   - This is your `MICROSOFT_TENANT_ID`

5. **Create Client Secret**
   - Go to "Certificates & secrets"
   - Click "New client secret"
   - Description: "Backend API"
   - Expires: Choose duration (e.g., 24 months)
   - Click "Add"
   - **IMPORTANT**: Copy the "Value" immediately (you can't see it again!)
   - This is your `MICROSOFT_CLIENT_SECRET`

6. **Configure Authentication**
   - Go to "Authentication"
   - Under "Implicit grant and hybrid flows":
     - ✅ Enable "ID tokens"
   - Under "Platform configurations" → Web:
     - Add frontend URL: `http://localhost:4200`
   - Click "Save"

7. **Grant API Permissions** (for SharePoint)
   - Go to "API permissions"
   - Click "Add a permission"
   - Select "Microsoft Graph"
   - Select "Application permissions"
   - Add:
     - `Sites.ReadWrite.All`
     - `Files.ReadWrite.All`
   - Click "Grant admin consent for [Your Organization]"
   - Status should show green checkmarks

---

### 3. SharePoint Values

#### Get Site ID:

1. **Using Microsoft Graph Explorer**
   - Go to https://developer.microsoft.com/en-us/graph/graph-explorer
   - Sign in
   - Request:
     ```
     GET https://graph.microsoft.com/v1.0/sites/{your-site-domain}.sharepoint.com:/sites/{site-name}
     ```
   - Example:
     ```
     GET https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/ComplianceDocs
     ```
   - Copy the `id` field from response
   - This is your `SHAREPOINT_SITE_ID`

2. **Using PowerShell**
   ```powershell
   Connect-PnPOnline -Url "https://your-site.sharepoint.com/sites/YourSite" -Interactive
   Get-PnPSite | Select Id
   ```

#### Get Drive ID:

1. **Using Microsoft Graph Explorer**
   - Request:
     ```
     GET https://graph.microsoft.com/v1.0/sites/{site-id}/drives
     ```
   - Look for the drive named "Documents" or your document library name
   - Copy the `id` field
   - This is your `SHAREPOINT_DRIVE_ID`

2. **Direct in SharePoint**
   - Go to your SharePoint site
   - Navigate to the document library
   - Look at URL, it contains the drive ID after `/Forms/`

---

### 4. Generate Secure Secrets

#### JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### SESSION_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### ENCRYPTION_KEY:
```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

**Example outputs:**
```
JWT_SECRET="a1b2c3d4e5f6... (128 characters)"
SESSION_SECRET="x7y8z9w0v1u2... (128 characters)"
ENCRYPTION_KEY="9f8e7d6c5b4a... (32 characters)"
```

---

### 5. Teams Webhook (Optional - can configure later via UI)

1. **In Microsoft Teams:**
   - Go to the channel where you want reports
   - Click "..." (More options)
   - Select "Workflows"
   - Choose "Post to a channel when a webhook request is received"
   - Configure:
     - Team: Select your team
     - Channel: Select channel
   - Click "Add workflow"
   - Copy the webhook URL

2. **Configure in App:**
   - After deployment, login as admin
   - Go to Settings → Integrations → Teams
   - Paste webhook URL
   - Configure schedule
   - Save

---

## Example Complete .env File

```env
# Database
DATABASE_URL="postgresql://postgres:mypass123@db.xyz123.supabase.co:5432/postgres"

# Microsoft Entra ID
MICROSOFT_CLIENT_ID="a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d"
MICROSOFT_CLIENT_SECRET="abc123~DEF456.GHI789_JKL012"
MICROSOFT_TENANT_ID="9e8d7c6b-5a4f-3e2d-1c0b-9a8f7e6d5c4b"
MICROSOFT_REDIRECT_URI="http://localhost:3000/auth/microsoft/callback"

# SharePoint
SHAREPOINT_SITE_ID="contoso.sharepoint.com,abc123-def456,ghi789-jkl012"
SHAREPOINT_DRIVE_ID="b!xyz789abc123def456ghi789jkl012mno345pqr678stu901vwx234yz"

# Security
JWT_SECRET="f8e9d0c1b2a3940e5f6d7c8b9a0e1f2d3c4b5a6978e8d9c0b1a2f3e4d5c6b7a8990"
JWT_EXPIRES_IN="7d"
SESSION_SECRET="a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890"
ENCRYPTION_KEY="9f8e7d6c5b4a39281f0e9d8c7b6a5948"

# Application
NODE_ENV="development"
PORT=3000
FRONTEND_URL="http://localhost:4200"

# Workspace
DEFAULT_WORKSPACE_ID="00000000-0000-0000-0000-000000000001"
```

---

## Validation Checklist

Before running the application, verify:

- [ ] `DATABASE_URL` - Can connect with `psql $DATABASE_URL`
- [ ] `MICROSOFT_CLIENT_ID` - 36 character UUID format
- [ ] `MICROSOFT_CLIENT_SECRET` - Not empty, copied correctly
- [ ] `MICROSOFT_TENANT_ID` - 36 character UUID format
- [ ] `JWT_SECRET` - At least 64 characters long
- [ ] `SESSION_SECRET` - At least 64 characters long
- [ ] `ENCRYPTION_KEY` - Exactly 32 characters
- [ ] `SHAREPOINT_SITE_ID` - Obtained from Graph API
- [ ] `SHAREPOINT_DRIVE_ID` - Obtained from Graph API
- [ ] `FRONTEND_URL` - Matches your frontend URL

---

## Troubleshooting

### "Database connection failed"
- Check `DATABASE_URL` format
- Verify database is running
- Test with: `psql $DATABASE_URL`

### "Microsoft SSO fails"
- Verify all three Microsoft values are correct
- Check redirect URI matches exactly
- Ensure ID tokens enabled in Azure

### "Invalid encryption key"
- Must be exactly 32 characters
- Regenerate with the command above

### "SharePoint upload fails"
- Verify Site ID and Drive ID
- Check API permissions granted
- Test with Graph Explorer

---

**🎯 Once all environment variables are set, you're ready to run:**

```bash
pnpm db:migrate
pnpm db:seed
pnpm dev
```
