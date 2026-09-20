import { THEME } from "../config/sections";

const { line, card } = THEME;

export function SkeletonBlock({ width = "100%", height = 14, radius = 6, style }) {
  return <div className="vp-skeleton" style={{ width, height, borderRadius: radius, ...style }} />;
}

export function SkeletonFichaRow() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderRadius: 12,
      border: `1px solid ${line}`, marginBottom: 10, background: card }}>
      <SkeletonBlock width={38} height={38} radius="50%" />
      <div style={{ flex: 1, display: "grid", gap: 8 }}>
        <SkeletonBlock width="35%" height={13} />
        <SkeletonBlock width="55%" height={11} />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px",
      borderBottom: `1px solid ${line}`, gap: 10 }}>
      <div style={{ flex: 1, display: "grid", gap: 6 }}>
        <SkeletonBlock width="40%" height={13} />
        <SkeletonBlock width="25%" height={11} />
      </div>
      <SkeletonBlock width={60} height={13} />
    </div>
  );
}
