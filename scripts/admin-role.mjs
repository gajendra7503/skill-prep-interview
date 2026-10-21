// Grant or revoke the admin role. Usage:
//   npm run admin:grant -- someone@example.com
//   npm run admin:revoke -- someone@example.com
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { config } from "dotenv";

config({ path: ".env.local" });
config();

const [action, email] = process.argv.slice(2);
if (!["grant", "revoke"].includes(action) || !email) {
  console.error("Usage: node scripts/admin-role.mjs <grant|revoke> <email>");
  process.exit(1);
}

const root = process.cwd();
const require = createRequire(path.join(root, "package.json"));
const { createJiti } = await import(pathToFileURL(require.resolve("jiti")).href);
const jiti = createJiti(root + "/", { alias: { "@": path.join(root, "src") } });
const { prisma } = await jiti.import("./src/lib/db.ts");

try {
  const result = await prisma.user.updateMany({
    where: { email: email.trim().toLowerCase() },
    data: { role: action === "grant" ? "admin" : "learner" },
  });
  if (result.count === 0) {
    console.error(`No user with email ${email}. They need to sign up first.`);
    process.exitCode = 1;
  } else {
    console.log(`${email} is now ${action === "grant" ? "an admin" : "a learner"}.`);
  }
} finally {
  await prisma.$disconnect();
}
