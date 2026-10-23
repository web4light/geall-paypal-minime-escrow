import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronUp,
  ChevronDown,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Terminal,
  Trash2,
  Layers,
  Sparkles,
} from "lucide-react";
import { ExecutionLog } from "../types";

interface ExecutionLogsPanelProps {
  logs: ExecutionLog[];
  onClear: () => void;
  isRunning?: boolean;
}

export const ExecutionLogsPanel: React.FC<ExecutionLogsPanelProps> = ({ logs, onClear, isRunning }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ExecutionLog | null>(null);

  const getStatusIcon = (status: ExecutionLog["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-[#00FF85]" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-[#F27D26]" />;
      case "error":
        return <XCircle className="w-4 h-4 text-rose-400" />;
      default:
        return <Activity className="w-4 h-4 text-[#38BDF8]" />;
    }
  };

  return (
    <div className="border-t border-[#1A1A1A] bg-[#0A0A0A]/95 backdrop-blur-md z-30 transition-all">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-6 py-2.5">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-3 text-xs font-semibold text-[#D4D4D8] hover:text-white transition-colors"
        >
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#F27D26]" />
            <span>Workflow Execution & Audit Logs</span>
            {logs.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#181818] text-[#F27D26] font-mono text-[11px] border border-[#262626]">
                {logs.length} událostí
              </span>
            )}
            {isRunning && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30 text-[11px] animate-pulse">
                <Activity className="w-3 h-3 animate-spin" /> Běží...
              </span>
            )}
          </div>
          {isExpanded ? <ChevronDown className="w-4 h-4 text-[#71717A]" /> : <ChevronUp className="w-4 h-4 text-[#71717A]" />}
        </button>

        <div className="flex items-center gap-2">
          {logs.length > 0 && (
            <button
              onClick={onClear}
              className="p-1.5 rounded text-[#71717A] hover:text-rose-400 hover:bg-[#1A1A1A] transition-colors text-xs flex items-center gap-1"
              title="Vymazat logy"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Logs Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 220, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex border-t border-[#1A1A1A] overflow-hidden"
          >
            {/* Logs List */}
            <div className="w-1/2 md:w-3/5 overflow-y-auto p-3 space-y-1.5 border-r border-[#1A1A1A] font-mono text-xs bg-[#080808]">
              {logs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[#52525B] text-xs">
                  Zatím žádné záznamy o běhu. Spusťte workflow tlačítkem "Spustit Workflow".
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`p-2 rounded-lg cursor-pointer transition-all flex items-start gap-2.5 ${
                      selectedLog?.id === log.id
                        ? "bg-[#1A1A1A] border border-[#F27D26]/50 text-[#EDEDED]"
                        : "bg-[#111111] hover:bg-[#161616] border border-[#1A1A1A] text-[#D4D4D8]"
                    }`}
                  >
                    <div className="mt-0.5">{getStatusIcon(log.status)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#F27D26] truncate">{log.nodeName}</span>
                        <span className="text-[10px] text-[#71717A]">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#A1A1AA] truncate mt-0.5">{log.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Log Detail Inspector */}
            <div className="w-1/2 md:w-2/5 overflow-y-auto p-4 bg-[#050505] font-mono text-xs">
              {selectedLog ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#F27D26]">{selectedLog.nodeName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#1A1A1A] text-[#EDEDED] border border-[#262626]">
                      {selectedLog.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[#D4D4D8] leading-relaxed">{selectedLog.message}</p>
                  {selectedLog.data && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-[#71717A] uppercase tracking-wider">Payload Data:</span>
                      <pre className="p-2 rounded-lg bg-[#0A0A0A] border border-[#1A1A1A] text-[11px] text-[#00FF85] overflow-x-auto">
                        {JSON.stringify(selectedLog.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-[#52525B] text-xs text-center p-4">
                  Klikněte na záznam vlevo pro zobrazení detailu a payloadu.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
