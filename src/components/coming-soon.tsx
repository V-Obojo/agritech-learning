import Link from "next/link";
export function ComingSoon({ title, blurb, back, liveHub }: { title: string; blurb: string; back: {href:string;label:string}; liveHub?: {href:string;label:string} | null }) {
  return <><span className="badge badge-soon">Coming soon</span><h1>{title}</h1><p>{blurb}</p><p>We’re preparing this part of the learning path. You can explore what’s available and come back later.</p><div className="actions"><Link href={back.href}>Back to {back.label}</Link>{liveHub && <Link className="button" href={liveHub.href}>Explore {liveHub.label}</Link>}</div></>;
}
