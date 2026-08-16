import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AnsemRail — Agentic Control Plane",
  description:
    "The agentic control plane combining ClawPump, MoonPay, and Open Wallet Standard — built for both humans and autonomous agents.",
  openGraph: {
    title: "AnsemRail — Agentic Control Plane",
    description:
      "The agentic control plane combining ClawPump, MoonPay, and Open Wallet Standard — built for both humans and autonomous agents.",
    url: "https://ansemrail.vercel.app",
    type: "website",
    images: [
      {
        url: "https://ansemrail.vercel.app/og-cover.jpg",
        width: 1200,
        height: 630,
        alt: "AnsemRail",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AnsemRail — Agentic Control Plane",
    description:
      "The agentic control plane combining ClawPump, MoonPay, and Open Wallet Standard — built for both humans and autonomous agents.",
    images: ["https://ansemrail.vercel.app/og-cover.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
