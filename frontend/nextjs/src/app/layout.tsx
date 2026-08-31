import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NagarikSaathi - Government Welfare Scheme Assistance Portal",
  description: "Discover, screen eligibility, and apply for central and state government benefits.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

