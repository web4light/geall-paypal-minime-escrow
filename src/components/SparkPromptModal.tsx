import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Copy, Check, ShieldAlert, Sparkles, BookOpen, AlertOctagon, Terminal } from "lucide-react";
import { DEFAULT_SPARK_PROMPT, SPARK_RULES, FORBIDDEN_WORDS, SPARK_PROMPT_PRESETS } from "../data/sparkPrompt";

interface SparkPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPreset?: (task: string) => void;
}

export const SparkPromptModal: React.FC<SparkPromptModalProps> = ({ isOpen, onClose, onApplyPreset }) => {
  const [activeTab, setActiveTab] = useState<"prompt" | "rules" | "forbidden" | "presets">("prompt");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(DEFAULT_SPARK_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#0D0D0D] border border-[#1A1A1A] rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A1A1A] bg-[#050505]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#F27D26]/15 text-[#F27D26] border border-[#F27D26]/30">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#EDEDED] flex items-center gap-2">
                  Ada/SPARK Code Agent – Systémový Prompt
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#00FF85]/15 text-[#00FF85] border border-[#00FF85]/30 font-mono">
                    gnatprove Verified
                  </span>
                </h2>
                <p className="text-xs text-[#71717A]">
                  Přesný systémový prompt garantující 100% formální verifikaci bez chyb
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[#71717A] hover:text-[#EDEDED] hover:bg-[#1A1A1A] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 px-6 pt-3 border-b border-[#1A1A1A] bg-[#0A0A0A]">
            <button
              onClick={() => setActiveTab("prompt")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
                activeTab === "prompt"
                  ? "border-[#F27D26] text-[#F27D26]"
                  : "border-transparent text-[#71717A] hover:text-[#EDEDED]"
              }`}
            >
              <Terminal className="w-4 h-4" />
              Plný Systémový Prompt
            </button>
            <button
              onClick={() => setActiveTab("rules")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
                activeTab === "rules"
                  ? "border-[#F27D26] text-[#F27D26]"
                  : "border-transparent text-[#71717A] hover:text-[#EDEDED]"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              10 Zlatých Pravidel
            </button>
            <button
              onClick={() => setActiveTab("forbidden")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
                activeTab === "forbidden"
                  ? "border-[#F27D26] text-[#F27D26]"
                  : "border-transparent text-[#71717A] hover:text-[#EDEDED]"
              }`}
            >
              <AlertOctagon className="w-4 h-4" />
              Zakázaná Slova
            </button>
            <button
              onClick={() => setActiveTab("presets")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
                activeTab === "presets"
                  ? "border-[#F27D26] text-[#F27D26]"
                  : "border-transparent text-[#71717A] hover:text-[#EDEDED]"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Rychlá Zadání & Příklady
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 text-[#D4D4D8] bg-[#080808]">
            {activeTab === "prompt" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#71717A]">
                    Tento prompt je automaticky vložen jako systémová instrukce do SPARK Agent uzlů ve workflow.
                  </span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-[#181818] hover:bg-[#222222] text-[#EDEDED] border border-[#262626] rounded-lg transition-all"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-[#00FF85]" /> : <Copy className="w-3.5 h-3.5 text-[#F27D26]" />}
                    {copied ? "Zkopírováno!" : "Kopírovat Prompt"}
                  </button>
                </div>
                <div className="relative p-4 rounded-xl bg-[#050505] border border-[#1A1A1A] font-mono text-xs text-[#00FF85] whitespace-pre-wrap leading-relaxed overflow-x-auto selection:bg-[#00FF85]/30">
                  {DEFAULT_SPARK_PROMPT}
                </div>
              </div>
            )}

            {activeTab === "rules" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SPARK_RULES.map((rule) => (
                  <div
                    key={rule.id}
                    className="p-4 rounded-xl bg-[#050505] border border-[#1A1A1A] hover:border-[#262626] transition-all flex flex-col gap-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-[#F27D26]/15 text-[#F27D26] font-bold text-xs flex items-center justify-center border border-[#F27D26]/30">
                        {rule.id}
                      </span>
                      <h3 className="font-semibold text-sm text-[#EDEDED]">{rule.title}</h3>
                    </div>
                    <p className="text-xs text-[#71717A] pl-8">{rule.desc}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "forbidden" && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Následující slova a konstrukce jsou v SPARK kódu <strong>přísně zakázány</strong> a automatický
                    verifikátor je okamžitě zachytí jako kritickou chybu.
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {FORBIDDEN_WORDS.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[#050505] border border-rose-900/30 flex items-start gap-3"
                    >
                      <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 font-mono text-xs font-bold border border-rose-500/30">
                        {item.word}
                      </span>
                      <p className="text-xs text-[#71717A] leading-snug">{item.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "presets" && (
              <div className="space-y-3">
                <p className="text-xs text-[#71717A]">
                  Vyberte vzorové zadání pro SPARK Agenta. Kliknutím jej aplikujete do aktivního workflow uzlu:
                </p>
                <div className="grid grid-cols-1 gap-3">
                  {SPARK_PROMPT_PRESETS.map((preset, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-[#050505] border border-[#1A1A1A] hover:border-[#262626] transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div>
                        <h4 className="text-sm font-semibold text-[#F27D26]">{preset.title}</h4>
                        <p className="text-xs text-[#A1A1AA] mt-1 font-mono">{preset.task}</p>
                      </div>
                      {onApplyPreset && (
                        <button
                          onClick={() => {
                            onApplyPreset(preset.task);
                            onClose();
                          }}
                          className="px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-[#F27D26] to-[#E06A14] text-[#050505] rounded-lg hover:from-[#FFA057] hover:to-[#F27D26] transition-colors flex-shrink-0"
                        >
                          Použít v Agentovi
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-[#1A1A1A] bg-[#050505]">
            <div className="flex items-center gap-2 text-xs text-[#71717A]">
              <ShieldAlert className="w-3.5 h-3.5 text-[#F27D26]" />
              <span>SPARK 2022 / AdaCore gnatprove kompatibilita</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-[#A1A1AA] bg-[#181818] hover:bg-[#222222] hover:text-white border border-[#262626] rounded-lg transition-colors"
            >
              Zavřít
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
