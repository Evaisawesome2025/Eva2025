"use client";
import { useState } from "react";

const games = [
  { id: "fruit-frenzy", title: "Fruit Frenzy", emoji: "🍓", src: "/fruit-frenzy.html", desc: "Catch fruit, dodge bombs, build combos!" },
  { id: "doodle-jump", title: "Doodle Jump", emoji: "🐸", src: "/doodle-jump.html", desc: "Bounce your way up the platforms!" },
];

export default function Home() {
  const [game, setGame] = useState(null);

  if (game) {
    return (
      <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
        <button
          onClick={() => setGame(null)}
          style={{
            position: "absolute", top: 12, left: 12, zIndex: 10,
            padding: "8px 16px", borderRadius: 20, border: "none",
            background: "rgba(255,255,255,0.85)", fontWeight: 700,
            cursor: "pointer", fontSize: 14,
          }}
        >
          ← Arcade
        </button>
        <iframe
          src={game.src}
          title={game.title}
          style={{ border: "none", width: "100%", height: "100%", display: "block" }}
        />
      </div>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 24,
        background: "linear-gradient(180deg, #16213e, #0f3460)",
        fontFamily: "system-ui, sans-serif", padding: 24,
      }}
    >
      <h1 style={{ color: "#fff", fontSize: 42, margin: 0 }}>🕹️ Eva&apos;s Arcade</h1>
      <p style={{ color: "rgba(255,255,255,0.7)", margin: 0 }}>Pick a game!</p>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
        {games.map((g) => (
          <button
            key={g.id}
            onClick={() => setGame(g)}
            style={{
              width: 220, padding: 24, borderRadius: 16, border: "none",
              background: "rgba(255,255,255,0.1)", color: "#fff",
              cursor: "pointer", textAlign: "center",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ fontSize: 56 }}>{g.emoji}</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 8 }}>{g.title}</div>
            <div style={{ fontSize: 14, opacity: 0.7, marginTop: 6 }}>{g.desc}</div>
          </button>
        ))}
      </div>
    </main>
  );
}
