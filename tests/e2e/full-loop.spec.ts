import { test, expect, startLesson, submitActivity, activity, events } from "./fixtures";

test("full loop: curious learner, cited guide, observe activity, next step and local session metrics", async ({ page }) => {
  await startLesson(page);
  const radios = page.getByRole("radio");
  await radios.nth(1).check(); await radios.nth(4).check(); await radios.nth(7).check();
  const guide = page.locator('[aria-labelledby="guide-title"]');
  await guide.getByLabel("Your question").fill("Why does the dry season matter?");
  const guideResponse = page.waitForResponse((response) => response.url().endsWith("/api/guide") && response.request().method() === "POST");
  await guide.getByRole("button", { name: "Ask guide", exact: true }).click();
  expect((await (await guideResponse).json()).mode).toBe("mock");
  await expect(guide.getByRole("link", { name: /^wa-03/ })).toBeVisible();
  await guide.getByRole("link", { name: /^wa-03/ }).click();
  await expect(page).toHaveURL(/#wa-03$/);
  await page.getByRole("link", { name: "Try the activity", exact: true }).click();
  await submitActivity(page, "observe", activity.paths.find((path) => path.id === "observe")!.example!);
  await expect(page.getByRole("heading", { name: "Activity completed", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "See my next steps", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Recommended next step", exact: true })).toBeVisible();
  await page.getByRole("radio", { name: "Yes", exact: true }).check();
  const session = page.locator('[aria-labelledby="session-title"]');
  await expect(session.getByText("Completed activity: Yes", { exact: true })).toBeVisible();
  await expect(session.getByText("Check score: 3/3", { exact: true })).toBeVisible();
  await expect(session.getByText("Would return: yes", { exact: true })).toBeVisible();
  const log = await events(page);
  expect(log.map((event) => event.name)).toEqual([
    "intention_chosen", "lesson_viewed", "check_answered", "check_answered", "check_answered",
    "guide_asked", "activity_submitted", "activity_completed", "would_return",
  ]);
  expect(log.every((event) => !Number.isNaN(Date.parse(event.at)))).toBe(true);
  expect(log.filter((event) => event.name === "check_answered").every((event) => event.details.correct)).toBe(true);
  expect(JSON.stringify(log)).not.toContain("Hand-dug");
  expect(JSON.stringify(log)).not.toContain("Why does");
});
