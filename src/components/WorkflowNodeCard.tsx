import React from "react";
import { Settings, Play, Trash2, Copy, ShieldCheck, Activity, Cpu } from "lucide-react";
import { WorkflowNode } from "../types";
import { NODE_DEFINITIONS } from "../data/nodeDefinitions";
import { NodeIcon, StatusIcon } from "./NodeIcon";

interface WorkflowNodeCardProps {
  node: WorkflowNode;
  isSelected: boolean;
  onSelect: (nodeId: string) => void;
  onOpenConfig: (node: WorkflowNode) => void;
  onDelete: (nodeId: string) => void;
  onClone: (node: WorkflowNode) => void;
  onRunSingle?: (node: WorkflowNode) => void;
  onStartConnection?: (nodeId: string, portId: string, isOutput: boolean) => void;
  onEndConnection?: (nodeId: string, portId: string) => void;
}

export const WorkflowNodeCard: React.FC<WorkflowNodeCardProps> = ({
  node,
  isSelected,
  onSelect,
  onOpenConfig,
  onDelete,
  onClone,
  onRunSingle,
  onStartConnection,
  onEndConnection,
}) => {
  const def = NODE_DEFINITIONS[node.type] || {
    label: node.data?.label || node.type,
    category: node.data?.category || "logic",
    iconName: "Layers",
    inputs: [{ id: "main", name: "In" }],
    outputs: [{ id: "main", name: "Out" }],
  };

  const isSpark = node.data?.category === "spark_ai";
  const isTrigger = node.data?.category === "trigger";
  const isRunning = node.data?.status === "running";

  const getCategoryColor = () => {
    switch (node.data?.category) {
      case "spark_ai":
        return "border-[#D4AF37]/50 shadow-[#D4AF37]/15";
      case "trigger":
        return "border-[#38BDF8]/45 shadow-[#38BDF8]/10";
      case "integration":
        return "border-[#4ADE80]/45 shadow-[#4ADE80]/10";
      case "logic":
        return "border-[#C084FC]/45 shadow-[#C084FC]/10";
      default:
        return "border-[#213426]";
    }
  };

  const getCategoryBg = () => {
    switch (node.data?.category) {
      case "spark_ai":
        return "bg-gradient-to-b from-[#D4AF37]/15 via-[#0E1B12]/95 to-[#09120C]";
      case "trigger":
        return "bg-gradient-to-b from-[#38BDF8]/15 via-[#0E1B12]/95 to-[#09120C]";
      case "integration":
        return "bg-gradient-to-b from-[#4ADE80]/15 via-[#0E1B12]/95 to-[#09120C]";
      case "logic":
        return "bg-gradient-to-b from-[#C084FC]/15 via-[#0E1B12]/95 to-[#09120C]";
      default:
        return "bg-[#0E1B12]";
    }
  };

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
      style={{
        transform: `translate(${node.position.x}px, ${node.position.y}px)`,
      }}
      className={`absolute w-72 rounded-2xl border transition-all duration-150 select-none shadow-2xl cursor-grab active:cursor-grabbing backdrop-blur-md ${getCategoryBg()} ${getCategoryColor()} ${
        isSelected ? "ring-2 ring-[#D4AF37] border-[#D4AF37] scale-[1.02]" : "hover:border-[#D4AF37]/60"
      } ${isRunning ? "animate-pulse" : ""}`}
    >
      {/* Input Ports (Left) */}
      {!isTrigger && (
        <div className="absolute -left-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
          {(def.inputs.length > 0 ? def.inputs : [{ id: "main", name: "In" }]).map((port) => (
            <div
              key={port.id}
              onClick={(e) => {
                e.stopPropagation();
                if (onEndConnection) onEndConnection(node.id, port.id);
              }}
              title={`Vstupní port: ${port.name}`}
              className="w-6 h-6 rounded-full bg-[#09120C] border-2 border-[#2A4230] hover:border-[#D4AF37] hover:scale-125 transition-all flex items-center justify-center cursor-pointer shadow-md group"
            >
              <div className="w-2 h-2 rounded-full bg-[#4ADE80] group-hover:bg-[#D4AF37]" />
            </div>
          ))}
        </div>
      )}

      {/* Output Ports (Right) */}
      <div className="absolute -right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
        {(def.outputs.length > 0 ? def.outputs : [{ id: "main", name: "Out" }]).map((port) => (
          <div
            key={port.id}
            onClick={(e) => {
              e.stopPropagation();
              if (onStartConnection) onStartConnection(node.id, port.id, true);
            }}
            title={`Výstupní port: ${port.name}`}
            className="w-6 h-6 rounded-full bg-[#09120C] border-2 border-[#D4AF37] hover:border-[#FDE047] hover:scale-125 transition-all flex items-center justify-center cursor-pointer shadow-md group"
          >
            <div className="w-2 h-2 rounded-full bg-[#D4AF37] group-hover:bg-[#FDE047]" />
          </div>
        ))}
      </div>

      {/* Node Header */}
      <div className="p-3.5 border-b border-[#213426] flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`p-2 rounded-xl border flex-shrink-0 ${
              isSpark
                ? "bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/40"
                : isTrigger
                ? "bg-[#38BDF8]/20 text-[#38BDF8] border-[#38BDF8]/40"
                : "bg-[#122217] text-[#E2DEC9] border-[#2A4230]"
            }`}
          >
            <NodeIcon name={node.data.icon || def.iconName} className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-[#F4EFE0] truncate tracking-tight">{node.data.label}</h4>
            <span className="text-[10px] text-[#9CAEA2] block truncate font-mono">
              {node.data.category === "spark_ai" ? "☘️ DRUID & MENHIR" : node.data.category.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <StatusIcon status={node.data.status} className="w-3.5 h-3.5" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenConfig(node);
            }}
            title="Nastavení uzlu"
            className="p-1 rounded-md text-[#71717A] hover:text-[#EDEDED] hover:bg-[#1A1A1A] transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Node Body / Summary Preview */}
      <div className="p-3 space-y-2 text-[11px] text-[#D4D4D8]">
        <p className="text-[#A1A1AA] line-clamp-2 leading-relaxed">{node.data.description}</p>

        {node.type === "spark_agent" && node.data?.config?.task && (
          <div className="p-2 rounded-lg bg-[#070E09] border border-[#D4AF37]/30 font-mono text-[10px] text-[#D4AF37] truncate">
            ⚗️ "{node.data.config.task}"
          </div>
        )}

        {node.type === "spark_verifier" && (
          <div className="flex items-center justify-between text-[10px] text-[#E2DEC9] font-mono">
            <span>Menhir Proof Level:</span>
            <span className="text-[#38BDF8] font-semibold">Level {node.data?.config?.proofLevel || 2}</span>
          </div>
        )}

        {node.type === "github_action" && node.data?.config?.repo && (
          <div className="p-1.5 rounded bg-[#050505] text-[10px] text-[#A1A1AA] font-mono truncate border border-[#1A1A1A]">
            Repo: {node.data.config.repo}
          </div>
        )}

        {node.type === "discord_webhook" && node.data?.config?.channel && (
          <div className="flex items-center justify-between text-[10px] text-[#A1A1AA]">
            <span>Kanál:</span>
            <span className="text-[#818CF8] font-mono">{node.data.config.channel}</span>
          </div>
        )}
      </div>

      {/* Quick Action Footer */}
      <div className="px-3 py-2 border-t border-[#1A1A1A] bg-[#0A0A0A]/60 rounded-b-2xl flex items-center justify-between text-[10px] text-[#71717A]">
        <span className="font-mono">ID: {node.id.substring(0, 7)}</span>

        <div className="flex items-center gap-1">
          {onRunSingle && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRunSingle(node);
              }}
              title="Spustit pouze tento uzel"
              className="p-1 rounded hover:bg-[#1A1A1A] text-[#71717A] hover:text-[#F27D26] transition-colors"
            >
              <Play className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClone(node);
            }}
            title="Duplikovat uzel"
            className="p-1 rounded hover:bg-[#1A1A1A] text-[#71717A] hover:text-[#EDEDED] transition-colors"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node.id);
            }}
            title="Smazat uzel"
            className="p-1 rounded hover:bg-rose-500/15 text-[#71717A] hover:text-rose-400 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
