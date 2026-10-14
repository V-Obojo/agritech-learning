import * as THREE from "three";
import type {ModelLab} from "@/lib/content/media-labs";
export const bodyProfile=new THREE.CatmullRomCurve3([
  [-2.76,.015,.025],[-2.58,.13,.43],[-2.3,.19,.62],[-1.9,.22,.65],[-1.5,.28,.58],[-1.05,.38,.49],[-.35,.43,.44],[.5,.36,.36],[1.35,.25,.22],[2.1,.13,.08],[2.58,.045,.025],
].map(p=>new THREE.Vector3(...p)),false,"centripetal");
export const centerY=(x:number)=>.045*Math.sin((x+2.7)*.7);
export const centerZ=(x:number)=>.025*Math.sin(x*.8);
export function crossSection(x:number) {let low=0,high=1;for(let i=0;i<16;i++){const t=(low+high)/2;if(bodyProfile.getPoint(t).x<x)low=t;else high=t;}return bodyProfile.getPoint((low+high)/2);}
export function morphPoint(point:THREE.Vector3,amount=1) {
  const head=1-THREE.MathUtils.smoothstep(point.x,-1.65,-.85);
  const young=new THREE.Vector3(point.x*.64-.15+Math.min(0,point.x+1.2)*.28,point.y*(1.08+head*.22),point.z*(1.1+head*.2));
  return point.clone().lerp(young,amount);
}
export function addMorph(geometry:THREE.BufferGeometry) {
  const positions=geometry.getAttribute("position"),values=[];
  for(let i=0;i<positions.count;i++){const p=morphPoint(new THREE.Vector3().fromBufferAttribute(positions,i));values.push(p.x,p.y,p.z);}
  const young=geometry.clone();young.setAttribute("position",new THREE.Float32BufferAttribute(values,3));young.computeVertexNormals();
  geometry.morphAttributes.position=[young.getAttribute("position").clone()];geometry.morphAttributes.normal=[young.getAttribute("normal").clone()];young.dispose();return geometry;
}
export function gridGeometry(columns:number,rows:number,point:(u:number,v:number)=>THREE.Vector3) {
  const positions=[],uv=[],indices=[];
  for(let col=0;col<=columns;col++)for(let row=0;row<=rows;row++){const p=point(col/columns,row/rows);positions.push(p.x,p.y,p.z);uv.push(col/columns,row/rows);}
  for(let col=0;col<columns;col++)for(let row=0;row<rows;row++){const a=col*(rows+1)+row,b=a+rows+1;indices.push(a,b,a+1,b,b+1,a+1);}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();return addMorph(geometry);
}
export function rayGeometry(count:number,point:(u:number,v:number)=>THREE.Vector3) {
  const positions=[];for(let ray=0;ray<=count;ray++)for(let step=0;step<5;step++)for(const v of [step/5,(step+1)/5]){const p=point(ray/count,v);positions.push(p.x,p.y,p.z);}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
  const young=[];for(let i=0;i<positions.length;i+=3){const p=morphPoint(new THREE.Vector3(positions[i],positions[i+1],positions[i+2]));young.push(p.x,p.y,p.z);}geometry.morphAttributes.position=[new THREE.Float32BufferAttribute(young,3)];return geometry;
}
export function taperedTube(points:THREE.Vector3[],radius:number,segments=20) {
  const curve=new THREE.CatmullRomCurve3(points),geometry=new THREE.TubeGeometry(curve,segments,radius,6,false),position=geometry.getAttribute("position");
  for(let ring=0;ring<=segments;ring++){const center=curve.getPointAt(ring/segments);for(let side=0;side<=6;side++){const i=ring*7+side,p=new THREE.Vector3().fromBufferAttribute(position,i).sub(center).multiplyScalar(1-ring/segments*.9).add(center);position.setXYZ(i,p.x,p.y,p.z);}}
  geometry.computeVertexNormals();return addMorph(geometry);
}
export function catfishMaterials(colors:ModelLab["model"]["bodyColors"]) {
  const young={value:0},time={value:0},body=new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:.38,metalness:.025,clearcoat:.45,clearcoatRoughness:.3});
  body.onBeforeCompile=shader=>{
    shader.uniforms.uYoung=young;shader.uniforms.uBelly={value:new THREE.Color(colors.belly)};
    shader.vertexShader=shader.vertexShader.replace("#include <common>","#include <common>\nvarying vec3 vFishPosition;").replace("#include <project_vertex>","vFishPosition=transformed;\n#include <project_vertex>");
    shader.fragmentShader=shader.fragmentShader.replace("#include <common>",`#include <common>
      varying vec3 vFishPosition; uniform float uYoung; uniform vec3 uBelly;
      float fishHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
      float fishNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(fishHash(i),fishHash(i+vec3(1,0,0)),f.x),mix(fishHash(i+vec3(0,1,0)),fishHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(fishHash(i+vec3(0,0,1)),fishHash(i+vec3(1,0,1)),f.x),mix(fishHash(i+vec3(0,1,1)),fishHash(i+vec3(1,1,1)),f.x),f.y),f.z);}
    `).replace("#include <color_fragment>",`#include <color_fragment>
      float clouds=fishNoise(vFishPosition*6.0)+0.45*fishNoise(vFishPosition*17.0);
      float flecks=smoothstep(0.55,0.95,clouds);
      diffuseColor.rgb*=mix(0.72,1.24,flecks);
      diffuseColor.rgb=mix(diffuseColor.rgb,uBelly,uYoung*0.24);
    `);
  };
  body.customProgramCacheKey=()=>"catfish-marbling-v2";
  const fins=new THREE.MeshPhysicalMaterial({color:new THREE.Color(colors.side).lerp(new THREE.Color(colors.belly),.2),side:THREE.DoubleSide,transparent:true,opacity:.86,roughness:.48,depthWrite:false});
  fins.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace("#include <common>","#include <common>\nvarying vec2 vFinUV;").replace("#include <begin_vertex>","#include <begin_vertex>\nvFinUV=uv;");shader.fragmentShader=shader.fragmentShader.replace("#include <common>","#include <common>\nvarying vec2 vFinUV;").replace("#include <alphatest_fragment>","diffuseColor.a*=mix(1.0,0.38,smoothstep(0.55,1.0,vFinUV.y));\n#include <alphatest_fragment>");};
  fins.customProgramCacheKey=()=>"catfish-membranes-v2";
  const rays=new THREE.LineBasicMaterial({color:new THREE.Color(colors.side).lerp(new THREE.Color(colors.belly),.55),transparent:true,opacity:.42});
  const barbel=new THREE.MeshPhysicalMaterial({color:colors.side,roughness:.42,clearcoat:.25});
  barbel.onBeforeCompile=shader=>{shader.uniforms.uTime=time;shader.vertexShader=shader.vertexShader.replace("#include <common>","#include <common>\nuniform float uTime;").replace("#include <project_vertex>","transformed.y+=sin(uTime*1.5+uv.x*5.0)*0.018*uv.x*uv.x;\n#include <project_vertex>");};
  return {body,fins,rays,barbel,update:(amount:number,elapsed:number)=>{young.value=amount;time.value=elapsed;fins.opacity=THREE.MathUtils.lerp(.86,.5,amount);rays.opacity=THREE.MathUtils.lerp(.42,.3,amount);},dispose:()=>[body,fins,rays,barbel].forEach(m=>m.dispose())};
}
