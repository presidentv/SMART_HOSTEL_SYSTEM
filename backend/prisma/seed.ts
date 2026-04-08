import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Initiating database wipe...');
  // Wipe all data sequentially to respect foreign keys
  await prisma.feedback.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.request.deleteMany();
  await prisma.staffProfile.deleteMany();
  await prisma.user.deleteMany();

  const hashedBasePassword = await bcrypt.hash('password123', 10);

  // 1. Admin
  await prisma.user.create({
    data: {
      name: 'Central Warden',
      email: 'admin@hostel.com',
      password: hashedBasePassword,
      role: 'ADMIN',
      is_approved: true
    } as any
  });

  // 2. Staffs
  const specializations = ['CLEANING', 'ELECTRICAL', 'PLUMBING'];
  const staffNames = [
    ['Alex', 'Sam'],
    ['Jordan', 'Casey'],
    ['Taylor', 'Morgan']
  ];

  for (let i = 0; i < specializations.length; i++) {
    const spec = specializations[i];
    for (let j = 0; j < 2; j++) {
      const name = staffNames[i][j];
      await prisma.user.create({
        data: {
          name,
          email: `${name.toLowerCase()}@hostel.com`,
          password: hashedBasePassword,
          role: 'STAFF',
          is_approved: true, // Auto approve these seeded ones
          staffProfile: {
            create: {
              specialization: spec,
              is_available: true,
              tasks_handled: 0
            }
          }
        } as any
      });
    }
  }

  console.log('Database seeded with Admin and strictly defined 6 Staff accounts!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
