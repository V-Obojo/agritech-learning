import {test,expect,firstTopic,openGuide} from "./fixtures";
test("failed guide retries the same question and keeps guest learning available",async({page})=>{
  await page.goto(firstTopic.url);await openGuide(page);const guide=page.getByRole("region",{name:"Ask the learning guide",exact:true});
  await page.route("**/api/guide",route=>route.abort("internetdisconnected"));await guide.getByLabel("Your question").fill("What do I need to start fish farming?");await guide.getByRole("button",{name:"Ask guide",exact:true}).click();await expect(guide.getByRole("alert")).toContainText("Please try again");await expect(guide.getByRole("button",{name:"Retry guide",exact:true})).toBeEnabled();
  await page.unroute("**/api/guide");await guide.getByRole("button",{name:"Retry guide",exact:true}).click();await expect(guide.locator('a[href="#wf-05"]')).toBeVisible();await expect(guide.getByRole("alert")).toHaveCount(0);
});
test("unavailable account service has a friendly error and a working guest route",async({page})=>{
  await page.goto("/signup");await page.route("**/api/auth/signup",route=>route.fulfill({status:503,contentType:"application/json",body:JSON.stringify({error:"The account service is unavailable. Please try again."})}));
  await page.getByLabel("Name",{exact:true}).fill("Guest Learner");await page.getByLabel("Email",{exact:true}).fill("guest@example.test");await page.getByLabel("Password",{exact:true}).fill("RecoveryFixture14");await page.getByRole("button",{name:"Create account",exact:true}).click();await expect(page.getByRole("main").getByRole("alert")).toContainText("account service is unavailable");await page.getByRole("link",{name:"Keep learning as a guest",exact:true}).click();await expect(page.locator(".hero")).toBeVisible();await page.goto(firstTopic.url);await expect(page.getByRole("article")).toBeVisible();
});
test("sign-in service failure explains account availability without a credential diagnostic",async({page})=>{
  await page.goto("/signin");await page.route("**/api/auth/callback/credentials",route=>route.fulfill({status:503,contentType:"application/json",body:JSON.stringify({url:"http://localhost:3100/signin?error=AccountServiceUnavailable"})}));
  await page.getByLabel("Email",{exact:true}).fill("guest@example.test");await page.getByLabel("Password",{exact:true}).fill("RecoveryFixture14");await page.getByRole("button",{name:"Sign in",exact:true}).click();await expect(page.getByRole("main").getByRole("alert")).toContainText("account service is unavailable");await expect(page.getByRole("link",{name:"Keep learning as a guest",exact:true})).toBeVisible();
});
