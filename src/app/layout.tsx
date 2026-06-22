import type { Metadata } from "next";
import "./globals.css";
import { MainNav } from "@/components/main-nav";

export const metadata: Metadata = {
  title: "Sioux Falls Flip Radar",
  description: "Private real estate investing dashboard for fast flip decisions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-muted/30 antialiased">
        <MainNav />
        <main className="container py-6 pb-24 md:pb-10">{children}</main>
      </body>
    </html>
  );
}
