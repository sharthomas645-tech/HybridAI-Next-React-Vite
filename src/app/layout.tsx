import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HybridAI | Medical Chronology & Analyzer Intelligence",
  description: "Secure attorney portal for PHI file uploads and medical chronology management",
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
