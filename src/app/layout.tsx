import type { Metadata } from "next";
import { Poppins } from "next/font/google";

import { AppShell } from "@/components/app-shell";

import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Matnog Project Management",
  description: "Municipal and barangay project management workspace for the Municipality of Matnog.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={poppins.variable}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
