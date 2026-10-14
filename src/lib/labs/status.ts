import type {Lab} from "@/lib/content/media-labs";
import {waterSchema,pondSchema,observationSchema} from "./definitions";
import {waterCompletion,waterState} from "./water-simulator";
import {earnChallenges,pondCompletion,pondState} from "./pond-builder";
import {observationCompletion,observationState} from "./observation";
export function simulationStatus(lab:Lab,data:unknown) {
  if(lab.type==="water-simulator") {const config=waterSchema.parse(lab),state=waterState(config,data);return {...waterCompletion(config,state),data:state};}
  if(lab.type==="pond-builder") {const config=pondSchema.parse(lab),state=earnChallenges(config,pondState(config,data));return {...pondCompletion(config,state),data:state};}
  if(lab.type==="observation") {const config=observationSchema.parse(lab),state=observationState(config,data);return {...observationCompletion(config,state),data:state};}
  throw new Error("Unsupported simulation type");
}
