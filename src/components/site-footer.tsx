import Link from "next/link";
import { getCatalog } from "@/lib/content";
export async function SiteFooter({ name, parent, supportContact }: { name: string; parent: string; supportContact: string }) {
  "use cache";
  const {tagline,heroSubhead}=getCatalog().product;
  return <footer className="site-footer">
    <div className="footer-columns">
      <section className="footer-brand" aria-label={name}><strong>{name}</strong><p>by {parent}</p><p>{tagline}</p><a href={`mailto:${supportContact}`}>{supportContact}</a></section>
      <nav aria-label="Footer"><section aria-labelledby="footer-learn"><h2 id="footer-learn">Learn</h2><Link href="/">Home</Link><Link href="/labs">Labs</Link><Link href="/dashboard">Dashboard</Link><Link href="/credits">Credits</Link></section><section aria-labelledby="footer-account"><h2 id="footer-account">Account</h2><Link href="/signin">Sign in</Link><Link href="/signup">Sign up</Link><Link href="/account">My account</Link></section></nav>
      <section aria-labelledby="footer-about"><h2 id="footer-about">About</h2><p>{heroSubhead.split(/(?<=\.)\s/)[0]}</p><p>Content drawn from FAO and Nigerian research. Expert review ongoing.</p></section>
    </div>
    <div className="footer-bottom"><p>© {new Date().getFullYear()} {parent}. All rights reserved.</p><Link href="/credits">Content under CC BY-SA where applicable · Media credits</Link></div>
  </footer>;
}
