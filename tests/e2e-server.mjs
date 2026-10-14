import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

const directory=await mkdtemp(join(tmpdir(),"ovayi-test-e2e-"));
// Public test fixture, never a deployment secret. Do not inherit real DB credentials.
const env={...process.env,GUIDE_MODE:"mock",NEXTAUTH_URL:"http://localhost:3100",NEXTAUTH_SECRET:"offline-test-fixture-only-not-for-deployment",DATABASE_URL:pathToFileURL(join(directory,"test-accounts.db")).href,DATABASE_AUTH_TOKEN:""};
const client=createClient({url:env.DATABASE_URL});
await client.execute("PRAGMA foreign_keys = ON");await migrate(drizzle(client),{migrationsFolder:"drizzle"});client.close();
let child;
function run(args) {
  return new Promise(resolve=>{
    child=spawn(process.execPath,["node_modules/next/dist/bin/next",...args],{env,stdio:"inherit",windowsHide:true});
    child.on("exit",code=>resolve(code ?? 1));
  });
}
try {
  const code=await run(["build"]);
  if(code!==0) process.exitCode=code;else process.exitCode=await run(["start","-p","3100"]);
} finally {
  child?.kill();
  // Windows native SQLite handles can remain open until this process exits.
  if(process.platform!=="win32" && directory.startsWith(join(tmpdir(),"ovayi-test-e2e-"))) await rm(directory,{recursive:true,force:true});
}
