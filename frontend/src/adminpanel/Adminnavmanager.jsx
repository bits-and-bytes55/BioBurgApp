// src/adminpanel/Adminnavmanager.jsx
// Supports: Top Nav → Submenu → Nested Submenu (3 levels deep)

import { useState } from "react";
import { useNav } from "../context/NavContext";

let _nextId = 9000;
const newId = () => ++_nextId;

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Badge({ children, color = "blue" }) {
  const colors = {
    blue:   "bg-blue-100 text-blue-700",
    green:  "bg-emerald-100 text-emerald-700",
    red:    "bg-red-100 text-red-700",
    gray:   "bg-gray-100 text-gray-500",
    amber:  "bg-amber-100 text-amber-700",
    violet: "bg-violet-100 text-violet-700",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${colors[color]}`}>
      {children}
    </span>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${value ? "bg-emerald-500" : "bg-gray-300"}`}
    >
      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${value ? "translate-x-4" : "translate-x-0"}`} />
    </button>
  );
}

// ─── Modal Shell ──────────────────────────────────────────────────────────────

function Modal({ title, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${wide ? "max-w-2xl" : "max-w-lg"} mx-4 overflow-hidden max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors text-2xl leading-none">×</button>
        </div>
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// ─── Item Edit Modal (label + link) ──────────────────────────────────────────

function ItemEditModal({ item, onSave, onClose, title }) {
  const [label, setLabel] = useState(item?.label || "");
  const [link,  setLink]  = useState(item?.link  || "/");

  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Label</label>
          <input
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Tablets"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Link / Route</label>
          <input
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="/page-route"
          />
          <p className="text-xs text-gray-400 mt-1">
            e.g. <span className="font-mono bg-gray-100 px-1 rounded">/category/tablets</span>
          </p>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => { if (label.trim()) onSave({ label: label.trim(), link: link.trim() || "/" }); }}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
          >
            Save
          </button>
          <button onClick={onClose} className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 rounded-xl transition-colors text-sm">
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── LEVEL 3: Nested sub-item row (leaf — no further nesting) ─────────────────

function NestedSubItemRow({ item, onEdit, onDelete, isFirst, isLast, onMoveUp, onMoveDown }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-100 bg-white hover:border-violet-200 transition-all">
      <div className="flex flex-col gap-0">
        <button onClick={onMoveUp}   disabled={isFirst} className="text-gray-300 hover:text-gray-500 disabled:opacity-20 text-xs leading-none">▲</button>
        <button onClick={onMoveDown} disabled={isLast}  className="text-gray-300 hover:text-gray-500 disabled:opacity-20 text-xs leading-none">▼</button>
      </div>
      <div className="w-2 h-2 rounded-full bg-violet-300 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-700 truncate">{item.label}</p>
        <p className="text-xs text-gray-400 font-mono truncate">{item.link}</p>
      </div>
      <button onClick={onEdit} className="p-1 rounded text-blue-400 hover:bg-blue-50 transition-colors">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
      <button onClick={onDelete} className="p-1 rounded text-red-400 hover:bg-red-50 transition-colors">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}

// ─── LEVEL 3: Nested Submenu Manager (shown inline inside Level 2 row) ────────

function NestedSubManager({ items, onChange }) {
  const [editingIdx, setEditingIdx] = useState(null);
  const [showAdd,    setShowAdd]    = useState(false);

  const move = (idx, dir) => {
    const arr = [...items];
    const to  = idx + dir;
    if (to < 0 || to >= arr.length) return;
    [arr[idx], arr[to]] = [arr[to], arr[idx]];
    onChange(arr);
  };

  return (
    <div className="mt-2 ml-4 pl-3 border-l-2 border-violet-200 space-y-1.5">
      {items.length === 0 && (
        <p className="text-xs text-gray-400 italic py-1">No nested items yet</p>
      )}
      {items.map((sub, idx) => (
        <div key={sub.id}>
          <NestedSubItemRow
            item={sub}
            isFirst={idx === 0}
            isLast={idx === items.length - 1}
            onMoveUp={()   => move(idx, -1)}
            onMoveDown={()  => move(idx, +1)}
            onEdit={()     => setEditingIdx(idx)}
            onDelete={()   => onChange(items.filter((_, i) => i !== idx))}
          />
          {editingIdx === idx && (
            <ItemEditModal
              title="Edit Nested Item"
              item={sub}
              onClose={() => setEditingIdx(null)}
              onSave={({ label, link }) => {
                const arr = [...items];
                arr[idx] = { ...arr[idx], label, link };
                onChange(arr);
                setEditingIdx(null);
              }}
            />
          )}
        </div>
      ))}

      <button
        onClick={() => setShowAdd(true)}
        className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 font-semibold bg-violet-50 hover:bg-violet-100 px-2.5 py-1 rounded-lg transition-colors mt-1"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Add nested item
      </button>

      {showAdd && (
        <ItemEditModal
          title="Add Nested Item"
          item={null}
          onClose={() => setShowAdd(false)}
          onSave={({ label, link }) => {
            onChange([...items, { id: newId(), label, link }]);
            setShowAdd(false);
          }}
        />
      )}
    </div>
  );
}

// ─── LEVEL 2: Submenu item row (can expand to show Level 3) ──────────────────

function SubItemRow({ item, onEdit, onDelete, isFirst, isLast, onMoveUp, onMoveDown, onChangeChildren }) {
  const [expanded, setExpanded] = useState(false);
  const children = item.children || [];

  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/50 overflow-hidden">
      {/* Row header */}
      <div className="flex items-center gap-3 px-3 py-2 hover:bg-white transition-all">
        {/* Reorder */}
        <div className="flex flex-col gap-0">
          <button onClick={onMoveUp}   disabled={isFirst} className="text-gray-300 hover:text-gray-500 disabled:opacity-20 text-xs leading-none">▲</button>
          <button onClick={onMoveDown} disabled={isLast}  className="text-gray-300 hover:text-gray-500 disabled:opacity-20 text-xs leading-none">▼</button>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
          title="Toggle nested items"
        >
          <svg className={`w-3 h-3 transition-transform ${expanded ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Label + link */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{item.label}</p>
          <p className="text-xs text-gray-400 font-mono truncate">{item.link}</p>
        </div>

        {/* Children count badge */}
        {children.length > 0 && (
          <Badge color="violet">{children.length} nested</Badge>
        )}

        {/* Edit */}
        <button onClick={onEdit} className="p-1 rounded-md text-blue-400 hover:bg-blue-50 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        {/* Delete */}
        <button onClick={onDelete} className="p-1 rounded-md text-red-400 hover:bg-red-50 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Nested children panel */}
      {expanded && (
        <div className="px-3 pb-3">
          <NestedSubManager
            items={children}
            onChange={(updated) => onChangeChildren(updated)}
          />
        </div>
      )}
    </div>
  );
}

// ─── LEVEL 2: Submenu Manager Modal ──────────────────────────────────────────

function SubmenuModal({ item, onSave, onClose }) {
  const [submenu,    setSubmenu]    = useState(
    (item.submenu || []).map((s) => ({ children: [], ...s }))
  );
  const [editingIdx, setEditingIdx] = useState(null);
  const [showAdd,    setShowAdd]    = useState(false);

  const move = (idx, dir) => {
    const arr = [...submenu];
    const to  = idx + dir;
    if (to < 0 || to >= arr.length) return;
    [arr[idx], arr[to]] = [arr[to], arr[idx]];
    setSubmenu(arr);
  };

  const updateChildren = (idx, children) => {
    const arr = [...submenu];
    arr[idx] = { ...arr[idx], children };
    setSubmenu(arr);
  };

  return (
    <Modal title={`Submenu: ${item.label}`} onClose={() => onSave(submenu)} wide>
      <div className="space-y-3">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-500">{submenu.length} items</p>
            <span className="text-xs text-gray-400">·</span>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <svg className="w-3 h-3 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              Click arrow to expand nested items
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            + Add item
          </button>
        </div>

        {/* Visual legend */}
        <div className="flex items-center gap-4 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
            Submenu item
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-violet-400 inline-block" />
            Nested sub-item
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
            = expand to add/edit nested
          </span>
        </div>

        {/* Submenu list */}
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {submenu.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">No submenu items yet — add one above</div>
          )}
          {submenu.map((sub, idx) => (
            <div key={sub.id}>
              <SubItemRow
                item={sub}
                isFirst={idx === 0}
                isLast={idx === submenu.length - 1}
                onMoveUp={()   => move(idx, -1)}
                onMoveDown={()  => move(idx, +1)}
                onEdit={()     => setEditingIdx(idx)}
                onDelete={()   => setSubmenu(submenu.filter((_, i) => i !== idx))}
                onChangeChildren={(children) => updateChildren(idx, children)}
              />
              {editingIdx === idx && (
                <ItemEditModal
                  title="Edit Submenu Item"
                  item={sub}
                  onClose={() => setEditingIdx(null)}
                  onSave={({ label, link }) => {
                    const arr = [...submenu];
                    arr[idx] = { ...arr[idx], label, link };
                    setSubmenu(arr);
                    setEditingIdx(null);
                  }}
                />
              )}
            </div>
          ))}
        </div>

        <button
          onClick={() => onSave(submenu)}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm mt-2"
        >
          Save Submenu
        </button>
      </div>

      {showAdd && (
        <ItemEditModal
          title="Add Submenu Item"
          item={null}
          onClose={() => setShowAdd(false)}
          onSave={({ label, link }) => {
            setSubmenu([...submenu, { id: newId(), label, link, children: [] }]);
            setShowAdd(false);
          }}
        />
      )}
    </Modal>
  );
}

// ─── LEVEL 1: Nav item row ────────────────────────────────────────────────────

function NavItemRow({ item, onEdit, onDelete, onToggle, onMoveUp, onMoveDown, onManageSubmenu, isFirst, isLast }) {
  const totalNested = (item.submenu || []).reduce((acc, s) => acc + (s.children?.length || 0), 0);

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-150 ${item.enabled ? "bg-white border-gray-200 hover:border-blue-200 hover:shadow-sm" : "bg-gray-50 border-gray-100 opacity-60"}`}>
      <div className="flex flex-col gap-0.5">
        <button onClick={onMoveUp}   disabled={isFirst} className="text-gray-300 hover:text-gray-600 disabled:opacity-20 text-xs leading-none px-0.5">▲</button>
        <button onClick={onMoveDown} disabled={isLast}  className="text-gray-300 hover:text-gray-600 disabled:opacity-20 text-xs leading-none px-0.5">▼</button>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 text-sm truncate">{item.label}</p>
        <p className="text-xs text-gray-400 truncate font-mono">{item.link}</p>
      </div>

      {/* Submenu badges */}
      <div className="flex flex-col gap-1 items-end">
        {item.submenu?.length > 0 && (
          <Badge color="amber">{item.submenu.length} sub</Badge>
        )}
        {totalNested > 0 && (
          <Badge color="violet">{totalNested} nested</Badge>
        )}
      </div>

      <Toggle value={item.enabled} onChange={onToggle} />

      {/* Manage submenu */}
      <button onClick={onManageSubmenu} className="p-1.5 rounded-lg text-violet-500 hover:bg-violet-50 transition-colors" title="Manage submenu & nested items">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h7" />
        </svg>
      </button>
      {/* Edit */}
      <button onClick={onEdit} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors" title="Edit label/link">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
      {/* Delete */}
      <button onClick={onDelete} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors" title="Delete">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}

// ─── Nav section panel ────────────────────────────────────────────────────────

function NavSection({ title, description, color, items, setItems }) {
  const [editingIdx, setEditingIdx] = useState(null);
  const [submenuIdx, setSubmenuIdx] = useState(null);
  const [showAdd,    setShowAdd]    = useState(false);
  const [search,     setSearch]     = useState("");

  const move = (idx, dir) => {
    const arr = [...items];
    const to  = idx + dir;
    if (to < 0 || to >= arr.length) return;
    [arr[idx], arr[to]] = [arr[to], arr[idx]];
    setItems(arr);
  };

  const filtered = items.filter(
    (it) =>
      it.label.toLowerCase().includes(search.toLowerCase()) ||
      it.link.toLowerCase().includes(search.toLowerCase()),
  );

  const enabledCount  = items.filter((i) => i.enabled).length;
  const totalNested   = items.reduce((a, i) =>
    a + (i.submenu || []).reduce((b, s) => b + (s.children?.length || 0), 0), 0);

  return (
    <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className={`px-6 py-5 border-b border-gray-100 ${color}`}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">{title}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 justify-end">
            <Badge color="green">{enabledCount} active</Badge>
            <Badge color="gray">{items.length} total</Badge>
            {totalNested > 0 && <Badge color="violet">{totalNested} nested</Badge>}
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <input
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add item
          </button>
        </div>
      </div>

      {/* List */}
      <div className="p-4 space-y-2 max-h-[520px] overflow-y-auto">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            {search ? "No items match your search" : "No items yet — add one!"}
          </div>
        )}
        {filtered.map((item) => {
          const realIdx = items.indexOf(item);
          return (
            <NavItemRow
              key={item.id}
              item={item}
              isFirst={realIdx === 0}
              isLast={realIdx === items.length - 1}
              onMoveUp={()    => move(realIdx, -1)}
              onMoveDown={()   => move(realIdx, +1)}
              onToggle={(val) => {
                const arr = [...items];
                arr[realIdx] = { ...arr[realIdx], enabled: val };
                setItems(arr);
              }}
              onEdit={()       => setEditingIdx(realIdx)}
              onDelete={()     => setItems(items.filter((_, i) => i !== realIdx))}
              onManageSubmenu={() => setSubmenuIdx(realIdx)}
            />
          );
        })}
      </div>

      {/* Modals */}
      {editingIdx !== null && (
        <ItemEditModal
          title="Edit Nav Item"
          item={items[editingIdx]}
          onClose={() => setEditingIdx(null)}
          onSave={({ label, link }) => {
            const arr = [...items];
            arr[editingIdx] = { ...arr[editingIdx], label, link };
            setItems(arr);
            setEditingIdx(null);
          }}
        />
      )}

      {showAdd && (
        <ItemEditModal
          title="Add Nav Item"
          item={null}
          onClose={() => setShowAdd(false)}
          onSave={({ label, link }) => {
            setItems([...items, { id: newId(), label, link, enabled: true, submenu: [] }]);
            setShowAdd(false);
          }}
        />
      )}

      {submenuIdx !== null && (
        <SubmenuModal
          item={items[submenuIdx]}
          onSave={(submenu) => {
            const arr = [...items];
            arr[submenuIdx] = { ...arr[submenuIdx], submenu };
            setItems(arr);
            setSubmenuIdx(null);
          }}
          onClose={() => setSubmenuIdx(null)}
        />
      )}
    </div>
  );
}

// ─── Live preview ─────────────────────────────────────────────────────────────

function LivePreview({ topNav, bottomNav }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <div className="w-3 h-3 rounded-full bg-emerald-400" />
        </div>
        <span className="text-sm font-semibold text-gray-600">Live preview</span>
        <span className="ml-auto text-xs text-gray-400">Read-only · reflects enabled items</span>
      </div>

      {/* Top nav */}
      <div className="border-b border-gray-100 bg-gray-50 px-4 py-2">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {topNav.filter((i) => i.enabled).map((item) => {
            const words = item.label.split(" ");
            const mid   = Math.ceil(words.length / 2);
            return (
              <div key={item.id} className="flex flex-col items-center px-2 py-1 text-xs font-medium text-gray-600 rounded hover:bg-blue-50 cursor-pointer whitespace-nowrap border border-transparent hover:border-blue-200 transition-colors text-center leading-tight min-w-[80px]">
                {words.length > 1 ? <><span>{words.slice(0, mid).join(" ")}</span><span>{words.slice(mid).join(" ")}</span></> : item.label}
                {item.submenu?.length > 0 && <span className="text-gray-300 text-xs">▾</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Search bar */}
      <div className="flex justify-center py-3 bg-white px-4">
        <div className="flex items-center gap-2 border border-gray-200 rounded-full px-4 py-2 w-full max-w-md">
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="11" cy="11" r="8" strokeWidth={2} />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35" />
          </svg>
          <span className="text-xs text-gray-400">Search for Brand Medicine, Injections...</span>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="border-t border-gray-100 bg-gray-50 px-4 py-2">
        <div className="flex flex-wrap gap-1 justify-center">
          {bottomNav.filter((i) => i.enabled).map((item) => (
            <div key={item.id} className="flex items-center gap-0.5 px-2.5 py-1 text-xs text-gray-600 hover:text-blue-600 cursor-pointer rounded-full hover:bg-blue-50 transition-colors whitespace-nowrap">
              {item.label}
              {item.submenu?.length > 0 && <span className="text-gray-400 text-xs">▾</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminNavManager() {
  const { topNav, setTopNav, bottomNav, setBottomNav } = useNav();

  const [saved,     setSaved]     = useState(false);
  const [activeTab, setActiveTab] = useState("manage");

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-6 font-sans">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </div>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Navigation Manager</h1>
          </div>
          <p className="text-sm text-gray-500 ml-10">
            3-level deep menus: <strong>Nav item</strong> → <strong>Submenu</strong> → <strong>Nested sub-items</strong>. Changes are live instantly.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            {[["manage", "Manage"], ["preview", "Preview"]].map(([val, lbl]) => (
              <button
                key={val}
                onClick={() => setActiveTab(val)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === val ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
              >
                {lbl}
              </button>
            ))}
          </div>
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 font-semibold px-5 py-2 rounded-xl text-sm transition-all ${saved ? "bg-emerald-500 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
          >
            {saved ? (
              <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>Saved!</>
            ) : (
              <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>Save changes</>
            )}
          </button>
        </div>
      </div>

      {activeTab === "preview" ? (
        <div className="max-w-4xl mx-auto">
          <LivePreview topNav={topNav} bottomNav={bottomNav} />
          <p className="text-center text-xs text-gray-400 mt-3">Simplified preview — actual appearance depends on your site's theme.</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Top nav items",       value: topNav.length,    active: topNav.filter((i) => i.enabled).length },
              { label: "Bottom nav items",    value: bottomNav.length, active: bottomNav.filter((i) => i.enabled).length },
              { label: "With submenu",        value: [...topNav, ...bottomNav].filter((i) => i.submenu?.length > 0).length },
              { label: "Total submenu links", value: [...topNav, ...bottomNav].reduce((a, i) => a + (i.submenu?.length || 0), 0) },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm">
                <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                <p className="text-2xl font-extrabold text-gray-900">{stat.value}</p>
                {stat.active !== undefined && <p className="text-xs text-gray-400 mt-0.5">{stat.active} active</p>}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-5 bg-white/70 rounded-xl px-4 py-3 border border-gray-100">
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded bg-violet-500 opacity-70" />= Manage submenu + nested</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded bg-blue-500 opacity-70"  />= Edit label/link</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded bg-red-400 opacity-70"   />= Delete</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-4 rounded-full bg-emerald-400 opacity-80" />= Toggle visibility</span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
              = Expand to add nested sub-items
            </span>
          </div>

          {/* Panels */}
          <div className="flex gap-5 flex-col xl:flex-row">
            <NavSection
              title="Top Navigation Bar"
              description="Above search bar — 3 levels: Nav → Submenu → Nested"
              color="bg-blue-50/50"
              items={topNav}
              setItems={setTopNav}
            />
            <NavSection
              title="Bottom Navigation Bar"
              description="Below search bar — 3 levels: Nav → Submenu → Nested"
              color="bg-violet-50/50"
              items={bottomNav}
              setItems={setBottomNav}
            />
          </div>
        </>
      )}
    </div>
  );
}