import { test, expect, submitActivity, fictionalAnswer, startLesson } from "./fixtures";
test("375px layout: welcome, lesson, populated activity and next have no horizontal scroll", async ({ page }) => {
  async function fits() {
    const size = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
    expect(size.width).toBe(375);
    expect(size.scroll, `Horizontal overflow on ${page.url()}`).toBeLessThanOrEqual(size.width);
  }
  await page.goto("/"); await fits();
  await startLesson(page); await fits();
  await page.getByRole("link", { name: "Try the activity", exact: true }).click();
  await submitActivity(page, "fictional", fictionalAnswer);
  await expect(page.getByRole("heading", { name: "Activity completed", exact: true })).toBeVisible();
  await fits();
  await page.getByRole("link", { name: "See my next steps", exact: true }).click();
  await page.getByRole("checkbox").check();
  await expect(page.getByText(/Hi! Last week you looked/)).toBeVisible();
  await fits();
});
