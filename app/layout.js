import "./globals.css";

export const metadata = {
  title: "Flowline — Your AI marketing manager for local business",
  description:
    "Flowline is an AI agent that runs your Google Ads, Meta ads, website, and lead follow-up — measured in booked jobs and dollars, not clicks. Built for small service businesses.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
