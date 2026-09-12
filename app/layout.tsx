import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Budget Tracker",
  description: "A responsive household budgeting app for married couples managing cutoff-based money plans.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg"
  },
  openGraph: {
    title: "Budget Tracker",
    description: "Record variable take-home income every cutoff, compare planned vs actual spending, and protect savings in Philippine Peso.",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Budget Tracker",
    description: "A lavender-and-blue household money tracker for variable twice-monthly take-home income."
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
