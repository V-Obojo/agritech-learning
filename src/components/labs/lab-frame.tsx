import {getMedia} from "@/lib/content";
import type {Lab,Media} from "@/lib/content/media-labs";
import type {BadgeDefinition} from "@/lib/insights/calculators";
import {LabFrameClient} from "./lab-frame-client";

export function LabFrame({lab,fallback,badge}:{lab:Lab;fallback?:Media;badge?:BadgeDefinition}) {
  const ids=new Set<string>();
  function collect(value:unknown) {
    if(Array.isArray(value))value.forEach(collect);
    else if(value&&typeof value==="object")for(const [key,child] of Object.entries(value)) {
      if(key==="media"&&typeof child==="string")ids.add(child);else collect(child);
    }
  }
  collect(lab);
  const media=Object.fromEntries([...ids].map(id=>[id,getMedia(id)]));
  return <LabFrameClient lab={lab} fallback={fallback} badge={badge} media={media}/>;
}
