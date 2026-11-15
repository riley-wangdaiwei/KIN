import type { Metadata } from "next";
import { Comfortaa } from "next/font/google";
import SiteFooter from "@/components/site/SiteFooter";
import "./globals.css";

const comfortaa = Comfortaa({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-comfortaa",
});

export const metadata: Metadata = {
  title: "re.KIN",
  description: "A place to gather what you love and turn it into thoughtful gifts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={comfortaa.variable}>
      <body>
        <div aria-hidden="true" className="kin-paper-bg" />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
