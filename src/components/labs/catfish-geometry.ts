import * as THREE from "three";
import type {ModelLab} from "@/lib/content/media-labs";
import {bodyProfile,centerY,centerZ,crossSection,gridGeometry,rayGeometry,taperedTube,addMorph} from "./catfish-surface";
export function buildCatfish(colors:ModelLab["model"]["bodyColors"],hotspots=9) {
  const body=gridGeometry(64,40,(u,v)=>{const p=bodyProfile.getPoint(u),angle=v*Math.PI*2;return new THREE.Vector3(p.x,centerY(p.x)+Math.sin(angle)*p.y,centerZ(p.x)+Math.cos(angle)*p.z);});
  const positions=body.getAttribute("position"),gradient=[],back=new THREE.Color(colors.back),side=new THREE.Color(colors.side),belly=new THREE.Color(colors.belly);
  for(let i=0;i<positions.count;i++){const x=positions.getX(i),section=crossSection(x),y=(positions.getY(i)-centerY(x))/Math.max(.015,section.y);const color=side.clone().lerp(y>=0?back:belly,Math.min(1,Math.abs(y)*1.1));gradient.push(color.r,color.g,color.b);}
  body.setAttribute("color",new THREE.Float32BufferAttribute(gradient,3));
  function longFin(direction:number) {
    const point=(u:number,v:number)=>{const x=-1.3+u*3.82,section=crossSection(x),edge=Math.pow(Math.sin(Math.PI*u),.55)*(direction>0?.32:.29);return new THREE.Vector3(x,centerY(x)+direction*(section.y*.97+edge*v),centerZ(x)+.018*Math.sin(u*10)*v);};
    return {membrane:gridGeometry(48,4,point),rays:rayGeometry(38,point)};
  }
  const dorsal=longFin(1),anal=longFin(-1);
  const tailPoint=(u:number,v:number)=>{const angle=-Math.PI/2+u*Math.PI;return new THREE.Vector3(2.55+v*(.06+.78*Math.cos(angle)),centerY(2.55)+v*.51*Math.sin(angle),centerZ(2.55)+.025*Math.sin(angle*3)*v);};
  const tail={membrane:gridGeometry(36,5,tailPoint),rays:rayGeometry(28,tailPoint)};
  const paired=[-1,1].flatMap(sign=>[{part:"pectoral-fin",root:new THREE.Vector3(-1.3,-.1,sign*.46),size:.88},{part:"pelvic-fin",root:new THREE.Vector3(.15,-.28,sign*.25),size:.48}].map(({part,root,size})=>{
    const point=(u:number,v:number)=>{const angle=.1+u*1.38,length=size*(.85+.15*Math.sin(Math.PI*u));return root.clone().add(new THREE.Vector3(v*length*Math.cos(angle),-.15*v,sign*v*length*Math.sin(angle)));};
    const edge=[point(1,0),point(1,.5),point(1,1)];
    return {part,membrane:gridGeometry(20,4,point),rays:rayGeometry(12,point),spine:part==="pectoral-fin"?taperedTube(edge,.022,12):null};
  }));
  const barbels=([-1,1] as const).flatMap(sign=>[
    {part:"barbel-maxillary",points:[[-2.52,.015,sign*.47],[-2.55,-.03,sign*.94],[-2.08,-.12,sign*1.55],[-1.05,-.16,sign*1.82]]},
    {part:"barbel-nasal",points:[[-2.48,.16,sign*.25],[-2.72,.25,sign*.45],[-2.96,.21,sign*.75]]},
    {part:"barbel-mandibular",points:[[-2.57,-.12,sign*.16],[-2.7,-.28,sign*.3],[-2.67,-.4,sign*.56]]},
    {part:"barbel-mandibular",points:[[-2.5,-.13,sign*.34],[-2.4,-.34,sign*.6],[-1.8,-.39,sign*.93]]},
  ].map(({part,points})=>({part,geometry:taperedTube(points.map(p=>new THREE.Vector3(...p)),.023)})));
  const mouthCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(-2.59,-.055,-.4),new THREE.Vector3(-2.73,-.075,0),new THREE.Vector3(-2.59,-.055,.4)]);
  const mouth=addMorph(new THREE.TubeGeometry(mouthCurve,28,.012,5,false));
  const eye=new THREE.SphereGeometry(1,20,12),marker=new THREE.SphereGeometry(1,12,8);
  const membranes=[dorsal.membrane,anal.membrane,tail.membrane,...paired.map(p=>p.membrane)],rays=[dorsal.rays,anal.rays,tail.rays,...paired.map(p=>p.rays)],spines=paired.flatMap(p=>p.spine?[p.spine]:[]);
  const all=[body,mouth,eye,marker,...membranes,...rays,...spines,...barbels.map(b=>b.geometry)];
  const count=(g:THREE.BufferGeometry)=>(g.index?.count??g.getAttribute("position").count)/3;
  const triangles=count(body)+count(mouth)+2*count(eye)+hotspots*count(marker)+membranes.reduce((n,g)=>n+count(g),0)+spines.reduce((n,g)=>n+count(g),0)+barbels.reduce((n,b)=>n+count(b.geometry),0)+2;
  return {body,mouth,eye,marker,dorsal,anal,tail,paired,barbels,triangles,dispose:()=>all.forEach(g=>g.dispose())};
}
