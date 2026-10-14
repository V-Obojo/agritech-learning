import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Fish Farming Basics",
  description:
    "Learn the basics of water availability for catfish farming in Nigeria, one short step at a time.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <a className="skip-link" href="#main">Skip to content</a>
        <header className="site-header"><Link href="/">Fish Farming Basics</Link><span>Learn at your pace</span></header>
        {children}
        <footer className="site-footer">No sign-up. Your progress stays on this device when storage is available.</footer>
      </body>
    </html>
  );
}
