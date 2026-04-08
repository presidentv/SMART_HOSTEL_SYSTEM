import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function main() {
  const staff = await p.staffProfile.findMany({
    include: {
      user: true,
      assignments: {
        include: { request: true }
      }
    }
  });

  const reqs = await p.request.findMany();

  console.log("-----------------------");
  console.log("ALL REQUESTS:", JSON.stringify(reqs, null, 2));
  console.log("-----------------------");
  console.log("ALL STAFF & ASSIGNMENTS:", JSON.stringify(staff, null, 2));
  console.log("-----------------------");
}

main().catch(console.error).finally(() => p.$disconnect());
