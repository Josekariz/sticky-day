import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sticky Day",
    short_name: "Sticky",
    description: "Your day as sticky notes on a whiteboard.",
    id: "/",
    start_url: "/board",
    scope: "/",
    display: "standalone",
    background_color: "#1E1C17",
    theme_color: "#1E1C17",
    lang: "en",
    categories: ["productivity"],
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/512-maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Board", short_name: "Board", url: "/board" },
      { name: "Calendar", short_name: "Calendar", url: "/calendar" },
      { name: "Your day", short_name: "Your day", url: "/summary" },
    ],
  };
}
