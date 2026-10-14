import { test, expect, startLesson, pathway, events, expectTopicMetrics } from "./fixtures";
test("unsupported medicine question: honest limitation, authored next step and no citations",async({page})=>{
  await startLesson(page);
  const guide=page.getByRole("region",{name:"Ask the learning guide",exact:true});
  await guide.getByLabel("Your question").fill("What dose of medicine should I give sick catfish?");
  const response=page.waitForResponse(response=>response.url().endsWith("/api/guide") && response.request().method()==="POST");
  await guide.getByRole("button",{name:"Ask guide",exact:true}).click();
  expect((await (await response).json()).mode).toBe("mock");
  await expect(guide.getByRole("heading",{name:"Not covered in this lesson",exact:true})).toBeVisible();
  await expect(guide.getByText(pathway.unsupportedFallback.message,{exact:true})).toBeVisible();
  await expect(guide.getByText(pathway.nextSteps.find(step=>step.id===pathway.unsupportedFallback.nextStep)!.label,{exact:false})).toBeVisible();
  await expect(guide.locator(".chips a")).toHaveCount(0);
  expect((await events(page)).map(event=>event.name)).toContain("guide_unsupported");
  await expectTopicMetrics(page);
});
