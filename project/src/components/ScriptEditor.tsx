// ScriptEditor.tsx
// @ts-nocheck
import React, { useRef, useState, useCallback } from "react";
import { Search, X, BookOpen, Hash, Clock, FileText, Users } from "lucide-react";

/** ====== CONFIG (unchanged) ====== */
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

/** ====== SEARCH HIGHLIGHT UTILITY ====== */
const highlightText = (text, searchTerm) => {
  if (!searchTerm || !text) return text;
  
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, index) => 
    regex.test(part) ? (
      <mark key={index} className="bg-yellow-300 text-black rounded px-0.5">
        {part}
      </mark>
    ) : part
  );
};

/** ====== SCENE SIDEBAR COMPONENT ====== */
const SceneSidebar = ({ blocks, onSceneClick, isOpen, onToggle, activeId }) => {
  const scenes = blocks.filter(b => b.type === "SceneHeading");
  
  return (
    <>
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-gray-50 shadow-lg z-[60] transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } w-72 border-r border-gray-300`}>
        <div className="p-4 border-b border-gray-300 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-gray-700 flex items-center gap-2 text-sm">
              <BookOpen size={18} />
              SCENES
            </h2>
            <button 
              onClick={onToggle}
              className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X size={14} className="text-gray-500" />
            </button>
          </div>
        </div>
        
        <div className="overflow-y-auto h-full pb-20 bg-gray-50">
          {scenes.length === 0 ? (
            <div className="p-4 text-gray-400 text-xs">
              No scenes found. Add a scene heading to see it here.
            </div>
          ) : (
            <div className="py-1">
              {scenes.map((scene, index) => {
                const sceneNumber = index + 1;
                const location = scene.location || "Untitled Scene";
                const time = scene.time || "";
                const isActive = activeId === scene.id;
                
                return (
                  <button
                    key={scene.id}
                    onClick={() => onSceneClick(scene.id)}
                    className={`w-full text-left px-4 py-2.5 hover:bg-white border-l-3 transition-all duration-200 ${
                      isActive 
                        ? 'border-l-green-500 bg-white shadow-sm' 
                        : 'border-l-transparent hover:border-l-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-xs font-medium ${
                        isActive 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {sceneNumber}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium text-xs truncate ${
                          isActive ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {location.toUpperCase()}
                        </div>
                        {time && (
                          <div className="text-xs text-gray-500 mt-0.5 truncate">
                            {time.toUpperCase()}
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          EXT./INT.
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-20 z-50"
          onClick={onToggle}
        />
      )}
    </>
  );
};

/** ====== SEARCH COMPONENT ====== */
const SearchBar = ({ searchTerm, setSearchTerm, isOpen, onToggle }) => {
  return (
    <div className={`transition-all duration-300 ${isOpen ? 'w-64' : 'w-10'} relative`}>
      {isOpen ? (
        <div className="flex items-center gap-2 bg-white rounded-lg border shadow-sm px-3 py-1.5">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search script..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 outline-none text-sm"
            autoFocus
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="p-0.5 hover:bg-gray-100 rounded"
            >
              <X size={14} />
            </button>
          )}
        </div>
      ) : (
        <button 
          onClick={onToggle}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Search"
        >
          <Search size={16} />
        </button>
      )}
    </div>
  );
};

/** ====== STATS COMPONENT ====== */
const ScriptStats = ({ blocks }) => {
  const stats = React.useMemo(() => {
    const scenes = blocks.filter(b => b.type === "SceneHeading").length;
    const actions = blocks.filter(b => b.type === "Action").length;
    const dialogues = blocks.filter(b => b.type === "CharDialogueInline").length;
    
    const characters = new Set(
      blocks
        .filter(b => b.type === "CharDialogueInline" && b.character)
        .map(b => b.character.toUpperCase().trim())
    ).size;
    
    const wordCount = blocks.reduce((count, block) => {
      let text = "";
      if (block.type === "Action") text = block.text || "";
      else if (block.type === "CharDialogueInline") text = block.dialogue || "";
      return count + (text.trim().split(/\s+/).filter(Boolean).length);
    }, 0);
    
    return { scenes, actions, dialogues, characters, wordCount };
  }, [blocks]);
  
  return (
    <div className="flex items-center gap-4 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
      <div className="flex items-center gap-1" title="Scenes">
        <Hash size={12} />
        {stats.scenes} scenes
      </div>
      <div className="flex items-center gap-1" title="Characters">
        <Users size={12} />
        {stats.characters} chars
      </div>
      <div className="flex items-center gap-1" title="Word count">
        <FileText size={12} />
        {stats.wordCount} words
      </div>
    </div>
  );
};

/** ====== PRINT CSS: print ONLY #script-editor-print with real margins ====== */
function PrintSetup({ widthIn, heightIn, marginsIn, fontFamily, fontSizePt, lineHeight }) {
  React.useEffect(() => {
    const s = document.createElement("style");
    s.id = "script-editor-print-setup";
    s.textContent = `
      /* Hide the print container on screen only */
      @media screen { #script-editor-print { display: none !important; } }

      @media print {
        /* Physical sheet size + screenplay margins (top right bottom left) */
        @page { size: ${widthIn}in ${heightIn}in; margin: ${marginsIn.top}in ${marginsIn.right}in ${marginsIn.bottom}in ${marginsIn.left}in; }
        html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; }

        /* ---- midline gap so nothing touches the fold ---- */
        :root { --mid-gap: 0.15in; } /* tweak if you want a wider/narrower fold gutter */

        /* Visibility trick so nested print container still shows */
        body * { visibility: hidden !important; }
        #script-editor-print, #script-editor-print * { visibility: visible !important; }
        #script-editor-print { position: absolute !important; left: 0 !important; top: 0 !important; width: auto !important; }

        /* Base typography for the flowing print content */
        #script-editor-print {
          font-family: ${fontFamily} !important;
          font-size: ${fontSizePt}pt !important;
          line-height: ${lineHeight} !important;
        }

        /* Tight, consistent spacing */
        .pb { margin: 0 !important; padding: 0 !important; }
        .pb + .pb { margin-top: 0.9em !important; }

        /* Scene heading: three columns */
        .p-scene { font-weight: 700; text-transform: uppercase;
                   display: grid; grid-template-columns: 33% 34% 33%; }
        .p-scene > .l { text-align: left; }
        .p-scene > .c { text-align: center; }
        .p-scene > .r { text-align: right; padding-right: ${TIME_RIGHT_PAD_REM}rem; }

        /* ===== CHANGED: Action stays on left half (never crosses midline) ===== */
        .p-action { width: calc(50% - var(--mid-gap)); white-space: pre-wrap; }

        /* ===== CHANGED: Dialogue starts on right half (after the fold) =====
           grid columns: [left half minus gap] [":" auto] [right half minus gap]
           This keeps the dialogue text strictly to the right of the vertical center. */
        .p-dialogue {
          width: 90%;                 /* keep your original look/centering */
          margin-left: auto; margin-right: auto;
          display: grid;
          grid-template-columns: calc(50% - var(--mid-gap)) max-content calc(50% - var(--mid-gap));
          gap: .5rem; align-items: start;
        }
        .p-dialogue .char, .p-dialogue .sep { font-weight: 700; }
        .p-dialogue .char { text-align: right; }
        .p-dialogue .txt { white-space: pre-wrap; }

        /* Transition */
        .p-trans { text-align: center; font-weight: 700; margin: 1em 0 1.2em 0 !important; }

        /* Allow long content to flow onto next pages (no clipping) */
        .p-allow-break { break-inside: auto; page-break-inside: auto; }
      }
    `;
    document.head.appendChild(s);
    return () => s.remove();
  }, [widthIn, heightIn, marginsIn, fontFamily, fontSizePt, lineHeight]);
  return null;
}

/** ====== SCREEN (editable) — unchanged behavior ====== */
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
        <button onClick={onMoveUp}   className="px-2 py-0.5 rounded bg-gray-100 border hover:bg-gray-200">↑</button>
        <button onClick={onMoveDown} className="px-2 py-0.5 rounded bg-gray-100 border hover:bg-gray-200">↓</button>
        <button onClick={onDelete}   className="px-2 py-0.5 rounded bg-red-50 text-red-600 border hover:bg-red-100">Delete</button>
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
            <div className="whitespace-pre-wrap text-left mb-4">
              {highlightText(b.text || "", searchTerm)}
            </div>
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
              <div className="whitespace-pre-wrap text-left">
                {highlightText(b.dialogue || "", searchTerm)}
              </div>
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

/** Screen "page" shell (visual only) */
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

/** ====== TOOLBAR ====== */
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
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Toggle Scenes"
        >
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
        <button
          onClick={onExportPDF}
          className="px-3 md:px-4 py-1.5 md:py-2 rounded-2xl bg-white text-black border shadow hover:bg-gray-50 text-xs md:text-sm whitespace-nowrap"
        >
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

  // Export PDF
  const exportPDF = useCallback(() => {
    requestAnimationFrame(() => window.print());
  }, []);

  // Scene navigation
  const handleSceneClick = useCallback((sceneId) => {
    const host = blockRefs.current.get(sceneId);
    if (host) {
      host.scrollIntoView({ block: "center", behavior: "smooth" });
      setActiveId(sceneId);
      setIsSidebarOpen(false);
    }
  }, []);

  // screen-only pagination by count (visual comfort only)
  const BLOCKS_PER_PAGE = 15;
  const screenPages = React.useMemo(() => {
    const pages = [];
    for (let i = 0; i < blocks.length; i += BLOCKS_PER_PAGE) pages.push(blocks.slice(i, i + BLOCKS_PER_PAGE));
    return pages.length ? pages : [[]];
  }, [blocks]);

  // Shortcuts: Alt+S (Scene), Alt+A (Action), Alt+C (Char:Dialogue), Alt+T (Transition)
  React.useEffect(() => {
    const onKey = (e) => {
      // Require Alt/Option only (no Ctrl/Cmd/Shift)
      if (!(e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey)) return;

      const k = e.key.toLowerCase();
      if (k === "s") {
        e.preventDefault();
        addBlock({ ...NEW_SCENE(), sceneNo: "SCENE: " });
      } else if (k === "a") {
        e.preventDefault();
        addBlock({ id: uid(), type: "Action", text: "" });
      } else if (k === "c") {
        e.preventDefault();
        addBlock({ id: uid(), type: "CharDialogueInline", character: "", dialogue: "" });
      } else if (k === "t") {
        e.preventDefault();
        addBlock({ id: uid(), type: "Transition", text: "CUT TO" });
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [addBlock]);

  // Filter blocks based on search
  const filteredBlocks = React.useMemo(() => {
    if (!searchTerm) return blocks;
    
    return blocks.filter(block => {
      const searchLower = searchTerm.toLowerCase();
      
      if (block.type === "SceneHeading") {
        return (block.sceneNo?.toLowerCase().includes(searchLower)) ||
               (block.location?.toLowerCase().includes(searchLower)) ||
               (block.time?.toLowerCase().includes(searchLower));
      } else if (block.type === "Action") {
        return block.text?.toLowerCase().includes(searchLower);
      } else if (block.type === "CharDialogueInline") {
        return (block.character?.toLowerCase().includes(searchLower)) ||
               (block.dialogue?.toLowerCase().includes(searchLower));
      } else if (block.type === "Transition") {
        return block.text?.toLowerCase().includes(searchLower);
      }
      
      return false;
    });
  }, [blocks, searchTerm]);

  const displayBlocks = searchTerm ? filteredBlocks : blocks;

  // Recalculate screen pages based on filtered blocks
  const filteredScreenPages = React.useMemo(() => {
    const pages = [];
    for (let i = 0; i < displayBlocks.length; i += BLOCKS_PER_PAGE) {
      pages.push(displayBlocks.slice(i, i + BLOCKS_PER_PAGE));
    }
    return pages.length ? pages : [[]];
  }, [displayBlocks, BLOCKS_PER_PAGE]);

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

      {/* Scene Sidebar */}
      <SceneSidebar 
        blocks={blocks}
        onSceneClick={handleSceneClick}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        activeId={activeId}
      />

      <div className="max-w-6xl mx-auto p-2 md:p-4 lg:p-6 space-y-4 md:space-y-6">
        {/* Sticky toolbar */}
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
          
          {/* Stats Bar */}
          <div className="max-w-6xl mx-auto px-2 md:px-4 lg:px-6 pb-3">
            <ScriptStats blocks={blocks} />
          </div>
        </div>

        {/* ===== SCREEN (editable) ===== */}
        <main id="script-editor-screen" className="pt-28 md:pt-32">
          {searchTerm && (
            <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-sm text-yellow-800">
                {displayBlocks.length === 0 ? (
                  <>No results found for "<strong>{searchTerm}</strong>"</>
                ) : (
                  <>Found {displayBlocks.length} result{displayBlocks.length !== 1 ? 's' : ''} for "<strong>{searchTerm}</strong>"</>
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

        {/* ===== PRINT-ONLY FLOW ===== */}
        <div id="script-editor-print">
          <div>
            {blocks.map((b) => {
              if (b.type === "SceneHeading") {
                return (
                  <div key={b.id} className="pb p-allow-break p-scene">
                    <div className="l">{(b.sceneNo || "").toUpperCase()}</div>
                    <div className="c">{(b.location || "").toUpperCase()}</div>
                    <div className="r">{(b.time || "").toUpperCase()}</div>
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
                    {(b.text || "CUT TO").toUpperCase()}
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