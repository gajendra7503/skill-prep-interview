import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js keeps local secrets in .env.local; load it (then .env) for the Prisma CLI.
config({ path: ".env.local" });
config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
