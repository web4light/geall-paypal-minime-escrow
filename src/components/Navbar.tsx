import React, { useState } from "react";
import {
  Play,
  Activity,
  FileCode,
  ShieldAlert,
  Layers,
  FolderOpen,
  Download,
  Upload,
  Plus,
  CheckCircle2,
  Sparkles,
  Github,
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
    <header className="h-14 border-b border-[#1A1A1A] bg-[#0A0A0A]/95 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none">
      {/* Brand & Workflow Info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#F27D26] to-[#D96B1C] flex items-center justify-center shadow-lg shadow-[#F27D26]/25 text-[#050505] font-black text-sm">
            SP
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#EDEDED] tracking-tight">SPARK Automate</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F27D26]/15 text-[#F27D26] font-mono border border-[#F27D26]/30">
                n8n + Ada/SPARK
              </span>
            </div>
          </div>
        </div>

        <div className="h-4 w-px bg-[#1A1A1A] hidden md:block" />

        {/* Template Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowTemplatesMenu(!showTemplatesMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#121212] hover:bg-[#1A1A1A] border border-[#222222] text-xs font-medium text-[#EDEDED] transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-[#F27D26]" />
            <span className="truncate max-w-[200px] md:max-w-[260px]">{currentWorkflow.name}</span>
          </button>

          {showTemplatesMenu && (
            <div className="absolute left-0 mt-1.5 w-80 bg-[#121212] border border-[#262626] rounded-xl shadow-2xl p-2 z-50 space-y-1">
              <div className="px-2 py-1 text-[11px] font-semibold text-[#71717A] uppercase tracking-wider">
                Šablony Workflow
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
                      ? "bg-[#F27D26]/15 text-[#F27D26] border border-[#F27D26]/30"
                      : "text-[#D4D4D8] hover:bg-[#1A1A1A]"
                  }`}
                >
                  <span className="font-semibold">{tmpl.name}</span>
                  <span className="text-[10px] text-[#A1A1AA] line-clamp-1">{tmpl.description}</span>
                </button>
              ))}
              <div className="pt-1 border-t border-[#1A1A1A] flex items-center justify-between px-2">
                <button
                  onClick={() => {
                    onNewWorkflow();
                    setShowTemplatesMenu(false);
                  }}
                  className="text-[11px] text-[#F27D26] hover:text-[#FFA057] font-medium flex items-center gap-1 py-1"
                >
                  <Plus className="w-3 h-3" /> Vytvořit čisté workflow
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenPalette}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#121212] hover:bg-[#1A1A1A] border border-[#222222] text-xs font-medium text-[#D4D4D8] hover:text-white transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-[#F27D26]" />
          <span className="hidden sm:inline">Přidat Uzel</span>
        </button>

        <button
          onClick={onOpenPromptModal}
          title="Zobrazit Ada/SPARK Systémový Prompt"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F27D26]/10 hover:bg-[#F27D26]/20 border border-[#F27D26]/30 text-xs font-semibold text-[#F27D26] transition-colors"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-[#F27D26]" />
          <span className="hidden md:inline">SPARK Prompt</span>
        </button>

        <button
          onClick={onOpenCodeDrawer}
          title="Zobrazit vygenerovaný Ada kód a formální audit"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#121212] hover:bg-[#1A1A1A] border border-[#222222] text-xs font-medium text-[#D4D4D8] hover:text-white transition-colors"
        >
          <FileCode className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span className="hidden md:inline">Ada Kód & Verifikace</span>
        </button>
      </div>

      {/* Right Run & Export Actions */}
      <div className="flex items-center gap-2">
        {/* Import/Export */}
        <button
          onClick={onExportJson}
          title="Exportovat workflow do JSON"
          className="p-2 rounded-lg text-[#A1A1AA] hover:text-[#EDEDED] hover:bg-[#1A1A1A] transition-colors hidden sm:flex"
        >
          <Download className="w-4 h-4" />
        </button>
        <label
          title="Importovat workflow z JSON"
          className="p-2 rounded-lg text-[#A1A1AA] hover:text-[#EDEDED] hover:bg-[#1A1A1A] transition-colors cursor-pointer hidden sm:flex"
        >
          <Upload className="w-4 h-4" />
          <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
        </label>

        {/* Primary Run Workflow Button */}
        <button
          onClick={onRunWorkflow}
          disabled={isRunning}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-lg ${
            isRunning
              ? "bg-[#1C1C1C] text-[#F27D26] cursor-not-allowed border border-[#F27D26]/30"
              : "bg-gradient-to-r from-[#F27D26] to-[#E06A14] hover:from-[#FFA057] hover:to-[#F27D26] text-[#050505] shadow-[#F27D26]/20 hover:scale-105 active:scale-95"
          }`}
        >
          {isRunning ? (
            <>
              <Activity className="w-4 h-4 animate-spin text-[#F27D26]" />
              <span>Provádím Pipeline...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Spustit Workflow</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
