const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const userId = 'de26d22b-9e10-46cd-829d-9015a3819a90';
  const userDetails = await prisma.userDetails.findUnique({
    where: { userId },
  });

  console.log(userDetails);
}

check();