import {readFileSync,writeFileSync,existsSync} from "node:fs";
import assert from "node:assert/strict";
const directory="test-results/phase-13-1",baseline=JSON.parse(readFileSync("tests/fixtures/phase-13-1-baseline.json","utf8")),statusPath=process.argv[2]??"test-results/.last-run.json",last=JSON.parse(readFileSync(statusPath,"utf8"));
assert.equal(last.status,"passed");assert.deepEqual(last.failedTests,[]);
const desktop=JSON.parse(readFileSync(`${directory}/desktop-chromium-dimensions.json`,"utf8"));
const sizes=Object.entries(desktop).map(([id,after])=>{const before=baseline[id];assert(after.width>=1000);assert(after.height<before.height/2);return {id,before,after,reductionPercent:Number(((1-after.height/before.height)*100).toFixed(2))};});
const projects={};
for(const project of ["desktop-chromium","mobile-chromium"]){
  const model=JSON.parse(readFileSync(`${directory}/${project}-model.json`,"utf8")),lightbox=JSON.parse(readFileSync(`${directory}/${project}-lightbox.json`,"utf8"));
  assert(model.triangles<=20000&&model.renderedTriangles<=20000&&model.renderedTriangles>10000);assert(model.morphSamples.some(n=>n>0&&n<1));assert.equal(model.allHotspots,9);assert(lightbox.centerOffset<=4);assert.equal(lightbox.toolbarRows,1);assert.equal(lightbox.rotationLabel,"nowrap");
  for(const name of ["adult","fingerling","model-viewer","water-simulator","pond-builder","observation","lightbox","chips"])assert(existsSync(`${directory}/${project}-${name}.png`));
  projects[project]={model,lightbox};
}
writeFileSync(`${directory}/evidence.json`,JSON.stringify({sizes,projects,baselineMethod:"Production browser at 1440px before source changes, same reviewed states; copied into tests/fixtures before Playwright clears its output.",phoneOverflow:false,progressThemes:["light","dark"],screenshotsPerProject:8},null,2));
console.log(JSON.stringify({sizes,triangles:projects["desktop-chromium"].model.triangles,renderedTriangles:projects["desktop-chromium"].model.renderedTriangles,lightboxOffsets:Object.fromEntries(Object.entries(projects).map(([p,v])=>[p,v.lightbox.centerOffset]))}));
