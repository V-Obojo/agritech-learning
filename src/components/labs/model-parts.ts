import {Vector3} from "three";
import {morphPoint} from "./catfish-surface";
export type Point=[number,number,number];
// Procedural anatomy coordinates, shared by meshes, markers and camera targets.
export const partPositions:Record<string,Point>={
  body:[.3,.06,.39],head:[-2.05,.21,.51],"gill-area":[-1.3,.12,.47],
  "barbel-maxillary":[-2.3,-.07,1.32],"barbel-nasal":[-2.72,.25,.45],"barbel-mandibular":[-2.6,-.29,.36],
  "dorsal-fin":[.65,.61,.025],"anal-fin":[.8,-.52,.025],"pectoral-fin":[-1.18,-.21,1.13],
};
export function partPosition(part:string,young=false):Point {
  const point=partPositions[part];if(!point) throw new Error(`Unknown procedural part: ${part}`);
  return young?morphPoint(new Vector3(...point)).toArray() as Point:[...point];
}
