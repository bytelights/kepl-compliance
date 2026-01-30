import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create default workspace
  const workspace = await prisma.workspace.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Default Workspace',
    },
  });

  console.log('✅ Created workspace:', workspace.name);

  // Create admin user (pre-seeded)
  const admin = await prisma.user.upsert({
    where: {
      workspaceId_email: {
        workspaceId: workspace.id,
        email: 'admin@example.com',
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      email: 'admin@example.com',
      name: 'System Admin',
      role: 'admin',
      isActive: true,
    },
  });

  console.log('✅ Created admin user:', admin.email);

  // Create reviewer user (pre-seeded)
  const reviewer = await prisma.user.upsert({
    where: {
      workspaceId_email: {
        workspaceId: workspace.id,
        email: 'reviewer@example.com',
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      email: 'reviewer@example.com',
      name: 'Compliance Reviewer',
      role: 'reviewer',
      isActive: true,
    },
  });

  console.log('✅ Created reviewer user:', reviewer.email);

  // Create sample master data
  const entity = await prisma.entity.upsert({
    where: {
      workspaceId_name: {
        workspaceId: workspace.id,
        name: 'Corporate Office',
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      name: 'Corporate Office',
    },
  });

  const department = await prisma.department.upsert({
    where: {
      workspaceId_name: {
        workspaceId: workspace.id,
        name: 'Legal',
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      name: 'Legal',
    },
  });

  const law = await prisma.law.upsert({
    where: {
      workspaceId_name: {
        workspaceId: workspace.id,
        name: 'Companies Act 2013',
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      name: 'Companies Act 2013',
    },
  });

  console.log('✅ Created sample master data');
  console.log('   - Entity:', entity.name);
  console.log('   - Department:', department.name);
  console.log('   - Law:', law.name);

  console.log('\n🎉 Seed completed successfully!');
  console.log('\nDefault credentials:');
  console.log('  Admin: admin@example.com');
  console.log('  Reviewer: reviewer@example.com');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
