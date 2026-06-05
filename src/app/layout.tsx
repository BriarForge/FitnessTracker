import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppHeader } from "@/components/app-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fitness Tracker",
  description:
    "A multi-user fitness tracker with passkeys, magic-link recovery, and agent tokens.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.16),_transparent_28%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] text-white">
        <div className="flex min-h-full flex-col">
          <AppHeader />
          {children}
        </div>
      </body>
    </html>
  );
}
