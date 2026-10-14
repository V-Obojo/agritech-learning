import "server-only";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as schema from "./schema";

const connections = new Map<string,ReturnType<typeof connect>>();
async function connect(url:string) {
  if(url.startsWith("file:")) {
    const filename=url.startsWith("file://") ? fileURLToPath(url) : resolve(url.slice(5));
    mkdirSync(dirname(filename),{recursive:true});
  }
  const client=createClient({url,authToken:process.env.DATABASE_AUTH_TOKEN || undefined,timeout:5000});
  await client.execute("PRAGMA foreign_keys = ON");
  return drizzle(client,{schema});
}
export function getDb() {
  const url=process.env.DATABASE_URL;
  if(!url) throw new Error("Set DATABASE_URL before using accounts. See Set up accounts locally in README.md.");
  if(process.env.NODE_ENV==="test" && (!url.startsWith("file:") || !/test[-_/]/i.test(url))) throw new Error("Tests require a temporary test database.");
  if(!connections.has(url)) connections.set(url,connect(url));
  return connections.get(url)!;
}
export async function migrateDb() { const db=await getDb(); await migrate(db,{migrationsFolder:resolve("drizzle")}); return db; }
