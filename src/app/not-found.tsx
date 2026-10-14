import Link from "next/link";
export default function NotFound() {
  return <main id="main"><section className="placeholder-panel"><p className="eyebrow">404 · A new direction</p><h1>We couldn’t find that page</h1><p>Choose an area from home to continue learning.</p><Link className="button" href="/">Back to home</Link></section></main>;
}
