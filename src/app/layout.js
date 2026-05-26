import "./globals.css";
import Providers from "@/components/Providers";
import {
  APP_URL,
  MINIAPP_EMBED,
  MINIAPP_ICON_URL,
  SITE_METADATA_BY_ROUTE,
  SITE_NAME,
  SITE_OG_IMAGE_URL,
} from "@/lib/appConfig";

const homeMetadata = SITE_METADATA_BY_ROUTE.home;

export const metadata = {
  metadataBase: new URL(APP_URL),
  title: homeMetadata.title,
  description: homeMetadata.description,
  icons: {
    icon: MINIAPP_ICON_URL,
  },
  openGraph: {
    title: homeMetadata.title,
    description: homeMetadata.description,
    url: APP_URL,
    siteName: SITE_NAME,
    images: [
      {
        url: SITE_OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: homeMetadata.title,
    description: homeMetadata.description,
    images: [SITE_OG_IMAGE_URL],
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
