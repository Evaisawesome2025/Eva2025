export const metadata = {
  title: "Doodle Jump",
  description: "A Doodle Jump-style canvas game",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, height: "100vh", background: "#1d2433" }}>
        {children}
      </body>
    </html>
  );
}
