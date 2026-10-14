import Link from "next/link";
export async function SiteFooter({ name, parent, supportContact }: { name: string; parent: string; supportContact: string }) {
  "use cache";
  return <footer className="site-footer"><div><strong>{name}</strong><p>© {new Date().getFullYear()} {parent}</p><a href={`mailto:${supportContact}`}>{supportContact}</a></div><nav aria-label="Footer navigation"><Link href="/">Learn</Link><Link href="/labs">Labs</Link><Link href="/credits">Credits</Link></nav></footer>;
}
