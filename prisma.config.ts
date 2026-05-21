import "dotenv/config";
import { defineConfig } from "prisma/config";

// Vercel Postgres provides POSTGRES_PRISMA_URL; fallback to DATABASE_URL for other providers
const url =
  process.env["POSTGRES_PRISMA_URL"] ??
  process.env["DATABASE_URL"] ??
  "";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: { url },
});
