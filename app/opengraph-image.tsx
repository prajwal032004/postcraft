import { ImageResponse } from "next/og";

export const alt = "Postcraft — compose email that reads like it was typeset";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f6f3f1",
          padding: 72,
          fontFamily: "Georgia, serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -80,
            width: 520,
            height: 520,
            borderRadius: 999,
            background: "radial-gradient(closest-side, rgba(255,148,115,0.85), rgba(160,181,235,0.45) 60%, rgba(246,243,241,0))",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -160,
            left: -100,
            width: 460,
            height: 460,
            borderRadius: 999,
            background: "radial-gradient(closest-side, rgba(167,252,205,0.9), rgba(160,181,235,0.35) 60%, rgba(246,243,241,0))",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              background: "#242424",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: 12, height: 12, borderRadius: 999, background: "#f6f3f1" }} />
          </div>
          <div style={{ fontSize: 34, color: "#242424", letterSpacing: -1 }}>postcraft</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {/* Satori needs one text node per box, so the italic line is its own div. */}
          <div style={{ display: "flex", flexDirection: "column", color: "#242424", letterSpacing: -2 }}>
            <div style={{ fontSize: 76, lineHeight: 1.08, maxWidth: 940 }}>Compose email that reads like it was</div>
            <div style={{ fontSize: 76, lineHeight: 1.08, fontStyle: "italic" }}>typeset.</div>
          </div>
          <div style={{ fontSize: 30, color: "#4e4d4d", maxWidth: 820, lineHeight: 1.35 }}>
            14 hand-set templates, a live HTML editor, and sending through your own SMTP account.
          </div>
        </div>

        <div style={{ display: "flex", gap: 14, fontSize: 22, color: "#797776" }}>
          <div style={{ padding: "10px 22px", border: "1px solid #cecac8", borderRadius: 999 }}>Gmail</div>
          <div style={{ padding: "10px 22px", border: "1px solid #cecac8", borderRadius: 999 }}>Outlook</div>
          <div style={{ padding: "10px 22px", border: "1px solid #cecac8", borderRadius: 999 }}>Zoho</div>
          <div style={{ padding: "10px 22px", border: "1px solid #cecac8", borderRadius: 999 }}>Any SMTP</div>
        </div>
      </div>
    ),
    size
  );
}
