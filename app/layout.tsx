import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cutoff Budget Tracker",
  description: "A responsive household budgeting app for married couples managing cutoff-based money plans.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg"
  },
  openGraph: {
    title: "Cutoff Budget Tracker",
    description: "Plan salary cutoffs, compare planned vs actual spending, and protect savings in Philippine Peso.",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Cutoff Budget Tracker",
    description: "A modern household money tracker for twice-monthly salary cutoffs."
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
