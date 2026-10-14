import type { Metadata } from "next";
import "./globals.css";
import { getCatalog } from "@/lib/content";
import catalog from "../../content/catalog.json";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
const product = getCatalog().product;

export const metadata: Metadata = {
  title: product.name,
  description: product.pitch,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('ovayi-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch{}` }} /></head>
      <body className="min-h-full flex flex-col">
        <a className="skip-link" href="#main">Skip to content</a>
        <SiteNav name={product.name} parent={product.parent} />
        {children}
        <SiteFooter name={product.name} parent={product.parent} supportContact={catalog.product.supportContact} />
      </body>
    </html>
  );
}
