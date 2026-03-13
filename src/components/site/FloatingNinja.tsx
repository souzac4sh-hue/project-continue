import { useEffect, useState } from "react";

export default function FloatingNinja() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        right: "20px",
        bottom: "90px",
        width: "90px",
        height: "90px",
        zIndex: 999999,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "999px",
        background: "radial-gradient(circle, #1e3a8a 0%, #020617 70%)",
        boxShadow: "0 0 25px rgba(59,130,246,0.9)",
        border: "2px solid rgba(96,165,250,0.9)",
        animation: "ninjaFloat 2s ease-in-out infinite",
      }}
      onClick={() => alert("🥷 Ninja ativo no site!")}
    >
      <div
        style={{
          fontSize: "42px",
          filter: "drop-shadow(0 0 10px rgba(96,165,250,0.9))",
        }}
      >
        🥷
      </div>

      <style>{`
        @keyframes ninjaFloat {
          0% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-10px) scale(1.04); }
          100% { transform: translateY(0px) scale(1); }
        }
      `}</style>
    </div>
  );
}
