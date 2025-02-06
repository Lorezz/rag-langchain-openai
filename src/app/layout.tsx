import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PADigitale 2026 | RAG",
  description: "PADigitale 2026 RAG MVP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body>{children}</body>
    </html>
  );
}
