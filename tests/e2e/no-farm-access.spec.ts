import { test, expect, fictionalAnswer, submitActivity, water, expectTopicMetrics } from "./fixtures";
test("no farm access: water fictional path completes with cited rubric feedback",async({page})=>{
  await page.goto(`${water.url}/activity`);
  const fictional=water.activity.paths.find(path=>path.id==="fictional")!;
  await page.getByRole("radio",{name:fictional.label,exact:true}).check();
  await expect(page.getByText(fictional.scenario!,{exact:true})).toBeVisible();
  await submitActivity(page,"fictional",fictionalAnswer);
  const feedback=page.locator('[aria-labelledby="feedback-title"]');
  await expect(feedback.getByRole("heading",{name:"Activity completed",exact:true})).toBeVisible();
  await expect(feedback.getByRole("heading",{name:"Things to consider",exact:true})).toBeVisible();
  await expect(feedback.getByRole("link",{name:"Revisit wa-04",exact:true}).first()).toHaveAttribute("href",`${water.url}#wa-04`);
  await page.getByRole("link",{name:"See my next steps",exact:true}).click();
  await expect(page.getByText("Completed activity: Yes",{exact:true})).toBeVisible();
  await expectTopicMetrics(page);
});
