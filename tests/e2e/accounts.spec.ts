import { randomUUID } from "node:crypto";
import { test,expect,firstTopic,water,answerCheck,askGuide,closeGuide } from "./fixtures";
import catalog from "../../content/catalog.json";
const fixturePassword="LearningFixture12";
function identity() {return {name:"Learning Friend",email:`e2e-${randomUUID()}@example.test`};}
async function signup(page:import("@playwright/test").Page,user:ReturnType<typeof identity>) {
  await page.goto("/signup");await page.getByLabel("Name",{exact:true}).fill(user.name);await page.getByLabel("Email",{exact:true}).fill(user.email);await page.getByLabel("Password",{exact:true}).fill(fixturePassword);
  await page.getByRole("button",{name:"Create account",exact:true}).click();await expect(page).toHaveURL("/dashboard");
}
async function signin(page:import("@playwright/test").Page,email:string,password=fixturePassword) {
  await page.getByLabel("Email",{exact:true}).fill(email);await page.getByLabel("Password",{exact:true}).fill(password);await page.getByRole("button",{name:"Sign in",exact:true}).click();
}
async function signout(page:import("@playwright/test").Page) {
  await page.getByRole("button",{name:"Account menu",exact:true}).click();await page.getByRole("navigation",{name:"Account navigation"}).getByRole("button",{name:"Sign out",exact:true}).click();await expect(page).toHaveURL("/");
}

test("accounts: guest work merges, account survives sign-out/sign-in, and profile initials update",async({page})=>{
  const user=identity();await page.goto(firstTopic.url);await answerCheck(page,firstTopic);
  await signup(page,user);await expect(page.getByRole("heading",{level:1,name:"Dashboard",exact:true})).toBeVisible();
  expect(await page.evaluate(()=>localStorage.getItem("agri-progress-v2"))).toBeNull();expect(await page.evaluate(()=>localStorage.getItem("agri-events-v1"))).toBeNull();
  const account=await (await page.request.get("/api/me/progress")).json();expect(Object.keys(account.topics[firstTopic.key].checkAnswers).length).toBe(firstTopic.config.understandingCheck.length);
  expect((await (await page.request.get("/api/me/events")).json()).some((event:{name:string})=>event.name==="check_answered")).toBe(true);
  const session=await (await page.request.get("/api/auth/session")).json();expect(Object.keys(session.user).sort()).toEqual(["email","id","name"]);
  await page.goto(firstTopic.url);for(const question of firstTopic.config.understandingCheck) await expect(page.getByRole("group",{name:question.question,exact:true}).getByRole("radio").nth(question.answerIndex)).toBeChecked();
  await signout(page);await page.goto(firstTopic.url);for(const question of firstTopic.config.understandingCheck) expect(await page.getByRole("group",{name:question.question,exact:true}).getByRole("radio").evaluateAll(elements=>elements.some(element=>(element as HTMLInputElement).checked))).toBe(false);
  // New guest work must merge into the existing account without replacing its answers.
  const question=water.config.understandingCheck[0];await page.goto(water.url);await page.getByRole("group",{name:question.question,exact:true}).getByRole("radio").nth(question.answerIndex).check();
  await page.goto("/signin");await signin(page,user.email);await expect(page).toHaveURL("/dashboard");
  const restored=await (await page.request.get("/api/me/progress")).json();expect(Object.keys(restored.topics[firstTopic.key].checkAnswers).length).toBe(firstTopic.config.understandingCheck.length);expect(restored.topics[water.key].checkAnswers[question.id]).toBe(question.answerIndex);
  await page.goto("/account");await page.getByLabel("Name",{exact:true}).fill("Course Explorer");await page.getByLabel("State",{exact:true}).selectOption("Lagos");await page.getByLabel("Theme",{exact:true}).selectOption("dark");await page.getByRole("button",{name:"Save profile",exact:true}).click();
  await expect(page.getByText("Profile saved.",{exact:true})).toBeVisible();await expect(page.getByRole("button",{name:"Account menu",exact:true})).toHaveText("CE");await expect(page.locator("html")).toHaveAttribute("data-theme","dark");await page.reload();await expect(page.getByRole("button",{name:"Account menu",exact:true})).toHaveText("CE");
  await expect(page.getByLabel("State",{exact:true})).toHaveValue("Lagos");expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
});

test("accounts: route protection, admin contact, inline validation, and generic bad-credentials error",async({page})=>{
  await page.goto("/dashboard");await expect(page).toHaveURL(/\/signin\?callbackUrl=/);await expect(page.getByRole("heading",{level:1,name:"Sign in",exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Forgot password?",exact:true}).click();await expect(page.getByRole("link",{name:catalog.product.supportContact,exact:true}).first()).toHaveAttribute("href",`mailto:${catalog.product.supportContact}`);
  await expect(page.getByText("Contact the admin to reset your password:",{exact:false})).toBeVisible();
  await signin(page,`missing-${randomUUID()}@example.test`,"WrongFixture12");await expect(page.getByRole("main").getByRole("alert")).toHaveText("Email or password is incorrect");
  await page.goto("/account");await expect(page).toHaveURL(/\/signin\?callbackUrl=/);
  await page.goto("/signup");await page.getByRole("button",{name:"Create account",exact:true}).click();await expect(page.getByText("Enter your name.",{exact:true})).toBeVisible();await expect(page.getByText("Enter a valid email address.",{exact:true})).toBeVisible();
});

test("accounts: signed-in changes debounce-save, guide history persists, password change and deletion work",async({page})=>{
  const user=identity();await signup(page,user);await page.goto(water.url);
  const question=water.config.understandingCheck[0];const saved=page.waitForResponse(response=>response.url().endsWith("/api/me/progress") && response.request().method()==="PUT");
  await page.getByRole("group",{name:question.question,exact:true}).getByRole("radio").nth(question.answerIndex).check();await saved;
  const history=page.waitForResponse(response=>response.url().endsWith("/api/me/guide-history") && response.request().method()==="POST");
  await askGuide(page,"Why does the dry season matter?","wa-03");expect((await history).status()).toBe(201);await closeGuide(page);
  await page.goto("/account");await page.getByLabel("Current password",{exact:true}).fill(fixturePassword);await page.getByLabel("New password",{exact:true}).fill("ReplacementFixture12");await page.getByRole("button",{name:"Change password",exact:true}).click();await expect(page.getByText("Password changed.",{exact:true})).toBeVisible();
  await signout(page);await page.goto("/signin?callbackUrl=%2Faccount");await signin(page,user.email,"ReplacementFixture12");await expect(page).toHaveURL("/account");
  const progress=await (await page.request.get("/api/me/progress")).json();expect(progress.topics[water.key].checkAnswers[question.id]).toBe(question.answerIndex);
  await expect(async()=>{const confirmation=page.getByLabel("Confirm account deletion",{exact:true});await confirmation.fill("");await confirmation.fill("DELETE");await expect(page.getByRole("button",{name:"Delete my account",exact:true})).toBeEnabled({timeout:500});}).toPass({timeout:10000,intervals:[250,500,1000]});await page.getByRole("button",{name:"Delete my account",exact:true}).click();await expect(page).toHaveURL("/");expect((await page.request.get("/api/me/progress")).status()).toBe(401);
  await page.goto("/signin");await signin(page,user.email,"ReplacementFixture12");await expect(page.getByRole("main").getByRole("alert")).toHaveText("Email or password is incorrect");
});
