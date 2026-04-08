import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("Clearing all tasks databases...");
  await prisma.feedback.deleteMany({});
  await prisma.assignment.deleteMany({});
  await prisma.request.deleteMany({});
  
  await prisma.staffProfile.updateMany({
    data: { tasks_handled: 0 }
  });

  console.log("All tasks, assignments, and feedback have been cleared. Staff workloads reset to 0.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
