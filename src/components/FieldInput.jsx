import { THEME } from "../config/sections";
import { maskPhone, maskCpfCnpj, formatCurrencyDigits, parseCurrencyInput } from "../utils/masks";

const { ink, line, card } = THEME;

export function FieldLabel({ children }) {
  return (
    <label
      style={{
        fontSize: 11,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        display: "block",
        marginBottom: 6,
        color: ink,
      }}
    >
      {children}
    </label>
  );
}

export default function FieldInput({ field, value, accent, onChange, onToggleChip }) {
  if (field.type === "select") {
    return (
      <div>
        <FieldLabel>{field.label}</FieldLabel>
        <select
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: "100%", padding: 10, border: `1.5px solid ${line}`, borderRadius: 8, outline: "none", background: card, color: ink }}
        >
          <option value="">—</option>
          {field.options.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div>
        <FieldLabel>{field.label}</FieldLabel>
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          rows={field.rows || 3}
          style={{ width: "100%", padding: 10, border: `1.5px solid ${line}`, borderRadius: 8, outline: "none", background: card, color: ink, resize: "none" }}
        />
      </div>
    );
  }

  if (field.type === "currency") {
    return (
      <div>
        <FieldLabel>{field.label}</FieldLabel>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: ink, fontSize: 13, pointerEvents: "none" }}>R$</span>
          <input
            type="text"
            inputMode="numeric"
            value={value ? formatCurrencyDigits(value) : ""}
            placeholder="0,00"
            onChange={(e) => onChange(parseCurrencyInput(e.target.value))}
            style={{ width: "100%", padding: "10px 10px 10px 32px", border: `1.5px solid ${line}`, borderRadius: 8, outline: "none", background: card, color: ink }}
          />
        </div>
      </div>
    );
  }

  if (field.type === "checkboxGroup") {
    const arr = value || [];
    return (
      <div>
        <FieldLabel>{field.label}</FieldLabel>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {field.options.map(([v, l]) => {
            const checked = arr.includes(v);
            return (
              <label
                key={v}
                onClick={() => onToggleChip(v)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  border: `1.5px solid ${checked ? accent : line}`, borderRadius: 20, padding: "7px 12px",
                  fontSize: 12.5, cursor: "pointer", background: checked ? accent : card, color: checked ? "#fff" : ink,
                }}
              >
                <input type="checkbox" checked={checked} readOnly style={{ margin: 0 }} /> {l}
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <FieldLabel>{field.label}</FieldLabel>
      <input
        type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
        value={value || ""}
        onChange={(e) => {
          let v = e.target.value;
          if (field.id === "telefone") v = maskPhone(v);
          else if (field.id === "cpf_cnpj") v = maskCpfCnpj(v);
          onChange(v);
        }}
        style={{ width: "100%", padding: 10, border: `1.5px solid ${line}`, borderRadius: 8, outline: "none", background: card, color: ink }}
      />
    </div>
  );
}
