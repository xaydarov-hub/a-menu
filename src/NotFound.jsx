import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #050d06, #0a1f0d, #0f2a10)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      textAlign: "center",
      fontFamily: "Inter,sans-serif",
    }}>
      <div style={{
        width: 120,
        height: 120,
        borderRadius: 30,
        background: "rgba(212,175,55,0.08)",
        border: "2px solid rgba(212,175,55,0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 56,
        marginBottom: 24,
      }}>
        🌿
      </div>
      <h1 style={{
        fontFamily: "Cinzel,serif",
        color: "#D4AF37",
        fontSize: 48,
        fontWeight: 700,
        letterSpacing: 4,
        marginBottom: 8,
      }}>
        404
      </h1>
      <p style={{
        color: "#7fa86b",
        fontSize: 18,
        maxWidth: 400,
        marginBottom: 32,
        lineHeight: 1.7,
      }}>
        Sahifa topilmadi. Iltimos, to'g'ri manzilni tekshiring.
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link
          to="/"
          style={{
            padding: "14px 32px",
            borderRadius: 12,
            border: "none",
            background: "linear-gradient(135deg, #b8931f, #D4AF37)",
            color: "#0a1f0d",
            fontFamily: "Cinzel,serif",
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: 1,
            cursor: "pointer",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          🏠 Bosh sahifa
        </Link>
        <Link
          to="/menu"
          style={{
            padding: "14px 32px",
            borderRadius: 12,
            border: "1px solid rgba(134,176,84,0.4)",
            background: "rgba(255,255,255,0.04)",
            color: "#86B054",
            fontFamily: "Inter,sans-serif",
            fontSize: 14,
            cursor: "pointer",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          🌿 Menyu
        </Link>
      </div>
      <div style={{
        marginTop: 40,
        color: "#3d5c38",
        fontSize: 12,
        letterSpacing: 1,
      }}>
        AMAZONIA · PREMIUM RESTAURANT
      </div>
    </div>
  );
}