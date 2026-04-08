import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const requests = await prisma.request.findMany({
      where: { assignment: { is: { staff_id: 2 } } },
      include: { user: true, assignment: true },
      orderBy: [{ priority: 'desc' }, { created_at: 'desc' }],
    });
    console.log("Success:", requests);
  } catch (err) {
    console.error("Error with is:", err);
  }

  try {
    const requests2 = await prisma.request.findMany({
      where: { assignment: { staff_id: 2 } },
      include: { user: true, assignment: true },
      orderBy: [{ priority: 'desc' }, { created_at: 'desc' }],
    });
    console.log("Success with direct:", requests2);
  } catch (err) {
    console.error("Error with direct:", err);
  }
}
main();
