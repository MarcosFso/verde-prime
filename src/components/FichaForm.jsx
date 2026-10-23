import { useState, useEffect, useRef } from "react";
import { X, Download, Copy, UploadCloud, FileDown, Loader2, Save } from "lucide-react";
import { SECTIONS, THEME } from "../config/sections";
import FieldInput, { FieldLabel } from "./FieldInput";
import Icon from "./Icon";
import PagamentosField from "./PagamentosField";
import { compressImage } from "../utils/image";
import { uploadAttachment, removeAttachment, getSignedUrl } from "../api";
import { generateFichaPDF } from "../utils/fichaPdf";
import { formatBRL } from "../utils/finance";
import logo from "../assets/logo.png";

const { ink, muted, line, bg, pageBg, card, cardGlass, brand, danger } = THEME;

// Limite por documento. O bucket do Supabase aceita bem mais, mas vale conter:
// o plano gratuito tem 1 GB de armazenamento no total.
const MAX_DOC_MB = 25;

export default function FichaForm({ editing, setEditing, userId, onCancel, onSave, onDuplicate, showToast }) {
  const [openSections, setOpenSections] = useState(() => Object.fromEntries(SECTIONS.map((sec) => [sec.id, true])));
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

  // Antes, arquivo grande e falha de envio eram descartados em silêncio: quem
  // estava usando clicava, nada acontecia e não havia como saber o motivo.
  const avisar = (msg, tipo = "error") => (showToast ? showToast(msg, tipo) : alert(msg));

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
        avisar(`Não foi possível enviar a foto "${file.name}": ${err?.message || "tente de novo."}`);
      }
    }
    setUploading(false);
  };

  const processDocFiles = async (files) => {
    setUploading(true);
    for (const file of files) {
      if (file.size > MAX_DOC_MB * 1024 * 1024) {
        const tamanho = (file.size / (1024 * 1024)).toFixed(1);
        avisar(`"${file.name}" tem ${tamanho} MB e o limite é ${MAX_DOC_MB} MB. Reduza o arquivo e tente de novo.`);
        continue;
      }
      try {
        const { path, name } = await uploadAttachment(userId, file, file.name);
        const url = await getSignedUrl(path).catch(() => null);
        setEditing((prev) => ({ ...prev, documentos: [...(prev.documentos || []), { path, name, size: file.size, url }] }));
      } catch (err) {
        console.error(err);
        avisar(`Não foi possível enviar "${file.name}": ${err?.message || "tente de novo."}`);
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

  const filled = (v) => (Array.isArray(v) ? v.length > 0 : typeof v === "number" ? v > 0 : !!String(v ?? "").trim());
  const sectionProgress = (sec) => {
    const total = sec.fields.length;
    const done = sec.fields.filter((f) => filled(editing[f.id])).length;
    return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
  };
  const formSections = SECTIONS.filter((sec) => sec.id !== "cadista");
  const overall = (() => {
    const all = formSections.flatMap((sec) => sec.fields);
    return all.length ? Math.round((all.filter((f) => filled(editing[f.id])).length / all.length) * 100) : 0;
  })();
  const allOpen = formSections.every((sec) => openSections[sec.id]);
  const setAllSections = (open) => setOpenSections(Object.fromEntries(SECTIONS.map((sec) => [sec.id, open])));
  const goToSection = (id) => {
    setOpenSections((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => document.getElementById("sec-" + id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 30);
  };

  const valorAReceber = Math.max((Number(editing.valor_cobrado) || 0) - (Number(editing.valor_recebido) || 0), 0);

  return (
    <div className="vp-fade-in" style={{ background: pageBg, minHeight: "100vh", fontFamily: "var(--vp-font-body)" }}>
      <div className="vp-form-header" style={{ position: "sticky", top: 0, zIndex: 10, background: "var(--vp-hero)", boxShadow: "0 10px 30px rgba(5,61,43,0.35)", color: "#fff", overflow: "hidden" }}>
        <div className="vp-blob" style={{ width: 180, height: 180, background: "#A3E635", opacity: 0.3, top: -90, right: "15%" }} />
        <div className="vp-form-head">
          <button onClick={handleCancelClick} className="vp-form-cancel">
            <X size={15} /> Cancelar
          </button>
          <img src={logo} alt="Verde Prime" style={{ height: 34 }} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="vp-form-kicker">{editing.id ? "Editar ficha" : "Nova ficha"}</div>
            <h1 className="vp-form-title">{editing.nome || "Novo cliente"}</h1>
          </div>
          <div className="vp-form-progress" title="Campos preenchidos">
            <div className="vp-form-progress-top"><span>Preenchimento</span><strong>{overall}%</strong></div>
            <div className="vp-form-progress-bar"><div style={{ width: `${overall}%` }} /></div>
          </div>
        </div>
      </div>
      <div className="vp-form-layout">
        <nav className="vp-form-nav">
          <div className="vp-form-nav-title">Seções</div>
          {formSections.map((sec) => {
            const pr = sectionProgress(sec);
            return (
              <button key={sec.id} type="button" onClick={() => goToSection(sec.id)} className="vp-form-nav-item">
                <span className="vp-icon-3d vp-form-nav-ico" style={{ background: sec.accent }}><Icon name={sec.icon} size={13} color="#fff" /></span>
                <span className="vp-form-nav-text">
                  <span>{sec.title}</span>
                  <span className="vp-form-nav-bar"><span style={{ width: `${pr.pct}%`, background: sec.accent }} /></span>
                </span>
                <span className="vp-form-nav-count" style={pr.pct === 100 ? { color: "var(--vp-brand)" } : undefined}>{pr.pct === 100 ? "✓" : `${pr.done}/${pr.total}`}</span>
              </button>
            );
          })}
          <button type="button" onClick={() => setAllSections(!allOpen)} className="vp-form-nav-toggle">
            {allOpen ? "Recolher tudo" : "Expandir tudo"}
          </button>
        </nav>
        <div className="vp-form-grid vp-stagger">
        {SECTIONS.filter((s) => s.id !== "cadista").map((s) => {
          const isOpen = !!openSections[s.id];
          return (
            <div key={s.id} id={"sec-" + s.id} className={`vp-panel ${s.id === "financeiro" ? "vp-form-wide" : ""}`} style={{ background: card, border: `1px solid ${line}`, borderRadius: 20, overflow: "hidden", scrollMarginTop: 110 }}>
              <div onClick={() => toggleSection(s.id)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", cursor: "pointer", borderLeft: `5px solid ${s.accent}` }}>
                <div className="vp-icon-3d" style={{ width: 34, height: 34, borderRadius: 10, background: s.accent, color: "#fff", display: "flex",
                  alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={s.icon} size={15} color="#fff" /></div>
                <div style={{ fontWeight: 700, fontSize: 14.5, flex: 1, color: ink }}>{s.title}</div>
                <div style={{ color: muted, fontSize: 13, transform: isOpen ? "none" : "rotate(-90deg)", transition: "transform .2s" }}>▾</div>
              </div>
              {isOpen && (
                <div style={{ padding: "4px 20px 20px", display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
                  {(s.id === "financeiro" ? s.fields.filter((f) => f.id !== "observacoes_financeiro") : s.fields).map((f) => (
                    <div key={f.id} style={f.type === "textarea" || f.type === "checkboxGroup" ? { gridColumn: "1 / -1" } : undefined}>
                      <FieldInput field={f} value={editing[f.id]} accent={s.accent}
                        onChange={(val) => setField(f.id, val)} onToggleChip={(v) => toggleChip(f.id, v)} />
                    </div>
                  ))}
                  {s.id === "financeiro" && (
                    <div style={{ gridColumn: "1 / -1", display: "grid", gap: 16 }}>
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

                      {/* Recibos já emitidos. Só de leitura: o registro é criado
                          automaticamente quando um recibo é gerado. */}
                      {(editing.recibos || []).length > 0 && (
                        <div>
                          <FieldLabel>Recibos emitidos</FieldLabel>
                          <div style={{ border: `1px solid ${line}`, borderRadius: 8, overflow: "hidden" }}>
                            {[...editing.recibos].reverse().map((r, i) => (
                              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                                padding: "10px 12px", borderBottom: i < editing.recibos.length - 1 ? `1px solid ${line}` : "none", flexWrap: "wrap", rowGap: 4 }}>
                                <div style={{ minWidth: 0 }}>
                                  <span style={{ fontWeight: 700, color: ink, fontSize: 13 }}>{formatBRL(r.valor)}</span>
                                  <span style={{ color: muted, fontSize: 12 }}>
                                    {r.cliente ? ` · ${r.cliente}` : ""}
                                    {r.imoveis && r.imoveis.length ? ` · ${r.imoveis.join(", ")}` : ""}
                                  </span>
                                </div>
                                <span style={{ color: muted, fontSize: 11.5, whiteSpace: "nowrap" }}>
                                  emitido em {r.ts || "—"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Fotos */}
        <div className="vp-panel vp-form-wide" style={{ background: card, border: `1px solid ${line}`, borderRadius: 20, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderLeft: "5px solid #2E86C1" }}>
            <div className="vp-icon-3d" style={{ width: 34, height: 34, borderRadius: 10, background: "#2E86C1", color: "#fff", display: "flex",
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
        <div className="vp-panel vp-form-wide" style={{ background: card, border: `1px solid ${line}`, borderRadius: 20, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderLeft: "5px solid #7A4FA3" }}>
            <div className="vp-icon-3d" style={{ width: 34, height: 34, borderRadius: 10, background: "#7A4FA3", color: "#fff", display: "flex",
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
              {uploading ? "Enviando..." : `Arraste documentos aqui ou clique para selecionar (máx. ${MAX_DOC_MB}MB cada)`}
              <input type="file" multiple onChange={handleDocUpload} style={{ display: "none" }} disabled={uploading} />
            </label>
          </div>
        </div>

        {/* Histórico */}
        {editing.id && (editing.historico || []).length > 0 && (
          <div className="vp-panel vp-form-wide" style={{ background: card, border: `1px solid ${line}`, borderRadius: 20, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderLeft: "5px solid #6B6470" }}>
              <div className="vp-icon-3d" style={{ width: 34, height: 34, borderRadius: 10, background: "#6B6470", color: "#fff", display: "flex",
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
      </div>

      {/* Barra de salvar fixa */}
      <div className="vp-glass" style={{ position: "sticky", bottom: 0, zIndex: 20,
        background: cardGlass, borderTop: `1px solid ${line}`, boxShadow: "0 -6px 20px rgba(0,0,0,0.08)" }}>
        <div className="vp-action-bar">
          <button onClick={onSave} disabled={uploading} className="vp-act vp-act-primary">
            <Save size={17} /> {editing.id ? "Salvar alterações" : "Salvar ficha"}
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
            className="vp-act vp-act-soft">
            {generatingPdf ? <><Loader2 size={16} className="vp-spin-icon" /> Gerando...</> : <><FileDown size={16} /> Baixar PDF</>}
          </button>
          {editing.id && (
            <button onClick={onDuplicate} className="vp-act vp-act-soft">
              <Copy size={16} /> Duplicar
            </button>
          )}
        </div>
      </div>

      {showLeaveConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(2,20,12,0.62)", backdropFilter: "blur(7px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 30 }}>
          <div className="vp-modal-in vp-modal" style={{ background: card, borderRadius: 22, padding: 22, maxWidth: 380, width: "100%" }}>
            <h3 style={{ fontSize: 16, marginBottom: 6, fontWeight: 700, color: ink }}>Sair sem salvar?</h3>
            <p style={{ color: muted, fontSize: 13, marginBottom: 18 }}>
              Você fez alterações nessa ficha que ainda não foram salvas. Se sair agora, elas podem se perder (fica só o rascunho automático).
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowLeaveConfirm(false)} className="vp-btn-3d"
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
        <button onClick={onDownload} title="Baixar foto" className="vp-mini"
          style={{ position: "absolute", bottom: -6, left: -6, width: 22, height: 22, borderRadius: "50%", background: "#2E86C1", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Download size={11} /></button>
      )}
      <button onClick={onRemove} title="Remover" className="vp-mini"
        style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: danger, color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={11} /></button>
    </div>
  );
}
