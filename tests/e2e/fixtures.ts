import { test as base, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

// Installed Edge avoids network browser downloads on the Windows demo machine.
export const test = base.extend<{ localOnly: void }>({
  localOnly: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    await page.route("**/*", (route) => {
      const hostname = new URL(route.request().url()).hostname;
      if (hostname === "localhost" || hostname === "127.0.0.1") return route.continue();
      errors.push(`Unexpected external request: ${hostname}`);
      return route.abort();
    });
    await use();
    expect(errors).toEqual([]);
  }, { auto: true }],
});
test.use({ channel: process.platform === "win32" ? "msedge" : undefined });
export { expect };
export const activity = JSON.parse(readFileSync("content/activity.json", "utf8")) as {
  paths: { id: string; label: string; example?: string; scenario?: string }[];
};
export const pathway = JSON.parse(readFileSync("content/pathway.json", "utf8")) as {
  stuckHints: Record<string, string>;
  unsupportedFallback: { message: string; nextStep: string };
  nextSteps: { id: string; label: string }[];
};
export const fictionalAnswer = "Amina's well ran low in the dry season. She needs to find out about testing the water.";
export async function startLesson(page: Page) {
  await page.goto("/");
  await page.getByRole("radio", { name: "I'm just curious about fish farming", exact: true }).check();
  await page.getByRole("link", { name: "Start the lesson", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Is there enough good water/ })).toBeVisible();
}
export async function submitActivity(page: Page, pathId: string, answer: string) {
  const path = activity.paths.find((path) => path.id === pathId)!;
  await page.getByRole("radio", { name: path.label, exact: true }).check();
  await page.getByLabel("Your answer", { exact: true }).fill(answer);
  await page.getByRole("button", { name: "Get feedback", exact: true }).click();
}
export async function events(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem("agri-events-v1") ?? "[]") as {
    name: string; at: string; details: Record<string, string | number | boolean>;
  }[]);
}
