import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KIN",
  description: "A place to gather what you love and turn it into thoughtful gifts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
