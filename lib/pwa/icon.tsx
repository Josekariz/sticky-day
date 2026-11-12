import { ImageResponse } from "next/og";

/** Dark board + neon paper. Hex matches --board (dark) and --paper-yellow. */
const TILE = "#1E1C17";
const STICKY = "#F5FF3D";
const STICKY_TOP = "#E4EE2A";
const FOLD = "#B8C22A";

function Note({ size }: { size: number }) {
  // Nearly edge-to-edge in the viewBox so home-screen icons stay loud after OS rounding.
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <g transform="rotate(-5 16 16)">
        <path d="M1.5 1.5h29v22.5l-6.5 6.5H1.5z" fill={STICKY} />
        <path d="M24 30.5l6.5-6.5H24z" fill={FOLD} />
        <path d="M1.5 1.5h29v5H1.5z" fill={STICKY_TOP} />
      </g>
    </svg>
  );
}

/** Caveat bold for splash wordmark — ImageResponse ignores CSS font stacks. */
async function loadHandFont(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Caveat:wght@700&text=Sticky%20Day&display=swap",
      {
        headers: { "User-Agent": "Mozilla/5.0" },
        next: { revalidate: 60 * 60 * 24 * 30 },
      },
    );
    if (!css.ok) return null;
    const body = await css.text();
    const url = body.match(/url\(([^)]+)\)/)?.[1];
    if (!url) return null;
    const font = await fetch(url, { next: { revalidate: 60 * 60 * 24 * 30 } });
    if (!font.ok) return null;
    return await font.arrayBuffer();
  } catch {
    return null;
  }
}

export function pwaIcon(size: number, kind: "any" | "maskable") {
  // Keep the sticky large on the home screen; maskable still needs a little safe pad.
  const pad = kind === "maskable" ? 0.12 : 0.04;
  const inner = Math.round(size * (1 - pad * 2));
  // Black S on the note — Chrome’s splash is icon-only, so this is the brand mark.
  const mark = Math.round(inner * 0.44);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: TILE,
          position: "relative",
        }}
      >
        <Note size={inner} />
        <div
          style={{
            position: "absolute",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: mark,
            fontWeight: 700,
            color: "#1F1D1A",
            lineHeight: 1,
            // Sit on the note face (note is rotated ~-5deg).
            transform: "translateY(-4%)",
          }}
        >
          S
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}

const LIGHT_BG = "#EDEAE2";
const LIGHT_FG = "#1F1D1A";
const DARK_FG = "#F2EFE6";

/** Full-screen launch image: big note + Sticky Day wordmark. */
export async function pwaSplash(width: number, height: number, scheme: "light" | "dark") {
  const m = Math.min(width, height);
  const note = Math.round(m * 0.46);
  const dark = scheme === "dark";
  const hand = await loadHandFont();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: Math.round(m * 0.05),
          background: dark ? TILE : LIGHT_BG,
        }}
      >
        <Note size={note} />
        <div
          style={{
            display: "flex",
            fontFamily: hand ? "Caveat" : "sans-serif",
            fontSize: Math.round(m * 0.13),
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: dark ? STICKY : LIGHT_FG,
            lineHeight: 1,
          }}
        >
          Sticky Day
        </div>
      </div>
    ),
    {
      width,
      height,
      ...(hand
        ? {
            fonts: [
              {
                name: "Caveat",
                data: hand,
                style: "normal" as const,
                weight: 700 as const,
              },
            ],
          }
        : {}),
    },
  );
}

const PHONES = [
  { w: 750, h: 1334, media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
  { w: 1170, h: 2532, media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
  { w: 1179, h: 2556, media: "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
  { w: 1284, h: 2778, media: "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
  { w: 1290, h: 2796, media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
  { w: 1320, h: 2868, media: "(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
];

export const SPLASH_SIZES = PHONES.flatMap((s) => [
  {
    ...s,
    theme: "light" as const,
    media: `${s.media} and (prefers-color-scheme: light)`,
  },
  {
    ...s,
    theme: "dark" as const,
    media: `${s.media} and (prefers-color-scheme: dark)`,
  },
]);
