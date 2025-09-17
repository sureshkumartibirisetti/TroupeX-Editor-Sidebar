// ScriptEditor.tsx
// @ts-nocheck
import React, { useRef, useState, useCallback } from "react";
import { Search, X, BookOpen, Hash, Clock, FileText, Users, MoreVertical } from "lucide-react";

/** ====== CONFIG ====== */
const ACTION_WIDTH = "w-[55%]";
const CD_CONTAINER_WIDTH = "w-[90%]";
const TIME_RIGHT_PAD_REM = 4.5;

const DEFAULT_PAGE = {
  widthIn: 8.5,
  heightIn: 11,
  marginsIn: { top: 1, bottom: 1, left: 1.5, right: 1 },
  fontFamily:
    "'Courier New','Courier Prime','Noto Serif Telugu','Noto Serif Devanagari',monospace",
  fontSizePt: 12,
  lineHeight: 1.15,
};

const uid = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const NEW_SCENE = () => ({
  id: uid(),
  type: "SceneHeading",
  sceneNo: "SCENE: ",
  location: "",
  time: "",
});

const START_DOC = [
  NEW_SCENE(),
  { id: uid(), type: "Action", text: "Action" },
  { id: uid(), type: "CharDialogueInline", character: "Character", dialogue: "Dialogue" },
  { id: uid(), type: "Transition", text: "CUT TO" },
];

/** ====== HELPERS ====== */
const normalize = (s = "") => s.toUpperCase().trim();

/** Color band like Yamdu: choose by time keyword */
function sceneStripe(time = "", idx: number) {
  const t = normalize(time);
  if (t.includes("NIGHT") || t.includes("NIGHTTIME")) return "bg-blue-500";      // blue
  if (t.includes("MORNING")) return "bg-green-500";                               // green
  if (t.includes("EVENING")) return "bg-purple-500";                              // purple
  if (t.includes("AFTERNOON")) return "bg-orange-500";                            // orange
  if (t.includes("DAY")) return "bg-yellow-500";                                  // yellow
  // fallback rotate a few pleasant hues
  const palette = ["bg-emerald-500","bg-sky-500","bg-rose-500","bg-amber-500","bg-indigo-500"];
  return palette[idx % palette.length];
}

/** ====== SEARCH HIGHLIGHT ====== */
const highlightText = (text, searchTerm) => {
  if (!searchTerm || !text) return text;
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")})`, "gi");
  const parts = String(text).split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-yellow-300 text-black rounded px-0.5">{part}</mark>
    ) : (
      part
    )
  );
};

/** ====== YAMDU-LIKE SCENE SIDEBAR ====== */
const SceneSidebar = ({
  blocks,
  onSceneClick,
  isOpen,
  onToggle,
  activeId,
  searchTerm,
  onSearch,
}) => {
  const scenes = blocks
    .map((b, i) => ({ ...b, _idx: i }))
    .filter((b) => b.type === "SceneHeading");

  return (
    <>
      {/* Drawer */}
      <aside
        className={`fixed left-0 top-0 h-full z-[60] w-[280px] md:w-[300px] border-r border-gray-200
        bg-white transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Header */}
        <div className="px-3 py-2 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <BookOpen size={16} /> Scenes
            </h2>
            <button
              onClick={onToggle}
              className="p-1.5 rounded hover:bg-gray-100"
              aria-label="Close"
            >
              <X size={14} className="text-gray-500" />
            </button>
          </div>

          {/* Search in sidebar (same field as top search) */}
          <div className="mt-2 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
            <input
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search in script…"
              className="w-full pl-7 pr-7 py-1.5 text-sm border rounded-lg"
            />
            {searchTerm && (
              <button
                onClick={() => onSearch("")}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100"
                aria-label="Clear"
              >
                <X className="w-3.5 h-3.5 text-gray-500" />
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto h-[calc(100%-88px)] p-2">
          {scenes.length === 0 ? (
            <div className="text-xs text-gray-500 p-3">No scenes yet. Add a scene heading.</div>
          ) : (
            <ul className="space-y-2">
              {scenes.map((scene, i) => {
                const n = i + 1;
                const location = scene.location || "Untitled Scene";
                const time = scene.time || "";
                const active = activeId === scene.id;
                const stripe = sceneStripe(time, i);

                return (
                  <li key={scene.id}>
                    <button
                      onClick={() => onSceneClick(scene.id)}
                      className={`w-full text-left rounded-lg border relative overflow-hidden group
                        ${active ? "bg-gray-50 border-gray-300 shadow-sm" : "bg-white border-gray-200 hover:bg-gray-50"}`}
                    >
                      {/* colored stripe (left) */}
                      <div className={`absolute left-0 top-0 h-full w-1.5 ${stripe}`} />

                      {/* row content */}
                      <div className="pl-3 pr-2 py-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-md grid place-items-center text-[11px] font-semibold
                            ${active ? "bg-black text-white" : "bg-gray-200 text-gray-700"}`}
                          >
                            {n}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="text-[12px] font-medium text-gray-800 truncate">
                              {/* INT/EXT chip + location like Yamdu */}
                              <span className="inline-flex items-center gap-1">
                                <span className="px-1.5 py-0.5 text-[10px] rounded bg-gray-100 text-gray-700">
                                  {(scene.sceneNo || "SC.").toString().replace(/[:\s]+$/,"")}
                                </span>
                                <span className="px-1.5 py-0.5 text-[10px] rounded bg-gray-100 text-gray-700">
                                  {normalize(time || "—")}
                                </span>
                              </span>
                              <span className="ml-2">{normalize(location)}</span>
                            </div>

                            {/* meta line: tiny counters like in Yamdu */}
                            <div className="mt-1 flex items-center gap-3 text-[11px] text-gray-500">
                              <span className="inline-flex items-center gap-1">
                                <Clock size={12} /> {time ? normalize(time) : "—"}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Hash size={12} /> #{n}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Users size={12} /> —
                              </span>
                            </div>
                          </div>

                          <button className="p-1 rounded hover:bg-gray-100">
                            <MoreVertical className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* Click-away overlay on mobile */}
      {isOpen && <div className="fixed inset-0 bg-black/20 z-50" onClick={onToggle} />}
    </>
  );
};

/** ====== SEARCH BAR (top) ====== */
const SearchBar = ({ searchTerm, setSearchTerm, isOpen, onToggle }) => {
  return (
    <div className={`transition-all duration-300 ${isOpen ? "w-64" : "w-10"} relative`}>
      {isOpen ? (
        <div className="flex items-center gap-2 bg-white rounded-lg border shadow-sm px-3 py-1.5">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search script…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 outline-none text-sm"
            autoFocus
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="p-0.5 hover:bg-gray-100 rounded">
              <X size={14} />
            </button>
          )}
        </div>
      ) : (
        <button onClick={onToggle} className="p-2 hover:bg-gray-100 rounded-lg" title="Search">
          <Search size={16} />
        </button>
      )}
    </div>
  );
};

/** ====== STATS ====== */
const ScriptStats = ({ blocks }) => {
  const stats = React.useMemo(() => {
    const scenes = blocks.filter((b) => b.type === "SceneHeading").length;
    const dialogues = blocks.filter((b) => b.type === "CharDialogueInline").length;
    const characters = new Set(
      blocks.filter((b) => b.type === "CharDialogueInline" && b.character)
            .map((b) => normalize(b.character))
    ).size;
    const wordCount = blocks.reduce((count, b) => {
      let t = "";
      if (b.type === "Action") t = b.text || "";
      else if (b.type === "CharDialogueInline") t = b.dialogue || "";
      return count + t.trim().split(/\s+/).filter(Boolean).length;
    }, 0);
    return { scenes, dialogues, characters, wordCount };
  }, [blocks]);

  return (
    <div className="flex items-center gap-4 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
      <div className="flex items-center gap-1" title="Scenes">
        <Hash size={12} /> {stats.scenes} scenes
      </div>
      <div className="flex items-center gap-1" title="Characters">
        <Users size={12} /> {stats.characters} chars
      </div>
      <div className="flex items-center gap-1" title="Dialogues">
        <FileText size={12} /> {stats.dialogues} dialogues
      </div>
    </div>
  );
};

/** ====== PRINT CSS ====== */
function PrintSetup({ widthIn, heightIn, marginsIn, fontFamily, fontSizePt, lineHeight }) {
  React.useEffect(() => {
    const s = document.createElement("style");
    s.id = "script-editor-print-setup";
    s.textContent = `
@media screen { #script-editor-print { display:none!important } }
@media print {
  @page { size:${widthIn}in ${heightIn}in; margin:${marginsIn.top}in ${marginsIn.right}in ${marginsIn.bottom}in ${marginsIn.left}in; }
  html,body{margin:0!important;padding:0!important;background:#fff!important}
  *{-webkit-print-color-adjust:exact;print-color-adjust:exact;box-sizing:border-box}
  :root{--mid-gap:.15in}
  body *{visibility:hidden!important}
  #script-editor-print, #script-editor-print *{visibility:visible!important}
  #script-editor-print{position:absolute!important;left:0;top:0}
  #script-editor-print{font-family:${fontFamily}!important;font-size:${fontSizePt}pt!important;line-height:${lineHeight}!important}
  .pb{margin:0!important;padding:0!important}
  .pb + .pb{margin-top:.9em!important}
  .p-scene{font-weight:700;text-transform:uppercase;display:grid;grid-template-columns:33% 34% 33%}
  .p-scene>.l{text-align:left}
  .p-scene>.c{text-align:center}
  .p-scene>.r{text-align:right;padding-right:${TIME_RIGHT_PAD_REM}rem}
  .p-action{width:calc(50% - var(--mid-gap));white-space:pre-wrap}
  .p-dialogue{width:90%;margin-left:auto;margin-right:auto;display:grid;grid-template-columns:calc(50% - var(--mid-gap)) max-content calc(50% - var(--mid-gap));gap:.5rem;align-items:start}
  .p-dialogue .char,.p-dialogue .sep{font-weight:700}
  .p-dialogue .char{text-align:right}
  .p-dialogue .txt{white-space:pre-wrap}
  .p-trans{text-align:center;font-weight:700;margin:1em 0 1.2em 0!important}
  .p-allow-break{break-inside:auto;page-break-inside:auto}
}`;
    document.head.appendChild(s);
    return () => s.remove();
  }, [widthIn, heightIn, marginsIn, fontFamily, fontSizePt, lineHeight]);
  return null;
}

/** ====== BLOCK (screen editing) ====== */
const Block = ({ b, onChange, onDelete, onMoveUp, onMoveDown, onFocused, searchTerm }) => {
  const textareaRefs = useRef(new Map());
  const autoGrow = useCallback((el) => {
    if (!el) return;
    const y = window.pageYOffset;
    el.style.height = "auto";
    const h = Math.max(el.scrollHeight, 24) + "px";
    if (el.style.height !== h) el.style.height = h;
    if (Math.abs(window.pageYOffset - y) > 1) window.scrollTo(0, y);
  }, []);
  const hookRef = useCallback(
    (el, key) => {
      if (el) {
        textareaRefs.current.set(key, el);
        requestAnimationFrame(() => autoGrow(el));
      } else {
        textareaRefs.current.delete(key);
      }
    },
    [autoGrow]
  );

  return (
    <div className="group my-2">
      <div className="hidden group-hover:flex gap-2 mb-1 text-[10px] text-gray-600 print:hidden">
        <button onClick={onMoveUp} className="px-2 py-0.5 rounded bg-gray-100 border hover:bg-gray-200">↑</button>
        <button onClick={onMoveDown} className="px-2 py-0.5 rounded bg-gray-100 border hover:bg-gray-200">↓</button>
        <button onClick={onDelete} className="px-2 py-0.5 rounded bg-red-50 text-red-600 border hover:bg-red-100">Delete</button>
      </div>

      {b.type === "SceneHeading" && (
        <div className="font-bold uppercase">
          <div className="w-full flex">
            <input
              className="flex-1 max-w-[33%] bg-transparent outline-none border-none"
              placeholder="SCENE: 1"
              value={b.sceneNo || ""}
              onFocus={() => onFocused(b.id)}
              onChange={(e) => onChange({ ...b, sceneNo: e.target.value })}
            />
            <input
              className="flex-1 text-center bg-transparent outline-none border-none uppercase"
              placeholder="LOCATION"
              value={b.location || ""}
              onFocus={() => onFocused(b.id)}
              onChange={(e) => onChange({ ...b, location: e.target.value })}
            />
            <input
              className="flex-1 text-right bg-transparent outline-none border-none uppercase"
              style={{ paddingRight: `${TIME_RIGHT_PAD_REM}rem` }}
              placeholder="INT/EXT/DAY"
              value={b.time || ""}
              onFocus={() => onFocused(b.id)}
              onChange={(e) => onChange({ ...b, time: e.target.value })}
            />
          </div>
        </div>
      )}

      {b.type === "Action" && (
        <div className={`${ACTION_WIDTH}`}>
          {searchTerm ? (
            <div className="whitespace-pre-wrap text-left mb-4">{highlightText(b.text || "", searchTerm)}</div>
          ) : (
            <textarea
              ref={(el) => hookRef(el, `action-${b.id}`)}
              className="w-full bg-transparent outline-none border-none resize-none overflow-hidden"
              placeholder="Action…"
              value={b.text || ""}
              onFocus={() => onFocused(b.id)}
              onChange={(e) => { onChange({ ...b, text: e.target.value }); autoGrow(e.target); }}
              onInput={(e) => autoGrow(e.target)}
              style={{ textAlign: "left", whiteSpace: "pre-wrap", minHeight: "24px", marginBottom: "1em" }}
            />
          )}
        </div>
      )}

      {b.type === "CharDialogueInline" && (
        <div className={`${CD_CONTAINER_WIDTH} mx-auto`}>
          <div className="grid items-start gap-2" style={{ gridTemplateColumns: "40% max-content 55%" }}>
            <input
              className="w-full text-right font-bold bg-transparent outline-none border-none"
              placeholder="Character"
              value={b.character || ""}
              onFocus={() => onFocused(b.id)}
              onChange={(e) => onChange({ ...b, character: e.target.value })}
            />
            <div className="font-bold">:</div>
            {searchTerm ? (
              <div className="whitespace-pre-wrap text-left">{highlightText(b.dialogue || "", searchTerm)}</div>
            ) : (
              <textarea
                ref={(el) => hookRef(el, `dialogue-${b.id}`)}
                className="w-full block bg-transparent outline-none border-none resize-none text-left overflow-hidden"
                placeholder="Dialogue…"
                value={b.dialogue || ""}
                onFocus={() => onFocused(b.id)}
                onChange={(e) => { onChange({ ...b, dialogue: e.target.value }); autoGrow(e.target); }}
                onInput={(e) => autoGrow(e.target)}
                style={{ whiteSpace: "pre-wrap", minHeight: "24px" }}
              />
            )}
          </div>
        </div>
      )}

      {b.type === "Transition" && (
        <input
          className="w-full text-center font-bold uppercase bg-transparent outline-none border-none"
          placeholder="CUT TO"
          value={b.text || ""}
          onFocus={() => onFocused(b.id)}
          onChange={(e) => onChange({ ...b, text: e.target.value })}
          style={{ margin: "1em 0 1.2em 0" }}
        />
      )}
    </div>
  );
};

/** SCREEN PAGE (visual aid) */
function ScreenPage({ page, children, isLast = false }) {
  const style = {
    width: `${page.widthIn}in`,
    maxWidth: "100%",
    minHeight: `${page.heightIn - page.marginsIn.top - page.marginsIn.bottom}in`,
    height: "auto",
    paddingTop: `${page.marginsIn.top}in`,
    paddingBottom: `${page.marginsIn.bottom}in`,
    paddingLeft: `${page.marginsIn.left}in`,
    paddingRight: `${page.marginsIn.right}in`,
    fontFamily: page.fontFamily,
    fontSize: `${page.fontSizePt}pt`,
    lineHeight: page.lineHeight,
  };
  return (
    <div className={`bg-white shadow-xl rounded-2xl relative mx-auto ${isLast ? "" : "mb-8"}`} style={style}>
      {children}
    </div>
  );
}

/** QUICK ADD BAR */
const BlockControls = ({ onAdd }) => (
  <div className="flex flex-wrap gap-2 text-sm md:text-base">
    {[
      ["Scene", () => onAdd({ ...NEW_SCENE(), sceneNo: "SCENE: " })],
      ["Action", () => onAdd({ id: uid(), type: "Action", text: "" })],
      ["Character:Dialogue", () => onAdd({ id: uid(), type: "CharDialogueInline", character: "", dialogue: "" })],
      ["Transition", () => onAdd({ id: uid(), type: "Transition", text: "CUT TO" })],
    ].map(([label, fn]) => (
      <button key={label} onClick={fn} className="px-2 md:px-3 py-1 rounded-xl bg-black text-white text-xs md:text-sm shadow hover:bg-gray-800 whitespace-nowrap">
        + {label}
      </button>
    ))}
  </div>
);

const Toolbar = ({ onAdd, onExportPDF, searchTerm, setSearchTerm, onToggleSidebar }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  return (
    <div className="flex items-center justify-between gap-2 md:gap-3 flex-wrap">
      <div className="flex items-center gap-3">
        <button onClick={onToggleSidebar} className="p-2 hover:bg-gray-100 rounded-lg" title="Toggle Scenes">
          <BookOpen size={16} />
        </button>
        <BlockControls onAdd={onAdd} />
      </div>
      <div className="flex items-center gap-3">
        <SearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          isOpen={isSearchOpen}
          onToggle={() => setIsSearchOpen(!isSearchOpen)}
        />
        <button onClick={onExportPDF} className="px-3 md:px-4 py-1.5 md:py-2 rounded-2xl bg-white text-black border shadow hover:bg-gray-50 text-xs md:text-sm">
          Export PDF
        </button>
      </div>
    </div>
  );
};

/** ====== MAIN ====== */
export default function ScriptEditor() {
  const [page] = useState(DEFAULT_PAGE);
  const [blocks, setBlocks] = useState(START_DOC);
  const [activeId, setActiveId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const blockRefs = useRef(new Map());

  const rememberRef = useCallback((id) => (el) => {
    if (el) blockRefs.current.set(id, el);
    else blockRefs.current.delete(id);
  }, []);

  // autosave
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("script_editor_draft");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setBlocks(parsed);
      }
    } catch {}
  }, []);
  React.useEffect(() => {
    const t = setTimeout(() => {
      try { localStorage.setItem("script_editor_draft", JSON.stringify(blocks)); } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [blocks]);

  // CRUD
  const onFocused = useCallback((id) => setActiveId(id), []);
  const addBlock = useCallback((b) => {
    if (!b.id) b.id = uid();
    setBlocks((arr) => [...arr, b]);
    setActiveId(b.id);
    setTimeout(() => {
      const host = blockRefs.current.get(b.id);
      if (host) {
        const focusable = host.querySelector("input,textarea");
        focusable?.focus();
        host.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    }, 120);
  }, []);
  const updateBlock = useCallback((id, patch) => {
    setActiveId(id);
    setBlocks((arr) => arr.map((b) => (b.id === id ? patch : b)));
  }, []);
  const deleteBlock = useCallback((id) => {
    setBlocks((arr) => arr.filter((b) => b.id !== id));
    setActiveId(null);
  }, []);
  const move = useCallback((id, dir) => {
    setActiveId(id);
    setBlocks((arr) => {
      const i = arr.findIndex((b) => b.id === id);
      if (i < 0) return arr;
      const j = dir === -1 ? Math.max(0, i - 1) : Math.min(arr.length - 1, i + 1);
      if (i === j) return arr;
      const copy = arr.slice();
      const [it] = copy.splice(i, 1);
      copy.splice(j, 0, it);
      return copy;
    });
  }, []);

  const exportPDF = useCallback(() => requestAnimationFrame(() => window.print()), []);

  // Scene jump
  const handleSceneClick = useCallback((sceneId) => {
    const host = blockRefs.current.get(sceneId);
    if (host) {
      host.scrollIntoView({ block: "center", behavior: "smooth" });
      setActiveId(sceneId);
      setIsSidebarOpen(false);
    }
  }, []);

  // simple pagination (visual only)
  const BLOCKS_PER_PAGE = 15;
  const displayBlocks = React.useMemo(() => {
    if (!searchTerm) return blocks;
    const q = searchTerm.toLowerCase();
    return blocks.filter((b) => {
      if (b.type === "SceneHeading")
        return (b.sceneNo||"").toLowerCase().includes(q) || (b.location||"").toLowerCase().includes(q) || (b.time||"").toLowerCase().includes(q);
      if (b.type === "Action") return (b.text||"").toLowerCase().includes(q);
      if (b.type === "CharDialogueInline")
        return (b.character||"").toLowerCase().includes(q) || (b.dialogue||"").toLowerCase().includes(q);
      if (b.type === "Transition") return (b.text||"").toLowerCase().includes(q);
      return false;
    });
  }, [blocks, searchTerm]);

  const filteredScreenPages = React.useMemo(() => {
    const pages = [];
    for (let i = 0; i < displayBlocks.length; i += BLOCKS_PER_PAGE)
      pages.push(displayBlocks.slice(i, i + BLOCKS_PER_PAGE));
    return pages.length ? pages : [[]];
  }, [displayBlocks]);

  return (
    <div className="min-h-screen bg-neutral-100 text-black">
      <PrintSetup
        widthIn={DEFAULT_PAGE.widthIn}
        heightIn={DEFAULT_PAGE.heightIn}
        marginsIn={DEFAULT_PAGE.marginsIn}
        fontFamily={DEFAULT_PAGE.fontFamily}
        fontSizePt={DEFAULT_PAGE.fontSizePt}
        lineHeight={DEFAULT_PAGE.lineHeight}
      />

      {/* Yamdu-like sidebar */}
      <SceneSidebar
        blocks={blocks}
        onSceneClick={handleSceneClick}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        activeId={activeId}
        searchTerm={searchTerm}
        onSearch={setSearchTerm}
      />

      {/* Top bar */}
      <div className="max-w-6xl mx-auto p-2 md:p-4 lg:p-6 space-y-4 md:space-y-6">
        <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-2 md:px-4 lg:px-6 py-2 md:py-3">
            <Toolbar
              onAdd={addBlock}
              onExportPDF={exportPDF}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />
          </div>
          <div className="max-w-6xl mx-auto px-2 md:px-4 lg:px-6 pb-3">
            <ScriptStats blocks={blocks} />
          </div>
        </div>

        {/* Editor pages */}
        <main id="script-editor-screen" className="pt-28 md:pt-32">
          {searchTerm && (
            <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-sm text-yellow-800">
                {displayBlocks.length === 0 ? (
                  <>No results found for "<strong>{searchTerm}</strong>"</>
                ) : (
                  <>Found {displayBlocks.length} result{displayBlocks.length !== 1 ? "s" : ""} for "<strong>{searchTerm}</strong>"</>
                )}
              </div>
            </div>
          )}

          {filteredScreenPages.map((arr, i) => (
            <ScreenPage key={i} page={DEFAULT_PAGE} isLast={i === filteredScreenPages.length - 1}>
              {arr.map((b) => (
                <div key={b.id} ref={rememberRef(b.id)}>
                  <Block
                    b={b}
                    onFocused={onFocused}
                    onChange={(patch) => updateBlock(b.id, patch)}
                    onDelete={() => deleteBlock(b.id)}
                    onMoveUp={() => move(b.id, -1)}
                    onMoveDown={() => move(b.id, +1)}
                    searchTerm={searchTerm}
                  />
                </div>
              ))}
            </ScreenPage>
          ))}
        </main>

        {/* PRINT FLOW */}
        <div id="script-editor-print">
          <div>
            {blocks.map((b) => {
              if (b.type === "SceneHeading") {
                return (
                  <div key={b.id} className="pb p-allow-break p-scene">
                    <div className="l">{normalize(b.sceneNo || "")}</div>
                    <div className="c">{normalize(b.location || "")}</div>
                    <div className="r">{normalize(b.time || "")}</div>
                  </div>
                );
              }
              if (b.type === "Action") {
                return (
                  <div key={b.id} className="pb p-allow-break p-action">
                    {(b.text || "").trim()}
                  </div>
                );
              }
              if (b.type === "CharDialogueInline") {
                return (
                  <div key={b.id} className="pb p-allow-break p-dialogue">
                    <div className="char">{(b.character || "").trim()}</div>
                    <div className="sep">:</div>
                    <div className="txt">{(b.dialogue || "").trim()}</div>
                  </div>
                );
              }
              if (b.type === "Transition") {
                return (
                  <div key={b.id} className="pb p-allow-break p-trans">
                    {normalize(b.text || "CUT TO")}
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
