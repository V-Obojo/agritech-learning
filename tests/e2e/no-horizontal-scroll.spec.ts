import { test, expect, catalog, animalArea, fishSubject, fishPath, areaUrl, hubUrl, firstTopic, water, submitActivity, fictionalAnswer, tundeAnswer } from "./fixtures";
test("375px layout: home, area, hub, coming-soon views and both populated topic loops fit",async({page})=>{
  async function fits() {
    const size=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
    expect(size.width).toBe(375);expect(size.scroll,`Horizontal overflow on ${page.url()}`).toBeLessThanOrEqual(size.width);
  }
  await page.goto("/");await fits();await page.goto(areaUrl);await fits();await page.goto(hubUrl);await fits();
  const soonArea=catalog.areas.find(area=>area.status==="coming-soon")!;
  await page.goto(`/${soonArea.slug}`);await fits();
  const soonSubject=animalArea.subjects.find(subject=>subject.status==="coming-soon")!;
  await page.goto(`${areaUrl}/${soonSubject.slug}`);await fits();
  const soonTopic=fishPath.topics.find(topic=>topic.status==="coming-soon")!;
  await page.goto(`${areaUrl}/${fishSubject.slug}/${soonTopic.slug}`);await fits();
  for(const [topic,answer] of [[firstTopic,tundeAnswer],[water,fictionalAnswer]] as const) {
    await page.goto(topic.url);await fits();await page.getByRole("link",{name:"Try the activity",exact:true}).click();
    await submitActivity(page,"fictional",answer,topic);
    await expect(page.getByRole("heading",{name:"Activity completed",exact:true})).toBeVisible();await fits();
    await page.getByRole("link",{name:"See my next steps",exact:true}).click();await page.getByRole("checkbox").check();
    await expect(page.getByText(topic.config.reminder.preview,{exact:true})).toBeVisible();await fits();
  }
});
