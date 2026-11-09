import React, { useState } from "react";
import {
  Play,
  Activity,
  FileCode,
  ShieldAlert,
  ShieldCheck,
  Layers,
  Download,
  Upload,
  Plus,
  RotateCcw,
  Cpu,
  GitBranch,
  Zap,
  Flame,
} from "lucide-react";
import { Workflow } from "../types";
import { WORKFLOW_TEMPLATES } from "../data/templates";

interface NavbarProps {
  currentWorkflow: Workflow;
  isRunning: boolean;
  onRunWorkflow: () => void;
  onSelectTemplate: (template: Workflow) => void;
  onOpenPromptModal: () => void;
  onOpenCodeDrawer: () => void;
  onOpenPalette: () => void;
  onNewWorkflow: () => void;
  onExportJson: () => void;
  onImportJson: (json: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentWorkflow,
  isRunning,
  onRunWorkflow,
  onSelectTemplate,
  onOpenPromptModal,
  onOpenCodeDrawer,
  onOpenPalette,
  onNewWorkflow,
  onExportJson,
  onImportJson,
}) => {
  const [showTemplatesMenu, setShowTemplatesMenu] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) onImportJson(content);
    };
    reader.readAsText(file);
  };

  return (
    <header className="h-15 border-b border-[#D4AF37]/30 bg-gradient-to-r from-[#08100B] via-[#0E1B12] to-[#08100B] backdrop-blur-md px-4 flex items-center justify-between z-30 select-none shadow-lg shadow-black/50">
      {/* Gallic Brand & Village Emblem */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          {/* Gallic Shield & Golden Sickle / Menhir Emblem */}
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#D4AF37] via-[#B8860B] to-[#7A5805] p-0.5 shadow-lg shadow-[#D4AF37]/25">
            <div className="w-full h-full rounded-[10px] bg-[#0B160F] flex items-center justify-center">
              <svg viewBox="0 0 32 32" className="w-6 h-6">
                {/* Menhir Stone Pillar */}
                <path
                  d="M16 3 L21 10 L20 27 L12 27 L11 10 Z"
                  fill="#38BDF8"
                  fillOpacity="0.25"
                  stroke="#38BDF8"
                  strokeWidth="1.4"
                />
                {/* Druid Golden Sickle (Zlatý srp Panoramikse) */}
                <path
                  d="M22 7 C14 6, 9 13, 13 21 C15 24, 19 25, 23 23"
                  fill="none"
                  stroke="#D4AF37"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
                {/* Asterisk Winged Star */}
                <circle cx="16" cy="14" r="2.3" fill="#FDE047" />
              </svg>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-gaul font-extrabold text-base text-[#F4EFE0] tracking-wider">
                G(E)A(L)L
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] font-mono border border-[#D4AF37]/40 shadow-xs">
                ☘️ Galská Tvrz · QNX 8.0
              </span>
            </div>
            <p className="text-[10px] text-[#9CAEA2] hidden sm:block">
              Panoramiks (Ada) · Asterisk (SPARK) · Obelisk (GNATprove)
            </p>
          </div>
        </div>

        <div className="h-5 w-px bg-[#213426] hidden md:block" />

        {/* Template Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowTemplatesMenu(!showTemplatesMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0F1E14] hover:bg-[#162B1D] border border-[#D4AF37]/30 text-xs font-medium text-[#F4EFE0] transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="truncate max-w-[200px] md:max-w-[260px]">{currentWorkflow.name}</span>
          </button>

          {showTemplatesMenu && (
            <div className="absolute left-0 mt-1.5 w-84 bg-[#0D1911] border border-[#D4AF37]/40 rounded-xl shadow-2xl p-2 z-50 space-y-1">
              <div className="px-2 py-1 text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider font-gaul">
                📜 Svitky & Galské Šablony Workflow
              </div>
              {WORKFLOW_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => {
                    onSelectTemplate(tmpl);
                    setShowTemplatesMenu(false);
                  }}
                  className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex flex-col gap-0.5 ${
                    currentWorkflow.id === tmpl.id
                      ? "bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/40"
                      : "text-[#E2DEC9] hover:bg-[#162B1D]"
                  }`}
                >
                  <span className="font-semibold">{tmpl.name}</span>
                  <span className="text-[10px] text-[#9CAEA2] line-clamp-1">{tmpl.description}</span>
                </button>
              ))}
              <div className="pt-1.5 border-t border-[#213426] flex flex-col gap-1 px-2">
                <button
                  onClick={() => {
                    onSelectTemplate(WORKFLOW_TEMPLATES[0]);
                    setShowTemplatesMenu(false);
                  }}
                  className="text-[11px] text-[#38BDF8] hover:text-[#7DD3FC] font-medium flex items-center gap-1.5 py-1"
                >
                  <RotateCcw className="w-3 h-3" /> Obnovit výchozí Galskou QNX 8.0 bránu
                </button>
                <button
                  onClick={() => {
                    onNewWorkflow();
                    setShowTemplatesMenu(false);
                  }}
                  className="text-[11px] text-[#D4AF37] hover:text-[#FDE047] font-medium flex items-center gap-1.5 py-1"
                >
                  <Plus className="w-3 h-3" /> Vytvořit nový svitek workflow
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gallic Pillar Status Badges */}
      <div className="hidden lg:flex items-center gap-2">
        <div
          title="Panoramiks — Druidův kotlík (Ada 2022)"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#22C55E]/10 text-[#4ADE80] border border-[#22C55E]/30 text-xs font-mono font-medium"
        >
          <Flame className="w-3.5 h-3.5 text-[#4ADE80]" />
          <span>Panoramiks: {currentWorkflow.nodes.length} Uzlů</span>
        </div>
        <div
          title="Asterisk — Rychlý bojovník (SPARK 2022 Kontrakty)"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#D4AF37]/15 text-[#FACC15] border border-[#D4AF37]/40 text-xs font-mono font-medium"
        >
          <Zap className="w-3.5 h-3.5 text-[#FACC15]" />
          <span>Asterisk: 10/10 Pravidel</span>
        </div>
        <div
          title="Obelisk — Kamenný menhir (GNATprove 16.1.0 + CVC5)"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30 text-xs font-mono font-medium"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span>Obelisk: 26/26 VC Důkazů</span>
        </div>
      </div>

      {/* Center Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenPalette}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F1E14] hover:bg-[#162B1D] border border-[#2A4230] text-xs font-medium text-[#E2DEC9] hover:text-white transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span className="hidden sm:inline">Přidat Uzel</span>
        </button>

        <button
          onClick={onOpenPromptModal}
          title="Zobrazit Druidský Kodex Panoramikse & Asterisku"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 border border-[#D4AF37]/40 text-xs font-semibold text-[#D4AF37] transition-colors"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span className="hidden md:inline">Druidský Kodex</span>
        </button>

        <button
          onClick={onOpenCodeDrawer}
          title="Zobrazit lektvar Panoramikse (.ads/.adb) a Menhir Obelisku"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F1E14] hover:bg-[#162B1D] border border-[#38BDF8]/35 text-xs font-medium text-[#E2DEC9] hover:text-white transition-colors"
        >
          <FileCode className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span className="hidden md:inline">Panoramiks & Obelisk Menhir</span>
        </button>
      </div>

      {/* Right Run & Export Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onExportJson}
          title="Exportovat svitek workflow do JSON"
          className="p-2 rounded-lg text-[#9CAEA2] hover:text-[#F4EFE0] hover:bg-[#162B1D] transition-colors hidden sm:flex"
        >
          <Download className="w-4 h-4" />
        </button>
        <label
          title="Importovat svitek workflow z JSON"
          className="p-2 rounded-lg text-[#9CAEA2] hover:text-[#F4EFE0] hover:bg-[#162B1D] transition-colors cursor-pointer hidden sm:flex"
        >
          <Upload className="w-4 h-4" />
          <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
        </label>

        {/* Primary Gallic Run Button */}
        <button
          onClick={onRunWorkflow}
          disabled={isRunning}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-lg ${
            isRunning
              ? "bg-[#162B1D] text-[#D4AF37] cursor-not-allowed border border-[#D4AF37]/40"
              : "bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#B8860B] hover:from-[#FDE047] hover:to-[#D4AF37] text-[#08100B] shadow-[#D4AF37]/25 hover:scale-105 active:scale-95"
          }`}
        >
          {isRunning ? (
            <>
              <Activity className="w-4 h-4 animate-spin text-[#D4AF37]" />
              <span>Vařím Lektvar & Křesám Menhir...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Zažehnout G(E)A(L)L</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
