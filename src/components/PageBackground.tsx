import logo from "../assets/logo.png";

export default function PageBackground() {
  return (
    <>
      <div className="vp-page-pattern" />
      <div className="vp-blob" style={{ position: "fixed", width: 420, height: 420, background: "#10B981", opacity: 0.16, top: "-10%", left: "-12%", zIndex: 0 }} />
      <div className="vp-blob" style={{ position: "fixed", width: 360, height: 360, background: "#06B6D4", opacity: 0.14, bottom: "-12%", right: "-10%", zIndex: 0, animationDelay: "2.2s" }} />
      <div className="vp-blob" style={{ position: "fixed", width: 260, height: 260, background: "#A3E635", opacity: 0.14, top: "38%", right: "4%", zIndex: 0, animationDelay: "4.4s" }} />
      <div className="vp-blob" style={{ position: "fixed", width: 200, height: 200, background: "#34D399", opacity: 0.13, bottom: "20%", left: "6%", zIndex: 0, animationDelay: "1.1s" }} />
      <img src={logo} alt="" aria-hidden="true" style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: "min(480px, 90vw)", opacity: 0.05, zIndex: 0, pointerEvents: "none", userSelect: "none",
      }} />
    </>
  );
}
