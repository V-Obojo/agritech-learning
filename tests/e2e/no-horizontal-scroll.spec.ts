import { mkdir } from "node:fs/promises";
import { test, expect, catalog, animalArea, fishPath, areaUrl, hubUrl, firstTopic, topicData, openGuide, water, submitActivity, fictionalAnswer, tundeAnswer } from "./fixtures";

test("all page types fit 375, 768, 1280 and 1440; save desktop and phone views",async({page},testInfo)=>{
  test.setTimeout(180_000);
  const soonArea=catalog.areas.find(area=>area.status==="coming-soon")!;
  const soonSubject=animalArea.subjects.find(subject=>subject.status==="coming-soon")!;
  const soonTopic=fishPath.topics.find(topic=>topic.status==="coming-soon")!;
  const pages=[
    ["home","/"],["area",areaUrl],["hub",hubUrl],["coming-soon-area",`/${soonArea.slug}`],
    ["coming-soon",`${areaUrl}/${soonSubject.slug}`],["coming-soon-topic",`${hubUrl}/${soonTopic.slug}`],
    ...fishPath.topics.filter(topic=>topic.status==="live").flatMap(topic=>{
      const data=topicData(topic.slug);return [[`lesson-${topic.order}`,data.url],[`activity-${topic.order}`,`${data.url}/activity`],[`next-${topic.order}`,`${data.url}/next`]];
    }),["not-found","/unknown-page"],
  ];
  await mkdir("test-results/phase-09",{recursive:true});
  const projectWidth=testInfo.project.name==="desktop-chromium" ? 1440 : 375;
  for(const width of [375,768,1280,1440]) {
    await page.setViewportSize({width,height:width===375 ? 812 : 900});
    for(const [name,url] of pages) {
      await page.goto(url);
      // A cold streamed not-found can start with HTTP 200; assert its actual UI.
      if(name==="not-found") await expect(page.getByRole("heading",{name:"We couldn’t find that page",exact:true})).toBeVisible();
      await expect(page.locator("main h1")).toBeVisible();
      await expect(page.locator("main[aria-busy=true]")).toHaveCount(0);
      if(name.startsWith("lesson-")) {
        const columns=width>=1280 ? 3 : width>=768 ? 2 : 1;
        const template=await page.locator(".lesson-layout").evaluate(element=>getComputedStyle(element).gridTemplateColumns);
        expect(template.split(" ")).toHaveLength(columns);
      }
      expect(await page.evaluate(()=>document.documentElement.scrollWidth),`${width}px overflow: ${url}`).toBeLessThanOrEqual(width);
      await expect(page.locator("body")).not.toContainText(/Draft learning material|not yet reviewed|No sign-up\. Your progress stays|::figure|::lab/);
      if(width===projectWidth) await page.screenshot({path:`test-results/phase-09/${name}-${width}.png`,fullPage:true,animations:"disabled"});
    }
  }
});

test("home identity, single up next, placeholders, navigation and live lessons",async({page})=>{
  await page.goto("/");
  await expect(page.getByRole("heading",{level:1,name:catalog.product.name,exact:true})).toHaveCount(1);
  expect((await page.getByRole("banner").getByRole("link",{name:catalog.product.name,exact:true}).boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await expect(page.locator("main")).not.toContainText(`by ${catalog.product.parent}`);
  await expect(page.getByRole("link",{name:"Start learning",exact:false})).toHaveAttribute("href",areaUrl);
  await page.goto(hubUrl);
  await expect(page.getByText("Up next",{exact:true})).toHaveCount(1);
  await expect(page.getByRole("img",{name:`0 of ${fishPath.topics.filter(topic=>topic.status==="live").length} live topics done`})).toBeVisible();
  for(const meta of fishPath.topics.filter(topic=>topic.status==="live")) {
    await page.goto(topicData(meta.slug).url);
    await expect(page.getByRole("heading",{level:1,name:meta.title,exact:true})).toBeVisible();
    const firstChunk=page.locator(".lesson-chunk").first();
    await firstChunk.getByText("Sources",{exact:true}).click();
    expect((await firstChunk.getByRole("link").first().boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await expect(page.locator("main")).not.toContainText(/::figure|::lab/);
    const width=page.viewportSize()!.width;
    await expect(page.locator(".lesson-layout")).toHaveCSS("grid-template-columns",width>=1280 ? /^\S+ \S+ \S+$/ : /^\S+$/);
    await openGuide(page);
    await expect(page.getByRole("region",{name:"Ask the learning guide",exact:true})).toBeVisible();
    if(width<768) {
      await expect(page.getByRole("dialog",{name:"Learning guide",exact:true})).toBeVisible();
      if(meta.order===1) await page.screenshot({path:"test-results/phase-09/guide-sheet-375.png",animations:"disabled"});
      await page.keyboard.press("Escape");
      await expect(page.getByRole("button",{name:"Ask the guide",exact:true})).toBeFocused();
    }
  }
  for(const [url,title] of [["/labs","Labs"],["/dashboard","Dashboard"],["/signin","Sign in"],["/signup","Sign up"],["/credits","Credits"]]) {
    await page.goto(url);await expect(page.getByRole("heading",{level:1,name:title,exact:true})).toBeVisible();
    await expect(page.getByText("Coming in this build",{exact:true})).toBeVisible();
  }
  const menu=page.getByRole("button",{name:"Open menu",exact:true});
  if(await menu.isVisible()) {
    await menu.click();await expect(page.getByRole("dialog",{name:"Navigation menu"})).toBeVisible();
    await page.getByRole("navigation",{name:"Mobile navigation"}).getByRole("link",{name:"Labs",exact:true}).click();
    await expect(page).toHaveURL("/labs");await expect(page.getByRole("dialog",{name:"Navigation menu"})).not.toBeVisible();
    await expect(menu).toBeFocused();
  }
});

test("theme follows the system, overrides it, persists and is applied before body paint",async({page})=>{
  await page.emulateMedia({colorScheme:"dark"});await page.goto("/");
  await expect(page.locator("html")).toHaveCSS("color-scheme","dark");
  await page.getByRole("button",{name:"Toggle colour theme",exact:true}).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme","light");
  await page.addInitScript(()=>{
    const observations:string[]=[];
    (window as typeof window & {themeAtBody:string[]}).themeAtBody=observations;
    new MutationObserver(()=>{ if(document.body && observations.length===0) observations.push(document.documentElement.dataset.theme ?? "unset"); }).observe(document,{childList:true,subtree:true});
  });
  await page.reload();
  expect(await page.evaluate(()=>(window as typeof window & {themeAtBody:string[]}).themeAtBody)).toEqual(["light"]);
  await expect(page.locator("html")).toHaveCSS("color-scheme","light");
  await page.getByRole("button",{name:"Toggle colour theme",exact:true}).click();await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme","dark");
  await page.screenshot({path:`test-results/phase-09/home-dark-${page.viewportSize()!.width}.png`,fullPage:true,animations:"disabled"});
  await page.goto(firstTopic.url);await expect(page.locator("html")).toHaveAttribute("data-theme","dark");
});

test("reduced motion renders instant states and no moving decorations",async({page})=>{
  await page.emulateMedia({reducedMotion:"reduce"});await page.goto("/");
  await expect(page.getByRole("heading",{level:1})).toBeVisible();
  await expect(page.locator(".hero-orbit span").first()).toHaveCSS("animation-name","none");
  await page.getByRole("heading",{name:catalog.areas[0].label,exact:true}).hover();
  await expect(page.locator(".navigation-card").first()).toHaveCSS("transform","none");
  expect(await page.evaluate(()=>document.getAnimations().filter(animation=>animation.playState==="running").length)).toBe(0);
});

// Keep the earlier populated-layout coverage, including long feedback and reminders.
test("populated activity and next-step layouts fit every breakpoint",async({page})=>{
  for(const [topic,answer] of [[firstTopic,tundeAnswer],[water,fictionalAnswer]] as const) {
    await page.goto(`${topic.url}/activity`);await submitActivity(page,"fictional",answer,topic);
    await expect(page.getByRole("heading",{name:"Activity completed",exact:true})).toBeVisible();
    for(const width of [375,768,1280,1440]) {
      await page.setViewportSize({width,height:900});
      expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }
    await page.getByRole("link",{name:"See my next steps",exact:true}).click();await page.getByRole("checkbox").check();
    await expect(page.getByText(topic.config.reminder.preview,{exact:true})).toBeVisible();
    for(const width of [375,768,1280,1440]) {
      await page.setViewportSize({width,height:900});
      expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }
  }
});
