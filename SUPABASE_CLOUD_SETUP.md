# Supabase Cloud Setup Guide

This guide will help you migrate from local Supabase to Supabase Cloud for the Compliance Management System.

## Quick Reference - Get PostgreSQL URI

**Fast track to get your connection string:**

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click your project
3. Click **Settings** (gear icon) → **Database**
4. Scroll to **"Connection string"** section
5. Click **"URI"** tab
6. Copy the string and replace `[YOUR-PASSWORD]` with your database password

**Result format:**
```
postgresql://postgres:YourPassword@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
```

---

## Step 1: Create Supabase Cloud Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"Sign In"**
3. Sign up using:
   - GitHub account (recommended)
   - Email and password
   - Google account

## Step 2: Create New Project

1. After logging in, click **"New Project"**
2. Fill in the project details:
   - **Name**: `kelp-compliance` (or your preferred name)
   - **Database Password**: Create a strong password (SAVE THIS - you'll need it)
   - **Region**: Choose closest to your location (e.g., `Southeast Asia (Singapore)` or `US East (North Virginia)`)
   - **Pricing Plan**: Select **Free** tier (includes 500MB database, 1GB file storage, 2GB bandwidth)
3. Click **"Create new project"**
4. Wait 2-3 minutes for the project to provision

## Step 3: Get Connection Details

### 3.1 Get Database URL (PostgreSQL URI)

**Follow these exact steps:**

1. **Go to your Supabase project dashboard** at [https://supabase.com/dashboard](https://supabase.com/dashboard)

2. **Select your project** from the list (click on the project you just created)

3. **Open Settings:**
   - Look for the **gear icon (⚙️)** in the left sidebar at the bottom
   - Click on **"Settings"**

4. **Navigate to Database settings:**
   - In the Settings menu, click **"Database"** from the left submenu
   
5. **Find Connection String section:**
   - Scroll down until you see **"Connection string"** section
   - You'll see multiple tabs: **Prisma**, **URI**, **JDBC**, **Session pooler**

6. **Copy the URI format:**
   - Click on the **"URI"** tab
   - You'll see a connection string like:
     ```
     postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
     ```
   - Click the **copy icon** button next to it

7. **Replace the password placeholder:**
   - The copied string has `[YOUR-PASSWORD]` in it
   - Replace `[YOUR-PASSWORD]` with the **database password you created in Step 2**
   - Final format should look like:
     ```
     postgresql://postgres:YourActualPassword123@db.abcdefghijklmno.supabase.co:5432/postgres
     ```

**Example:**
```
Before: postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijklmno.supabase.co:5432/postgres
After:  postgresql://postgres:MySecret123!@db.abcdefghijklmno.supabase.co:5432/postgres
```

**Important Notes:**
- The project reference ID (the `xxxxxxxxxxxxx` part) is unique to your project
- Keep your password secure - don't share it or commit it to Git
- If you forgot your password, you can reset it in Settings → Database → "Reset Database Password"

### 3.2 Get API Keys (Optional - Skip if only using database)

**You can skip this step** since you're only using Supabase as a PostgreSQL database through Prisma.

Only needed if you plan to use:
- Supabase Storage for file uploads
- Supabase Auth for authentication
- Supabase Realtime for live updates

If needed later:
1. Go to **Settings** → **API**
2. Copy the following:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public** key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (long JWT token)
   - **service_role secret** key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (different long JWT token)

## Step 4: Update Environment Variables

Update your `.env` file in `apps/backend-nest/`:

```bash
# Database - THIS IS ALL YOU NEED
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres"
```

Replace:
- `[YOUR-PASSWORD]` with the database password you created in Step 2
- `xxxxxxxxxxxxx` with your project reference ID from the connection string

**Important Notes:**
- Do NOT commit the `.env` file to Git (it should be in `.gitignore`)
- You only need `DATABASE_URL` since you're using Prisma, not Supabase client libraries
- The other Supabase keys (SUPABASE_URL, SUPABASE_KEY) are only needed if you use Supabase Storage, Auth, or Realtime features directly

## Step 5: Run Database Migrations

1. Stop your local Supabase instance:
   ```bash
   supabase stop
   ```

2. Navigate to the backend directory:
   ```bash
   cd apps/backend-nest
   ```

3. Run Prisma migrations to create tables in cloud database:
   ```bash
   npx prisma migrate deploy
   ```

4. (Optional) Generate Prisma client:
   ```bash
   npx prisma generate
   ```

5. (Optional) Seed database with initial data if you have seed scripts:
   ```bash
   npm run seed
   ```

## Step 6: Verify Connection

1. Test the database connection:
   ```bash
   npx prisma db push
   ```

2. Open Prisma Studio to view your cloud database:
   ```bash
   npx prisma studio
   ```

3. Or check tables in Supabase Dashboard:
   - Go to **Table Editor** in Supabase dashboard
   - You should see all your tables (users, entities, compliance_tasks, etc.)

## Step 7: Update Application Settings

Your backend will automatically connect using the new `DATABASE_URL` in `.env`. No code changes needed!

The frontend doesn't need any Supabase configuration since it connects to your NestJS backend API, not directly to Supabase.

## Step 8: Test Your Application

1. Start the backend:
   ```bash
   cd apps/backend-nest
   npm run start:dev
   ```

2. Start the frontend:
   ```bash
   cd apps/frontend-angular
   ng serve
   ```

3. Test all functionality:
   - User login
   - CRUD operations
   - File uploads (if using Supabase storage)
   - All API endpoints

## Step 9: Database Management

### View/Edit Data
- Use **Supabase Dashboard** → **Table Editor**
- Or use **Prisma Studio**: `npx prisma studio`

### Backup Database
1. In Supabase Dashboard, go to **Settings** → **Database**
2. Scroll to **Database Backups**
3. Free tier includes daily backups (retained for 7 days)
4. Manual backups can be downloaded

### Monitor Database
- Go to **Reports** in Supabase Dashboard
- View database size, API requests, bandwidth usage

## Step 10: Production Deployment (Optional)

When deploying to production:

1. **Update Environment Variable** in your hosting platform (Vercel, Heroku, AWS, etc.):
   ```bash
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

2. **Enable SSL** (Supabase requires SSL in production):
   ```
   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres?sslmode=require"
   ```

3. **Set up Connection Pooling** for better performance:
   - In Supabase Dashboard → Settings → Database
   - Use the **"Connection pooling"** URL instead of direct connection
   - Format: `postgresql://postgres.[project-ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres`

## Troubleshooting

### Connection Timeout
- Check if your IP is whitelisted (Supabase allows all IPs by default)
- Verify DATABASE_URL is correct
- Check if you're using the correct password

### Forgot Database Password
1. Go to Supabase Dashboard → Settings → Database
2. Scroll to **"Database password"** section
3. Click **"Reset Database Password"**
4. Enter a new password and save
5. Update your `DATABASE_URL` in `.env` with the new password
6. Restart your backend server

### Can't Find Connection String
- Make sure you're in the correct project
- Look for **Settings** (gear icon) at the bottom of the left sidebar
- Go to **Database** from the Settings submenu
- Scroll down - the Connection string section is below the Database settings

### Migration Errors
```bash
# Reset and re-run migrations
npx prisma migrate reset
npx prisma migrate deploy
```

### "Too Many Connections" Error
- Use connection pooling URL instead of direct connection
- Reduce `connection_limit` in your Prisma schema:
  ```prisma
  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
    connectionLimit = 10
  }
  ```

### View Logs
- Supabase Dashboard → **Logs**
- View database queries, API requests, and errors

## Supabase Free Tier Limits

- **Database**: 500 MB storage
- **Bandwidth**: 2 GB per month
- **API Requests**: 50,000 per month
- **File Storage**: 1 GB
- **Auth Users**: Unlimited
- **Backups**: Daily (7-day retention)

If you exceed limits, consider upgrading to Pro tier ($25/month).

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Prisma with Supabase Guide](https://www.prisma.io/docs/guides/database/supabase)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)

## Need Help?

- [Supabase Discord](https://discord.supabase.com)
- [Supabase GitHub Discussions](https://github.com/supabase/supabase/discussions)
- [Stack Overflow - Supabase Tag](https://stackoverflow.com/questions/tagged/supabase)
