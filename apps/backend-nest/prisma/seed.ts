import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'System Admin',
      role: 'admin',
      isActive: true,
    },
  });

  console.log('✅ Created admin user:', admin.email);

  // Create reviewer user
  const reviewer = await prisma.user.upsert({
    where: { email: 'reviewer@example.com' },
    update: {},
    create: {
      email: 'reviewer@example.com',
      name: 'Compliance Reviewer',
      role: 'reviewer',
      isActive: true,
    },
  });

  console.log('✅ Created reviewer user:', reviewer.email);

  // Create task owner user
  const taskOwner = await prisma.user.upsert({
    where: { email: 'taskowner@example.com' },
    update: {},
    create: {
      email: 'taskowner@example.com',
      name: 'Task Owner',
      role: 'task_owner',
      isActive: true,
    },
  });

  console.log('✅ Created task owner user:', taskOwner.email);

  // Create sample master data
  const entity = await prisma.entity.upsert({
    where: { name: 'Corporate Office' },
    update: {},
    create: { name: 'Corporate Office' },
  });

  const department = await prisma.department.upsert({
    where: { name: 'Legal' },
    update: {},
    create: { name: 'Legal' },
  });

  const law = await prisma.law.upsert({
    where: { name: 'Companies Act 2013' },
    update: {},
    create: {
      name: 'Companies Act 2013',
    },
  });

  console.log('✅ Created sample master data');
  console.log('   - Entity:', entity.name);
  console.log('   - Department:', department.name);
  console.log('   - Law:', law.name);

  // Create sample compliance master
  const complianceMaster = await prisma.complianceMaster.upsert({
    where: { name: 'Board Meeting Minutes' },
    update: {},
    create: {
      name: 'Board Meeting Minutes',
      complianceId: 'COMP-001',
      title: 'Quarterly Board Meeting Documentation',
      description:
        'Maintain proper records of board meetings as per Companies Act',
      lawId: law.id,
      departmentId: department.id,
      frequency: 'QUARTERLY',
      impact: 'HIGH',
    },
  });

  console.log('✅ Created sample compliance master:', complianceMaster.name);

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📧 Default user credentials:');
  console.log('  Admin:      admin@example.com');
  console.log('  Reviewer:   reviewer@example.com');
  console.log('  Task Owner: taskowner@example.com');
  console.log('\n💡 Use Microsoft SSO to login with these emails');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
