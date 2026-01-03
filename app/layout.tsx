import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Auto-Baseball-Scientist | 2026 MLB Off-Season Analysis",
  description: "Live autonomous AI research analyzing the 2026 MLB off-season with bold hypotheses, Monte Carlo simulations, and real-time updates.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
