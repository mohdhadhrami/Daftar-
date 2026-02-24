import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create system roles
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'owner' },
      update: {},
      create: { name: 'owner', description: 'Company owner with full access', isSystem: true },
    }),
    prisma.role.upsert({
      where: { name: 'admin' },
      update: {},
      create: { name: 'admin', description: 'Administrator with management access', isSystem: true },
    }),
    prisma.role.upsert({
      where: { name: 'accountant' },
      update: {},
      create: { name: 'accountant', description: 'Full accounting access', isSystem: true },
    }),
    prisma.role.upsert({
      where: { name: 'sales' },
      update: {},
      create: { name: 'sales', description: 'Sales and invoice access', isSystem: true },
    }),
    prisma.role.upsert({
      where: { name: 'viewer' },
      update: {},
      create: { name: 'viewer', description: 'Read-only access', isSystem: true },
    }),
  ]);

  console.log(`Created ${roles.length} roles`);

  // Create permissions
  const permissionData = [
    { name: 'accounts.read', description: 'View chart of accounts', resource: 'accounts', action: 'read' },
    { name: 'accounts.write', description: 'Create/edit accounts', resource: 'accounts', action: 'write' },
    { name: 'accounts.delete', description: 'Delete accounts', resource: 'accounts', action: 'delete' },
    { name: 'journals.read', description: 'View journal entries', resource: 'journals', action: 'read' },
    { name: 'journals.write', description: 'Create journal entries', resource: 'journals', action: 'write' },
    { name: 'journals.post', description: 'Post journal entries', resource: 'journals', action: 'post' },
    { name: 'journals.void', description: 'Void journal entries', resource: 'journals', action: 'void' },
    { name: 'invoices.read', description: 'View invoices', resource: 'invoices', action: 'read' },
    { name: 'invoices.write', description: 'Create/edit invoices', resource: 'invoices', action: 'write' },
    { name: 'invoices.delete', description: 'Delete invoices', resource: 'invoices', action: 'delete' },
    { name: 'payments.read', description: 'View payments', resource: 'payments', action: 'read' },
    { name: 'payments.write', description: 'Create/edit payments', resource: 'payments', action: 'write' },
    { name: 'reports.read', description: 'View financial reports', resource: 'reports', action: 'read' },
    { name: 'settings.read', description: 'View company settings', resource: 'settings', action: 'read' },
    { name: 'settings.write', description: 'Edit company settings', resource: 'settings', action: 'write' },
    { name: 'users.read', description: 'View users', resource: 'users', action: 'read' },
    { name: 'users.write', description: 'Manage users', resource: 'users', action: 'write' },
    { name: 'audit.read', description: 'View audit logs', resource: 'audit', action: 'read' },
    { name: 'periods.manage', description: 'Lock/unlock periods', resource: 'periods', action: 'manage' },
    { name: 'ai.use', description: 'Use AI features', resource: 'ai', action: 'use' },
  ];

  const permissions = await Promise.all(
    permissionData.map((p) =>
      prisma.permission.upsert({
        where: { name: p.name },
        update: {},
        create: p,
      }),
    ),
  );

  console.log(`Created ${permissions.length} permissions`);

  // Assign all permissions to owner role
  const ownerRole = roles.find((r) => r.name === 'owner')!;
  for (const p of permissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: ownerRole.id, permissionId: p.id } },
      update: {},
      create: { roleId: ownerRole.id, permissionId: p.id },
    });
  }

  // Create a demo user and company
  const demoPasswordHash = await bcrypt.hash('DemoP@ss1', 12);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@daftar.app' },
    update: {},
    create: {
      email: 'demo@daftar.app',
      passwordHash: demoPasswordHash,
      firstName: 'Demo',
      lastName: 'User',
      isActive: true,
      isEmailVerified: true,
    },
  });

  const demoCompany = await prisma.company.upsert({
    where: { slug: 'demo-company' },
    update: {},
    create: {
      name: 'Demo Company',
      slug: 'demo-company',
      currency: 'USD',
      fiscalYearStart: 1,
    },
  });

  await prisma.companyUser.upsert({
    where: {
      companyId_userId: {
        companyId: demoCompany.id,
        userId: demoUser.id,
      },
    },
    update: {},
    create: {
      companyId: demoCompany.id,
      userId: demoUser.id,
      roleId: ownerRole.id,
    },
  });

  console.log('Demo user created: demo@daftar.app / DemoP@ss1');
  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
