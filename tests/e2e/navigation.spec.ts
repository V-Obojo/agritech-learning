import { test, expect, catalog, animalArea, fishPath, areaUrl, firstTopic, water, chooseIntention, openFishHub, answerCheck, askGuide, submitActivity, tundeAnswer, events } from "./fixtures";
test("navigation: Ovayi Farm → fish hub → Tunde topic loop → Done → water guide → coming-soon pages",async({page})=>{
  await page.goto("/");
  await expect(page.getByRole("heading",{name:catalog.product.name,exact:true})).toBeVisible();
  await expect(page.locator("header")).toContainText(`by ${catalog.product.parent}`);
  await expect(page.locator("a.navigation-card")).toHaveCount(3);
  for(const area of catalog.areas) await expect(page.getByRole("heading",{name:area.label,exact:true})).toBeVisible();
  await expect(page.getByText("A first step for curious beginners",{exact:false})).toHaveCount(0);
  await chooseIntention(page,"considering");await openFishHub(page);
  await expect(page.getByText(fishPath.intro,{exact:true})).toBeVisible();await expect(page.locator(".topic-path > li")).toHaveCount(5);
  await expect(page.locator(".topic-path .badge").filter({hasText:"Coming soon"})).toHaveCount(3);
  await expect(page.locator(".topic-path .muted-card a")).toHaveCount(0);
  await page.getByRole("link",{name:"Start",exact:true}).click();await expect(page).toHaveURL(firstTopic.url);
  await answerCheck(page,firstTopic);await askGuide(page,"What do I need to start fish farming?","wf-05");
  await page.getByRole("link",{name:"Try the activity",exact:true}).click();
  await page.getByRole("radio",{name:firstTopic.activity.paths.find(path=>path.id==="fictional")!.label,exact:true}).check();
  await expect(page.getByText(firstTopic.activity.paths.find(path=>path.id==="fictional")!.scenario!,{exact:true})).toBeVisible();
  await submitActivity(page,"fictional",tundeAnswer,firstTopic);
  await expect(page.getByRole("heading",{name:"Activity completed",exact:true})).toBeVisible();
  await page.getByRole("link",{name:"See my next steps",exact:true}).click();
  await expect(page.getByRole("link",{name:`Next topic: ${water.meta.title}`,exact:true})).toHaveAttribute("href",water.url);
  await page.getByRole("link",{name:`Back to ${fishPath.title} path`,exact:true}).click();
  await expect(page.locator(".topic-card").filter({has:page.getByRole("heading",{name:firstTopic.meta.title,exact:true})})).toContainText("Done");
  await page.getByRole("link",{name:`Continue: ${water.meta.title}`,exact:true}).click();
  await askGuide(page,"Why does the dry season matter for a fish pond?","wa-03");
  // Water's session must not inherit the completed first topic or its check answers.
  await page.getByRole("link",{name:"Try the activity",exact:true}).click();
  await page.getByRole("link",{name:"Pause and see next steps",exact:true}).click();
  await expect(page).toHaveURL(`${water.url}/next`);
  await expect(page.getByRole("region",{name:"Your session",exact:true})).toContainText("Completed activity: No");
  await expect(page.getByRole("region",{name:"Your session",exact:true})).toContainText("Check score: 0/3");
  const crop=catalog.areas.find(area=>area.id==="crop-farming")!;
  await page.goto(`/${crop.slug}`);await expect(page.getByRole("heading",{name:crop.label,exact:true})).toBeVisible();
  await expect(page.getByText("Coming soon",{exact:true}).first()).toBeVisible();
  await expect(page.getByRole("navigation",{name:"Breadcrumb"}).getByRole("link",{name:"Home",exact:true})).toHaveAttribute("href","/");
  const poultry=animalArea.subjects.find(subject=>subject.id==="poultry")!;
  await page.goto(`${areaUrl}/${poultry.slug}`);await expect(page.getByRole("heading",{name:poultry.label,exact:true})).toBeVisible();
  await expect(page.getByText("Coming soon",{exact:true})).toBeVisible();await expect(page.getByRole("link",{name:`Back to ${animalArea.label}`,exact:true})).toHaveAttribute("href",areaUrl);
  const log=await events(page);
  for(const topic of [firstTopic,water]) {
    expect(log.some(event=>event.name==="topic_opened" && event.details.subjectId===topic.subjectId && event.details.topicId===topic.meta.id)).toBe(true);
    expect(log.some(event=>event.name==="guide_asked" && event.details.topicId===topic.meta.id)).toBe(true);
  }
  expect(log.some(event=>event.name==="area_opened" && event.details.areaId===animalArea.id)).toBe(true);
  expect(log.some(event=>event.name==="subject_opened" && event.details.subjectId===firstTopic.subjectId)).toBe(true);
  expect(log.find(event=>event.name==="activity_completed")?.details).toMatchObject({subjectId:firstTopic.subjectId,topicId:firstTopic.meta.id,pathId:"fictional"});
  expect(JSON.stringify(log)).not.toContain(tundeAnswer);
});
