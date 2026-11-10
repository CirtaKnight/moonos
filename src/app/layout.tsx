import type { Metadata, Viewport } from "next";
import { Cinzel, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const display = Cinzel({
  variable: "--font-display-face",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MoonOS — Portfolio",
    template: "%s · MoonOS",
  },
  description:
    "The portfolio of CirtaKnight, a computer science engineering student — explore projects inside a web operating system.",
  applicationName: "MoonOS",
  openGraph: {
    type: "website",
    title: "MoonOS — Portfolio",
    description: "Boot up and explore the projects of CirtaKnight, CS engineering student.",
    siteName: "MoonOS",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#06080f",
};

/**
 * Applies the visitor's saved "reduce motion" preference before first paint.
 * Reads the same localStorage key the settings store persists to.
 */
const motionInit = `(function(){try{var s=JSON.parse(localStorage.getItem('ck-os-settings')||'{}').state||{};if(s.reduceMotion)document.documentElement.dataset.motion='reduced';}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${display.variable} antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionInit }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
