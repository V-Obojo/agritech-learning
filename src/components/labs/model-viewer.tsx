"use client";
import {Component,useEffect,useMemo,useRef,useState,type ReactNode} from "react";
import {Canvas,useFrame,useThree} from "@react-three/fiber";
import {OrbitControls} from "@react-three/drei";
import * as THREE from "three";
import {useReducedMotion} from "motion/react";
import type {ModelLab,Media} from "@/lib/content/media-labs";
import {Figure} from "../media/figure";
import {buildCatfish} from "./catfish-geometry";
import {partPosition} from "./model-parts";

type Command={view:string;serial:number;part?:string};
type Controls=React.ComponentRef<typeof OrbitControls>;
class CanvasBoundary extends Component<{children:ReactNode;fallback:ReactNode},{failed:boolean}> {
  state={failed:false};static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed?this.props.fallback:this.props.children;}
}
function supportsWebGL(){try{const canvas=document.createElement("canvas"),gl=canvas.getContext("webgl2")||canvas.getContext("webgl");if(!gl)return false;gl.getExtension("WEBGL_lose_context")?.loseContext();return true;}catch{return false;}}
function Scene({lab,young,reduced,rotate,command,onSelect,onCamera}:{lab:ModelLab;young:boolean;reduced:boolean;rotate:boolean;command:Command;onSelect:(id:string)=>void;onCamera:(azimuth:string,distance:string)=>void}) {
  const geometry=useMemo(()=>buildCatfish(lab.model.bodyColors),[lab.model.bodyColors]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  const fish=useRef<THREE.Group>(null),head=useRef<THREE.Group>(null),body=useRef<THREE.Group>(null),barbels=useRef<THREE.Group>(null),controls=useRef<Controls>(null);
  const {camera,size}=useThree(),destination=useRef<THREE.Vector3|null>(null),target=useRef(new THREE.Vector3()),last=useRef("");
  const fitDistance=Math.min(12,Math.max(8,3.8/(Math.tan(THREE.MathUtils.degToRad(42)/2)*(size.width/Math.max(1,size.height)))));
  useEffect(()=>{
    const c=controls.current;if(!c)return;
    const center=command.part?new THREE.Vector3(...partPosition(command.part,young)):new THREE.Vector3();target.current.copy(center);
    const offsets:Record<string,THREE.Vector3>={front:new THREE.Vector3(-7,1,0),side:new THREE.Vector3(0,1,fitDistance),top:new THREE.Vector3(0,8,.01),reset:new THREE.Vector3(0,1.4,fitDistance)};
    if(command.view==="in"||command.view==="out") {const offset=camera.position.clone().sub(c.target).multiplyScalar(command.view==="in"?.8:1.25);offset.clampLength(3,12);destination.current=c.target.clone().add(offset);target.current.copy(c.target);}
    else destination.current=center.clone().add(command.part?new THREE.Vector3(0,1,4):offsets[command.view]??offsets.reset);
    if(reduced) {camera.position.copy(destination.current);c.target.copy(target.current);destination.current=null;c.update();}
  },[command,camera,reduced,young,fitDistance]);
  useFrame(({clock},delta)=>{
    const c=controls.current;
    if(destination.current&&c) {const t=1-Math.exp(-delta*7);camera.position.lerp(destination.current,t);c.target.lerp(target.current,t);if(camera.position.distanceTo(destination.current)<.01) destination.current=null;c.update();}
    const t=reduced?1:1-Math.exp(-delta*7);
    if(body.current) body.current.scale.lerp(new THREE.Vector3(young?.78:1,young?.86:1,young?.86:1),t);
    if(head.current) head.current.scale.lerp(new THREE.Vector3(young?.82:1,young?1.2:1,young?1.2:1),t);
    if(fish.current) fish.current.rotation.y=reduced?0:Math.sin(clock.elapsedTime*.8)*.018;
    if(barbels.current) barbels.current.rotation.x=reduced?0:Math.sin(clock.elapsedTime*1.1)*.025;
    if(c) {const azimuth=c.getAzimuthalAngle().toFixed(3),distance=camera.position.distanceTo(c.target).toFixed(3),key=`${azimuth}/${distance}`;if(key!==last.current){last.current=key;onCamera(azimuth,distance);}}
  });
  const finMaterial=<meshStandardMaterial color={lab.model.bodyColors.side} side={THREE.DoubleSide} transparent opacity={young?.58:.88} roughness={.5}/>;
  return <><ambientLight intensity={1.4}/><directionalLight position={[-3,5,6]} intensity={2.5}/><directionalLight position={[2,-2,-3]} intensity={1}/>
    <group ref={fish}>
      <group ref={body}>
        <mesh geometry={geometry.body}><meshStandardMaterial vertexColors roughness={.36} metalness={.06}/></mesh>
        <mesh geometry={geometry.dorsal}>{finMaterial}</mesh><mesh geometry={geometry.anal}>{finMaterial}</mesh><mesh geometry={geometry.tail}>{finMaterial}</mesh>
        {[-1,1].map(sign=><group key={sign}>
          <mesh geometry={geometry.paired} position={[-1.15,-.08,sign*.33]} rotation={[sign*Math.PI/2,0,-.15]}>{finMaterial}</mesh>
          <mesh geometry={geometry.spine} position={[-.99,-.15,sign*.73]} rotation={[sign*Math.PI/2,0,-.3]}><meshStandardMaterial color={lab.model.bodyColors.belly}/></mesh>
          <mesh geometry={geometry.paired} position={[.15,-.28,sign*.18]} scale={.55} rotation={[sign*Math.PI/2,0,0]}>{finMaterial}</mesh>
        </group>)}
      </group>
      <group ref={head}>
        <mesh geometry={geometry.head} position={[-1.85,0,0]} scale={[.78,.29,.56]}><meshStandardMaterial color={lab.model.bodyColors.back} roughness={.32}/></mesh>
        {[-1,1].map(sign=><mesh key={sign} geometry={geometry.eye} position={[-2.12,.2,sign*.43]} scale={young?.075:.055}><meshStandardMaterial color="#0a1113" roughness={.1}/></mesh>)}
        <group ref={barbels}>{geometry.barbels.map((barbel,index)=><mesh key={index} geometry={barbel.geometry}><meshStandardMaterial color={lab.model.bodyColors.side} roughness={.5}/></mesh>)}</group>
      </group>
      {lab.hotspots.map(h=><mesh key={h.id} name={h.part} position={partPosition(h.part,young)} geometry={geometry.marker} scale={.085} onClick={e=>{e.stopPropagation();onSelect(h.id);}}><meshStandardMaterial color="#e8c879" emissive="#d7aa44" emissiveIntensity={.7}/></mesh>)}
    </group>
    <OrbitControls ref={controls} makeDefault minDistance={3} maxDistance={12} enablePan={false} enableDamping={!reduced} dampingFactor={.12} autoRotate={rotate&&!reduced} autoRotateSpeed={.6} onStart={()=>{destination.current=null;}}/>
  </>;
}
export default function ModelViewer({lab,fallback,onVisit,ready}:{lab:ModelLab;fallback?:Media;onVisit:(kind:"hotspots"|"modes",id:string)=>void;ready:boolean}) {
  const [mode,setMode]=useState(lab.modes[0].id),[selected,setSelected]=useState<string|null>(null),[rotate,setRotate]=useState(false),[command,setCommand]=useState<Command>({view:"reset",serial:0}),[webgl,setWebgl]=useState(supportsWebGL);
  const reduced=Boolean(useReducedMotion()),canvasHost=useRef<HTMLDivElement>(null);
  useEffect(()=>{if(ready)onVisit("modes",mode);},[ready,mode,onVisit]);
  const young=mode===lab.modes[1].id,active=lab.hotspots.find(h=>h.id===selected),currentMode=lab.modes.find(m=>m.id===mode)!;
  const triangles=useMemo(()=>{const g=buildCatfish(lab.model.bodyColors);const n=g.triangles;g.dispose();return n;},[lab.model.bodyColors]);
  function select(id:string) {const hotspot=lab.hotspots.find(h=>h.id===id)!;setSelected(id);onVisit("hotspots",id);setCommand(c=>({view:"focus",part:hotspot.part,serial:c.serial+1}));}
  const fallbackView=<div className="model-fallback"><p>3D is unavailable on this device. Explore the same parts using the image and buttons.</p>{fallback&&<div className="fallback-overlay"><Figure media={fallback}/>{lab.hotspots.map(h=>{const p=partPosition(h.part,young);return <button key={h.id} className="fallback-marker" aria-label={h.label} onClick={()=>select(h.id)} style={{left:`${10+(p[0]+3.5)/7*80}%`,top:`${43-p[1]*25}%`}}>●</button>;})}</div>}</div>;
  return <div className="model-viewer" data-procedural-model="true" data-triangles={triangles}>
    <div className="lab-toolbar" aria-label="Model modes">{lab.modes.map(m=><button key={m.id} disabled={!ready} aria-pressed={mode===m.id} onClick={()=>setMode(m.id)}>{m.label}</button>)}</div>
    <p className="mode-note">{currentMode.note} {currentMode.chunk&&<a href={`#${currentMode.chunk}`}>{currentMode.chunk}</a>}</p><details><summary>About this model</summary><p>{lab.model.species} · {lab.model.notes}</p><div className="lab-toolbar">{[...new Set(lab.hotspots.map(h=>h.chunk))].map(chunk=><a key={chunk} href={`#${chunk}`}>{chunk}</a>)}</div></details>
    <div className="model-layout"><div>
      {webgl?<CanvasBoundary fallback={fallbackView}><div ref={canvasHost} className="model-canvas" data-camera-azimuth="0.000" role="img" aria-label={lab.title}><Canvas camera={{position:[0,1.4,8],fov:42}} dpr={[1,1.5]} gl={{antialias:true,alpha:true}} onCreated={({gl})=>{gl.domElement.addEventListener("webglcontextlost",e=>{e.preventDefault();setWebgl(false);},{once:true});}}><Scene lab={lab} young={young} reduced={reduced} rotate={rotate} command={command} onSelect={select} onCamera={(value,distance)=>{canvasHost.current?.setAttribute("data-camera-azimuth",value);canvasHost.current?.setAttribute("data-camera-distance",distance);}}/></Canvas></div></CanvasBoundary>:fallbackView}
      {webgl&&<div className="lab-toolbar" aria-label="Camera controls">{["in","out","reset","front","side","top"].map(view=><button key={view} onClick={()=>setCommand(c=>({view,serial:c.serial+1}))}>{view==="in"?"Zoom in model":view==="out"?"Zoom out model":view==="reset"?"Reset view":`${view[0].toUpperCase()+view.slice(1)} view`}</button>)}<button aria-pressed={rotate&&!reduced} disabled={reduced} onClick={()=>setRotate(v=>!v)}>Auto-rotate</button></div>}
    </div><div className="hotspot-panel"><p className="eyebrow">Explore the parts</p><div className="hotspot-list">{lab.hotspots.map(h=><button key={h.id} disabled={!ready} aria-pressed={selected===h.id} onClick={()=>select(h.id)}>{h.label}</button>)}</div>{active&&<div className="hotspot-card" aria-live="polite"><h4>{active.label}</h4><p>{active.text}</p><a className="citation" href={`#${active.chunk}`}>{active.chunk}</a></div>}</div></div>
  </div>;
}
