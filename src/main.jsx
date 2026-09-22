import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// O app funciona offline, então o navegador guarda uma cópia dele. Quando sai
// um deploy novo, essa cópia antiga continua rodando até a página ser recarregada
// — era a causa de correções parecerem não ter subido. Aqui, assim que a versão
// nova assume o controle, a página se recarrega uma única vez, sozinha.
if ("serviceWorker" in navigator) {
  const jaTinhaVersaoInstalada = !!navigator.serviceWorker.controller;
  let recarregando = false;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    // Na primeiríssima visita não há o que atualizar: o app acabou de ser instalado.
    if (!jaTinhaVersaoInstalada || recarregando) return;
    recarregando = true;
    window.location.reload();
  });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
