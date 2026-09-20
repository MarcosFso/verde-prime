import { useState, useEffect, useRef } from "react";
import { X, Download, Copy, UploadCloud, FileDown, Loader2 } from "lucide-react";
import { SECTIONS, THEME } from "../config/sections";
import FieldInput from "./FieldInput";
import Icon from "./Icon";
import PagamentosField from "./PagamentosField";
import { compressImage } from "../utils/image";
import { uploadAttachment, removeAttachment, getSignedUrl } from "../api";
import { generateFichaPDF } from "../utils/fichaPdf";
import { formatBRL } from "../utils/finance";
import logo from "../assets/logo.png";

const { ink, muted, line, bg, pageBg, card, cardGlass, brand, brandDark, amber, danger } = THEME;

export default function FichaForm({ editing, setEditing, userId, onCancel, onSave, onDuplicate }) {
  const [openSections, setOpenSections] = useState({ cabecalho: true, proprietario: true });
  const [uploading, setUploading] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [dragPhoto, setDragPhoto] = useState(false);
  const [dragDoc, setDragDoc] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const initialSnapshot = useRef(JSON.stringify(editing));

  // Ao abrir uma ficha já existente, busca links de acesso (assinados) NOVOS para
  // fotos e documentos já enviados anteriormente — sempre atualiza, mesmo que já
  // exista um link salvo, porque links assinados expiram (1h) e não devem ficar
  // guardados como se fossem permanentes.
  const urlsFetched = useRef(false);
  useEffect(() => {
    if (urlsFetched.current || !editing.id) return;
    const hasFotos = (editing.fotos || []).some((f) => f.path);
    const hasDocs = (editing.documentos || []).some((d) => d.path);
    if (!hasFotos && !hasDocs) return;
    urlsFetched.current = true;
    (async () => {
      const [fotosComUrl, documentosComUrl] = await Promise.all([
        Promise.all((editing.fotos || []).map(async (f) => {
          if (!f.path) return f;
          try { return { ...f, url: await getSignedUrl(f.path) }; } catch (e) { return f; }
        })),
        Promise.all((editing.documentos || []).map(async (d) => {
          if (!d.path) return d;
          try { return { ...d, url: await getSignedUrl(d.path) }; } catch (e) { return d; }
        })),
      ]);
      setEditing((prev) => {
        const next = { ...prev, fotos: fotosComUrl, documentos: documentosComUrl };
        initialSnapshot.current = JSON.stringify(next);
        return next;
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isDirty = () => JSON.stringify(editing) !== initialSnapshot.current;
  const handleCancelClick = () => {
    if (isDirty()) setShowLeaveConfirm(true);
    else onCancel();
  };

  const toggleSection = (id) => setOpenSections((p) => ({ ...p, [id]: !p[id] }));
  const setField = (id, val) => setEditing((prev) => ({ ...prev, [id]: val }));
  const toggleChip = (groupId, value) => {
    setEditing((prev) => {
      const cur = prev[groupId] || [];
      const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
      return { ...prev, [groupId]: next };
    });
  };

  const processPhotoFiles = async (files) => {
    setUploading(true);
    for (const file of files) {
      try {
        const blob = await compressImage(file);
        const { path, name } = await uploadAttachment(userId, blob, file.name.replace(/\.[^.]+$/, "") + ".jpg");
        const url = await getSignedUrl(path).catch(() => null);
        setEditing((prev) => ({ ...prev, fotos: [...(prev.fotos || []), { path, name, url }] }));
      } catch (err) {
        console.error(err);
      }
    }
    setUploading(false);
  };

  const processDocFiles = async (files) => {
    setUploading(true);
    for (const file of files) {
      if (file.size > 8 * 1024 * 1024) continue;
      try {
        const { path, name } = await uploadAttachment(userId, file, file.name);
        const url = await getSignedUrl(path).catch(() => null);
        setEditing((prev) => ({ ...prev, documentos: [...(prev.documentos || []), { path, name, size: file.size, url }] }));
      } catch (err) {
        console.error(err);
      }
    }
    setUploading(false);
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    processPhotoFiles(files);
    e.target.value = "";
  };
  const handleDocUpload = (e) => {
    const files = Array.from(e.target.files || []);
    processDocFiles(files);
    e.target.value = "";
  };

  const handlePhotoDrop = (e) => {
    e.preventDefault();
    setDragPhoto(false);
    const files = Array.from(e.dataTransfer.files || []).filter((f) => f.type.startsWith("image/"));
    if (files.length) processPhotoFiles(files);
  };
  const handleDocDrop = (e) => {
    e.preventDefault();
    setDragDoc(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length) processDocFiles(files);
  };

  const removePhoto = async (idx) => {
    const item = editing.fotos[idx];
    setEditing((prev) => ({ ...prev, fotos: prev.fotos.filter((_, i) => i !== idx) }));
    if (item?.path) removeAttachment(item.path).catch(() => {});
  };
  const downloadPhoto = async (item) => {
    if (!item?.path) return;
    try {
      const freshUrl = await getSignedUrl(item.path);
      const a = document.createElement("a");
      a.href = freshUrl;
      a.download = item.name || "foto.jpg";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert("Não foi possível baixar a foto. Tente novamente.");
    }
  };
  const removeDoc = async (idx) => {
    const item = editing.documentos[idx];
    setEditing((prev) => ({ ...prev, documentos: prev.documentos.filter((_, i) => i !== idx) }));
    if (item?.path) removeAttachment(item.path).catch(() => {});
  };

  const valorAReceber = Math.max((Number(editing.valor_cobrado) || 0) - (Number(editing.valor_recebido) || 0), 0);

  return (
    <div className="vp-fade-in" style={{ background: pageBg, minHeight: "100vh", fontFamily: "var(--vp-font-body)" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: `linear-gradient(120deg, ${brandDark}, ${brand} 60%, ${brandDark})`, color: "#fff", overflow: "hidden" }}>
        <div className="vp-blob" style={{ width: 180, height: 180, background: "#C98A2C", opacity: 0.2, top: -90, right: "15%" }} />
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, position: "relative" }}>
          <button onClick={handleCancelClick} style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "none", borderRadius: 6, padding: "7px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <X size={14} /> Cancelar
          </button>
          <img src={logo} alt="Verde Prime" style={{ height: 32 }} />
          <h1 style={{ fontSize: 17, margin: 0, fontFamily: "var(--vp-font-heading)" }}>{editing.id ? "Editar ficha" : "Nova ficha"}</h1>
        </div>
      </div>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 20px 100px" }}>
        {SECTIONS.filter((s) => s.id !== "cadista").map((s) => {
          const isOpen = !!openSections[s.id];
          return (
            <div key={s.id} style={{ background: card, border: `1px solid ${line}`, borderRadius: 12, marginBottom: 14, overflow: "hidden" }}>
              <div onClick={() => toggleSection(s.id)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", cursor: "pointer", borderLeft: `5px solid ${s.accent}` }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: s.accent, color: "#fff", display: "flex",
                  alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={s.icon} size={15} color="#fff" /></div>
                <div style={{ fontWeight: 700, fontSize: 14.5, flex: 1, color: ink }}>{s.title}</div>
                <div style={{ color: muted, fontSize: 13, transform: isOpen ? "none" : "rotate(-90deg)", transition: "transform .2s" }}>▾</div>
              </div>
              {isOpen && (
                <div style={{ padding: "4px 18px 18px", display: "grid", gap: 14 }}>
                  {(s.id === "financeiro" ? s.fields.filter((f) => f.id !== "observacoes_financeiro") : s.fields).map((f) => (
                    <FieldInput key={f.id} field={f} value={editing[f.id]} accent={s.accent}
                      onChange={(val) => setField(f.id, val)} onToggleChip={(v) => toggleChip(f.id, v)} />
                  ))}
                  {s.id === "financeiro" && (
                    <>
                      <PagamentosField pagamentos={editing.pagamentos} onChange={(list) => {
                        const total = list.reduce((sum, p) => sum + (Number(p.valor) || 0), 0);
                        setEditing((prev) => ({ ...prev, pagamentos: list, valor_recebido: total }));
                      }} />
                      <div style={{ background: bg, border: `1px solid ${line}`, borderRadius: 8, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: 0.3 }}>Valor a Receber</span>
                        <span style={{ fontSize: 17, fontWeight: 800, color: valorAReceber > 0 ? danger : brand }}>
                          {formatBRL(valorAReceber)}
                        </span>
                      </div>
                      <FieldInput field={s.fields.find((f) => f.id === "observacoes_financeiro")} value={editing.observacoes_financeiro} accent={s.accent}
                        onChange={(val) => setField("observacoes_financeiro", val)} />
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Fotos */}
        <div style={{ background: card, border: `1px solid ${line}`, borderRadius: 12, marginBottom: 14, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderLeft: "5px solid #2E86C1" }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "#2E86C1", color: "#fff", display: "flex",
              alignItems: "center", justifyContent: "center" }}><Icon name="camera" size={15} color="#fff" /></div>
            <div style={{ fontWeight: 700, fontSize: 14.5, color: ink }}>Fotos</div>
          </div>
          <div style={{ padding: "4px 18px 18px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
              {(editing.fotos || []).map((f, i) => (
                <PhotoThumb key={f.path || i} item={f} onRemove={() => removePhoto(i)} onDownload={() => downloadPhoto(f)} />
              ))}
            </div>
            <label
              onDragOver={(e) => { e.preventDefault(); setDragPhoto(true); }}
              onDragLeave={() => setDragPhoto(false)}
              onDrop={handlePhotoDrop}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "22px 14px",
                borderRadius: 10, border: `2px dashed ${dragPhoto ? "#2E86C1" : line}`, fontSize: 12.5, color: muted, cursor: "pointer",
                background: dragPhoto ? "rgba(46,134,193,0.08)" : "transparent", transition: "background .15s ease, border-color .15s ease" }}>
              <UploadCloud size={22} color={dragPhoto ? "#2E86C1" : muted} />
              {uploading ? "Enviando..." : "Arraste fotos aqui ou clique para selecionar"}
              <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{ display: "none" }} disabled={uploading} />
            </label>
          </div>
        </div>

        {/* Documentos */}
        <div style={{ background: card, border: `1px solid ${line}`, borderRadius: 12, marginBottom: 14, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderLeft: "5px solid #7A4FA3" }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "#7A4FA3", color: "#fff", display: "flex",
              alignItems: "center", justifyContent: "center" }}><Icon name="paperclip" size={15} color="#fff" /></div>
            <div style={{ fontWeight: 700, fontSize: 14.5, color: ink }}>Documentos</div>
          </div>
          <div style={{ padding: "4px 18px 18px" }}>
            {(editing.documentos || []).length > 0 && (
              <div style={{ display: "grid", gap: 6, marginBottom: 10 }}>
                {editing.documentos.map((d, i) => (
                  <div key={d.path || i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: bg, borderRadius: 6, padding: "7px 10px", fontSize: 12.5 }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: ink }}>
                      📄 {d.name} {d.size ? <span style={{ color: muted }}>({Math.round(d.size / 1024)} KB)</span> : null}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                      {d.path ? (
                        <button
                          onClick={async () => {
                            try {
                              const freshUrl = await getSignedUrl(d.path);
                              window.open(freshUrl, "_blank", "noopener");
                            } catch (err) {
                              alert("Não foi possível abrir o documento. Tente novamente.");
                            }
                          }}
                          style={{ background: "none", border: "none", color: brand, fontWeight: 700, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", padding: 0, display: "flex", alignItems: "center", gap: 4 }}>
                          <Download size={12} /> Baixar
                        </button>
                      ) : (
                        <span style={{ color: muted, fontSize: 11 }}>carregando...</span>
                      )}
                      <button onClick={() => removeDoc(i)} style={{ background: "none", border: "none", color: danger, cursor: "pointer", display: "flex" }}><X size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <label
              onDragOver={(e) => { e.preventDefault(); setDragDoc(true); }}
              onDragLeave={() => setDragDoc(false)}
              onDrop={handleDocDrop}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "22px 14px",
                borderRadius: 10, border: `2px dashed ${dragDoc ? "#7A4FA3" : line}`, fontSize: 12.5, color: muted, cursor: "pointer",
                background: dragDoc ? "rgba(122,79,163,0.08)" : "transparent", transition: "background .15s ease, border-color .15s ease" }}>
              <UploadCloud size={22} color={dragDoc ? "#7A4FA3" : muted} />
              {uploading ? "Enviando..." : "Arraste documentos aqui ou clique para selecionar (máx. 8MB cada)"}
              <input type="file" multiple onChange={handleDocUpload} style={{ display: "none" }} disabled={uploading} />
            </label>
          </div>
        </div>

        {/* Histórico */}
        {editing.id && (editing.historico || []).length > 0 && (
          <div style={{ background: card, border: `1px solid ${line}`, borderRadius: 12, marginBottom: 14, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderLeft: "5px solid #6B6470" }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: "#6B6470", color: "#fff", display: "flex",
                alignItems: "center", justifyContent: "center" }}><Icon name="history" size={15} color="#fff" /></div>
              <div style={{ fontWeight: 700, fontSize: 14.5, color: ink }}>Histórico de alterações</div>
            </div>
            <div style={{ padding: "4px 18px 18px", display: "grid", gap: 6 }}>
              {[...editing.historico].reverse().map((h, i) => (
                <div key={i} style={{ fontSize: 12, color: muted, borderBottom: i < editing.historico.length - 1 ? `1px solid ${line}` : "none", paddingBottom: 6 }}>
                  <strong style={{ color: ink }}>{h.action}</strong> — {h.ts}{h.user ? ` · ${h.user}` : ""}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Barra de salvar fixa */}
      <div className="vp-glass" style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 20,
        background: cardGlass, borderTop: `1px solid ${line}`, boxShadow: "0 -6px 20px rgba(0,0,0,0.08)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "12px 20px", display: "flex", gap: 10 }}>
          <button onClick={onSave} disabled={uploading}
            style={{ flex: 1, background: `linear-gradient(90deg, ${amber}, #B9762A)`, color: "#fff", padding: 13,
              fontWeight: 700, fontSize: 15, borderRadius: 10, border: "none", cursor: "pointer", opacity: uploading ? 0.7 : 1, boxShadow: "0 4px 14px rgba(201,138,44,0.3)" }}>
            {editing.id ? "Salvar alterações" : "Salvar ficha"}
          </button>
          <button onClick={async () => {
              setGeneratingPdf(true);
              try {
                await generateFichaPDF(editing);
              } catch (err) {
                console.error(err);
                alert("Não foi possível gerar o PDF. Se o site foi atualizado recentemente, tente recarregar a página (puxe pra baixo ou aperte F5) e tente de novo.");
              } finally {
                setGeneratingPdf(false);
              }
            }}
            disabled={generatingPdf} title="Baixar ficha em PDF"
            style={{ background: card, color: ink, padding: "0 16px", fontWeight: 700, fontSize: 13, borderRadius: 10, border: `1.5px solid ${line}`, cursor: generatingPdf ? "default" : "pointer", display: "flex", alignItems: "center", gap: 6, opacity: generatingPdf ? 0.7 : 1 }}>
            {generatingPdf ? <><Loader2 size={14} className="vp-spin-icon" /> Gerando...</> : <><FileDown size={14} /> Baixar PDF</>}
          </button>
          {editing.id && (
            <button onClick={onDuplicate} style={{ background: card, color: ink, padding: "0 16px", fontWeight: 700, fontSize: 13, borderRadius: 10, border: `1.5px solid ${line}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Copy size={14} /> Duplicar
            </button>
          )}
        </div>
      </div>

      {showLeaveConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 30 }}>
          <div className="vp-modal-in" style={{ background: card, borderRadius: 12, padding: 22, maxWidth: 380, width: "100%" }}>
            <h3 style={{ fontSize: 16, marginBottom: 6, fontWeight: 700, color: ink }}>Sair sem salvar?</h3>
            <p style={{ color: muted, fontSize: 13, marginBottom: 18 }}>
              Você fez alterações nessa ficha que ainda não foram salvas. Se sair agora, elas podem se perder (fica só o rascunho automático).
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowLeaveConfirm(false)}
                style={{ flex: 1, background: brand, color: "#fff", padding: 9, fontWeight: 600, borderRadius: 8, border: "none", cursor: "pointer" }}>
                Continuar editando
              </button>
              <button onClick={() => { setShowLeaveConfirm(false); onCancel(); }}
                style={{ flex: 1, background: card, border: `1.5px solid ${danger}`, color: danger, padding: 9, fontWeight: 600, borderRadius: 8, cursor: "pointer" }}>
                Sair sem salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PhotoThumb({ item, onRemove, onDownload }) {
  return (
    <div style={{ position: "relative", width: 84, height: 84 }}>
      {item.url ? (
        <img src={item.url} alt={item.name} onClick={onDownload} title="Clique para baixar"
          style={{ width: 84, height: 84, objectFit: "cover", borderRadius: 8, border: `1px solid ${line}`, cursor: "pointer" }} />
      ) : (
        <div style={{ width: 84, height: 84, borderRadius: 8, border: `1px solid ${line}`, background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: muted, textAlign: "center", padding: 4 }}>
          {item.name}
        </div>
      )}
      {item.url && (
        <button onClick={onDownload} title="Baixar foto"
          style={{ position: "absolute", bottom: -6, left: -6, width: 22, height: 22, borderRadius: "50%", background: "#2E86C1", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Download size={11} /></button>
      )}
      <button onClick={onRemove} title="Remover"
        style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: danger, color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={11} /></button>
    </div>
  );
}
