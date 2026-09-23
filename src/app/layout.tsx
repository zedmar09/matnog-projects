import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { AppShell } from "@/components/app-shell";

import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: "Matnog Project Management",
  description: "Municipal and barangay project management workspace for the Municipality of Matnog.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={geist.variable}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
