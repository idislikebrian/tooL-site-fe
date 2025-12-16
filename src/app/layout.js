import "./globals.css";

export const metadata = {
  title: "tooL",
  description: "tooL is a collection of 7,777 unique onchain toolkits.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
