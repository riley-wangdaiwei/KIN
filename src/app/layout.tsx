import type { Metadata } from "next";
import localFont from "next/font/local";
import SiteFooter from "@/components/site/SiteFooter";
import "./globals.css";

const comfortaa = localFont({
  src: "./fonts/Comfortaa-VariableFont_wght.ttf",
  weight: "300 700",
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
