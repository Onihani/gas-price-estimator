"use client";

// next
import { Inter } from "next/font/google";
// imports
import { Toaster } from "sonner";

// styles
import "./globals.css";

// fonts
const inter = Inter({ subsets: ["latin"] });

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
