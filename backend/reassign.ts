import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const requests = await prisma.request.findMany({
    where: { status: 'ASSIGNED' },
    include: { assignment: { include: { staff: true } } }
  });

  let reassignedCount = 0;

  for (const req of requests) {
    if (req.assignment && req.category !== req.assignment.staff.specialization) {
      console.log(`Mismatch found: Request ${req.id} (${req.category}) is assigned to staff with specialization ${req.assignment.staff.specialization}.`);
      
      const correctStaff = await prisma.staffProfile.findFirst({
        where: { specialization: req.category, is_available: true },
        orderBy: { tasks_handled: 'asc' }
      });

      if (correctStaff) {
        await prisma.staffProfile.update({
          where: { id: req.assignment.staff_id },
          data: { tasks_handled: { decrement: 1 } }
        });

        await prisma.assignment.update({
          where: { id: req.assignment.id },
          data: { staff_id: correctStaff.id }
        });

        await prisma.staffProfile.update({
          where: { id: correctStaff.id },
          data: { tasks_handled: { increment: 1 } }
        });
        
        console.log(`-> Reassigned Request ${req.id} to Staff ${correctStaff.id} (Specialization: ${correctStaff.specialization})`);
        reassignedCount++;
      }
    }
  }
  
  console.log(`Completed. Total reassigned: ${reassignedCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
