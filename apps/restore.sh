#!/bin/bash
# Rollback script - reverts to original HTTP-only setup
echo "=== Rolling back to original HTTP-only configuration ==="

cd /home/ec2-user/kepl-compliance/apps

# Stop all current containers
echo "Stopping containers..."
docker compose down

# Restore original files from backups
echo "Restoring original configs..."
cp backups/docker-compose.yml.bak docker-compose.yml
cp backups/nginx.conf.bak frontend-angular/nginx.conf

# Remove the nginx proxy directory
rm -rf nginx/

# Rebuild and start with original config
echo "Rebuilding and starting original containers..."
docker compose up -d --build

echo "=== Rollback complete. HTTP-only setup restored. ==="
docker ps
