import {gzipSync} from "node:zlib";
import {mkdir,writeFile} from "node:fs/promises";
import {randomUUID} from "node:crypto";
import {test,expect,catalog,hubUrl,fishPath,topicData} from "./fixtures";
import {labTopic} from "./lab-actions";
test("production route JavaScript, lazy engine/chart/labs and responsive images",async({page},info)=>{
  test.setTimeout(240000);await page.emulateMedia({reducedMotion:"reduce"});
  const requested=new Set<string>(),cache=new Map<string,{bytes:number;gzip:number;engines:string[]}>();
  page.on("request",r=>{if(new URL(r.url()).pathname.endsWith(".js"))requested.add(r.url());});
  const rows:{route:string;jsKiB:number;gzipKiB:number;chunks:string[];engines:string[]}[]=[];
  async function measure(route:string) {
    requested.clear();await page.goto(route);await page.waitForLoadState("networkidle");
    const chunks=[...requested];expect(chunks.length).toBeGreaterThan(0);
    for(const url of chunks)if(!cache.has(url)) {
      const response=await page.request.get(url);expect(response.ok()).toBe(true);const body=await response.body(),text=body.toString();
      const engines=[...(text.includes("THREE.WebGLRenderer")||text.includes("R3F:")?["3d"]:[]),...(text.includes("data-chart")&&text.includes("learning-activity")?["chart"]:[]),...(["water-simulator","pond-builder","observation"] as const).filter(type=>text.includes("data-simulator")&&text.includes(`\"${type}\"`))];
      cache.set(url,{bytes:body.length,gzip:gzipSync(body).length,engines});
    }
    const data=chunks.map(url=>cache.get(url)!);rows.push({route,jsKiB:Number((data.reduce((n,c)=>n+c.bytes,0)/1024).toFixed(1)),gzipKiB:Number((data.reduce((n,c)=>n+c.gzip,0)/1024).toFixed(1)),chunks:chunks.map(u=>new URL(u).pathname),engines:[...new Set(data.flatMap(c=>c.engines))]});
    const heavy=rows.at(-1)!.engines;
    expect(heavy.includes("3d")).toBe(route===labTopic("model-viewer").url);
    expect(heavy.includes("chart")).toBe(route==="/dashboard");
    for(const type of ["water-simulator","pond-builder","observation"])expect(heavy.includes(type)).toBe(route===labTopic(type).url);
    const images=await page.locator("main img").evaluateAll(images=>images.map(i=>({sizes:i.getAttribute("sizes"),width:i.getAttribute("width"),height:i.getAttribute("height"),src:i.getAttribute("src")})));
    for(const image of images){expect(image.sizes).toBeTruthy();expect(Number(image.width)).toBeGreaterThan(0);expect(Number(image.height)).toBeGreaterThan(0);expect(image.src).toMatch(/^\/(?:_next\/image|media\/)/);}
  }
  const routes=["/",...catalog.areas.flatMap(a=>[`/${a.slug}`,...a.subjects.map(s=>`/${a.slug}/${s.slug}`)]),...fishPath.topics.flatMap(t=>t.status==="live"?[topicData(t.slug).url,`${topicData(t.slug).url}/activity`,`${topicData(t.slug).url}/next`]:[`${hubUrl}/${t.slug}`]),"/labs","/credits","/signin","/signup","/unknown-page"];
  for(const route of [...new Set(routes)])await measure(route);
  expect(rows.find(row=>row.route==="/")!.gzipKiB).toBeLessThanOrEqual(250);
  await page.goto("/signup");await page.getByLabel("Name",{exact:true}).fill("Performance Learner");await page.getByLabel("Email",{exact:true}).fill(`performance-${randomUUID()}@example.test`);await page.getByLabel("Password",{exact:true}).fill("PerformanceFixture14");await page.getByRole("button",{name:"Create account",exact:true}).click();await expect(page).toHaveURL("/dashboard");await expect(page.locator('[data-chart="learning-activity"]')).toBeVisible();await measure("/dashboard");await measure("/account");
  await mkdir("test-results/phase-14",{recursive:true});await writeFile(`test-results/phase-14/${info.project.name}-performance.json`,JSON.stringify({method:"Production hard navigation through network idle; distinct requested JS; uncompressed and local gzip byte totals. Next 16 build has no First Load JS column.",rows},null,2));
});
