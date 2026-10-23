import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Search, Plus, Cpu, Webhook, GitBranch, Layers, Sparkles } from "lucide-react";
import { NodeType, NodeCategory } from "../types";
import { NODE_DEFINITIONS } from "../data/nodeDefinitions";
import { NodeIcon } from "./NodeIcon";

interface NodePaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onAddNode: (type: NodeType) => void;
}

export const NodePalette: React.FC<NodePaletteProps> = ({ isOpen, onClose, onAddNode }) => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  if (!isOpen) return null;

  const categories: Array<{ id: string; label: string; icon: any }> = [
    { id: "all", label: "Všechny uzly", icon: Layers },
    { id: "spark_ai", label: "SPARK & Ada Engine", icon: Cpu },
    { id: "trigger", label: "Triggery & Spouštěče", icon: Webhook },
    { id: "integration", label: "Integrace & Akce", icon: Sparkles },
    { id: "logic", label: "Logika & Transformace", icon: GitBranch },
  ];

  const allNodes = Object.values(NODE_DEFINITIONS);

  const filteredNodes = allNodes.filter((node) => {
    const matchesCategory = selectedCategory === "all" || node.category === selectedCategory;
    const matchesSearch =
      node.label.toLowerCase().includes(search.toLowerCase()) ||
      node.description.toLowerCase().includes(search.toLowerCase()) ||
      node.type.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-3xl max-h-[85vh] flex flex-col bg-[#0D0D0D] border border-[#1A1A1A] rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A1A1A] bg-[#050505]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#F27D26]/15 text-[#F27D26] border border-[#F27D26]/30">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#EDEDED]">Knihovna Uzlů Workflow</h3>
                <p className="text-xs text-[#71717A]">Vyberte uzel pro vložení do automatizačního plátna</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[#71717A] hover:text-[#EDEDED] hover:bg-[#1A1A1A] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="p-6 border-b border-[#1A1A1A] space-y-4 bg-[#080808]">
            <div className="relative">
              <Search className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Hledat uzly (např. SPARK, GitHub, Discord, Webhook)..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#050505] border border-[#1A1A1A] rounded-xl text-[#EDEDED] focus:outline-none focus:border-[#F27D26] text-xs font-medium placeholder:text-[#52525B]"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-[#F27D26] text-[#050505] font-bold shadow-md shadow-[#F27D26]/20"
                        : "bg-[#050505] text-[#A1A1AA] hover:text-white border border-[#1A1A1A] hover:border-[#262626]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid of Nodes */}
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-[#050505]">
            {filteredNodes.map((def) => {
              const isSpark = def.category === "spark_ai";
              return (
                <div
                  key={def.type}
                  onClick={() => {
                    onAddNode(def.type);
                    onClose();
                  }}
                  className={`group p-4 rounded-xl cursor-pointer transition-all border flex items-start gap-3.5 ${
                    isSpark
                      ? "bg-[#0D0D0D] border-[#F27D26]/30 hover:border-[#F27D26] hover:bg-[#141414]"
                      : "bg-[#0A0A0A] border-[#1A1A1A] hover:border-[#262626] hover:bg-[#121212]"
                  }`}
                >
                  <div
                    className={`p-2.5 rounded-xl transition-all ${
                      isSpark
                        ? "bg-[#F27D26]/15 text-[#F27D26] group-hover:scale-105"
                        : "bg-[#141414] text-[#A1A1AA] border border-[#222222] group-hover:scale-105"
                    }`}
                  >
                    <NodeIcon name={def.iconName} className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-[#EDEDED] group-hover:text-[#F27D26] transition-colors">
                        {def.label}
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono text-[#71717A] bg-[#141414] border border-[#222222]">
                        {def.category}
                      </span>
                    </div>
                    <p className="text-xs text-[#A1A1AA] mt-1 leading-snug">{def.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
