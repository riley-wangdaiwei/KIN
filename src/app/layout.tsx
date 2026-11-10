import type { Metadata } from "next";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import SiteFooter from "@/components/site/SiteFooter";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-montserrat",
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-cormorant-garamond",
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
    <html
      lang="en"
      className={`${montserrat.variable} ${cormorantGaramond.variable}`}
    >
      <body>
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
