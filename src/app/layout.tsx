import type { Metadata, Viewport } from "next";
import { preload } from "react-dom";
import "./globals.css";

const SITE_ASSETS = "/sites/www-mikes-cv-de975993/root-8a5edab2";

// Restores the cabin light (window shade) before first paint, so a reload
// never flashes light before snapping to dark. Mirrors mikes.cv/theme.js.
const THEME_SCRIPT = `try{if(localStorage.getItem('mikescv-cabin-dark')==='1'){document.documentElement.dataset.theme='dark'}}catch(e){}`;

export const metadata: Metadata = {
  metadataBase: new URL("https://kushmaniar.me"),
  title: "Kush Maniar",
  description: "AI engineer who ships agents, computer vision and NLP into production. MSc AI at NTU Singapore.",
  robots: { index: true, follow: true },
  icons: { icon: { url: `${SITE_ASSETS}/seo/favicon.svg`, type: "image/svg+xml" } },
  openGraph: {
    title: "Kush Maniar",
    description: "AI engineer who ships agents, computer vision and NLP into production. MSc AI at NTU Singapore.",
    type: "website",
    images: [{ url: `${SITE_ASSETS}/seo/og-image.jpg`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kush Maniar",
    description: "AI engineer who ships agents, computer vision and NLP into production. MSc AI at NTU Singapore.",
    images: [`${SITE_ASSETS}/seo/og-image.jpg`],
  },
};

export const viewport: Viewport = {
  themeColor: "#0e0e0e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The two faces used above the fold start alongside the stylesheet.
  preload(`${SITE_ASSETS}/fonts/mb-sans-400.woff2`, {
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  });
  preload(`${SITE_ASSETS}/fonts/mb-mono-400.woff2`, {
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  });

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
