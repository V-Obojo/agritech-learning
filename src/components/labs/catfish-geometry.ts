import * as THREE from "three";
import type {ModelLab} from "@/lib/content/media-labs";

export function buildCatfish(colors:ModelLab["model"]["bodyColors"]) {
  const body=new THREE.LatheGeometry([
    new THREE.Vector2(.32,-1.65),new THREE.Vector2(.43,-1.3),new THREE.Vector2(.48,-.8),
    new THREE.Vector2(.47,-.3),new THREE.Vector2(.41,.3),new THREE.Vector2(.34,.9),new THREE.Vector2(.26,1.5),new THREE.Vector2(.16,2),new THREE.Vector2(.07,2.5),
  ],32);body.rotateZ(-Math.PI/2);
  const positions=body.getAttribute("position"),gradient=[];
  const back=new THREE.Color(colors.back),side=new THREE.Color(colors.side),belly=new THREE.Color(colors.belly);
  for(let i=0;i<positions.count;i++) {
    const y=positions.getY(i),x=positions.getX(i),z=positions.getZ(i);
    const color=side.clone().lerp(y>=0?back:belly,Math.min(1,Math.abs(y)/.4));
    const marble=Math.sin(x*18+Math.sin(z*24))*Math.sin(z*32+y*14)*.055;
    color.offsetHSL(0,0,marble);gradient.push(color.r,color.g,color.b);
  }
  body.setAttribute("color",new THREE.Float32BufferAttribute(gradient,3));
  const head=new THREE.SphereGeometry(1,24,16),eye=new THREE.SphereGeometry(1,12,8),marker=new THREE.SphereGeometry(1,12,8);
  function fin(points:[number,number][]) {const shape=new THREE.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();return new THREE.ExtrudeGeometry(shape,{depth:.025,bevelEnabled:false,steps:1});}
  const dorsal=fin([[-1.05,.36],[-.8,.7],[.1,.74],[1.35,.48],[2.38,.14],[2.2,.08],[.3,.28]]);
  const anal=fin([[-.5,-.36],[-.25,-.66],[.9,-.58],[2.38,-.13],[2.2,-.06],[.3,-.28]]);
  const paired=fin([[0,0],[.65,-.2],[.8,-.42],[.3,-.38]]);
  const tailShape=new THREE.Shape();tailShape.moveTo(2.35,-.12);tailShape.bezierCurveTo(2.7,-.55,3.25,-.48,3.28,0);tailShape.bezierCurveTo(3.25,.48,2.7,.55,2.35,.12);tailShape.closePath();
  const tail=new THREE.ExtrudeGeometry(tailShape,{depth:.03,bevelEnabled:false});
  const barbels=([-1,1] as const).flatMap(sign=>[
    {part:"barbel-maxillary",start:[-2.48,-.02,sign*.4],end:[-3.45,-.16,sign*1.2]},
    {part:"barbel-nasal",start:[-2.48,.2,sign*.18],end:[-2.95,.4,sign*.52]},
    {part:"barbel-mandibular",start:[-2.48,-.18,sign*.13],end:[-3.02,-.5,sign*.32]},
    {part:"barbel-mandibular",start:[-2.38,-.18,sign*.32],end:[-3.2,-.42,sign*.75]},
  ].map(({part,start,end})=>{
    const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(...start),new THREE.Vector3((start[0]+end[0])/2,(start[1]+end[1])/2+.05,(start[2]+end[2])/2),new THREE.Vector3(...end)]);
    const geometry=new THREE.TubeGeometry(curve,14,.02,6,false);
    // Taper each ring towards the end.
    const p=geometry.getAttribute("position");for(let ring=0;ring<=14;ring++) {const center=curve.getPointAt(ring/14);for(let side=0;side<=6;side++) {const i=ring*7+side;const v=new THREE.Vector3().fromBufferAttribute(p,i).sub(center).multiplyScalar(1-ring/14*.85).add(center);p.setXYZ(i,v.x,v.y,v.z);}}
    geometry.computeVertexNormals();return {part,geometry};
  }));
  const spine=new THREE.CylinderGeometry(.012,.02,.82,6);
  const all=[body,head,eye,marker,dorsal,anal,paired,tail,spine,...barbels.map(b=>b.geometry)];
  const count=(g:THREE.BufferGeometry)=>(g.index?.count??g.getAttribute("position").count)/3;
  const triangles=count(body)+count(head)+2*count(eye)+9*count(marker)+count(dorsal)+count(anal)+4*count(paired)+count(tail)+2*count(spine)+barbels.reduce((n,b)=>n+count(b.geometry),0);
  return {body,head,eye,marker,dorsal,anal,paired,tail,spine,barbels,triangles,dispose:()=>all.forEach(g=>g.dispose())};
}
