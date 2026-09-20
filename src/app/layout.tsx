import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CatchReel — Instagram Knowledge & Learning Tracker",
  description:
    "Simpan, rangkum poin penting dengan AI, dan lacak reels Instagram edukatif ke Google Sheets agar tidak terlupakan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#f6f5f4" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CatchReel" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="icon" type="image/svg+xml" href="/icons/icon.svg" />
        <link rel="icon" href="/icons/icon-192.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
