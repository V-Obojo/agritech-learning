import Link from "next/link";
export function PlaceholderPage({ title }: { title: string }) {
  return <main id="main"><section className="placeholder-panel"><span className="badge badge-next">Coming in this build</span><h1>{title}</h1><p>This part of your learning journey is on its way. Keep exploring the available lessons at your own pace.</p><Link className="button" href="/">Explore learning →</Link></section></main>;
}
