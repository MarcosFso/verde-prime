import { AlertTriangle } from "lucide-react";
import { THEME } from "../config/sections";

const { ink, muted, line, card, brand, danger } = THEME;

export default function ConfirmModal({ title, message, confirmLabel = "Confirmar", cancelLabel = "Cancelar", tone = "danger", onConfirm, onCancel }) {
  const accent = tone === "danger" ? danger : brand;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 50 }}>
      <div className="vp-modal-in" style={{ background: card, borderRadius: 12, padding: 22, maxWidth: 380, width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: `${accent}1A`, color: accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <AlertTriangle size={17} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: ink, margin: 0 }}>{title}</h3>
        </div>
        <p style={{ color: muted, fontSize: 13, marginBottom: 18 }}>{message}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel}
            style={{ flex: 1, background: card, border: `1.5px solid ${line}`, color: ink, padding: 9, fontWeight: 600, borderRadius: 8, cursor: "pointer" }}>
            {cancelLabel}
          </button>
          <button onClick={onConfirm}
            style={{ flex: 1, background: accent, color: "#fff", padding: 9, fontWeight: 600, borderRadius: 8, border: "none", cursor: "pointer" }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
