import {mkdir,writeFile} from "node:fs/promises";
import {test,expect,catalog,firstTopic,water,askGuide} from "./fixtures";
const directory="test-results/phase-13-2";

test("Phase 13.2: authored hero and four-column responsive footer",async({page},info)=>{
  await page.emulateMedia({reducedMotion:"reduce"});await page.goto("/");
  await expect(page.getByRole("heading",{level:1})).toHaveText(catalog.product.heroHeadline);
  await expect(page.getByRole("heading",{name:catalog.product.name,exact:true})).toHaveCount(0);
  await expect(page.getByRole("banner").getByRole("link",{name:catalog.product.name,exact:true})).toBeVisible();
  await expect(page.locator(".hero .lead")).toHaveText(catalog.product.heroSubhead);
  await expect(page.locator(".hero .eyebrow")).toHaveText(catalog.product.heroEyebrow);
  await expect(page.locator(".hero").getByRole("link")).toHaveCount(2);
  const footer=page.getByRole("contentinfo"),columns=footer.locator(".footer-columns");
  for(const name of ["Learn","Account","About"])await expect(footer.getByRole("heading",{name,exact:true})).toBeVisible();
  for(const [label,href] of [["Home","/"],["Labs","/labs"],["Dashboard","/dashboard"],["Credits","/credits"],["Sign in","/signin"],["Sign up","/signup"],["My account","/account"]])await expect(footer.getByRole("navigation",{name:"Footer",exact:true}).getByRole("link",{name:label,exact:true})).toHaveAttribute("href",href);
  await expect(footer.getByRole("link",{name:catalog.product.supportContact,exact:true})).toHaveAttribute("href",`mailto:${catalog.product.supportContact}`);
  await expect(footer).toContainText(`© ${new Date().getFullYear()} ${catalog.product.parent}. All rights reserved.`);
  await expect(page.getByText("Content drawn from FAO and Nigerian research. Expert review ongoing.",{exact:true})).toHaveCount(1);
  await expect(page.locator("main")).not.toContainText("Expert review ongoing");
  const evidence=[];
  for(const width of [375,768,1024,1280,1440]){
    await page.setViewportSize({width,height:900});
    const grid=await columns.evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(" "));
    expect(grid).toHaveLength(width>=1024?4:1);
    const boxes=await columns.locator("section").evaluateAll(nodes=>nodes.map(n=>{const b=n.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width};}));
    expect(boxes).toHaveLength(4);if(width>=1024)expect(new Set(boxes.map(b=>b.y)).size).toBe(1);else for(let i=1;i<boxes.length;i++)expect(boxes[i].y).toBeGreaterThan(boxes[i-1].y);
    const scrollWidth=await page.evaluate(()=>document.documentElement.scrollWidth);expect(scrollWidth).toBeLessThanOrEqual(width);evidence.push({width,columns:grid.length,boxes,scrollWidth});
  }
  await mkdir(directory,{recursive:true});await writeFile(`${directory}/${info.project.name}-footer.json`,JSON.stringify(evidence,null,2));
  await page.setViewportSize(info.project.use.viewport!);await page.screenshot({path:`${directory}/${info.project.name}-home-after.png`,scale:"css"});await footer.screenshot({path:`${directory}/${info.project.name}-footer.png`,scale:"css"});
  await expect(page.getByRole("button",{name:"Ask the guide",exact:true})).toHaveCount(0);
});

test("Phase 13.2: fixed guide FAB, sheet, focus trap, Escape and preserved question",async({page},info)=>{
  await page.emulateMedia({reducedMotion:"reduce"});await page.goto(firstTopic.url);
  const fab=page.getByRole("button",{name:"Ask the guide",exact:true}),dialog=page.getByRole("dialog",{name:"Learning guide",exact:true});
  await expect(fab).toBeVisible();await expect(fab).toHaveAttribute("aria-haspopup","dialog");await expect(fab).toHaveAttribute("aria-expanded","false");
  await mkdir(directory,{recursive:true});await page.screenshot({path:`${directory}/${info.project.name}-lesson-after.png`,scale:"css"});
  const measurements=[];
  for(const width of [375,768,1024,1280,1440]){
    await page.setViewportSize({width,height:900});await expect(fab).toHaveCSS("position","fixed");
    const box=(await fab.boundingBox())!;expect(Math.abs(width-box.x-box.width-24)).toBeLessThanOrEqual(1);expect(Math.abs(900-box.y-box.height-24)).toBeLessThanOrEqual(1);
    expect(await fab.evaluate(e=>{const b=e.getBoundingClientRect();return e.contains(document.elementFromPoint(b.x+b.width/2,b.y+b.height/2));})).toBe(true);
    await fab.click();await expect(dialog).toBeVisible();await expect(fab).toHaveAttribute("aria-expanded","true");
    await expect(dialog.getByLabel("Your question",{exact:true})).toBeVisible();await expect(dialog.getByRole("button",{name:"Help with the lesson",exact:true})).toBeVisible();
    const sheet=(await dialog.boundingBox())!;if(width>=1024){expect(sheet.width).toBeGreaterThanOrEqual(420);expect(sheet.width).toBeLessThanOrEqual(480);expect(sheet.x+sheet.width).toBe(width);}else {expect(sheet.height/900).toBeCloseTo(.85,2);expect(sheet.y+sheet.height).toBe(900);}
    const close=dialog.getByRole("button",{name:"Close guide",exact:true});await close.focus();await page.keyboard.press("Shift+Tab");await expect(dialog.getByRole("button",{name:"Help with the lesson",exact:true})).toBeFocused();await page.keyboard.press("Tab");await expect(close).toBeFocused();
    await dialog.getByLabel("Your question",{exact:true}).fill("What do I need to start fish farming?");
    const scrollWidth=await page.evaluate(()=>document.documentElement.scrollWidth);expect(scrollWidth).toBeLessThanOrEqual(width);measurements.push({width,fab:box,sheet,scrollWidth});
    await page.keyboard.press("Escape");await expect(dialog).not.toBeVisible();await expect(fab).toBeFocused();await expect(fab).toHaveAttribute("aria-expanded","false");
    await fab.click();await expect(dialog.getByLabel("Your question",{exact:true})).toHaveValue("What do I need to start fish farming?");await close.click();await expect(fab).toBeFocused();
  }
  await writeFile(`${directory}/${info.project.name}-guide.json`,JSON.stringify(measurements,null,2));await page.setViewportSize(info.project.use.viewport!);await fab.click();await page.screenshot({path:`${directory}/${info.project.name}-guide-open.png`,scale:"css"});
});

test("Phase 13.2: water citation scrolls lesson and keeps desktop guide open",async({page},info)=>{
  await page.emulateMedia({reducedMotion:"reduce"});await page.goto(water.url);
  await askGuide(page,"Why does the dry season matter?","wa-03");
  const dialog=page.getByRole("dialog",{name:"Learning guide",exact:true});await dialog.getByRole("link",{name:/^wa-03/}).click();await expect(page).toHaveURL(/#wa-03$/);
  await expect.poll(()=>page.locator("#wa-03").evaluate(e=>e.getBoundingClientRect().top)).toBeLessThan(300);
  expect(await page.locator("#wa-03").evaluate(e=>e.getBoundingClientRect().bottom)).toBeGreaterThan(0);
  if(page.viewportSize()!.width>=1024)await expect(dialog).toBeVisible();else await expect(dialog).not.toBeVisible();
  await mkdir(directory,{recursive:true});await page.screenshot({path:`${directory}/${info.project.name}-citation.png`,scale:"css"});
});
