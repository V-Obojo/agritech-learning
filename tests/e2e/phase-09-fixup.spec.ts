import { test, expect, catalog, fishPath, areaUrl, hubUrl, water, chooseIntention, openGuide } from "./fixtures";

test("Phase 09.1: breadcrumb links and current item have aligned centres",async({page})=>{
  await page.emulateMedia({reducedMotion:"reduce"});
  for(const width of [1440,375]) {
    await page.setViewportSize({width,height:900});
    for(const url of [areaUrl,hubUrl]) {
      await page.goto(url);
      const crumbs=page.getByRole("navigation",{name:"Breadcrumb"}).getByRole("listitem");
      await expect(crumbs.first()).toBeVisible();
      const boxes=await crumbs.evaluateAll(items=>items.map(item=>{
        const content=item.querySelector("a,[aria-current=page]")!.getBoundingClientRect();
        const box=item.getBoundingClientRect();
        return {centre:content.y+content.height/2,itemCentre:box.y+box.height/2};
      }));
      expect(boxes.length).toBeGreaterThan(1);
      for(const box of boxes) {
        expect(Math.abs(box.centre-boxes[0].centre)).toBeLessThanOrEqual(2);
        expect(Math.abs(box.centre-box.itemCentre)).toBeLessThanOrEqual(2);
      }
    }
    await page.screenshot({path:`test-results/phase-09.1/breadcrumbs-${width}.png`,animations:"disabled"});
  }
});

test("Phase 09.1: authored copy and direct hub intention picker",async({page})=>{
  await page.goto("/");
  await expect(page.locator(".hero").getByText(catalog.product.heroEyebrow,{exact:true})).toBeVisible();
  await page.goto(hubUrl);
  const card=page.locator(".hub-summary");
  await expect(card.getByRole("heading",{name:fishPath.hubCard.title,exact:true})).toBeVisible();
  await expect(card.getByText(fishPath.hubCard.note,{exact:true})).toBeVisible();
  await expect(card.getByRole("group",{name:fishPath.hubCard.intentionPrompt,exact:true})).toBeVisible();
  await expect(card).not.toContainText("You’re here because:");
  await expect(card.getByRole("button",{name:"Change",exact:true})).toHaveCount(0);
  await page.screenshot({path:`test-results/phase-09.1/hub-${page.viewportSize()!.width}.png`,fullPage:true,animations:"disabled"});
  // Choosing replaces the picker with a summary, so assert that resulting state.
  await card.getByRole("radio",{name:catalog.intentions[0].label,exact:true}).click();
  await expect(card).toContainText(`You’re here because: ${catalog.intentions[0].label}`);
  await expect(card.getByRole("group",{name:fishPath.hubCard.intentionPrompt,exact:true})).toHaveCount(0);
  await card.getByRole("button",{name:"Change",exact:true}).click();
  await expect(card.getByRole("group",{name:fishPath.hubCard.intentionPrompt,exact:true})).toBeVisible();
  await chooseIntention(page,catalog.intentions[1].id);await page.reload();
  await expect(card).toContainText(`You’re here because: ${catalog.intentions[1].label}`);
});

test("Phase 09.1: visible lesson bullets and distinct, working lesson and guide help",async({page})=>{
  await page.goto(water.url);
  const items=page.locator(".lesson-chunk > div ul li");
  expect(await items.count()).toBeGreaterThan(0);
  await items.first().scrollIntoViewIfNeeded();
  const markers=await items.evaluateAll(elements=>elements.map(element=>{
    const style=getComputedStyle(element);
    return {display:style.display,type:style.listStyleType};
  }));
  expect(markers.every(marker=>marker.display==="list-item" && marker.type!=="none")).toBe(true);
  await openGuide(page);
  await expect(page.getByRole("button",{name:"Stuck?",exact:true})).toHaveCount(0);
  for(const [label,step] of [["Help with the lesson","lesson"],["Help asking the guide","guide"]] as const) {
    const button=page.getByRole("button",{name:label,exact:true});
    await expect(button).toHaveCount(1);
    await expect(button).toBeVisible();
    const response=page.waitForResponse(response=>response.url().endsWith("/api/help") && response.request().method()==="POST");
    await button.click();
    const result=await response;
    expect(result.request().postDataJSON().step).toBe(step);
    expect((await result.json()).hint).toBe(water.config.stuckHints[step]);
    await expect(button.locator("..").getByText(water.config.stuckHints[step],{exact:true})).toBeVisible();
  }
  await page.screenshot({path:`test-results/phase-09.1/help-${page.viewportSize()!.width}.png`,animations:"disabled"});
});
