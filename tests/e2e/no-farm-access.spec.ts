import { test, expect, fictionalAnswer, submitActivity, events } from "./fixtures";
test("no farm access: fictional path completes with cited rubric feedback", async ({ page }) => {
  await page.goto("/activity");
  await expect(page.getByRole("heading", { name: "Amina’s story (fictional)", exact: true })).toBeVisible();
  await submitActivity(page, "fictional", fictionalAnswer);
  const feedback = page.locator('[aria-labelledby="feedback-title"]');
  await expect(feedback.getByRole("heading", { name: "Activity completed", exact: true })).toBeVisible();
  await expect(feedback.getByRole("heading", { name: "Things to consider", exact: true })).toBeVisible();
  await expect(feedback.getByRole("link", { name: "Revisit wa-04", exact: true }).first()).toBeVisible();
  await page.getByRole("link", { name: "See my next steps", exact: true }).click();
  await expect(page.getByText("Completed activity: Yes", { exact: true })).toBeVisible();
  expect((await events(page)).find((event) => event.name === "activity_completed")?.details.pathId).toBe("fictional");
});
