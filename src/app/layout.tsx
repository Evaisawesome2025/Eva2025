import type { Metadata } from "next";
import "./globals.css";
import { MainNav } from "@/components/main-nav";
import { CommandPalette } from "@/components/command-palette";
import { ToastProvider } from "@/components/ui/toast";

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
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Apply the saved theme before paint to avoid a flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('flip-radar.theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-screen bg-muted/30 antialiased">
        <ToastProvider>
          <MainNav />
          <CommandPalette />
          <main className="container py-6 pb-24 md:pb-10">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
