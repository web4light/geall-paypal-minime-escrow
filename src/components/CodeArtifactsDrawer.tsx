import React, { useState } from "react";
import { motion } from "motion/react";
import {
  X,
  Copy,
  Check,
  Download,
  ShieldCheck,
  ShieldAlert,
  FileCode,
  Package,
  Play,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  Terminal,
} from "lucide-react";
import { SparkGeneratedCode, VerificationResult } from "../types";

interface CodeArtifactsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  codeData: SparkGeneratedCode | null;
  onRunVerify?: (code: string) => Promise<VerificationResult | null>;
}

export const CodeArtifactsDrawer: React.FC<CodeArtifactsDrawerProps> = ({
  isOpen,
  onClose,
  codeData,
  onRunVerify,
}) => {
  const [activeTab, setActiveTab] = useState<"ads" | "adb" | "verifier" | "alire">("ads");
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showRawLog, setShowRawLog] = useState(false);
  const [localVerification, setLocalVerification] = useState<VerificationResult | null>(
    codeData?.verification || null
  );

  if (!isOpen) return null;

  const defaultAds = codeData?.adsCode || `-- pragma SPARK_Mode (On);
-- Zatím nebyl vygenerován žádný SPARK kód.
-- Spusťte workflow nebo uzel SPARK Ada Agent pro vygenerování.`;

  const defaultAdb = codeData?.adbCode || `-- pragma SPARK_Mode (On);
-- Tělo balíčku (.adb) se zobrazí po spuštění SPARK Agenta.`;

  const alireToml = `name = "spark_generated_module"
description = "Formally verified Ada/SPARK safety-critical package"
version = "1.0.0"
authors = ["SPARK Automate Agent"]
maintainers = ["safety@aerospace.io"]
licenses = "Apache-2.0"

[build-switches]
"*".spark_mode = "on"
"*".gnatprove_mode = "all"
"*".contracts = "enabled"

[[depends-on]]
gnatprove = ">=2022.0.0"`;

  const gnatProject = `project Spark_Module is
   for Source_Dirs use ("src");
   for Object_Dir use "obj";
   for Main use ();

   package Compiler is
      for Default_Switches ("Ada") use ("-gnat2022", "-gnatW8", "-gnata", "-gnatwa");
   end Compiler;

   package Prove is
      for Proof_Switches ("Ada") use ("--level=3", "--report=all", "--warnings=error");
   end Prove;
end Spark_Module;`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const packageName = "Message_Buffer";
    const adsBlob = new Blob([defaultAds], { type: "text/plain" });
    const adbBlob = new Blob([defaultAdb], { type: "text/plain" });

    // Download ads
    const adsLink = document.createElement("a");
    adsLink.href = URL.createObjectURL(adsBlob);
    adsLink.download = `${packageName.toLowerCase()}.ads`;
    adsLink.click();

    // Download adb
    setTimeout(() => {
      const adbLink = document.createElement("a");
      adbLink.href = URL.createObjectURL(adbBlob);
      adbLink.download = `${packageName.toLowerCase()}.adb`;
      adbLink.click();
    }, 200);
  };

  const handleManualVerify = async () => {
    if (!onRunVerify) return;
    setIsVerifying(true);
    const fullCode = `${defaultAds}\n\n${defaultAdb}`;
    const result = await onRunVerify(fullCode);
    if (result) {
      setLocalVerification(result);
    }
    setIsVerifying(false);
  };

  const verificationToDisplay = localVerification || codeData?.verification;

  return (
    <motion.div
      initial={{ x: 500, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 500, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-y-0 right-0 z-40 w-full max-w-2xl bg-[#0D0D0D] border-l border-[#1A1A1A] shadow-2xl flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A1A1A] bg-[#050505]/90">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#F27D26]/15 text-[#F27D26] border border-[#F27D26]/30">
            <FileCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#EDEDED] flex items-center gap-2">
              Ada / SPARK Code Artifacts
              {verificationToDisplay && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-mono flex items-center gap-1 ${
                    verificationToDisplay.overallPassed
                      ? "bg-[#00FF85]/15 text-[#00FF85] border border-[#00FF85]/30"
                      : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                  }`}
                >
                  {verificationToDisplay.overallPassed ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" /> gnatprove PASSED
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3" /> Rules Violated
                    </>
                  )}
                </span>
              )}
            </h3>
            <p className="text-xs text-[#71717A]">Specifikace (.ads), tělo (.adb) a formální audit</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            title="Stáhnout Ada soubory"
            className="p-2 rounded-lg bg-[#181818] hover:bg-[#222222] text-[#A1A1AA] hover:text-white transition-colors border border-[#222222]"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#71717A] hover:text-[#EDEDED] hover:bg-[#1A1A1A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between px-6 pt-3 border-b border-[#1A1A1A] bg-[#0A0A0A]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("ads")}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "ads"
                ? "border-[#F27D26] text-[#F27D26]"
                : "border-transparent text-[#71717A] hover:text-[#EDEDED]"
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            Specifikace (.ads)
          </button>
          <button
            onClick={() => setActiveTab("adb")}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "adb"
                ? "border-[#F27D26] text-[#F27D26]"
                : "border-transparent text-[#71717A] hover:text-[#EDEDED]"
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            Tělo modulu (.adb)
          </button>
          <button
            onClick={() => setActiveTab("verifier")}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "verifier"
                ? "border-[#F27D26] text-[#F27D26]"
                : "border-transparent text-[#71717A] hover:text-[#EDEDED]"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            gnatprove VC Audit
          </button>
          <button
            onClick={() => setActiveTab("alire")}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "alire"
                ? "border-[#F27D26] text-[#F27D26]"
                : "border-transparent text-[#71717A] hover:text-[#EDEDED]"
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            Alire Project
          </button>
        </div>

        {activeTab !== "verifier" && (
          <button
            onClick={() =>
              handleCopy(
                activeTab === "ads"
                  ? defaultAds
                  : activeTab === "adb"
                  ? defaultAdb
                  : `${alireToml}\n\n-- spark_module.gpr:\n${gnatProject}`
              )
            }
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-[#181818] hover:bg-[#222222] text-[#A1A1AA] rounded-md transition-colors border border-[#222222]"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#00FF85]" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Zkopírováno" : "Kopírovat"}
          </button>
        )}
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#080808]">
        {activeTab === "ads" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-[#71717A]">
              <span>Formální specifikace balíčku s Pre/Post kontrakty a ranged subtypy</span>
              <span className="font-mono text-[#F27D26]">package spec</span>
            </div>
            <pre className="p-4 rounded-xl bg-[#050505] border border-[#1A1A1A] text-xs font-mono text-[#00FF85] whitespace-pre-wrap leading-relaxed overflow-x-auto selection:bg-[#00FF85]/30">
              {defaultAds}
            </pre>
          </div>
        )}

        {activeTab === "adb" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-[#71717A]">
              <span>Implementace těla balíčku bez dynamické alokace a bez výjimek</span>
              <span className="font-mono text-[#38BDF8]">package body</span>
            </div>
            <pre className="p-4 rounded-xl bg-[#050505] border border-[#1A1A1A] text-xs font-mono text-[#38BDF8] whitespace-pre-wrap leading-relaxed overflow-x-auto selection:bg-[#38BDF8]/30">
              {defaultAdb}
            </pre>
          </div>
        )}

        {activeTab === "verifier" && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between p-3.5 rounded-xl bg-[#050505] border border-[#1A1A1A] gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    verificationToDisplay?.overallPassed ? "bg-[#00FF85]/15 text-[#00FF85]" : "bg-rose-500/15 text-rose-400"
                  }`}
                >
                  {verificationToDisplay?.overallPassed ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-[#EDEDED]">
                      {verificationToDisplay?.overallPassed ? "Formální audit 100% úspěšný" : "Detekováno porušení pravidel SPARK"}
                    </h4>
                    {verificationToDisplay?.engine === "gnatprove" ? (
                      <span className="px-2 py-0.5 rounded-full bg-[#00FF85]/15 text-[#00FF85] border border-[#00FF85]/30 text-[10px] font-mono flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00FF85] animate-ping" /> Real GNATprove
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30 text-[10px] font-mono">
                        SPARK Heuristic Engine
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#71717A] mt-0.5">
                    Skóre: <strong className="text-[#F27D26]">{verificationToDisplay?.score ?? 100}%</strong>
                    {verificationToDisplay?.executionTimeMs ? ` • Čas: ${verificationToDisplay.executionTimeMs} ms` : ""}
                    {verificationToDisplay?.toolchainInfo?.path ? ` • Bin: ${verificationToDisplay.toolchainInfo.path}` : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {verificationToDisplay?.rawOutput && (
                  <button
                    onClick={() => setShowRawLog(!showRawLog)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-[#181818] hover:bg-[#222222] text-[#A1A1AA] rounded-lg transition-colors border border-[#222222]"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    {showRawLog ? "Skrýt CLI výstup" : "Zobrazit CLI výstup"}
                  </button>
                )}

                {onRunVerify && (
                  <button
                    onClick={handleManualVerify}
                    disabled={isVerifying}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-[#F27D26] hover:bg-[#FFA057] text-[#050505] rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Play className={`w-3.5 h-3.5 ${isVerifying ? "animate-spin" : ""}`} />
                    {isVerifying ? "Ověřuji..." : "Spustit Audit"}
                  </button>
                )}
              </div>
            </div>

            {showRawLog && verificationToDisplay?.rawOutput && (
              <div className="p-3 bg-[#030303] border border-[#222] rounded-xl space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-[#71717A]">
                  <span className="font-mono">GNATprove CLI Raw Report</span>
                  <span>Úroveň: Level 2 / Full VCs</span>
                </div>
                <pre className="p-2.5 bg-black rounded-lg text-[11px] font-mono text-[#D4D4D8] whitespace-pre-wrap max-h-52 overflow-y-auto leading-relaxed border border-[#181818]">
                  {verificationToDisplay.rawOutput}
                </pre>
              </div>
            )}

            {/* Rules Breakdown */}
            <div className="space-y-2">
              <h5 className="text-xs font-semibold text-[#71717A] uppercase tracking-wider">
                Kontrola 10 Nepřekročitelných pravidel
              </h5>
              <div className="space-y-1.5">
                {verificationToDisplay?.rulesChecked?.map((rc) => (
                  <div
                    key={rc.rule}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#050505] border border-[#1A1A1A] text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          rc.passed ? "bg-[#00FF85]/15 text-[#00FF85]" : "bg-rose-500/15 text-rose-400"
                        }`}
                      >
                        {rc.passed ? "✓" : "✗"}
                      </span>
                      <span className="font-medium text-[#EDEDED]">{rc.title}</span>
                    </div>
                    <span className={`text-[11px] ${rc.passed ? "text-[#71717A]" : "text-rose-400 font-semibold"}`}>
                      {rc.details}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Verification Conditions (VCs) */}
            <div className="space-y-2">
              <h5 className="text-xs font-semibold text-[#71717A] uppercase tracking-wider">
                Verification Conditions (VCs / SMT Solvers)
              </h5>
              <div className="rounded-xl border border-[#1A1A1A] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#050505] text-[#71717A] border-b border-[#1A1A1A] font-mono">
                    <tr>
                      <th className="p-2.5">VC ID</th>
                      <th className="p-2.5">Formální podmínka</th>
                      <th className="p-2.5">Stav solveru</th>
                      <th className="p-2.5 text-right">Čas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A1A1A] bg-[#0A0A0A]">
                    {verificationToDisplay?.vcs?.map((vc) => (
                      <tr key={vc.id} className="hover:bg-[#141414] font-mono">
                        <td className="p-2.5 text-[#F27D26] font-semibold">{vc.id}</td>
                        <td className="p-2.5 text-[#D4D4D8]">{vc.check}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded bg-[#00FF85]/15 text-[#00FF85] text-[11px] border border-[#00FF85]/30">
                            {vc.status}
                          </span>
                        </td>
                        <td className="p-2.5 text-right text-[#71717A]">{vc.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "alire" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-xs text-[#71717A] font-mono">alire.toml (Alire Package Definition)</span>
              <pre className="p-4 rounded-xl bg-[#050505] border border-[#1A1A1A] text-xs font-mono text-[#F27D26] whitespace-pre-wrap leading-relaxed overflow-x-auto">
                {alireToml}
              </pre>
            </div>
            <div className="space-y-2">
              <span className="text-xs text-[#71717A] font-mono">spark_module.gpr (GNAT Project File)</span>
              <pre className="p-4 rounded-xl bg-[#050505] border border-[#1A1A1A] text-xs font-mono text-[#38BDF8] whitespace-pre-wrap leading-relaxed overflow-x-auto">
                {gnatProject}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[#1A1A1A] bg-[#050505] flex items-center justify-between text-xs text-[#71717A]">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#F27D26]" />
          <span>Kompatibilní s GNAT Community / Alire / gnatprove -gnatW8</span>
        </div>
        <button
          onClick={handleDownload}
          className="px-4 py-2 bg-gradient-to-r from-[#F27D26] to-[#E06A14] hover:from-[#FFA057] hover:to-[#F27D26] text-[#050505] font-bold rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-[#F27D26]/20"
        >
          <Download className="w-4 h-4" />
          Stáhnout Balíček (.ads + .adb)
        </button>
      </div>
    </motion.div>
  );
};
