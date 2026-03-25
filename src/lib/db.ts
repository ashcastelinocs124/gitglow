import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __gitglowPrisma: PrismaClient | undefined;
}

export const db = global.__gitglowPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__gitglowPrisma = db;
}
