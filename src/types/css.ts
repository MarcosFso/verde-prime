import type { CSSProperties } from "react";

/** Estilo em linha que também aceita variáveis CSS (`--nome`), usadas nos efeitos 3D. */
export type EstiloCss = CSSProperties & { [variavel: `--${string}`]: string | number };
