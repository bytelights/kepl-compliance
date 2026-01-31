#!/bin/bash

# Fix all TypeScript compilation errors after workspace removal

cd "$(dirname "$0")/apps/backend-nest"

echo "🔧 Fixing TypeScript errors..."

# Fix all controller import type issues
echo "1. Fixing import type statements in controllers..."

for file in src/**/*.controller.ts; do
  if [ -f "$file" ]; then
    # Fix Response imports
    sed -i '' "s/import { Response } from 'express';/import type { Response } from 'express';/g" "$file"
    # Fix JwtPayload imports  
    sed -i '' "s/import { JwtPayload } from/import type { JwtPayload } from/g" "$file"
  fi
done

# Fix Express.Multer.File in csv-import.controller.ts
echo "2. Fixing Multer types..."
if [ -f "src/csv-import/csv-import.controller.ts" ]; then
  sed -i '' 's/@UploadedFile() file: Express.Multer.File,/@UploadedFile() file: Express.Multer.File,/g' "src/csv-import/csv-import.controller.ts"
fi

# Fix completionDate to completedAt in reports
echo "3. Fixing completionDate reference..."
if [ -f "src/reports/export.service.ts" ]; then
  sed -i '' "s/task.completionDate/task.completedAt/g" "src/reports/export.service.ts"
fi

# Fix seed.ts - remove description from Law, remove complianceId from ComplianceMaster
echo "4. Fixing seed.ts..."
if [ -f "prisma/seed.ts" ]; then
  # Will manually fix this one as it needs structural changes
  echo "   Note: seed.ts needs manual fixes (remove description from Law create)"
fi

echo "✅ Auto-fixes applied!"
echo ""
echo "⚠️  Remaining manual fixes needed:"
echo "   1. DTO files - add '!' to properties or make them optional"
echo "   2. SharePoint service - initialize properties in constructor"
echo "   3. Integrations service - initialize encryptionKey in constructor"
echo "   4. Master data service - fix Prisma type unions"
echo "   5. Tasks service - fix DTO type compatibility"
echo "   6. Seed.ts - remove 'description' from Law, remove 'complianceId' from ComplianceMaster"
echo ""
echo "Run: cd apps/backend-nest && npm run build"
