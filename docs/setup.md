# Compliance Management System - Setup Guide

## Prerequisites

- **Node.js**: >= 18.0.0
- **PNPM**: >= 8.0.0
- **PostgreSQL**: 14+ (or Supabase account)
- **Microsoft Entra ID (Azure AD)**: Application registration
- **SharePoint**: Access to a SharePoint site with a document library
- **Microsoft Teams**: Webhook URL for notifications

## 1. Initial Setup

### 1.1 Clone and Install Dependencies

```bash
# Navigate to project root
cd /path/to/compliance-management-system

# Install dependencies
pnpm install

# Approve build scripts for native dependencies
pnpm approve-builds
```

## 2. Database Setup (Supabase)

### 2.1 Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the database to be provisioned
4. Copy the connection string from Settings > Database > Connection String (Direct connection)

### 2.2 Configure Database URL

Create `.env` file in `apps/backend-nest/`:

```bash
cp apps/backend-nest/.env.example apps/backend-nest/.env
```

Update `DATABASE_URL`:
```
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-ID].supabase.co:5432/postgres"
```

### 2.3 Run Migrations

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed initial data
pnpm db:seed
```

This will create:
- Default workspace
- Admin user: `admin@example.com`
- Reviewer user: `reviewer@example.com`
- Sample master data (entity, department, law)

## 3. Microsoft Entra ID (Azure AD) Setup

### 3.1 Register Application

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Microsoft Entra ID** > **App registrations**
3. Click **New registration**
   - **Name**: Compliance Management System
   - **Supported account types**: Single tenant
   - **Redirect URI**: 
     - Type: Web
     - URI: `http://localhost:3000/auth/microsoft/callback`
4. Click **Register**

### 3.2 Configure Authentication

1. Go to **Authentication** in your app registration
2. Under **Implicit grant and hybrid flows**, enable:
   - ✅ ID tokens
3. Under **Platform configurations** > Web:
   - Add Redirect URI: `http://localhost:4200` (for frontend)
4. Save changes

### 3.3 Create Client Secret

1. Go to **Certificates & secrets**
2. Click **New client secret**
   - **Description**: Backend API
   - **Expires**: Choose expiration period
3. **Copy the secret value immediately** (you can't view it again)

### 3.4 Configure Backend Environment

Update `apps/backend-nest/.env`:

```env
MICROSOFT_CLIENT_ID="your-application-client-id"
MICROSOFT_CLIENT_SECRET="your-client-secret-value"
MICROSOFT_TENANT_ID="your-tenant-id"
MICROSOFT_REDIRECT_URI="http://localhost:3000/auth/microsoft/callback"
```

Find these values:
- **Client ID**: Overview page (Application/Client ID)
- **Tenant ID**: Overview page (Directory/Tenant ID)
- **Client Secret**: The value you copied

### 3.5 Configure Frontend Environment

Create `apps/frontend-angular/.env`:

```env
MICROSOFT_CLIENT_ID="your-application-client-id"
MICROSOFT_TENANT_ID="your-tenant-id"
MICROSOFT_REDIRECT_URI="http://localhost:4200"
BACKEND_API_URL="http://localhost:3000"
```

### 3.6 Grant API Permissions (for SharePoint)

1. Go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Select **Application permissions**
5. Add these permissions:
   - `Sites.ReadWrite.All` (for SharePoint access)
   - `Files.ReadWrite.All` (for file management)
6. Click **Grant admin consent** (requires admin privileges)

## 4. SharePoint Configuration

### 4.1 Get SharePoint IDs

You'll need:
- **Tenant ID**: From Azure AD (same as above)
- **Site ID**: SharePoint site identifier
- **Drive ID**: Document library identifier

#### Get Site ID:

```bash
# Using Microsoft Graph Explorer (https://developer.microsoft.com/en-us/graph/graph-explorer)
GET https://graph.microsoft.com/v1.0/sites/{your-site-domain}.sharepoint.com:/sites/{site-name}

# Response includes site ID
```

#### Get Drive ID:

```bash
GET https://graph.microsoft.com/v1.0/sites/{site-id}/drives

# Use the ID of your "Documents" library
```

### 4.2 Configure Backend

Update `apps/backend-nest/.env`:

```env
SHAREPOINT_TENANT_ID="your-tenant-id"
SHAREPOINT_SITE_ID="your-site-id"
SHAREPOINT_DRIVE_ID="your-drive-id"
```

### 4.3 Configure in Admin UI

Once the app is running:
1. Login as admin
2. Go to **Settings** > **Integrations** > **SharePoint**
3. Enter configuration values
4. Click **Test Connection**
5. Save configuration

## 5. Microsoft Teams Setup

### 5.1 Create Incoming Webhook

1. Open Microsoft Teams
2. Navigate to the channel where you want reports
3. Click **⋯** (More options) > **Workflows**
4. Choose **Post to a channel when a webhook request is received**
5. Configure the workflow:
   - **Team**: Select your team
   - **Channel**: Select the channel
6. Copy the webhook URL

### 5.2 Configure Backend

Update `apps/backend-nest/.env` or configure in Admin UI:

```env
# These will be stored in the database configs table
TEAMS_WEBHOOK_URL="your-webhook-url"
WEEKLY_REPORT_DAY=1  # Monday (0=Sunday, 1=Monday, etc.)
WEEKLY_REPORT_TIME="09:00"
TIMEZONE="Asia/Kolkata"
```

### 5.3 Configure in Admin UI

1. Login as admin
2. Go to **Settings** > **Integrations** > **Teams**
3. Enter webhook URL
4. Configure schedule (day of week, time, timezone)
5. Click **Test Webhook**
6. Save configuration

## 6. Security Configuration

### 6.1 Generate Secrets

Generate strong random secrets for production:

```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate session secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate encryption key (32 characters)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

### 6.2 Update Environment

```env
JWT_SECRET="your-generated-jwt-secret"
SESSION_SECRET="your-generated-session-secret"
ENCRYPTION_KEY="your-generated-encryption-key"
```

## 7. Pre-seed Admin and Reviewer Users

Before first login, pre-seed users who should have admin/reviewer roles:

### Option 1: Via Database Seed Script

Edit `apps/backend-nest/prisma/seed.ts` and update emails:

```typescript
// Change these to actual user emails
email: 'your-admin@company.com',
email: 'your-reviewer@company.com',
```

Run seed again:
```bash
pnpm db:seed
```

### Option 2: Via Database Insert

```sql
INSERT INTO users (id, workspace_id, email, name, role, is_active)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  'admin@yourcompany.com',
  'Admin Name',
  'admin',
  true
);
```

## 8. Running the Application

### 8.1 Development Mode

Run both frontend and backend:

```bash
# From project root
pnpm dev
```

Or run separately:

```bash
# Backend only (port 3000)
pnpm backend:dev

# Frontend only (port 4200)
pnpm frontend:dev
```

### 8.2 Access the Application

- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:3000
- **Prisma Studio**: Run `pnpm db:studio` to open at http://localhost:5555

### 8.3 First Login

1. Navigate to http://localhost:4200
2. Click **Sign in with Microsoft**
3. Authenticate with your Microsoft account
4. If your email is pre-seeded, you'll have admin/reviewer role
5. Otherwise, you'll be created as a task_owner by default

## 9. Verification Checklist

- [ ] Database connection working
- [ ] Migrations applied successfully
- [ ] Microsoft SSO authentication working
- [ ] Admin user can login and access admin pages
- [ ] SharePoint connection test passes
- [ ] Teams webhook test sends message successfully
- [ ] CSV import preview works
- [ ] File upload to SharePoint works
- [ ] Task completion flow works
- [ ] Weekly report scheduler configured

## 10. Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL

# Check Prisma connection
pnpm --filter backend-nest db:studio
```

### Microsoft SSO Issues

- Verify Redirect URIs match exactly (including http/https)
- Ensure ID tokens are enabled in Azure AD
- Check client secret hasn't expired
- Verify tenant ID is correct

### SharePoint Issues

- Ensure API permissions are granted with admin consent
- Verify site ID and drive ID are correct
- Check application has Sites.ReadWrite.All permission
- Test connection using Graph Explorer first

### Teams Webhook Issues

- Verify webhook URL is complete and correct
- Test webhook manually using curl:

```bash
curl -H "Content-Type: application/json" -d '{"text": "Test message"}' YOUR_WEBHOOK_URL
```

## 11. Production Deployment

### Environment Variables

Ensure all production values are set:
- Use HTTPS URLs for all redirects
- Generate new secrets (don't use dev secrets)
- Use production database connection string
- Update CORS settings in backend

### Database

```bash
# Run migrations in production
pnpm --filter backend-nest db:migrate:deploy
```

### Build

```bash
# Build backend
pnpm --filter backend-nest build

# Build frontend
pnpm --filter frontend-angular build
```

### Security Checklist

- [ ] All secrets rotated for production
- [ ] HTTPS enabled for all endpoints
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Database backups configured
- [ ] Audit logs reviewed
- [ ] API permissions minimal
- [ ] Environment variables secured
- [ ] Cookie settings: secure, httpOnly, sameSite

## 12. Admin Tasks

### Add New Admin/Reviewer

1. Login as admin
2. Go to **Users** page
3. Wait for user to login once (they'll be created as task_owner)
4. Change their role to admin/reviewer

### CSV Import

1. Prepare CSV with required columns
2. Go to **Import** page
3. Upload and preview
4. Fix any errors
5. Commit import

### Configure Master Data

1. Go to **Master Data** section
2. Add Entities (Operating Units)
3. Add Departments
4. Add Laws
5. Add Legal Compliances (optional)

## 13. Support and Resources

- **Prisma Docs**: https://www.prisma.io/docs
- **NestJS Docs**: https://docs.nestjs.com
- **Angular Docs**: https://angular.io/docs
- **Microsoft Graph API**: https://docs.microsoft.com/en-us/graph
- **Supabase Docs**: https://supabase.com/docs

## 14. Default Credentials (Development Only)

After running seed:
- **Admin**: admin@example.com
- **Reviewer**: reviewer@example.com

⚠️ **Important**: Change these emails in seed script before deploying to production!
