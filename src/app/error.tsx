"use client";
import Link from "next/link";
export default function ErrorPage({retry}:{error:Error&{digest?:string};retry:()=>void}) {
  return <main id="main"><section className="placeholder-panel" role="alert"><p className="eyebrow">A moment to pause</p><h1>We couldn’t finish loading this page</h1><p>Please try again. You can also return home and keep learning as a guest.</p><div className="actions"><button onClick={retry}>Try again</button><Link className="button secondary" href="/">Back to home</Link></div></section></main>;
}
