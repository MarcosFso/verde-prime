import { THEME } from "../config/sections";

export default function DraftModal({ onDiscard, onRestore }) {
  const { ink, muted, line, brand, card } = THEME;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 30 }}>
      <div className="vp-modal-in" style={{ background: card, borderRadius: 12, padding: 22, maxWidth: 380, width: "100%" }}>
        <h3 style={{ fontSize: 16, marginBottom: 6, fontWeight: 700, color: ink }}>Rascunho encontrado</h3>
        <p style={{ color: muted, fontSize: 13, marginBottom: 18 }}>Encontramos um rascunho não salvo desta ficha. Deseja continuar de onde parou?</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onDiscard} style={{ flex: 1, background: card, border: `1.5px solid ${line}`, color: ink, padding: 9, fontWeight: 600, borderRadius: 8, cursor: "pointer" }}>Descartar</button>
          <button onClick={onRestore} style={{ flex: 1, background: brand, color: "#fff", padding: 9, fontWeight: 600, borderRadius: 8, border: "none", cursor: "pointer" }}>Continuar rascunho</button>
        </div>
      </div>
    </div>
  );
}
