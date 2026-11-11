"use client";
import { ThemeProvider as NextThemes } from "next-themes";

// Only the server-rendered theme script has to run. On the client a data-block
// type keeps React 19 from warning about a <script> inside a component.
const scriptProps = { type: typeof window === "undefined" ? undefined : "application/json" };

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemes attribute="class" defaultTheme="system" enableSystem scriptProps={scriptProps}>
      {children}
    </NextThemes>
  );
}
