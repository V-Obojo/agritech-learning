import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fish Farming Basics",
  description:
    "Learn the basics of water availability for catfish farming in Nigeria, one short step at a time.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
