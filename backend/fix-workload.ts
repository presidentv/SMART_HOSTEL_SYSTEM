import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const staffProfiles = await prisma.staffProfile.findMany({
    include: {
      assignments: {
        include: { request: true }
      }
    }
  });

  for (const staff of staffProfiles) {
    // Count assignments where request is NOT cancelled
    const validCount = staff.assignments.filter(a => a.request.status !== 'CANCELLED').length;
    
    await prisma.staffProfile.update({
      where: { id: staff.id },
      data: { tasks_handled: validCount }
    });
    console.log(`Updated Staff ${staff.id} tasks_handled to ${validCount}`);
  }
  console.log('Workloads correctly recalibrated to lifetime handled tasks.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
