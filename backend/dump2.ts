import { PrismaClient } from '@prisma/client';
import fs from 'fs';
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

  fs.writeFileSync('db-dump2.json', JSON.stringify({reqs, staff}, null, 2));
}

main().catch(console.error).finally(() => p.$disconnect());
