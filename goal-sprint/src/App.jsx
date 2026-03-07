import { useState, useRef } from "react";

const COLUMNS = ["Backlog", "This Week", "In Progress", "Done"];

const PRIORITIES = {
  Low: { color: "#4ade80", bg: "rgba(74,222,128,0.15)", label: "Low" },
  Medium: { color: "#facc15", bg: "rgba(250,204,21,0.15)", label: "Medium" },
  High: { color: "#f87171", bg: "rgba(248,113,113,0.15)", label: "High" },
};

const CATEGORIES = ["Health", "Career", "Finance", "Personal", "Learning", "Social"];

const COL_STYLES = {
  "Backlog":     { accent: "#94a3b8", glow: "rgba(148,163,184,0.3)" },
  "This Week":   { accent: "#60a5fa", glow: "rgba(96,165,250,0.3)" },
  "In Progress": { accent: "#f59e0b", glow: "rgba(245,158,11,0.3)" },
  "Done":        { accent: "#34d399", glow: "rgba(52,211,153,0.3)" },
};

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function isOverdue(dueDate) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

export default function AgileBoard() {
  const [dark, setDark] = useState(true);
  const [cards, setCards] = useState([
    { id: generateId(), title: "Define Q2 goals", description: "Map out key objectives for next quarter", priority: "High", category: "Career", column: "Backlog", dueDate: "" },
    { id: generateId(), title: "30-min morning run", description: "", priority: "Medium", category: "Health", column: "This Week", dueDate: "" },
    { id: generateId(), title: "Read 'Deep Work'", description: "At least 2 chapters per week", priority: "Low", category: "Learning", column: "In Progress", dueDate: "" },
    { id: generateId(), title: "Set up emergency fund", description: "3 months of expenses", priority: "High", category: "Finance", column: "Done", dueDate: "" },
  ]);

  const [filterPriority, setFilterPriority] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const [form, setForm] = useState({ title: "", description: "", priority: "Medium", category: "Personal", column: "Backlog", dueDate: "" });
  const dragCard = useRef(null);

  const bg = dark ? "#0f1117" : "#f0f2f7";
  const surface = dark ? "#1a1d27" : "#ffffff";
  const surface2 = dark ? "#22263a" : "#f8f9fc";
  const text = dark ? "#e2e8f0" : "#1e293b";
  const subtext = dark ? "#64748b" : "#94a3b8";
  const border = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";

  const doneCount = cards.filter(c => c.column === "Done").length;
  const progress = cards.length > 0 ? Math.round((doneCount / cards.length) * 100) : 0;

  const filtered = cards.filter(c => {
    if (filterPriority !== "All" && c.priority !== filterPriority) return false;
    if (filterCategory !== "All" && c.category !== filterCategory) return false;
    return true;
  });

  function addCard() {
    if (!form.title.trim()) return;
    setCards(prev => [...prev, { ...form, id: generateId() }]);
    setForm({ title: "", description: "", priority: "Medium", category: "Personal", column: "Backlog", dueDate: "" });
    setShowForm(false);
  }

  function deleteCard(id) {
    setCards(prev => prev.filter(c => c.id !== id));
  }

  function saveEdit(id, updates) {
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    setEditingId(null);
  }

  function weeklyReset() {
    setCards(prev => prev.map(c => c.column === "Done" ? { ...c, column: "Backlog" } : c));
  }

  function onDragStart(e, id) {
    dragCard.current = id;
    setDragging(id);
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragOver(e, col) {
    e.preventDefault();
    setDragOver(col);
  }

  function onDrop(e, col) {
    e.preventDefault();
    setCards(prev => prev.map(c => c.id === dragCard.current ? { ...c, column: col } : c));
    setDragging(null);
    setDragOver(null);
    dragCard.current = null;
  }

  function onDragEnd() {
    setDragging(null);
    setDragOver(null);
    dragCard.current = null;
  }

  return (
    <div style={{ minHeight: "100vh", background: bg, color: text, fontFamily: "'DM Sans', 'Segoe UI', sans-serif", transition: "background 0.3s" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: surface, borderBottom: `1px solid ${border}`, padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: 24, letterSpacing: "-0.5px", background: "linear-gradient(135deg, #60a5fa, #34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Goal Sprint
          </h1>
          <p style={{ margin: 0, fontSize: 12, color: subtext, marginTop: 2 }}>Personal Agile Board</p>
        </div>

        {/* Progress */}
        <div style={{ flex: 1, maxWidth: 280, margin: "0 32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12, color: subtext }}>
            <span>Overall Progress</span>
            <span style={{ color: "#34d399", fontWeight: 600 }}>{progress}% complete</span>
          </div>
          <div style={{ background: dark ? "#2d3348" : "#e2e8f0", borderRadius: 999, height: 8, overflow: "hidden" }}>
            <div style={{ width: `${progress}%`, background: "linear-gradient(90deg, #60a5fa, #34d399)", height: "100%", borderRadius: 999, transition: "width 0.5s cubic-bezier(.4,0,.2,1)" }} />
          </div>
          <div style={{ fontSize: 11, color: subtext, marginTop: 4 }}>{doneCount} of {cards.length} goals done</div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={weeklyReset} style={{ ...btnStyle(dark), background: dark ? "rgba(248,113,113,0.1)" : "rgba(239,68,68,0.08)", color: "#f87171", border: "1px solid rgba(248,113,113,0.25)", fontSize: 12 }}>
            ↩ Weekly Reset
          </button>
          <button onClick={() => setShowForm(true)} style={{ ...btnStyle(dark), background: "linear-gradient(135deg, #60a5fa, #34d399)", color: "#0f1117", fontWeight: 700, border: "none" }}>
            + Add Goal
          </button>
          <button onClick={() => setDark(d => !d)} style={{ ...btnStyle(dark), width: 38, height: 38, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
            {dark ? "☀️" : "🌙"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ padding: "14px 28px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", borderBottom: `1px solid ${border}`, background: surface }}>
        <span style={{ fontSize: 12, color: subtext, fontWeight: 500 }}>Filter:</span>
        {["All", ...Object.keys(PRIORITIES)].map(p => (
          <button key={p} onClick={() => setFilterPriority(p)} style={{ ...chipStyle(filterPriority === p, dark), ...(p !== "All" && filterPriority === p ? { background: PRIORITIES[p]?.bg, color: PRIORITIES[p]?.color, borderColor: PRIORITIES[p]?.color } : {}) }}>
            {p}
          </button>
        ))}
        <div style={{ width: 1, height: 20, background: border }} />
        {["All", ...CATEGORIES].map(c => (
          <button key={c} onClick={() => setFilterCategory(c)} style={chipStyle(filterCategory === c, dark)}>
            {c}
          </button>
        ))}
      </div>

      {/* Board */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, padding: 24, minHeight: "calc(100vh - 180px)" }}>
        {COLUMNS.map(col => {
          const colCards = filtered.filter(c => c.column === col);
          const { accent, glow } = COL_STYLES[col];
          const isOver = dragOver === col;

          return (
            <div key={col}
              onDragOver={e => onDragOver(e, col)}
              onDrop={e => onDrop(e, col)}
              style={{ background: isOver ? (dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)") : surface2, borderRadius: 16, border: `1px solid ${isOver ? accent : border}`, transition: "all 0.2s", boxShadow: isOver ? `0 0 0 2px ${glow}` : "none", display: "flex", flexDirection: "column" }}
            >
              {/* Column Header */}
              <div style={{ padding: "16px 18px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: accent, boxShadow: `0 0 8px ${glow}` }} />
                  <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: "0.02em" }}>{col}</span>
                </div>
                <span style={{ background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", color: subtext, fontSize: 11, fontWeight: 600, borderRadius: 999, padding: "2px 9px" }}>{colCards.length}</span>
              </div>

              {/* Cards */}
              <div style={{ flex: 1, padding: "0 12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                {colCards.map(card => (
                  <Card key={card.id} card={card} dark={dark} surface={surface} text={text} subtext={subtext} border={border}
                    dragging={dragging === card.id}
                    editingId={editingId}
                    onEdit={() => setEditingId(card.id)}
                    onSave={updates => saveEdit(card.id, updates)}
                    onDelete={() => deleteCard(card.id)}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                  />
                ))}
                {colCards.length === 0 && (
                  <div style={{ textAlign: "center", padding: "32px 12px", color: subtext, fontSize: 13, opacity: 0.6 }}>
                    Drop goals here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: surface, borderRadius: 20, padding: 28, width: 420, border: `1px solid ${border}`, boxShadow: "0 24px 60px rgba(0,0,0,0.4)" }}>
            <h2 style={{ margin: "0 0 20px", fontFamily: "'Playfair Display', serif", fontSize: 20 }}>New Goal</h2>
            <FormFields form={form} setForm={setForm} dark={dark} surface2={surface2} text={text} border={border} subtext={subtext} />
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={addCard} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #60a5fa, #34d399)", color: "#0f1117", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>Add Goal</button>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${border}`, background: "transparent", color: text, cursor: "pointer", fontSize: 14 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ card, dark, surface, text, subtext, border, dragging, editingId, onEdit, onSave, onDelete, onDragStart, onDragEnd }) {
  const [editForm, setEditForm] = useState({ ...card });
  const isEditing = editingId === card.id;
  const overdue = isOverdue(card.dueDate) && card.column !== "Done";
  const p = PRIORITIES[card.priority];

  return (
    <div
      draggable={!isEditing}
      onDragStart={e => onDragStart(e, card.id)}
      onDragEnd={onDragEnd}
      style={{
        background: dark ? (overdue ? "rgba(248,113,113,0.06)" : "rgba(255,255,255,0.04)") : (overdue ? "rgba(248,113,113,0.05)" : "#ffffff"),
        border: `1px solid ${overdue ? "rgba(248,113,113,0.35)" : border}`,
        borderRadius: 12,
        padding: "14px 14px 12px",
        cursor: dragging ? "grabbing" : "grab",
        opacity: dragging ? 0.4 : 1,
        transition: "all 0.2s",
        boxShadow: dark ? "0 2px 8px rgba(0,0,0,0.25)" : "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      {isEditing ? (
        <div>
          <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} style={inputStyle(dark)} placeholder="Goal title" />
          <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle(dark), height: 64, resize: "vertical", marginTop: 6 }} placeholder="Description (optional)" />
          <input type="date" value={editForm.dueDate} onChange={e => setEditForm(f => ({ ...f, dueDate: e.target.value }))} style={{ ...inputStyle(dark), marginTop: 6 }} />
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            {Object.keys(PRIORITIES).map(p => (
              <button key={p} onClick={() => setEditForm(f => ({ ...f, priority: p }))} style={{ ...miniChip(editForm.priority === p, PRIORITIES[p].color, PRIORITIES[p].bg) }}>{p}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button onClick={() => onSave(editForm)} style={{ flex: 1, padding: "7px", borderRadius: 8, border: "none", background: "#60a5fa", color: "#0f1117", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>Save</button>
            <button onClick={() => {}} style={{ flex: 1, padding: "7px", borderRadius: 8, border: `1px solid ${border}`, background: "transparent", color: text, cursor: "pointer", fontSize: 12 }} onClickCapture={e => { e.stopPropagation(); setEditForm({ ...card }); onSave(card); }}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 13.5, lineHeight: 1.4, flex: 1 }}>{card.title}</span>
            <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
              <button onClick={onEdit} style={{ ...iconBtn(dark), fontSize: 13 }} title="Edit">✏️</button>
              <button onClick={onDelete} style={{ ...iconBtn(dark), fontSize: 13 }} title="Delete">🗑</button>
            </div>
          </div>
          {card.description && <p style={{ margin: "6px 0 0", fontSize: 12, color: subtext, lineHeight: 1.5 }}>{card.description}</p>}
          {card.dueDate && (
            <div style={{ marginTop: 8, fontSize: 11, color: overdue ? "#f87171" : subtext, fontWeight: overdue ? 600 : 400 }}>
              {overdue ? "⚠️ Overdue · " : "📅 "}{new Date(card.dueDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </div>
          )}
          <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span style={{ background: p.bg, color: p.color, fontSize: 11, fontWeight: 600, borderRadius: 6, padding: "2px 8px", border: `1px solid ${p.color}33` }}>{card.priority}</span>
            <span style={{ background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: subtext, fontSize: 11, borderRadius: 6, padding: "2px 8px" }}>{card.category}</span>
          </div>
        </>
      )}
    </div>
  );
}

function FormFields({ form, setForm, dark, surface2, text, border, subtext }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Goal title *" style={inputStyle(dark)} />
      <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description (optional)" style={{ ...inputStyle(dark), height: 70, resize: "vertical" }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <label style={{ fontSize: 11, color: subtext, fontWeight: 500 }}>Priority</label>
          <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} style={{ ...inputStyle(dark), marginTop: 4 }}>
            {Object.keys(PRIORITIES).map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, color: subtext, fontWeight: 500 }}>Category</label>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ ...inputStyle(dark), marginTop: 4 }}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <label style={{ fontSize: 11, color: subtext, fontWeight: 500 }}>Start Column</label>
          <select value={form.column} onChange={e => setForm(f => ({ ...f, column: e.target.value }))} style={{ ...inputStyle(dark), marginTop: 4 }}>
            {COLUMNS.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, color: subtext, fontWeight: 500 }}>Due Date</label>
          <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} style={{ ...inputStyle(dark), marginTop: 4 }} />
        </div>
      </div>
    </div>
  );
}

function inputStyle(dark) {
  return {
    width: "100%",
    padding: "9px 12px",
    borderRadius: 9,
    border: `1px solid ${dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.12)"}`,
    background: dark ? "rgba(255,255,255,0.05)" : "#f8f9fc",
    color: dark ? "#e2e8f0" : "#1e293b",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };
}

function btnStyle(dark) {
  return {
    padding: "8px 16px",
    borderRadius: 10,
    border: `1px solid ${dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
    background: dark ? "rgba(255,255,255,0.05)" : "#ffffff",
    color: dark ? "#e2e8f0" : "#1e293b",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
    fontFamily: "inherit",
    transition: "all 0.15s",
  };
}

function chipStyle(active, dark) {
  return {
    padding: "4px 12px",
    borderRadius: 999,
    border: `1px solid ${active ? "#60a5fa" : (dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)")}`,
    background: active ? "rgba(96,165,250,0.15)" : "transparent",
    color: active ? "#60a5fa" : (dark ? "#94a3b8" : "#64748b"),
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.15s",
  };
}

function miniChip(active, color, bg) {
  return {
    padding: "3px 10px",
    borderRadius: 6,
    border: `1px solid ${active ? color : "transparent"}`,
    background: active ? bg : "transparent",
    color: active ? color : "#94a3b8",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  };
}

function iconBtn(dark) {
  return {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "2px 4px",
    borderRadius: 5,
    opacity: 0.5,
    transition: "opacity 0.15s",
    lineHeight: 1,
  };
}
