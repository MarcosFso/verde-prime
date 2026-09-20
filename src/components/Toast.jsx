import { CheckCircle2, AlertTriangle } from "lucide-react";
import { THEME } from "../config/sections";

export default function Toast({ msg, type = "default" }) {
  const styles = {
    success: { background: "#1E8F5F", Icon: CheckCircle2 },
    error: { background: "#B3261E", Icon: AlertTriangle },
    default: { background: THEME.brandDark, Icon: null },
  };
  const s = styles[type] || styles.default;
  return (
    <div className="vp-toast-in" style={{ position: "fixed", bottom: 20, left: "50%", background: s.background, color: "#fff",
      padding: "11px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, zIndex: 40, boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
      display: "flex", alignItems: "center", gap: 8 }}>
      {s.Icon && <s.Icon size={15} />}{msg}
    </div>
  );
}
