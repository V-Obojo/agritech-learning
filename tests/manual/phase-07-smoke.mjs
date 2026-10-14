// Phase 07 acceptance smoke against a dev server started with GUIDE_MODE=mock.
import { chromium, expect } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
const origin = 'http://127.0.0.1:3101';
const catalog = JSON.parse(readFileSync('content/catalog.json', 'utf8'));
const area = catalog.areas.find(item => item.status === 'live');
const subject = area.subjects.find(item => item.status === 'live');
const authoredPath = JSON.parse(readFileSync(path.join('content', subject.path, 'path.json'), 'utf8'));
const live = authoredPath.topics.filter(item => item.status === 'live').sort((a,b) => a.order-b.order);
const areaUrl = `/${area.slug}`;
const hubUrl = `${areaUrl}/${subject.slug}`;
const urlFor = topic => `${hubUrl}/${topic.slug}`;
const configFor = topic => JSON.parse(readFileSync(path.join('content',subject.path,topic.id,'topic.json'),'utf8'));
const activityFor = topic => JSON.parse(readFileSync(path.join('content',subject.path,topic.id,'activity.json'),'utf8'));
const browser = await chromium.launch({channel:'msedge'});
const page = await browser.newPage({viewport:{width:375,height:812},colorScheme:'light'});
const errors = [];
let expect404 = false;
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if(message.type()==='error' && !(expect404 && message.text().includes('404'))) errors.push(message.text()); });
await page.route('**/*',route=>{
  const url=new URL(route.request().url());
  if(url.hostname==='127.0.0.1' || url.hostname==='localhost') return route.continue();
  errors.push(`External request: ${url.hostname}`); return route.abort();
});
mkdirSync('test-results/phase-07',{recursive:true});
async function width(name) {
  const size=await page.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth}));
  expect(size.scroll,`${name}: horizontal overflow`).toBeLessThanOrEqual(size.viewport);
  await page.screenshot({path:`test-results/phase-07/${name}.png`,fullPage:true});
}
async function saved() { return page.evaluate(()=>JSON.parse(localStorage.getItem('agri-progress-v2'))); }
async function lesson(topic,index) {
  const config=configFor(topic);
  await expect(page.getByRole('heading',{name:topic.title,exact:true})).toBeVisible();
  await expect(page.getByText(`Topic ${topic.order} of ${authoredPath.topics.length}`,{exact:false})).toBeVisible();
  await expect(page.getByRole('navigation',{name:'Breadcrumb'})).toBeVisible();
  await page.getByRole('button',{name:'Stuck?',exact:true}).first().click();
  await expect(page.getByText(config.stuckHints.lesson,{exact:true})).toBeVisible();
  await page.locator('.lesson-chunk details').first().getByText('Sources',{exact:true}).click();
  await expect(page.locator('.lesson-chunk details').first().getByRole('link').first()).toBeVisible();
  for(const question of config.understandingCheck) await page.getByRole('group',{name:question.question,exact:true}).getByRole('radio').nth(question.answerIndex).check();
  await page.reload();
  for(const question of config.understandingCheck) await expect(page.getByRole('group',{name:question.question,exact:true}).getByRole('radio').nth(question.answerIndex)).toBeChecked();
  const guide=page.locator('[aria-labelledby="guide-title"]');
  const question=config.starterQuestions[index===0 ? 1 : 0];
  await guide.getByLabel('Your question').fill(question);
  await guide.getByRole('button',{name:'Ask guide',exact:true}).click();
  await expect(guide.getByRole('heading',{name:'From the lesson'})).toBeVisible();
  const expectedChunk=config.understandingCheck[0].chunk;
  await expect(guide.locator(`a[href="#${expectedChunk}"]`)).toBeVisible();
  await guide.locator(`a[href="#${expectedChunk}"]`).click(); expect(new URL(page.url()).hash).toBe(`#${expectedChunk}`);
  await guide.getByLabel('Your question').fill('What dose of medicine should I give sick catfish?');
  await guide.getByRole('button',{name:'Ask guide',exact:true}).click();
  await expect(guide.getByRole('heading',{name:'Not covered in this lesson'})).toBeVisible();
  await expect(guide.getByText(config.unsupportedFallback.message,{exact:true})).toBeVisible();
  await width(`topic-${index+1}-lesson`);
}
async function activity(topic,index) {
  const authored=activityFor(topic); const selected=authored.paths[0];
  await page.getByRole('link',{name:'Try the activity',exact:true}).click();
  await expect(page).toHaveURL(`${origin}${urlFor(topic)}/activity`);
  await expect(page.getByRole('radio',{name:selected.label,exact:true})).toBeChecked();
  await page.getByLabel('Your answer',{exact:true}).fill('idk');
  await page.getByRole('button',{name:'Get feedback',exact:true}).click();
  await expect(page.getByText(configFor(topic).stuckHints[`activity-${selected.id}`],{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Stuck?',exact:true}).click();
  await expect(page.locator('.stuck-help .hint')).toHaveText(configFor(topic).stuckHints[`activity-${selected.id}`]);
  await page.getByLabel('Your answer',{exact:true}).fill(selected.example);
  await page.reload(); await expect(page.getByLabel('Your answer',{exact:true})).toHaveValue(selected.example);
  await page.getByRole('button',{name:'Get feedback',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Activity completed',exact:true})).toBeVisible();
  const citation=page.locator('[aria-labelledby="feedback-title"] a.chip').first();
  expect(await citation.getAttribute('href')).toMatch(new RegExp(`^${urlFor(topic)}#`));
  await width(`topic-${index+1}-activity`);
  await page.getByRole('link',{name:'See my next steps',exact:true}).click();
  await expect(page).toHaveURL(`${origin}${urlFor(topic)}/next`);
  await expect(page.getByText(`Understanding check: ${configFor(topic).understandingCheck.length}/${configFor(topic).understandingCheck.length} correct`,{exact:true})).toBeVisible();
  const reminder=page.getByRole('checkbox',{name:configFor(topic).reminder.label,exact:true});
  await reminder.check(); await expect(page.getByText(configFor(topic).reminder.preview,{exact:true})).toBeVisible();
  await page.getByRole('radio',{name:'Yes',exact:true}).check();
  await page.reload(); await expect(reminder).toBeChecked();
  await width(`topic-${index+1}-next`);
  const progress=await saved(); const key=`${subject.id}/${topic.id}`;
  expect(progress.topics[key].completed).toBe(true); expect(progress.lastPath).toBe(`${urlFor(topic)}/next`); expect(progress.reminderOptIn[key]).toBe(true);
}
try {
  await page.goto(origin);
  await expect(page.locator('header').getByRole('link',{name:catalog.product.name,exact:true})).toBeVisible();
  await expect(page.locator('header')).toContainText(`by ${catalog.product.parent}`);
  await expect(page.getByText(/first step for curious beginners/i)).toHaveCount(0);
  await expect(page.locator('a.navigation-card')).toHaveCount(3);
  await page.getByRole('radio',{name:catalog.intentions[0].label,exact:true}).check();
  await page.reload(); await expect(page.getByRole('radio',{name:catalog.intentions[0].label,exact:true})).toBeChecked();
  await width('home');
  await page.locator(`a.navigation-card[href="${areaUrl}"]`).click();
  await expect(page.getByRole('heading',{name:area.label,exact:true})).toBeVisible(); await width('area');
  await page.locator(`a.navigation-card[href="${hubUrl}"]`).click();
  await expect(page.locator('.topic-path > li')).toHaveCount(5);
  await expect(page.locator('.topic-path .badge-soon').filter({hasText:'Coming soon'})).toHaveCount(3);
  await expect(page.locator('.topic-path > li .muted-card a')).toHaveCount(0);
  await page.getByRole('button',{name:'Change',exact:true}).click();
  await page.getByRole('radio',{name:catalog.intentions[1].label,exact:true}).check();
  await page.getByRole('button',{name:'Change',exact:true}).click();
  await expect(page.locator('.intention-line > p')).toContainText(catalog.intentions[1].label);
  await width('hub-start');
  await page.getByRole('link',{name:'Start',exact:true}).click();
  await lesson(live[0],0); await activity(live[0],0);
  await expect(page.getByRole('link',{name:`Next topic: ${live[1].title}`,exact:true})).toHaveAttribute('href',urlFor(live[1]));
  await page.getByRole('link',{name:`Back to ${authoredPath.title} path`,exact:true}).click();
  await expect(page.locator('.topic-card').filter({has:page.getByRole('heading',{name:live[0].title,exact:true})})).toContainText('Done');
  await width('hub-after-first');
  await page.getByRole('link',{name:`Continue: ${live[1].title}`,exact:true}).click();
  await lesson(live[1],1); await activity(live[1],1);
  const progress=await saved(); expect(Object.keys(progress.topics)).toHaveLength(2);
  expect(progress.topics[`${subject.id}/${live[0].id}`].activity.pathId).toBe(activityFor(live[0]).paths[0].id);
  expect(progress.topics[`${subject.id}/${live[1].id}`].activity.pathId).toBe(activityFor(live[1]).paths[0].id);
  await page.locator('header').getByRole('link',{name:catalog.product.name,exact:true}).click();
  await expect(page).toHaveURL(origin+'/'); await page.reload(); await expect(page.getByRole('link',{name:'Continue where you left off',exact:true})).toHaveAttribute('href',`${urlFor(live[1])}/next`);
  await page.getByRole('link',{name:'Continue where you left off',exact:true}).click();
  await expect(page).toHaveURL(`${origin}${urlFor(live[1])}/next`);
  const soonArea=catalog.areas.find(item=>item.status==='coming-soon');
  await page.goto(`${origin}/${soonArea.slug}`); await expect(page.getByRole('heading',{name:soonArea.label,exact:true})).toBeVisible(); await expect(page.getByText('Coming soon',{exact:true}).first()).toBeVisible(); await width('coming-soon-area');
  const soonSubject=area.subjects.find(item=>item.status==='coming-soon');
  await page.goto(`${origin}${areaUrl}/${soonSubject.slug}`); await expect(page.getByRole('heading',{name:soonSubject.label,exact:true})).toBeVisible(); await expect(page.getByText('Coming soon',{exact:true})).toBeVisible(); await width('coming-soon-subject');
  const soonTopic=authoredPath.topics.find(item=>item.status==='coming-soon');
  await page.goto(`${origin}${urlFor(soonTopic)}`); await expect(page.getByRole('heading',{name:soonTopic.title,exact:true})).toBeVisible(); await expect(page.getByText('Coming soon',{exact:true})).toBeVisible(); await width('coming-soon-topic');
  for(const invalid of ['/unknown-area',`${hubUrl}/unknown-topic`,'/lesson','/activity','/next']) {
    expect404=true; const response=await page.goto(`${origin}${invalid}`); expect(response.status()).toBe(404); await expect(page.getByRole('heading',{name:'We couldn’t find that page',exact:true})).toBeVisible();
  }
  expect404=false;
  await page.goto(`${origin}${hubUrl}`); await expect(page.locator('.topic-path .badge-done')).toHaveCount(2); await width('hub-complete');
  await page.emulateMedia({colorScheme:'dark'}); await width('hub-dark');
  await page.goto(origin); await width('home-dark');
  expect(errors).toEqual([]);
  console.log('Phase 07 smoke PASS: complete 375px home → area → hub → both topic loops; reflect/observe feedback, authored help, local citations and unsupported fallback; Done/Continue; independent progress/reminders; reload/resume; coming-soon area/subject/topic; unknown and removed routes 404; light/dark layouts; no browser errors or external requests.');
} finally { await browser.close(); }
