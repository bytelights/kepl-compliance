# Kepl Compliance - Setup and Deployment Guide

## Table of Contents

- [Local Development Setup](#local-development-setup)
- [Azure Deployment](#azure-deployment)

---

## Local Development Setup

### Prerequisites

- Node.js 20+
- npm or pnpm
- PostgreSQL database (local or hosted)
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/bytelights/kepl-compliance.git
cd kepl-compliance
```

### 2. Backend Setup (NestJS)

```bash
cd apps/backend-nest
```

#### Create `.env` file

```bash
cp .env.example .env
```

Edit `.env` with these values for local development:

```env
# Database - local PostgreSQL
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/compliance_db"

# Microsoft Entra ID (Azure AD)
MICROSOFT_CLIENT_ID="your-client-id"
MICROSOFT_CLIENT_SECRET="your-client-secret"
MICROSOFT_TENANT_ID="your-tenant-id"
MICROSOFT_REDIRECT_URI="http://localhost:3000/api/auth/microsoft/callback"

# SharePoint (for evidence file uploads)
SHAREPOINT_TENANT_ID="your-tenant-id"
SHAREPOINT_SITE_ID="your-sharepoint-site-id"
SHAREPOINT_DRIVE_ID="your-document-library-drive-id"

# JWT
JWT_SECRET="generate-a-random-32-char-string"
JWT_EXPIRES_IN="7d"

# Session
SESSION_SECRET="generate-a-random-32-char-string"

# App
NODE_ENV=development
PORT=3000
FRONTEND_URL="http://localhost:4200"

# Encryption
ENCRYPTION_KEY="generate-a-random-32-char-string"
```

#### Install dependencies and run

```bash
npm install --legacy-peer-deps

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed sample data
npm run db:seed

# Start backend in dev mode
npm run dev
```

Backend will be available at `http://localhost:3000`

### 3. Frontend Setup (Angular)

```bash
cd apps/frontend-angular
```

#### Create `.env` file

```bash
cp .env.example .env
```

Edit `.env` for local development:

```env
# Microsoft Entra ID
MICROSOFT_CLIENT_ID="your-client-id"
MICROSOFT_TENANT_ID="your-tenant-id"
MICROSOFT_REDIRECT_URI="http://localhost:4200"

# Backend API
BACKEND_API_URL="http://localhost:3000"
```

#### Update `src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  msalConfig: {
    auth: {
      clientId: 'your-client-id',
      authority: 'https://login.microsoftonline.com/your-tenant-id',
      redirectUri: 'http://localhost:4200/auth/callback',
    },
    cache: {
      cacheLocation: 'localStorage',
      storeAuthStateInCookie: false,
    },
  },
};
```

#### Install and run

```bash
npm install --legacy-peer-deps

# Start Angular dev server
npm start
```

Frontend will be available at `http://localhost:4200`

### 4. Microsoft Entra ID App Registration (for SSO)

1. Go to Azure Portal > Microsoft Entra ID > App registrations
2. Register a new application
3. Set redirect URI to `http://localhost:3000/api/auth/microsoft/callback` (for local)
4. Copy the Client ID, Tenant ID, and create a Client Secret
5. Use these values in both `.env` files

### Local URLs Summary

| Service | URL |
|---------|-----|
| Frontend | http://localhost:4200 |
| Backend API | http://localhost:3000/api |
| Prisma Studio | http://localhost:5555 (run `npm run db:studio`) |
| Microsoft SSO Callback | http://localhost:3000/api/auth/microsoft/callback |

---

## Azure Deployment

### Architecture on Azure

```
Internet --> Azure Application Gateway (SSL + WAF)
                |
          +-----+------+
          |            |
   Azure Container     Azure Container
   Instance/App        Instance/App
   (Frontend)          (Backend)
    :80                 :3000

   Azure Database for PostgreSQL (Flexible Server)
```

### Option A: Azure Container Instances (ACI) - Simple

Best for quick deployments and testing.

#### Prerequisites

- Azure CLI installed (`az`)
- Azure Container Registry (ACR) or Docker Hub
- Azure Database for PostgreSQL

#### Step 1: Create Azure Resources

```bash
# Login to Azure
az login

# Create resource group
az group create --name kepl-compliance-rg --location eastus

# Create Azure Container Registry
az acr create --resource-group kepl-compliance-rg --name keplcompliance --sku Basic

# Login to ACR
az acr login --name keplcompliance
```

#### Step 2: Create Azure Database for PostgreSQL

```bash
az postgres flexible-server create \
  --resource-group kepl-compliance-rg \
  --name kepl-compliance-db \
  --location eastus \
  --admin-user adminuser \
  --admin-password "YourSecurePassword123!" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 15

# Allow Azure services to connect
az postgres flexible-server firewall-rule create \
  --resource-group kepl-compliance-rg \
  --name kepl-compliance-db \
  --rule-name AllowAzure \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Create the database
az postgres flexible-server db create \
  --resource-group kepl-compliance-rg \
  --server-name kepl-compliance-db \
  --database-name compliance_db
```

Your DATABASE_URL will be:
```
postgresql://adminuser:YourSecurePassword123!@kepl-compliance-db.postgres.database.azure.com:5432/compliance_db?sslmode=require
```

#### Step 3: Build and Push Docker Images

```bash
cd apps

# Build and tag images
docker build -t keplcompliance.azurecr.io/backend:latest ./backend-nest
docker build -t keplcompliance.azurecr.io/frontend:latest ./frontend-angular

# Push to ACR
docker push keplcompliance.azurecr.io/backend:latest
docker push keplcompliance.azurecr.io/frontend:latest
```

#### Step 4: Deploy Backend Container

```bash
az container create \
  --resource-group kepl-compliance-rg \
  --name kepl-backend \
  --image keplcompliance.azurecr.io/backend:latest \
  --registry-login-server keplcompliance.azurecr.io \
  --registry-username $(az acr credential show --name keplcompliance --query username -o tsv) \
  --registry-password $(az acr credential show --name keplcompliance --query "passwords[0].value" -o tsv) \
  --ports 3000 \
  --cpu 1 \
  --memory 1.5 \
  --environment-variables \
    NODE_ENV=production \
    PORT=3000 \
    FRONTEND_URL=https://YOUR_DOMAIN \
    MICROSOFT_CLIENT_ID=your-client-id \
    MICROSOFT_TENANT_ID=your-tenant-id \
    MICROSOFT_REDIRECT_URI=https://YOUR_DOMAIN/api/auth/microsoft/callback \
    JWT_EXPIRES_IN=7d \
  --secure-environment-variables \
    DATABASE_URL="postgresql://adminuser:YourSecurePassword123!@kepl-compliance-db.postgres.database.azure.com:5432/compliance_db?sslmode=require" \
    MICROSOFT_CLIENT_SECRET=your-client-secret \
    JWT_SECRET=your-jwt-secret \
    SESSION_SECRET=your-session-secret \
    ENCRYPTION_KEY=your-32-char-encryption-key \
  --dns-name-label kepl-backend \
  --os-type Linux
```

#### Step 5: Deploy Frontend Container

```bash
az container create \
  --resource-group kepl-compliance-rg \
  --name kepl-frontend \
  --image keplcompliance.azurecr.io/frontend:latest \
  --registry-login-server keplcompliance.azurecr.io \
  --registry-username $(az acr credential show --name keplcompliance --query username -o tsv) \
  --registry-password $(az acr credential show --name keplcompliance --query "passwords[0].value" -o tsv) \
  --ports 80 \
  --cpu 0.5 \
  --memory 0.5 \
  --dns-name-label kepl-frontend \
  --os-type Linux
```

#### Step 6: Run Database Migrations

```bash
# Run migrations against Azure PostgreSQL from local machine
cd apps/backend-nest
DATABASE_URL="postgresql://adminuser:YourSecurePassword123!@kepl-compliance-db.postgres.database.azure.com:5432/compliance_db?sslmode=require" \
  npx prisma migrate deploy
```

---

### Option B: Azure App Service (Recommended for Production)

Better for production with built-in scaling, SSL, and CI/CD.

#### Step 1: Create App Service Plan

```bash
az appservice plan create \
  --resource-group kepl-compliance-rg \
  --name kepl-compliance-plan \
  --sku B1 \
  --is-linux
```

#### Step 2: Create Backend App Service

```bash
# Create web app for backend
az webapp create \
  --resource-group kepl-compliance-rg \
  --plan kepl-compliance-plan \
  --name kepl-backend-app \
  --deployment-container-image-name keplcompliance.azurecr.io/backend:latest

# Configure ACR access
az webapp config container set \
  --resource-group kepl-compliance-rg \
  --name kepl-backend-app \
  --container-image-name keplcompliance.azurecr.io/backend:latest \
  --container-registry-url https://keplcompliance.azurecr.io \
  --container-registry-user $(az acr credential show --name keplcompliance --query username -o tsv) \
  --container-registry-password $(az acr credential show --name keplcompliance --query "passwords[0].value" -o tsv)

# Set environment variables
az webapp config appsettings set \
  --resource-group kepl-compliance-rg \
  --name kepl-backend-app \
  --settings \
    NODE_ENV=production \
    PORT=3000 \
    WEBSITES_PORT=3000 \
    FRONTEND_URL=https://YOUR_DOMAIN \
    MICROSOFT_CLIENT_ID=your-client-id \
    MICROSOFT_CLIENT_SECRET=your-client-secret \
    MICROSOFT_TENANT_ID=your-tenant-id \
    MICROSOFT_REDIRECT_URI=https://YOUR_DOMAIN/api/auth/microsoft/callback \
    SHAREPOINT_TENANT_ID=your-tenant-id \
    SHAREPOINT_SITE_ID=your-site-id \
    SHAREPOINT_DRIVE_ID=your-drive-id \
    JWT_SECRET=your-jwt-secret \
    JWT_EXPIRES_IN=7d \
    SESSION_SECRET=your-session-secret \
    ENCRYPTION_KEY=your-32-char-key \
    DATABASE_URL="postgresql://adminuser:YourSecurePassword123!@kepl-compliance-db.postgres.database.azure.com:5432/compliance_db?sslmode=require"
```

#### Step 3: Create Frontend App Service

```bash
az webapp create \
  --resource-group kepl-compliance-rg \
  --plan kepl-compliance-plan \
  --name kepl-frontend-app \
  --deployment-container-image-name keplcompliance.azurecr.io/frontend:latest

az webapp config container set \
  --resource-group kepl-compliance-rg \
  --name kepl-frontend-app \
  --container-image-name keplcompliance.azurecr.io/frontend:latest \
  --container-registry-url https://keplcompliance.azurecr.io \
  --container-registry-user $(az acr credential show --name keplcompliance --query username -o tsv) \
  --container-registry-password $(az acr credential show --name keplcompliance --query "passwords[0].value" -o tsv)
```

#### Step 4: Configure Custom Domain and SSL

```bash
# Add custom domain
az webapp config hostname add \
  --resource-group kepl-compliance-rg \
  --webapp-name kepl-frontend-app \
  --hostname YOUR_DOMAIN

# Enable free managed SSL
az webapp config ssl create \
  --resource-group kepl-compliance-rg \
  --name kepl-frontend-app \
  --hostname YOUR_DOMAIN
```

#### Step 5: Set Up Azure Application Gateway (Optional - for single domain routing)

If you want both frontend and backend under one domain (e.g. `kelptest.xyz` for frontend and `kelptest.xyz/api` for backend), use Azure Application Gateway:

1. Create Application Gateway in Azure Portal
2. Add backend pools:
   - Pool 1: Frontend App Service
   - Pool 2: Backend App Service
3. Add routing rules:
   - Path `/api/*` -> Backend pool
   - Path `/*` -> Frontend pool
4. Configure SSL certificate on the gateway

---

### Option C: Azure Container Apps (Modern, Serverless)

Best for cost efficiency with auto-scaling.

#### Step 1: Create Container Apps Environment

```bash
# Create Container Apps environment
az containerapp env create \
  --resource-group kepl-compliance-rg \
  --name kepl-compliance-env \
  --location eastus
```

#### Step 2: Deploy Backend

```bash
az containerapp create \
  --resource-group kepl-compliance-rg \
  --environment kepl-compliance-env \
  --name kepl-backend \
  --image keplcompliance.azurecr.io/backend:latest \
  --registry-server keplcompliance.azurecr.io \
  --registry-username $(az acr credential show --name keplcompliance --query username -o tsv) \
  --registry-password $(az acr credential show --name keplcompliance --query "passwords[0].value" -o tsv) \
  --target-port 3000 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 3 \
  --cpu 0.5 \
  --memory 1.0Gi \
  --env-vars \
    NODE_ENV=production \
    PORT=3000 \
    FRONTEND_URL=https://YOUR_DOMAIN \
    MICROSOFT_CLIENT_ID=your-client-id \
    MICROSOFT_TENANT_ID=your-tenant-id \
    MICROSOFT_REDIRECT_URI=https://YOUR_DOMAIN/api/auth/microsoft/callback \
    JWT_EXPIRES_IN=7d \
  --secrets \
    db-url="postgresql://adminuser:YourSecurePassword123!@kepl-compliance-db.postgres.database.azure.com:5432/compliance_db?sslmode=require" \
    ms-secret=your-client-secret \
    jwt-secret=your-jwt-secret \
    session-secret=your-session-secret \
    encryption-key=your-32-char-key
```

#### Step 3: Deploy Frontend

```bash
az containerapp create \
  --resource-group kepl-compliance-rg \
  --environment kepl-compliance-env \
  --name kepl-frontend \
  --image keplcompliance.azurecr.io/frontend:latest \
  --registry-server keplcompliance.azurecr.io \
  --registry-username $(az acr credential show --name keplcompliance --query username -o tsv) \
  --registry-password $(az acr credential show --name keplcompliance --query "passwords[0].value" -o tsv) \
  --target-port 80 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 3 \
  --cpu 0.25 \
  --memory 0.5Gi
```

---

## Environment Configuration Reference

### Files that need URL changes per environment

#### 1. `apps/backend-nest/.env`

| Variable | Local | Azure |
|----------|-------|-------|
| DATABASE_URL | `postgresql://postgres:pass@localhost:5432/compliance_db` | `postgresql://user:pass@your-server.postgres.database.azure.com:5432/compliance_db?sslmode=require` |
| MICROSOFT_REDIRECT_URI | `http://localhost:3000/api/auth/microsoft/callback` | `https://YOUR_DOMAIN/api/auth/microsoft/callback` |
| FRONTEND_URL | `http://localhost:4200` | `https://YOUR_DOMAIN` |
| NODE_ENV | `development` | `production` |

#### 2. `apps/frontend-angular/.env`

| Variable | Local | Azure |
|----------|-------|-------|
| MICROSOFT_REDIRECT_URI | `http://localhost:4200` | `https://YOUR_DOMAIN` |
| BACKEND_API_URL | `http://localhost:3000` | `https://YOUR_DOMAIN` |

#### 3. `apps/frontend-angular/src/environments/environment.ts` (dev)

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  msalConfig: {
    auth: {
      clientId: 'your-client-id',
      authority: 'https://login.microsoftonline.com/your-tenant-id',
      redirectUri: 'http://localhost:4200/auth/callback',
    },
    cache: {
      cacheLocation: 'localStorage',
      storeAuthStateInCookie: false,
    },
  },
};
```

#### 4. `apps/frontend-angular/src/environments/environment.prod.ts` (production/Azure)

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://YOUR_DOMAIN/api',
  msalConfig: {
    auth: {
      clientId: 'your-client-id',
      authority: 'https://login.microsoftonline.com/your-tenant-id',
      redirectUri: 'https://YOUR_DOMAIN/auth/callback',
    },
    cache: {
      cacheLocation: 'localStorage',
      storeAuthStateInCookie: false,
    },
  },
};
```

### Microsoft Entra ID - Redirect URIs to Register

For each environment, add these redirect URIs in Azure Portal > App Registration > Authentication:

| Environment | Redirect URI |
|-------------|-------------|
| Local | `http://localhost:3000/api/auth/microsoft/callback` |
| Local (frontend) | `http://localhost:4200/auth/callback` |
| Azure Production | `https://YOUR_DOMAIN/api/auth/microsoft/callback` |
| Azure Production (frontend) | `https://YOUR_DOMAIN/auth/callback` |

---

## Comparison: Azure Deployment Options

| Feature | Container Instances (ACI) | App Service | Container Apps |
|---------|--------------------------|-------------|----------------|
| Complexity | Low | Medium | Medium |
| Auto-scaling | No | Yes (manual rules) | Yes (automatic) |
| Built-in SSL | No (need gateway) | Yes (free managed) | Yes (free managed) |
| CI/CD | Manual | Built-in GitHub Actions | Built-in GitHub Actions |
| Cost | Pay per second | Fixed monthly | Pay per usage |
| Custom domain | Via DNS | Built-in | Built-in |
| Best for | Dev/Testing | Production | Production (cost-efficient) |
| Minimum cost | ~$30/month | ~$13/month (B1) | ~$0 (scale to zero) |

**Recommendation**: Use **Azure Container Apps** for production - it offers the best balance of cost, scaling, and ease of management.
