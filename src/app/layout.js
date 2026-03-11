import "./globals.css";
import Providers from "@/components/Providers";

export const metadata = {
  title: "tooL",
  description: "tooL is a collection of 888 onchain toolkits.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
