import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReelsHub — Instagram Knowledge & Learning Tracker",
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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚡</text></svg>" />
      </head>
      <body>{children}</body>
    </html>
  );
}
