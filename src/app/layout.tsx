import type { Metadata, Viewport } from "next";
import { Big_Shoulders, Figtree, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const shoulders = Big_Shoulders({
  variable: "--font-shoulders",
  subsets: ["latin"],
  axes: ["opsz"],
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Spotter", template: "%s · Spotter" },
  description:
    "An 8-week home workout plan for glutes, thighs, bust and waist. Your phone camera counts reps and checks form, and everything stays on your device.",
  applicationName: "Spotter",
  appleWebApp: { capable: true, title: "Spotter", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f3ef" },
    { media: "(prefers-color-scheme: dark)", color: "#121117" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${shoulders.variable} ${figtree.variable} ${jetbrains.variable} antialiased`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
