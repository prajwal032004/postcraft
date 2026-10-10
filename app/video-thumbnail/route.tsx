import { ImageResponse } from "next/og";

/**
 * Poster frame for the app-password walkthrough. It doubles as the
 * thumbnailUrl in the VideoObject structured data, so the clip can appear as
 * a video result rather than a bare link.
 */

// ImageResponse sets Content-Type: image/png itself; route handlers cannot
// export a `contentType` the way image metadata files can.
const W = 1280;
const H = 720;

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#242424",
          padding: 64,
          fontFamily: "Georgia, serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -180,
            right: -140,
            width: 620,
            height: 620,
            borderRadius: 999,
            background:
              "radial-gradient(closest-side, rgba(255,148,115,0.55), rgba(160,181,235,0.28) 60%, rgba(36,36,36,0))",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -220,
            left: -160,
            width: 560,
            height: 560,
            borderRadius: 999,
            background:
              "radial-gradient(closest-side, rgba(167,252,205,0.45), rgba(160,181,235,0.2) 60%, rgba(36,36,36,0))",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 999,
              background: "#f6f3f1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: 11, height: 11, borderRadius: 999, background: "#242424" }} />
          </div>
          <div style={{ fontSize: 30, color: "#f6f3f1", letterSpacing: -1 }}>postcraft plum</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", flexDirection: "column", color: "#f6f3f1", letterSpacing: -2 }}>
            <div style={{ fontSize: 74, lineHeight: 1.08 }}>Create a Gmail</div>
            <div style={{ fontSize: 74, lineHeight: 1.08, fontStyle: "italic" }}>app password.</div>
          </div>
          <div style={{ fontSize: 28, color: "#b9b5b2" }}>A 25-second walkthrough, start to finish.</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: 999,
              background: "#2b59d1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 0,
                height: 0,
                marginLeft: 7,
                borderTop: "17px solid transparent",
                borderBottom: "17px solid transparent",
                borderLeft: "27px solid #ffffff",
              }}
            />
          </div>
          <div style={{ fontSize: 26, color: "#f6f3f1", letterSpacing: 0 }}>Watch the setup · 0:25</div>
        </div>
      </div>
    ),
    { width: W, height: H }
  );
}
