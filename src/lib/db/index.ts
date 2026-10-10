import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import { DATABASE_NAME } from "../constants";
import * as schema from "./schema";

const sqlite = openDatabaseSync(DATABASE_NAME, { enableChangeListener: true });
sqlite.execSync("PRAGMA foreign_keys = ON;");
export const db = drizzle(sqlite, { schema });
export * from "./schema";
