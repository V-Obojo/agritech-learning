const buckets=new Map<string,{count:number;until:number}>();
export function allowSignup(ip:string,now=Date.now()) {
  for(const [key,bucket] of buckets) if(bucket.until<=now) buckets.delete(key);
  const bucket=buckets.get(ip) ?? {count:0,until:now+10*60*1000};
  if(bucket.count>=10) return false;
  bucket.count++;buckets.set(ip,bucket);return true;
}
