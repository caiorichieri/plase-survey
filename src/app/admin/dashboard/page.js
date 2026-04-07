"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

// Vector bar component
function VectorBar({ label, value, min = -1, max = 1, color }) {
  if (value === null || value === undefined) return null;
  const range = max - min;
  const pct = ((value - min) / range) * 100;
  const zeroPos = min < 0 ? ((0 - min) / range) * 100 : 0;
  const isPositive = min < 0 ? value >= 0 : true;
  const barLeft = isPositive ? zeroPos : pct;
  const barWidth = Math.abs(pct - zeroPos);
  return (
    <div className="flex items-center gap-2 mb-1">
      <span className="w-14 text-right text-xs font-mono font-bold" style={{ color }}>{label}</span>
      <div className="flex-1 h-4 bg-stone-100 rounded relative overflow-hidden">
        {min < 0 && <div className="absolute top-0 bottom-0 w-px bg-stone-300" style={{ left: `${zeroPos}%` }} />}
        <div className="absolute top-0.5 bottom-0.5 rounded" style={{ left: `${barLeft}%`, width: `${Math.max(barWidth, 1)}%`, backgroundColor: color, opacity: 0.75 }} />
      </div>
      <span className="w-10 text-xs font-mono text-right text-stone-600">{value.toFixed(2)}</span>
    </div>
  );
}

const WINDOW_COLORS = {
  CLOSED_BELOW: "bg-blue-900 text-white",
  CLOSED_ABOVE: "bg-red-700 text-white",
  UNSTABLE: "bg-amber-500 text-white",
  OPEN: "bg-emerald-600 text-white",
};

function WindowBadge({ state }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-bold ${WINDOW_COLORS[state] || "bg-stone-400 text-white"}`}>
      {state || "—"}
    </span>
  );
}

function ConfirmedBadge({ confirmed }) {
  return confirmed ? (
    <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-700">✓ Confermato</span>
  ) : (
    <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-700">In attesa</span>
  );
}

// NOTE: prop named 'rec' to avoid minifier naming conflicts
function ResponseCard({ rec, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(rec.therapist_notes || "");
  const [saving, setSaving] = useState(false);
  const [adj, setAdj] = useState({
    V: rec.therapist_adjusted_v ?? rec.plase_v ?? null,
    A: rec.therapist_adjusted_a ?? rec.plase_a ?? null,
    phi: rec.therapist_adjusted_phi ?? rec.plase_phi_elab ?? null,
    delta: rec.therapist_adjusted_delta ?? rec.plase_delta ?? null,
    window: rec.therapist_adjusted_window ?? rec.plase_window ?? "",
    stadio: rec.therapist_adjusted_stadio ?? rec.plase_stadio ?? "",
  });

  const langFlag = { it: "🇮🇹", en: "🇬🇧", pt: "🇧🇷", fr: "🇫🇷", fur: "🏔️" };

  const save = async (confirmed) => {
    setSaving(true);
    const body = {
      therapist_notes: notes,
      therapist_confirmed: confirmed,
      therapist_adjusted_v: adj.V,
      therapist_adjusted_a: adj.A,
      therapist_adjusted_phi: adj.phi,
      therapist_adjusted_delta: adj.delta,
      therapist_adjusted_window: adj.window || null,
      therapist_adjusted_stadio: adj.stadio || null,
    };
    await fetch(`/api/admin/update/${rec.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    setEditing(false);
    onUpdate();
  };

  const adjSlider = (key, val) => setAdj((prev) => ({ ...prev, [key]: parseFloat(val) }));
  const hasPlase = rec.plase_v !== null && rec.plase_v !== undefined;

  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-stone-50" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <span className="text-xs text-stone-400">{new Date(rec.created_at).toLocaleString("it-IT")}</span>
          <span className="text-sm font-medium">{rec.age}a · {rec.sex} · {rec.nationality} · {rec.location}</span>
          <span>{langFlag[rec.language] || rec.language}</span>
        </div>
        <div className="flex items-center gap-2">
          {rec.plase_window && <WindowBadge state={rec.therapist_adjusted_window || rec.plase_window} />}
          <ConfirmedBadge confirmed={rec.therapist_confirmed} />
          <svg className={`w-4 h-4 text-stone-400 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-stone-100 px-4 py-4">
          <div className="mb-5 space-y-3">
            <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Risposte</h3>
            {[
              { label: "D1", text: rec.d1 },
              { label: "D2", text: rec.d2 },
              { label: "D3", text: rec.d3 },
              { label: "D4", text: rec.d4 },
              { label: "D5", text: rec.d5 },
              { label: `D6 (${rec.d6_scale}/5)`, text: rec.d6_text || "—" },
            ].map((q) => (
              <div key={q.label} className="bg-stone-50 rounded-lg p-3">
                <span className="text-xs font-bold text-stone-500">{q.label}</span>
                <p className="text-sm text-stone-700 mt-1 whitespace-pre-wrap">{q.text}</p>
              </div>
            ))}
          </div>

          {hasPlase && (
            <div className="mb-5 bg-stone-50 rounded-lg p-4">
              <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">Vettore Ψ(t) — Modello</h3>
              <VectorBar label="V" value={rec.plase_v} color="#2563eb" />
              <VectorBar label="A" value={rec.plase_a} color="#dc2626" />
              <VectorBar label="R" value={rec.plase_r} color="#d97706" />
              {rec.plase_t !== null && <VectorBar label="T" value={rec.plase_t} color="#059669" />}
              <VectorBar label="Φ elab" value={rec.plase_phi_elab} min={1} max={5} color="#7c3aed" />
              <VectorBar label="Φ comp" value={rec.plase_phi_comport} min={1} max={5} color="#a855f7" />
              <VectorBar label="Δ" value={rec.plase_delta} color="#0891b2" />
              <div className="flex gap-4 mt-2 text-xs text-stone-400">
                {rec.plase_nc !== null && <span>Narr.Coh: {rec.plase_nc?.toFixed(2)}</span>}
                {rec.plase_emb !== null && <span>Embod: {rec.plase_emb?.toFixed(2)}</span>}
                {rec.plase_stadio && <span>Stadio: {rec.plase_stadio}</span>}
              </div>
            </div>
          )}

          {!hasPlase && (
            <div className="mb-5 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
              Analisi PLASE non disponibile per questa risposta
            </div>
          )}

          {rec.plase_raw && (
            <details className="mb-5">
              <summary className="text-xs font-semibold text-stone-500 uppercase tracking-wide cursor-pointer hover:text-stone-700">Analisi completa PLASE ▸</summary>
              <div className="mt-2 bg-stone-50 rounded-lg p-4 text-xs text-stone-700 whitespace-pre-wrap font-mono leading-relaxed max-h-80 overflow-y-auto">{rec.plase_raw}</div>
            </details>
          )}

          <div className="border-t border-stone-100 pt-4">
            <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">Revisione supervisore</h3>
            {editing ? (
              <div className="space-y-4">
                {[
                  { key: "V", label: "V (Valenza)", min: -1, max: 1 },
                  { key: "A", label: "A (Arousal)", min: -1, max: 1 },
                  { key: "phi", label: "Φ (Fase)", min: 1, max: 5 },
                  { key: "delta", label: "Δ (Desiderata)", min: -1, max: 1 },
                ].map(({ key, label, min, max }) => (
                  <div key={key}>
                    <div className="flex justify-between mb-1">
                      <label className="text-xs font-medium text-stone-600">{label}</label>
                      <span className="text-xs font-mono text-stone-700">{adj[key]?.toFixed(2) ?? "—"}</span>
                    </div>
                    <input type="range" min={min} max={max} step={0.05} value={adj[key] ?? 0} onChange={(e) => adjSlider(key, e.target.value)} className="w-full accent-stone-700" />
                  </div>
                ))}
                <div>
                  <label className="text-xs font-medium text-stone-600 block mb-1">Window State</label>
                  <select value={adj.window} onChange={(e) => setAdj((prev) => ({ ...prev, window: e.target.value }))} className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-sm">
                    {["", "OPEN", "UNSTABLE", "CLOSED_ABOVE", "CLOSED_BELOW"].map((v) => (
                      <option key={v} value={v}>{v || "— Non modificato —"}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-600 block mb-1">Stadio</label>
                  <input type="text" value={adj.stadio} onChange={(e) => setAdj((prev) => ({ ...prev, stadio: e.target.value }))} placeholder="Es: Stadio 2, 6b…" className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-600 block mb-1">Note cliniche</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Note per la supervisione…" rows={3} className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm resize-none" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => save(true)} disabled={saving} className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">{saving ? "Salvo…" : "✓ Conferma valutazione"}</button>
                  <button onClick={() => save(false)} disabled={saving} className="flex-1 py-2 bg-stone-200 text-stone-700 rounded-lg text-sm font-medium hover:bg-stone-300 disabled:opacity-50">Salva senza confermare</button>
                  <button onClick={() => setEditing(false)} className="px-4 py-2 border border-stone-300 rounded-lg text-sm hover:bg-stone-50">Annulla</button>
                </div>
              </div>
            ) : (
              <div>
                {rec.therapist_notes && (
                  <div className="bg-emerald-50 rounded-lg p-3 mb-3 text-sm text-emerald-800">
                    <p className="text-xs font-semibold text-emerald-600 mb-1">Note cliniche:</p>
                    {rec.therapist_notes}
                  </div>
                )}
                {rec.therapist_confirmed && rec.therapist_confirmed_at && (
                  <p className="text-xs text-stone-400 mb-3">Confermato: {new Date(rec.therapist_confirmed_at).toLocaleString("it-IT")}</p>
                )}
                <button onClick={() => setEditing(true)} className="px-4 py-2 bg-stone-800 text-white rounded-lg text-sm hover:bg-stone-700">✏️ Rivedi / Conferma</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [responses, setResponses] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [filter, setFilter] = useState("all");
  const router = useRouter();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`/api/admin/responses?page=${page}`);
      if (res.status === 401) { router.push("/admin"); return; }
      const json = await res.json();
      setResponses(json.data || []);
      setCount(json.count || 0);
    } catch (err) {
      setFetchError("Errore di rete. Riprova.");
    } finally {
      setLoading(false);
    }
  }, [page, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = responses.filter((item) => {
    if (filter === "pending") return !item.therapist_confirmed;
    if (filter === "confirmed") return item.therapist_confirmed;
    return true;
  });

  const confirmedCount = responses.filter((item) => item.therapist_confirmed).length;

  const exportCSV = async () => {
    const res = await fetch("/api/admin/responses?page=1&pageSize=9999");
    const json = await res.json();
    const rows = json.data || [];
    const headers = ["id","created_at","language","age","sex","nationality","location","d1","d2","d3","d4","d5","d6_scale","d6_text","plase_v","plase_a","plase_r","plase_t","plase_phi_elab","plase_phi_comport","plase_delta","plase_window","plase_nc","plase_emb","plase_stadio","therapist_confirmed","therapist_notes","therapist_adjusted_v","therapist_adjusted_a","therapist_adjusted_phi","therapist_adjusted_delta","therapist_adjusted_window","therapist_adjusted_stadio"];
    const escape = (val) => `"${String(val ?? "").replace(/"/g, '""')}"`;
    const csvRows = rows.map((row) => headers.map((h) => escape(row[h])).join(","));
    const csv = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `plase_risposte_${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
  };

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="bg-stone-800 text-white px-4 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-bold">Dashboard PLASE — Supervisore</h1>
            <p className="text-xs text-stone-400">{count} risposte totali · {confirmedCount} confermate</p>
          </div>
          <button onClick={exportCSV} className="px-3 py-1.5 bg-stone-700 hover:bg-stone-600 rounded-lg text-sm">⬇ CSV</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl border border-stone-200 p-4 mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-stone-700">Avanzamento raccolta</span>
            <span className="font-bold text-stone-800">{count} / 200</span>
          </div>
          <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden">
            <div className="h-full bg-stone-800 rounded-full transition-all" style={{ width: `${Math.min((count / 200) * 100, 100)}%` }} />
          </div>
          <p className="text-xs text-stone-400 mt-1">{count >= 200 ? "🎉 Obiettivo raggiunto!" : `Mancano ${200 - count} risposte all'obiettivo`}</p>
        </div>

        <div className="flex gap-2 mb-4">
          {[{ key: "all", label: "Tutte" }, { key: "pending", label: "In attesa" }, { key: "confirmed", label: "Confermate" }].map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f.key ? "bg-stone-800 text-white" : "bg-white text-stone-600 border border-stone-300 hover:border-stone-500"}`}>{f.label}</button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16 text-stone-400">Caricamento…</div>
        ) : fetchError ? (
          <div className="text-center py-16 text-red-500">{fetchError}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-stone-400">Nessuna risposta trovata.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <ResponseCard key={item.id} rec={item} onUpdate={fetchData} />
            ))}
          </div>
        )}

        {count > 20 && (
          <div className="flex justify-center gap-2 mt-6">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 bg-white border border-stone-300 rounded-lg text-sm disabled:opacity-40 hover:bg-stone-50">← Precedente</button>
            <span className="px-4 py-2 text-sm text-stone-500">Pagina {page}</span>
            <button onClick={() => setPage((p) => p + 1)} disabled={page * 20 >= count} className="px-4 py-2 bg-white border border-stone-300 rounded-lg text-sm disabled:opacity-40 hover:bg-stone-50">Successiva →</button>
          </div>
        )}
      </main>
    </div>
  );
}
