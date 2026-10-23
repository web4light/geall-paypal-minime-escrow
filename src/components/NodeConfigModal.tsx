import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Settings,
  Play,
  Save,
  Trash2,
  Cpu,
  ShieldCheck,
  Globe,
  Github,
  MessageSquare,
  Slack,
  Clock,
  Code,
  GitBranch,
  Sparkles,
} from "lucide-react";
import { WorkflowNode } from "../types";
import { NODE_DEFINITIONS } from "../data/nodeDefinitions";
import { NodeIcon } from "./NodeIcon";

interface NodeConfigModalProps {
  node: WorkflowNode | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (nodeId: string, updatedData: Partial<WorkflowNode["data"]>) => void;
  onDelete: (nodeId: string) => void;
  onTestNode?: (node: WorkflowNode) => void;
}

export const NodeConfigModal: React.FC<NodeConfigModalProps> = ({
  node,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onTestNode,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (node) {
      setFormData(node.data?.config || {});
      setLabel(node.data?.label || "");
      setDescription(node.data?.description || "");
    }
  }, [node]);

  if (!isOpen || !node) return null;

  const def = NODE_DEFINITIONS[node.type];

  const handleFieldChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(node.id, {
      label,
      description,
      config: formData,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-[#0D0D0D] border border-[#1A1A1A] rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A1A1A] bg-[#050505]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#F27D26]/15 text-[#F27D26] border border-[#F27D26]/30">
                <NodeIcon name={node.data.icon} className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#EDEDED] flex items-center gap-2">
                  Konfigurace Uzlu: {node.data.label}
                </h3>
                <p className="text-xs text-[#71717A] font-mono">Typ: {node.type}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[#71717A] hover:text-[#EDEDED] hover:bg-[#1A1A1A] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm text-[#D4D4D8] bg-[#080808]">
            {/* General Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#A1A1AA]">Název uzlu</label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full px-3 py-2 bg-[#050505] border border-[#1A1A1A] rounded-lg text-[#EDEDED] focus:outline-none focus:border-[#F27D26] text-xs font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#A1A1AA]">Popis</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-[#050505] border border-[#1A1A1A] rounded-lg text-[#EDEDED] focus:outline-none focus:border-[#F27D26] text-xs font-medium"
                />
              </div>
            </div>

            <hr className="border-[#1A1A1A]" />

            {/* Node-specific configuration */}
            {node.type === "spark_agent" && (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-[#F27D26]/10 border border-[#F27D26]/20 text-xs text-[#F27D26] flex items-center gap-2">
                  <Cpu className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Tento uzel je řízen formálním <strong>SPARK Agent Promptem</strong> s pravidly pro gnatprove
                    (Pre/Post kontrakty, ranged types, no heap).
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#D4D4D8]">Zadání modulu (Task Prompt)</label>
                  <textarea
                    rows={4}
                    value={formData.task || ""}
                    onChange={(e) => handleFieldChange("task", e.target.value)}
                    placeholder="Např. Vytvoř kruhový buffer pro 100 zpráv s operacemi Add a Get..."
                    className="w-full p-3 bg-[#050505] border border-[#1A1A1A] rounded-lg text-[#EDEDED] focus:outline-none focus:border-[#F27D26] font-mono text-xs leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#D4D4D8]">Název Ada balíčku (Package)</label>
                    <input
                      type="text"
                      value={formData.packageName || "Message_Buffer"}
                      onChange={(e) => handleFieldChange("packageName", e.target.value)}
                      className="w-full px-3 py-2 bg-[#050505] border border-[#1A1A1A] rounded-lg text-[#EDEDED] font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#D4D4D8]">AI Model</label>
                    <select
                      value={formData.model || "gemini-2.5-flash"}
                      onChange={(e) => handleFieldChange("model", e.target.value)}
                      className="w-full px-3 py-2 bg-[#050505] border border-[#1A1A1A] rounded-lg text-[#EDEDED] text-xs"
                    >
                      <option value="gemini-2.5-flash">Gemini 2.5 Flash (Doporučeno – rychlé a přesné)</option>
                      <option value="gemini-2.5-pro">Gemini 2.5 Pro (Hluboké uvažování pro kontrakty)</option>
                      <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
                      <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Preview)</option>
                      <option value="gemini-3.1-flash-lite-preview">Gemini 3.1 Flash Lite</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="strictContracts"
                    checked={formData.strictGoldenRules !== false}
                    onChange={(e) => handleFieldChange("strictGoldenRules", e.target.checked)}
                    className="rounded bg-[#050505] border-[#1A1A1A] text-[#F27D26] focus:ring-0"
                  />
                  <label htmlFor="strictContracts" className="text-xs text-[#A1A1AA] cursor-pointer">
                    Vynutit 10 nepřekročitelných pravidel SPARK (pragma SPARK_Mode, zákaz new/raise/access)
                  </label>
                </div>
              </div>
            )}

            {node.type === "spark_verifier" && (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-[#38BDF8]/10 border border-[#38BDF8]/20 text-xs text-[#38BDF8] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Ověřuje splnění všech formálních podmínek (VCs) a absenci runtime chyb podle specifikace Ada 2022 přes lokální GNATprove nebo inteligentní analyzátor.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#D4D4D8]">Cesta k existujícímu .gpr projektu na disku (volitelné)</label>
                  <input
                    type="text"
                    placeholder="W:\projekty\Universal-Translation-Layer\mincovna.gpr"
                    value={formData.gprPath || ""}
                    onChange={(e) => handleFieldChange("gprPath", e.target.value)}
                    className="w-full px-3 py-2 bg-[#050505] border border-[#1A1A1A] rounded-lg text-[#EDEDED] text-xs font-mono"
                  />
                  <p className="text-[10px] text-[#71717A]">
                    Pokud je zadáno, GNATprove ověří přímo tento projekt na disku místo in-memory kódu.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#D4D4D8]">Verifikační engine</label>
                  <select
                    value={formData.mode || "auto"}
                    onChange={(e) => handleFieldChange("mode", e.target.value)}
                    className="w-full px-3 py-2 bg-[#050505] border border-[#1A1A1A] rounded-lg text-[#EDEDED] text-xs font-mono"
                  >
                    <option value="auto">Auto (Použít reálný gnatprove na disku W / Alire, fallback na analyzátor)</option>
                    <option value="gnatprove">Reálný gnatprove toolchain (SMT: Z3, cvc5, Alt-Ergo)</option>
                    <option value="heuristic">Rychlý statický analyzátor pravidel SPARK</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#D4D4D8]">Úroveň dokazování (Proof Level)</label>
                    <select
                      value={formData.proofLevel ?? 2}
                      onChange={(e) => handleFieldChange("proofLevel", Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#050505] border border-[#1A1A1A] rounded-lg text-[#EDEDED] text-xs font-mono"
                    >
                      <option value="0">Level 0 - Rychlá kontrola toku dat (Flow Analysis)</option>
                      <option value="1">Level 1 - Absence run-time chyb (Základní)</option>
                      <option value="2">Level 2 - Důkaz kontraktů & RTE (Doporučeno)</option>
                      <option value="3">Level 3 - Prodloužený timeout proveru</option>
                      <option value="4">Level 4 - Hloubkový SMT solver (Z3 + CVC5 + Alt-Ergo)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#D4D4D8]">Timeout na VC (sekundy)</label>
                    <input
                      type="number"
                      value={formData.timeoutSec || 15}
                      onChange={(e) => handleFieldChange("timeoutSec", Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#050505] border border-[#1A1A1A] rounded-lg text-[#EDEDED] text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {node.type === "github_action" && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#D4D4D8]">Cílový Repozitář (owner/repo)</label>
                  <input
                    type="text"
                    value={formData.repo || "aerospace/flight-control"}
                    onChange={(e) => handleFieldChange("repo", e.target.value)}
                    className="w-full px-3 py-2 bg-[#050505] border border-[#1A1A1A] rounded-lg text-[#EDEDED] text-xs font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#D4D4D8]">Větev (Branch)</label>
                    <input
                      type="text"
                      value={formData.branch || "spark-modules"}
                      onChange={(e) => handleFieldChange("branch", e.target.value)}
                      className="w-full px-3 py-2 bg-[#050505] border border-[#1A1A1A] rounded-lg text-[#EDEDED] text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#D4D4D8]">Cesta ve stromu repozitáře</label>
                    <input
                      type="text"
                      value={formData.path || "src/"}
                      onChange={(e) => handleFieldChange("path", e.target.value)}
                      className="w-full px-3 py-2 bg-[#050505] border border-[#1A1A1A] rounded-lg text-[#EDEDED] text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {node.type === "discord_webhook" && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#D4D4D8]">Discord Webhook URL</label>
                  <input
                    type="text"
                    value={formData.webhookUrl || ""}
                    onChange={(e) => handleFieldChange("webhookUrl", e.target.value)}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="w-full px-3 py-2 bg-[#050505] border border-[#1A1A1A] rounded-lg text-[#EDEDED] text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#D4D4D8]">Cílový kanál</label>
                  <input
                    type="text"
                    value={formData.channel || "#spark-ci-alerts"}
                    onChange={(e) => handleFieldChange("channel", e.target.value)}
                    className="w-full px-3 py-2 bg-[#050505] border border-[#1A1A1A] rounded-lg text-[#EDEDED] text-xs"
                  />
                </div>
              </div>
            )}

            {node.type === "slack_notification" && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#D4D4D8]">Slack Webhook URL</label>
                  <input
                    type="text"
                    value={formData.webhookUrl || ""}
                    onChange={(e) => handleFieldChange("webhookUrl", e.target.value)}
                    placeholder="https://hooks.slack.com/services/..."
                    className="w-full px-3 py-2 bg-[#050505] border border-[#1A1A1A] rounded-lg text-[#EDEDED] text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#D4D4D8]">Kanál</label>
                  <input
                    type="text"
                    value={formData.channel || "#ada-safety-reviews"}
                    onChange={(e) => handleFieldChange("channel", e.target.value)}
                    className="w-full px-3 py-2 bg-[#050505] border border-[#1A1A1A] rounded-lg text-[#EDEDED] text-xs"
                  />
                </div>
              </div>
            )}

            {node.type === "http_request" && (
              <div className="space-y-3">
                <div className="grid grid-cols-4 gap-2">
                  <div className="col-span-1 space-y-1.5">
                    <label className="text-xs font-semibold text-[#D4D4D8]">Metoda</label>
                    <select
                      value={formData.method || "POST"}
                      onChange={(e) => handleFieldChange("method", e.target.value)}
                      className="w-full px-3 py-2 bg-[#050505] border border-[#1A1A1A] rounded-lg text-[#EDEDED] text-xs font-mono"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                  </div>
                  <div className="col-span-3 space-y-1.5">
                    <label className="text-xs font-semibold text-[#D4D4D8]">URL Endpoint</label>
                    <input
                      type="text"
                      value={formData.url || "https://api.example.com/endpoint"}
                      onChange={(e) => handleFieldChange("url", e.target.value)}
                      className="w-full px-3 py-2 bg-[#050505] border border-[#1A1A1A] rounded-lg text-[#EDEDED] text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {node.type === "trigger_cron" && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#D4D4D8]">Cron Výraz</label>
                  <input
                    type="text"
                    value={formData.cronExpression || "0 */4 * * *"}
                    onChange={(e) => handleFieldChange("cronExpression", e.target.value)}
                    className="w-full px-3 py-2 bg-[#050505] border border-[#1A1A1A] rounded-lg text-[#EDEDED] text-xs font-mono"
                  />
                </div>
              </div>
            )}

            {node.type === "js_code" && (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-[#D4D4D8]">JavaScript Transform Script</label>
                <textarea
                  rows={6}
                  value={formData.code || ""}
                  onChange={(e) => handleFieldChange("code", e.target.value)}
                  className="w-full p-3 bg-[#050505] border border-[#1A1A1A] rounded-lg text-[#EDEDED] font-mono text-xs"
                />
              </div>
            )}

            {node.type === "condition_filter" && (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-[#D4D4D8]">Podmínka filtru</label>
                <input
                  type="text"
                  value={formData.condition || "verification.overallPassed == true"}
                  onChange={(e) => handleFieldChange("condition", e.target.value)}
                  className="w-full px-3 py-2 bg-[#050505] border border-[#1A1A1A] rounded-lg text-[#EDEDED] text-xs font-mono"
                />
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#1A1A1A] bg-[#050505]">
            <button
              onClick={() => {
                onDelete(node.id);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Smazat uzel
            </button>

            <div className="flex items-center gap-2">
              {onTestNode && (
                <button
                  onClick={() => onTestNode(node)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#A1A1AA] bg-[#141414] hover:bg-[#1C1C1C] hover:text-white border border-[#222222] rounded-lg transition-colors"
                >
                  <Play className="w-3.5 h-3.5 text-[#F27D26]" />
                  Otestovat tento uzel
                </button>
              )}
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#050505] bg-gradient-to-r from-[#F27D26] to-[#E06A14] hover:from-[#FFA057] hover:to-[#F27D26] rounded-xl transition-all shadow-lg shadow-[#F27D26]/20"
              >
                <Save className="w-3.5 h-3.5" />
                Uložit změny
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
