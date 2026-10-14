import { test, expect, fictionalAnswer, submitActivity, pathway, water, events, expectTopicMetrics } from "./fixtures";
test("stuck learner: idk gets a hint, Stuck? gets authored help, and retry completes",async({page})=>{
  await page.goto(`${water.url}/activity`);
  await submitActivity(page,"fictional","idk");
  const feedback=page.locator('[aria-labelledby="feedback-title"]');
  await expect(feedback.getByText(pathway.stuckHints["activity-fictional"],{exact:true})).toBeVisible();
  expect((await events(page)).some(event=>event.name==="activity_completed")).toBe(false);
  await page.getByRole("button",{name:"Stuck?",exact:true}).click();
  await expect(page.locator(".stuck-help").getByText(pathway.stuckHints["activity-fictional"],{exact:true})).toBeVisible();
  await submitActivity(page,"fictional",fictionalAnswer);
  await expect(feedback.getByRole("heading",{name:"Activity completed",exact:true})).toBeVisible();
  expect((await events(page)).map(event=>event.name)).toEqual(["activity_submitted","help_requested","activity_submitted","activity_completed"]);
  await expectTopicMetrics(page);
});
