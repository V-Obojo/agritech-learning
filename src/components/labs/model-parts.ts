export type Point=[number,number,number];
// Procedural anatomy coordinates, shared by meshes, markers and camera targets.
export const partPositions:Record<string,Point>={
  body:[.3,0,.42],head:[-1.9,.18,.45],"gill-area":[-1.25,.12,.5],
  "barbel-maxillary":[-2.75,-.08,.9],"barbel-nasal":[-2.6,.27,.4],"barbel-mandibular":[-2.7,-.3,.36],
  "dorsal-fin":[.65,.64,0],"anal-fin":[.8,-.52,0],"pectoral-fin":[-1.18,-.1,.9],
};
export function partPosition(part:string,young=false):Point {
  const point=partPositions[part];if(!point) throw new Error(`Unknown procedural part: ${part}`);
  const head=["head","gill-area","barbel-maxillary","barbel-nasal","barbel-mandibular"].includes(part);
  return young?(head?[point[0]*.82,point[1]*1.2,point[2]*1.2]:[point[0]*.78,point[1]*.86,point[2]*.86]):[...point];
}
