import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { getCatalog } from "@/lib/content";
const product = getCatalog().product;

export const metadata: Metadata = {
  title: product.name,
  description: product.pitch,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <a className="skip-link" href="#main">Skip to content</a>
        <header className="site-header"><Link href="/">{product.name}</Link><span>by {product.parent}</span></header>
        {children}
        <footer className="site-footer">No sign-up. Your progress stays on this device when storage is available.</footer>
      </body>
    </html>
  );
}
