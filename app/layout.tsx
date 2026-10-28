import type { Metadata, Viewport } from "next";
import { Caveat, DM_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { SPLASH_SIZES } from "@/lib/pwa/icon";
import "./globals.css";

const hand = Caveat({ variable: "--font-hand", subsets: ["latin"] });
const body = DM_Sans({ variable: "--font-body", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sticky Day",
  description: "Your day as sticky notes on a whiteboard.",
  applicationName: "Sticky Day",
  appleWebApp: {
    capable: true,
    title: "Sticky Day",
    statusBarStyle: "black-translucent",
    startupImage: SPLASH_SIZES.map((s) => ({
      url: `/splash/${s.theme}/${s.w}/${s.h}`,
      media: s.media,
    })),
  },
  // Next emits mobile-web-app-capable; iPhone still wants the Apple name.
  other: { "apple-mobile-web-app-capable": "yes" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#EDEAE2" },
    { media: "(prefers-color-scheme: dark)", color: "#15140F" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${hand.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-fg font-body">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
} 