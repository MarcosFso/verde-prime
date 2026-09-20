import { useState } from "react";
import { THEME } from "../config/sections";
import AuthShell from "./AuthShell";
import logo from "../assets/logo.png";

const { ink, muted, line, bg, brand, teal } = THEME;

export default function TermsGate({ onAccept, onLogout }) {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    try {
      await onAccept();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell tagline="Antes de continuar, confirme que leu os termos de uso e o aviso de privacidade.">
      <div style={{ width: "100%", maxWidth: 640 }}>
        <div className="vp-auth-mobile-header">
          <img src={logo} alt="Verde Prime" style={{ width: 120, margin: "0 auto 8px", display: "block", filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.35))" }} />
        </div>
        <div style={{ background: "#fff", border: `1px solid ${line}`, borderRadius: 16, padding: 26, boxShadow: "0 20px 50px rgba(0,0,0,0.25)" }}>
          <h2 style={{ margin: "0 0 4px", fontSize: 18, fontFamily: "var(--vp-font-heading)", color: ink }}>Termos de Uso e Aviso de Privacidade</h2>
          <p style={{ color: muted, fontSize: 12, marginBottom: 14 }}>Leia com atenção antes de continuar.</p>

          <div style={{ maxHeight: 300, overflowY: "auto", border: `1px solid ${line}`, borderRadius: 8, padding: "14px 16px",
            fontSize: 12.5, lineHeight: 1.6, color: ink, background: bg, marginBottom: 16 }}>
            <p><strong>1. Sobre este sistema.</strong> Este sistema é uma ferramenta interna da Verde Prime Consultoria Ambiental,
            destinada ao cadastro e acompanhamento de fichas técnicas de visita relacionadas ao Cadastro Ambiental Rural (CAR).
            O acesso é restrito a usuários autorizados pela empresa.</p>

            <p><strong>2. Dados tratados.</strong> Ao usar este sistema, você poderá inserir dados pessoais de terceiros
            (proprietários/possuidores de imóveis rurais), incluindo nome, CPF/CNPJ, telefone, e-mail e outras informações
            relacionadas ao imóvel e ao atendimento. Esses dados são tratados exclusivamente para a finalidade de prestação
            dos serviços de consultoria ambiental contratados junto à Verde Prime.</p>

            <p><strong>3. Responsabilidades do usuário.</strong> Você se compromete a: (a) manter sua senha em sigilo e não
            compartilhá-la com terceiros; (b) inserir apenas dados obtidos de forma legítima e com conhecimento do titular;
            (c) utilizar o sistema exclusivamente para fins relacionados ao trabalho na Verde Prime; (d) comunicar
            imediatamente ao administrador qualquer uso indevido ou suspeita de acesso não autorizado à sua conta.</p>

            <p><strong>4. Segurança e armazenamento.</strong> Os dados são armazenados em banco de dados com controles de
            acesso e criptografia em trânsito. Ainda assim, nenhum sistema é totalmente livre de riscos, e o uso responsável
            das credenciais de acesso é essencial para a proteção das informações.</p>

            <p><strong>5. LGPD.</strong> A Verde Prime, como controladora dos dados pessoais tratados neste sistema, deve
            observar a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), incluindo a garantia dos direitos dos titulares
            dos dados (acesso, correção, exclusão, entre outros). Dúvidas sobre o tratamento de dados devem ser direcionadas
            ao responsável pela empresa.</p>

            <p><strong>6. Alterações.</strong> Este termo pode ser atualizado periodicamente. O uso continuado do sistema
            após alterações implica concordância com os novos termos.</p>
          </div>

          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: ink, cursor: "pointer", marginBottom: 16 }}>
            <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)}
              style={{ marginTop: 2, width: 16, height: 16, flexShrink: 0 }} />
            Li e concordo com os Termos de Uso e o Aviso de Privacidade acima.
          </label>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onLogout}
              style={{ background: "#fff", border: `1.5px solid ${line}`, color: muted, padding: 11, fontWeight: 600,
                fontSize: 13.5, borderRadius: 8, cursor: "pointer" }}>
              Sair
            </button>
            <button onClick={handleAccept} disabled={!checked || loading}
              style={{ flex: 1, background: checked ? `linear-gradient(90deg, ${brand}, ${teal})` : "#ccc", color: "#fff",
                padding: 11, fontWeight: 700, fontSize: 14, border: "none", borderRadius: 8,
                cursor: checked && !loading ? "pointer" : "not-allowed" }}>
              {loading ? "Salvando..." : "Aceitar e continuar"}
            </button>
          </div>
        </div>
      </div>
    </AuthShell>
  );
}
