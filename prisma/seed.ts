import { containers_auction_or_sell, PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function rawSql() {
  // await prisma.users.create({
  //   data: {
  //     name: "SUPERADMIN",
  //     username: "SUPERADMIN",
  //     password: await bcrypt.hash("SUPERADMIN", 10),
  //     role: "SUPER_ADMIN",
  //   },
  // });
  // console.log({ result: "SUPERADMIN created!" });
}

async function main() {}

main()
  .then(rawSql)
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
