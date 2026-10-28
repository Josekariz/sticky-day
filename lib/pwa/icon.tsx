import { ImageResponse } from "next/og";

/** Dark board + neon paper. Hex matches --board (dark) and --paper-yellow. */
const TILE = "#1E1C17";
const STICKY = "#F5FF3D";
const STICKY_TOP = "#E4EE2A";
const FOLD = "#B8C22A";

function Note({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <g transform="rotate(-6 16 16)">
        <path d="M5 5h22v17l-5 5H5z" fill={STICKY} />
        <path d="M22 27l5-5h-5z" fill={FOLD} />
        <path d="M5 5h22v4H5z" fill={STICKY_TOP} />
      </g>
    </svg>
  );
}

export function pwaIcon(size: number, kind: "any" | "maskable") {
  // Maskable safe zone is the centre 80%; extra pad so the fold survives a circle crop.
  const pad = kind === "maskable" ? 0.22 : 0.14;
  const inner = Math.round(size * (1 - pad * 2));

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
        }}
      >
        <Note size={inner} />
      </div>
    ),
    { width: size, height: size },
  );
}

const LIGHT_BG = "#EDEAE2";
const LIGHT_FG = "#1F1D1A";
const DARK_FG = "#F2EFE6";
const GLOW_DARK =
  "radial-gradient(circle at 50% 50%, rgba(245, 255, 61, 0.42) 0%, rgba(245, 255, 61, 0.18) 28%, rgba(245, 255, 61, 0.06) 52%, rgba(245, 255, 61, 0) 70%)";
const GLOW_LIGHT =
  "radial-gradient(circle at 50% 50%, rgba(245, 255, 61, 0.28) 0%, rgba(245, 255, 61, 0.10) 32%, rgba(245, 255, 61, 0) 62%)";

/** Full-screen launch image: note, halo, and the name. Follows paper vs night. */
export function pwaSplash(width: number, height: number, scheme: "light" | "dark") {
  const m = Math.min(width, height);
  const note = Math.round(m * 0.24);
  const glow = Math.round(m * 0.88);
  const dark = scheme === "dark";

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
          gap: Math.round(m * 0.04),
          background: dark ? TILE : LIGHT_BG,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: Math.round(m * 0.04),
            width: glow,
            height: glow,
            background: dark ? GLOW_DARK : GLOW_LIGHT,
          }}
        >
          <Note size={note} />
          <div
            style={{
              display: "flex",
              fontSize: Math.round(m * 0.07),
              fontWeight: 700,
              color: dark ? DARK_FG : LIGHT_FG,
            }}
          >
            Sticky Day
          </div>
        </div>
      </div>
    ),
    { width, height },
  );
}

const PHONES = [
  { w: 750, h: 1334, media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" },
  { w: 1170, h: 2532, media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" },
  { w: 1179, h: 2556, media: "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" },
  { w: 1284, h: 2778, media: "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)" },
  { w: 1290, h: 2796, media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" },
];

export const SPLASH_SIZES = PHONES.flatMap((s) => [
  { ...s, theme: "light" as const, media: s.media },
  { ...s, theme: "dark" as const, media: `${s.media} and (prefers-color-scheme: dark)` },
]);
