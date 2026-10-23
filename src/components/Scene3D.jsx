import { useRef } from "react";
import logo from "../assets/logo.png";

const FACES = ["front", "back", "right", "left", "top", "bottom"];

/**
 * Cena 3D em CSS puro (sem biblioteca): um cubo de vidro girando com a logo,
 * anéis em órbita e esferas flutuantes. Reage ao mouse com parallax.
 */
export default function Scene3D() {
  const ref = useRef(null);

  const onMove = (e) => {
    const el = ref.current;
    if (!el || e.pointerType === "touch") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--px", `${(x * 24).toFixed(1)}deg`);
    el.style.setProperty("--py", `${(-y * 18).toFixed(1)}deg`);
  };

  return (
    <div className="vp-scene" ref={ref} onPointerMove={onMove} aria-hidden="true">
      <div className="vp-scene-stage">
        <div className="vp-scene-floor" />
        <div className="vp-ring vp-ring-a" />
        <div className="vp-ring vp-ring-b" />
        <div className="vp-cube">
          {FACES.map((f) => (
            <div key={f} className={`vp-cube-face vp-cube-${f}`}>
              {(f === "front" || f === "back") && <img src={logo} alt="" draggable="false" />}
            </div>
          ))}
        </div>
        <span className="vp-orb vp-orb-1" />
        <span className="vp-orb vp-orb-2" />
        <span className="vp-orb vp-orb-3" />
        <span className="vp-orb vp-orb-4" />
      </div>
    </div>
  );
}
