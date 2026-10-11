import type { Config } from "drizzle-kit";

// Migrationen erzeugen: pnpm db:generate
export default {
  schema: "./src/lib/db/schema/index.ts",
  out: "./src/lib/db/migrations",
  dialect: "sqlite",
  driver: "expo",
} satisfies Config;
