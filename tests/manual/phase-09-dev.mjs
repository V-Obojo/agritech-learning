import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const directory="test-results/phase-09";
await mkdir(directory,{recursive:true});
const catalog=JSON.parse(await readFile("content/catalog.json","utf8"));
const area=catalog.areas.find(area=>area.status==="live");
const subject=area.subjects.find(subject=>subject.status==="live");
const path=JSON.parse(await readFile(`content/${subject.path}/path.json`,"utf8"));
const base=`/${area.slug}/${subject.slug}`;
const urls=[`/${area.slug}`,base,...path.topics.filter(topic=>topic.status==="live").flatMap(topic=>[`${base}/${topic.slug}`,`${base}/${topic.slug}/activity`,`${base}/${topic.slug}/next`])];
const server=spawn(process.execPath,["node_modules/next/dist/bin/next","dev","-p","3101"],{env:{...process.env,GUIDE_MODE:"mock",DATABASE_URL:`file:data/test-phase-09-dev-${process.pid}.db`},windowsHide:true,stdio:["ignore","pipe","pipe"]});
let output="";server.stdout.on("data",data=>{output+=data;});server.stderr.on("data",data=>{output+=data;});
let browser;
const problems=[];
try {
  const deadline=Date.now()+60000;
  while(!output.includes("Ready")) {
    if(server.exitCode!==null) throw new Error(`Dev server exited ${server.exitCode}`);
    if(Date.now()>deadline) throw new Error("Dev server did not become ready within 60s");
    await new Promise(resolve=>setTimeout(resolve,200));
  }
  browser=await chromium.launch({channel:process.platform==="win32" ? "msedge" : undefined});
  const page=await browser.newPage();
  page.on("pageerror",error=>problems.push(error.message));
  page.on("console",message=>{if(message.type()==="error") problems.push(message.text());});
  await page.route("**/*",route=>{
    if(new URL(route.request().url()).hostname==="localhost") return route.continue();
    problems.push(`Unexpected external request: ${route.request().url()}`);return route.abort();
  });
  for(const url of urls) {
    await page.goto(`http://localhost:3101${url}`);
    await page.getByRole("heading",{level:1}).waitFor();
    await page.waitForTimeout(150);
  }
  if(/URL data|blocking-prerender|outside of.*Suspense/i.test(output)) problems.push("Prerender warning in dev server output");
  if(problems.length) throw new Error(problems.join("\n"));
  console.log(`Phase 09 dev PASS: ${urls.length} dynamic routes; no page/console errors or URL-data prerender warnings.`);
} finally {
  await browser?.close();server.kill();
  await writeFile(`${directory}/dev-console.log`,output);
  await writeFile(`${directory}/dev-result.json`,JSON.stringify({urls,problems},null,2));
}
