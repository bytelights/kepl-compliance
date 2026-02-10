# Deployment Guide - Kepl Compliance

## Architecture

```
Internet --> nginx-proxy (ports 80/443)
               |
         +-----+------+
         |            |
    frontend      backend
    (Angular)     (NestJS)
     :80           :3000

    certbot (auto SSL renewal)
```

- **nginx-proxy**: SSL termination + reverse proxy (only publicly exposed service)
- **frontend**: Angular app served via Nginx (internal only)
- **backend**: NestJS API with Prisma (internal only)
- **certbot**: Let's Encrypt certificate auto-renewal every 12h

## Prerequisites

- AWS EC2 instance (Amazon Linux 2023)
- Docker and Docker Compose installed
- Domain with DNS A record pointing to EC2 public IP
- Security Group allowing ports 80 (HTTP) and 443 (HTTPS)

## Services

| Service | Image | Port | Description |
|---------|-------|------|-------------|
| nginx-proxy | nginx:alpine | 80, 443 (exposed) | SSL termination, reverse proxy |
| frontend | apps-frontend | 80 (internal) | Angular SPA |
| backend | apps-backend | 3000 (internal) | NestJS API |
| certbot | certbot/certbot | - | SSL auto-renewal |

## Directory Structure

```
apps/
  docker-compose.yml          # Main compose file
  restore.sh                  # Rollback script
  backups/                    # Pre-HTTPS config backups
    docker-compose.yml.bak
    frontend-dockerfile.bak
    backend-dockerfile.bak
    nginx.conf.bak
  nginx/
    nginx.conf                # Active Nginx config
    nginx-full.conf           # Full HTTPS config
    nginx-init.conf           # HTTP-only (for cert acquisition)
  frontend-angular/
    dockerfile
    nginx.conf                # SPA routing config
  backend-nest/
    dockerfile
    .env
```

## Initial Setup (First Time)

### 1. Clone and Checkout

```bash
ssh -i "kelpComplience.pem" ec2-user@<EC2_IP>
cd /home/ec2-user/kepl-compliance
git checkout docker/https-setup
```

### 2. Configure Environment

```bash
cp apps/backend-nest/.env.example apps/backend-nest/.env
# Edit .env with your database URL, API keys, etc.
```

### 3. Build and Start (HTTP only first)

```bash
cd apps
cp nginx/nginx-init.conf nginx/nginx.conf
docker-compose up -d --build
```

### 4. Obtain SSL Certificate

Replace YOUR_DOMAIN with your actual domain.

```bash
docker run --rm \
  -v apps_certbot-conf:/etc/letsencrypt \
  -v apps_certbot-www:/var/www/certbot \
  --network apps_app-network \
  certbot/certbot certonly \
  --webroot -w /var/www/certbot \
  -d YOUR_DOMAIN -d www.YOUR_DOMAIN \
  --email admin@YOUR_DOMAIN \
  --agree-tos --no-eff-email
```

### 5. Switch to HTTPS

Update `server_name` in `nginx/nginx-full.conf` with your domain, then:

```bash
cp nginx/nginx-full.conf nginx/nginx.conf
docker restart nginx-proxy
docker-compose up -d certbot
```

## Redeployment (After Code Changes)

```bash
cd /home/ec2-user/kepl-compliance
git pull origin <branch>
cd apps
docker-compose build --no-cache frontend backend
docker-compose up -d frontend backend
```

nginx-proxy and certbot do NOT need to restart for code changes.

## CI/CD (GitHub Actions)

Deployment is automated via GitHub Actions on push to `main` or `docker/https-setup`.

### Required GitHub Secrets

Set these in **GitHub > Repo Settings > Secrets and variables > Actions**:

| Secret | Value |
|--------|-------|
| EC2_SSH_KEY | Contents of kelpComplience.pem private key |
| EC2_HOST | EC2 public hostname |
| EC2_USER | ec2-user |

## Nginx Routing

| Path | Proxied To | Description |
|------|-----------|-------------|
| / | frontend:80 | Angular SPA |
| /api/ | backend:3000 | NestJS API |
| /.well-known/acme-challenge/ | local filesystem | Let's Encrypt verification |

## SSL Details

- Provider: Let's Encrypt (free)
- Auto-renewal: Certbot checks every 12 hours
- Protocols: TLS 1.2 and TLS 1.3
- HTTP/2: Enabled
- Certificate path: /etc/letsencrypt/live/DOMAIN/

## Rollback

Revert to the original HTTP-only setup:

```bash
cd /home/ec2-user/kepl-compliance/apps
bash restore.sh
```

This will stop all containers, restore original configs from backups/, rebuild and start with HTTP-only setup.

## Useful Commands

```bash
# View running containers
docker ps

# View logs
docker logs nginx-proxy --tail 50
docker logs frontend-angular --tail 50
docker logs backend-nest --tail 50

# Restart a service
docker-compose restart <service>

# Rebuild one service
docker-compose build --no-cache frontend
docker-compose up -d frontend

# Force SSL renewal
docker run --rm \
  -v apps_certbot-conf:/etc/letsencrypt \
  -v apps_certbot-www:/var/www/certbot \
  certbot/certbot renew --force-renewal

# Check SSL expiry
echo | openssl s_client -connect YOUR_DOMAIN:443 2>/dev/null | openssl x509 -noout -dates

# Disk cleanup
docker system prune -af
docker builder prune -af
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails "no space left" | Run `docker system prune -af && docker builder prune -af` |
| Certbot ACME challenge fails | Ensure port 80 open, DNS A record correct |
| 502 Bad Gateway | Check containers running: `docker ps` |
| SSL cert expired | Force renewal, then `docker restart nginx-proxy` |
| Buildx session errors | `sudo systemctl restart docker` |
