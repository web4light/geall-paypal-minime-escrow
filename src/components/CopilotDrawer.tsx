import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Bot,
  RotateCcw,
  X,
  Code,
  Copy,
  Check,
  ShieldCheck,
  Send,
  Loader2,
} from "lucide-react";
import { WorkflowNode } from "../types";

export interface CopilotMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  extractedCode?: string;
  timestamp: string;
}

interface CopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyCodeToNode?: (code: string) => void;
  onOpenVerify?: (code: string) => void;
  currentWorkflowNodes?: WorkflowNode[];
}

export const CopilotDrawer: React.FC<CopilotDrawerProps> = ({
  isOpen,
  onClose,
  onApplyCodeToNode,
  onOpenVerify,
  currentWorkflowNodes = [],
}) => {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Ahoj! Jsem **Ada / SPARK Copilot**. \nMým úkolem je pomáhat ti navrhovat a formálně ověřovat kód pro **Ada 2022 / SPARK** s garancí, že projde nástrojem `gnatprove` bez jediné chyby.\n\nMůžeš se mě zeptat na:\n- Generování specifikací (`.ads`) a těl (`.adb`) s `pragma SPARK_Mode (On)`\n- Formulaci **Pre/Post kontraktů** a loop invariantů\n- Ranged typy a eliminaci heap alokace (bez `new` a `raise`)\n- Řešení neprokázaných VC (Verification Conditions)",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const quickPrompts = [
    {
      label: "FIFO Buffer (.ads/.adb)",
      text: "Navrhni bezpečný kruhový FIFO buffer pro 100 prvků v Adě se SPARK kontrakty a ranged typy.",
    },
    {
      label: "PID Regulátor",
      text: "Vytvoř deterministický SPARK PID regulátor s pevnou řádovou čárkou bez dynamické alokace.",
    },
    {
      label: "Pravidla pro kontrakty",
      text: "Jak správně zapsat Post kontrakt pro proceduru, která modifikuje pole a vrací úspěch přes OUT Boolean?",
    },
    {
      label: "Loop Invarianty",
      text: "Vysvětli, jak v SPARK správně dokázat loop invariant pro lineární vyhledávání v poli.",
    },
  ];

  const handleSend = async (overrideText?: string) => {
    const textToSend = (overrideText || input).trim();
    if (!textToSend || loading) return;

    const userMsg: CopilotMessage = {
      id: "msg_" + Date.now(),
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const sparkAgentNode = currentWorkflowNodes.find((n) => n.type === "spark_agent");
      const currentCode =
        sparkAgentNode?.data?.lastOutput?.rawResponse ||
        sparkAgentNode?.data?.config?.customPromptOverride ||
        "";

      const res = await fetch("/api/spark/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
          currentCode,
        }),
      });

      if (!res.ok) {
        throw new Error(`Chyba serveru: ${res.statusText}`);
      }

      const data = await res.json();
      const botMsg: CopilotMessage = {
        id: "msg_" + (Date.now() + 1),
        role: "assistant",
        content: data.reply || "Odpověď přijata.",
        extractedCode: data.extractedCode,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: CopilotMessage = {
        id: "msg_err_" + Date.now(),
        role: "assistant",
        content: `⚠️ Nepodařilo se spojit s Copilotem: ${
          err.message || "Neznámá chyba"
        }. Ujisti se, že je nastaven GEMINI_API_KEY.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/60 backdrop-blur-xs">
        <motion.aside
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 220 }}
          className="w-full max-w-xl h-full bg-[#0D0D0D] border-l border-[#1F1F1F] flex flex-col shadow-2xl relative"
        >
          {/* Header */}
          <div className="p-4 border-b border-[#1A1A1A] bg-[#0A0A0A] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F27D26] to-[#E06A14] flex items-center justify-center text-[#050505] shadow-lg shadow-[#F27D26]/20">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-[#EDEDED] tracking-tight">Ada / SPARK Copilot</h2>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F27D26]/15 text-[#F27D26] font-mono border border-[#F27D26]/30">
                    gnatprove AI
                  </span>
                </div>
                <p className="text-[11px] text-[#71717A]">Specializovaný asistent pro formálně verifikovaný kód</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() =>
                  setMessages([
                    {
                      id: "welcome_reset",
                      role: "assistant",
                      content: "Konverzace byla vyčištěna. Na co se chceš zeptat ohledně Ada/SPARK?",
                      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    },
                  ])
                }
                title="Vyčistit konverzaci"
                className="p-1.5 rounded-lg text-[#71717A] hover:text-[#EDEDED] hover:bg-[#1A1A1A] transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[#71717A] hover:text-[#EDEDED] hover:bg-[#1A1A1A] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-4 py-2 bg-[#080808] border-b border-[#1A1A1A] flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="text-[10px] uppercase font-mono text-[#52525B] whitespace-nowrap">Rychlé dotazy:</span>
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p.text)}
                className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-[#141414] hover:bg-[#1F1F1F] text-[#A1A1AA] hover:text-white border border-[#222222] transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-2 mb-1 text-[10px] text-[#71717A] px-1">
                  <span>{m.role === "user" ? "Ty" : "Ada/SPARK Copilot"}</span>
                  <span>•</span>
                  <span>{m.timestamp}</span>
                </div>

                <div
                  className={`p-3.5 rounded-2xl max-w-[92%] leading-relaxed whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-[#1E1E1E] text-white border border-[#2D2D2D] rounded-tr-xs"
                      : "bg-[#121212] text-[#D4D4D8] border border-[#1F1F1F] rounded-tl-xs shadow-md"
                  }`}
                >
                  {m.content}

                  {m.extractedCode && (
                    <div className="mt-3 pt-3 border-t border-[#222222] flex flex-col gap-2">
                      <div className="flex items-center justify-between text-[11px] font-mono text-[#F27D26]">
                        <span className="flex items-center gap-1">
                          <Code className="w-3.5 h-3.5" /> Ada / SPARK Kód
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleCopy(m.extractedCode!, m.id)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#1A1A1A] hover:bg-[#252525] text-[#D4D4D8] border border-[#2A2A2A] transition-colors text-[10px]"
                          >
                            {copiedId === m.id ? (
                              <Check className="w-3 h-3 text-[#00FF85]" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>{copiedId === m.id ? "Zkopírováno" : "Kopírovat"}</span>
                          </button>
                          {onOpenVerify && (
                            <button
                              onClick={() => onOpenVerify(m.extractedCode!)}
                              className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#F27D26]/15 hover:bg-[#F27D26]/25 text-[#F27D26] border border-[#F27D26]/30 transition-colors text-[10px]"
                            >
                              <ShieldCheck className="w-3 h-3" />
                              <span>Ověřit</span>
                            </button>
                          )}
                        </div>
                      </div>
                      <pre className="p-2.5 rounded-lg bg-[#070707] border border-[#1A1A1A] text-[11px] font-mono text-[#38BDF8] overflow-x-auto max-h-60">
                        {m.extractedCode}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-[#F27D26] p-3 rounded-xl bg-[#121212] border border-[#1A1A1A] w-fit">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Ada/SPARK Copilot přemýšlí a formuluje formální kód...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input form */}
          <div className="p-4 border-t border-[#1A1A1A] bg-[#0A0A0A]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Zeptej se Copilota (např. 'Jak napsat Post kontrakt pro buffer?')..."
                disabled={loading}
                className="flex-1 bg-[#141414] border border-[#222222] focus:border-[#F27D26] focus:outline-hidden text-xs text-[#EDEDED] placeholder-[#52525B] px-3.5 py-2.5 rounded-xl transition-colors"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-2.5 rounded-xl bg-gradient-to-r from-[#F27D26] to-[#E06A14] hover:from-[#FFA057] hover:to-[#F27D26] text-[#050505] font-bold shadow-lg shadow-[#F27D26]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </motion.aside>
      </div>
    </AnimatePresence>
  );
};
