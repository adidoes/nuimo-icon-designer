import "@/styles/globals.css";

import { GeistMono } from "geist/font/mono";
import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Nuimo Icon Designer",
  description: "A web app for designing Nuimo icons",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
