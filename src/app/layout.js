import "./globals.css";
import Providers from "@/components/Providers";
import {
  APP_DESCRIPTION,
  APP_NAME,
  MINIAPP_EMBED,
  MINIAPP_ICON_URL,
} from "@/lib/appConfig";

export const metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  icons: {
    icon: MINIAPP_ICON_URL,
  },
  other: {
    "fc:miniapp": JSON.stringify(MINIAPP_EMBED),
  },
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
