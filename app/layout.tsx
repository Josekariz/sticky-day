import type { Metadata } from "next";
import { Caveat, DM_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import "./globals.css";

const hand = Caveat({ variable: "--font-hand", subsets: ["latin"] });
const body = DM_Sans({ variable: "--font-body", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sticky Day",
  description: "Your day as sticky notes on a whiteboard.",
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