export const metadata = {
  title: "Eva's Recipes",
  description: "A simple recipe app that shows you how to make each recipe",
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
