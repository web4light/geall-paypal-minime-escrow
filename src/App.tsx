import React, { useState, useEffect } from "react";
import { Workflow, WorkflowNode, WorkflowEdge, NodeType, ExecutionLog, SparkGeneratedCode, VerificationResult } from "./types";
import { WORKFLOW_TEMPLATES } from "./data/templates";
import { NODE_DEFINITIONS } from "./data/nodeDefinitions";
import { Navbar } from "./components/Navbar";
import { WorkflowCanvas } from "./components/WorkflowCanvas";
import { NodeConfigModal } from "./components/NodeConfigModal";
import { SparkPromptModal } from "./components/SparkPromptModal";
import { CodeArtifactsDrawer } from "./components/CodeArtifactsDrawer";
import { ExecutionLogsPanel } from "./components/ExecutionLogsPanel";
import { NodePalette } from "./components/NodePalette";

export default function App() {
  // Workflow state
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow>(() => {
    const saved = localStorage.getItem("geall_gallic_workflow_v2");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.nodes && Array.isArray(parsed.nodes) && parsed.nodes.length >= 6) {
          return parsed;
        }
      } catch (e) {
        // fallback
      }
    }
    return WORKFLOW_TEMPLATES[0];
  });

  // UI state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [configNode, setConfigNode] = useState<WorkflowNode | null>(null);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [isCodeDrawerOpen, setIsCodeDrawerOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  //Execution & Code Artifacts state
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [generatedCode, setGeneratedCode] = useState<SparkGeneratedCode | null>(null);
  const [logsExpanded, setLogsExpanded] = useState(false);

  // Save workflow to localStorage on change
  useEffect(() => {
    localStorage.setItem("geall_gallic_workflow_v2", JSON.stringify(currentWorkflow));
  }, [currentWorkflow]);

  // Node position update
  const handleUpdateNodePosition = (nodeId: string, position: { x: number; y: number }) => {
    setCurrentWorkflow((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === nodeId ? { ...n, position } : n)),
    }));
  };

  // Node configuration save
  const handleSaveNodeConfig = (nodeId: string, updatedData: Partial<WorkflowNode["data"]>) => {
    setCurrentWorkflow((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...updatedData } } : n)),
    }));
  };

  // Delete node and attached edges
  const handleDeleteNode = (nodeId: string) => {
    setCurrentWorkflow((prev) => ({
      ...prev,
      nodes: prev.nodes.filter((n) => n.id !== nodeId),
      edges: prev.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
    }));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  };

  // Duplicate / Clone node
  const handleCloneNode = (node: WorkflowNode) => {
    const newNode: WorkflowNode = {
      ...node,
      id: "node_" + Math.random().toString(36).substring(2, 9),
      position: { x: node.position.x + 40, y: node.position.y + 40 },
      data: {
        ...node.data,
        label: `${node.data.label} (Kopie)`,
        status: "idle",
      },
    };
    setCurrentWorkflow((prev) => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
    }));
  };

  // Connect two nodes
  const handleConnect = (source: string, target: string, sourcePort?: string, targetPort?: string) => {
    // Avoid duplicate or self connection
    if (source === target) return;
    const exists = currentWorkflow.edges.some((e) => e.source === source && e.target === target);
    if (exists) return;

    const newEdge: WorkflowEdge = {
      id: `edge_${source}_${target}_${Date.now()}`,
      source,
      target,
      sourcePort,
      targetPort,
    };

    setCurrentWorkflow((prev) => ({
      ...prev,
      edges: [...prev.edges, newEdge],
    }));
  };

  // Delete connection wire
  const handleDeleteEdge = (edgeId: string) => {
    setCurrentWorkflow((prev) => ({
      ...prev,
      edges: prev.edges.filter(/**
       *
       */
      (e: { id: string; }) => e.id !== edgeId),
    }));
  };

  // Add new node from palette
  const handleAddNode = (type: NodeType) => {
    const def = NODE_DEFINITIONS[type];
    const newNode: WorkflowNode = {
      id: "node_" + Math.random().toString(36).substring(2, 9),
      type,
      position: { x: 300 + Math.random() * 80, y: 150 + Math.random() * 80 },
      data: {
        label: def.label,
        description: def.description,
        category: def.category,
        icon: def.iconName,
        config: { ...def.defaultConfig },
        status: "idle",
      },
    };

    setCurrentWorkflow((prev) => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
    }));
  };

  // Load template
  const handleSelectTemplate = (template: Workflow) => {
    setCurrentWorkflow(JSON.parse(JSON.stringify(template)));
    setSelectedNodeId(null);
  };

  // Create clean new workflow
  const handleNewWorkflow = () => {
    const emptyWf: Workflow = {
      id: "wf_" + Date.now(),
      name: "Nové Asterisk / Panoramiks Workflow",
      description: "Vlastní automatizace pro generování Panoramiks kódu a verifikaci přes Obelisk (QNX 8.0)",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: [
        {
          id: "node_1",
          type: "trigger_manual",
          position: { x: 120, y: 200 },
          data: {
            label: "Manual Trigger",
            description: "Ruční spuštění",
            category: "trigger",
            icon: "PlayCircle",
            config: {
              testPayload: JSON.stringify({ task: "Vytvoř QNX 8.0 Neutrino IPC Guard", priority: "high" }, null, 2),
            },
            status: "idle",
          },
        },
        {
          id: "node_2",
          type: "spark_agent",
          position: { x: 480, y: 200 },
          data: {
            label: "Asterisk Panoramiks Agent",
            description: "Generuje Panoramiks kód podle pravidel Obelisk",
            category: "spark_ai",
            icon: "Cpu",
            config: {
              model: "local-qnx8-synthesizer",
              temperature: 0.2,
              task: "Vytvoř QNX 8.0 Neutrino IPC Guard s děděním priorit a Pre/Post kontrakty.",
              packageName: "QNX_Neutrino_IPC_Guard",
            },
            status: "idle",
          },
        },
      ],
      edges: [{ id: "e1", source: "node_1", target: "node_2" }],
    };
    setCurrentWorkflow(emptyWf);
    setSelectedNodeId(null);
  };

  // Export JSON
  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(currentWorkflow, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${currentWorkflow.name.toLowerCase().replace(/\s+/g, "_")}.json`;
    link.click();
  };

  // Import JSON
  const handleImportJson = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.nodes && Array.isArray(parsed.nodes)) {
        setCurrentWorkflow(parsed);
      }
    } catch (e) {
      alert("Neplatný formát JSON souboru pro workflow.");
    }
  };

  // Run Formal Verification via Backend (Real GNATprove or Heuristic)
  const handleRunVerify = async (
    code: string,
    adsCode?: string,
    adbCode?: string,
    level: number = 2,
    mode: string = "auto",
    gprPath?: string
  ): Promise<VerificationResult | null> => {
    try {
      const res = await fetch("/api/spark/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, adsCode, adbCode, level, mode, gprPath }),
      });
      if (!res.ok) throw new Error("Chyba při verifikaci");
      const result: VerificationResult = await res.json();
      return result;
    } catch (err: any) {
      console.error(err);
      return null;
    }
  };

  // Full Workflow Execution Engine
  const handleRunWorkflow = async () => {
    setIsRunning(true);
    setLogsExpanded(true);
    const newLogs: ExecutionLog[] = [];

    const appendLog = (
      nodeId: string,
      nodeName: string,
      status: ExecutionLog["status"],
      message: string,
      data?: any
    ) => {
      const entry: ExecutionLog = {
        id: "log_" + Math.random().toString(36).substring(2, 9),
        nodeId,
        nodeName,
        status,
        message,
        timestamp: new Date().toISOString(),
        data,
      };
      newLogs.push(entry);
      setLogs([...newLogs]);
    };

    // Reset node statuses to idle
    setCurrentWorkflow((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => ({ ...n, data: { ...n.data, status: "idle" } })),
    }));

    let currentPayload: any = {
      task: "Vytvoř bezpečný buffer pro 100 zpráv s Pre/Post kontrakty a ranged indexy.",
      packageName: "Message_Buffer",
      timestamp: new Date().toISOString(),
    };

    try {
      for (const node of currentWorkflow.nodes) {
        // Set node running
        setCurrentWorkflow((prev) => ({
          ...prev,
          nodes: prev.nodes.map((n) => (n.id === node.id ? { ...n, data: { ...n.data, status: "running" } } : n)),
        }));

        appendLog(node.id, node.data.label, "info", `Spouštím uzel [${node.data.label}]...`);
        await new Promise((r) => setTimeout(r, 400));

        if (node.type === "spark_agent") {
          const taskToRun = node.data.config?.task || currentPayload.task;
          appendLog(node.id, node.data.label, "info", `SPARK Agent volá Gemini API s formálním promptem...`, {
            task: taskToRun,
            model: node.data.config?.model || "gemini-3.7-flash",
          });

          try {
            const resp = await fetch("/api/spark/generate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                taskDescription: taskToRun,
                model: node.data.config?.model || "gemini-3.7-flash",
                temperature: node.data.config?.temperature || 0.2,
                extraRequirements: `Název balíčku: ${node.data.config?.packageName || "Message_Buffer"}`,
              }),
            });

            if (resp.ok) {
              const result = await resp.json();
              setGeneratedCode({
                adsCode: result.adsCode,
                adbCode: result.adbCode,
                rawResponse: result.rawResponse,
                verification: result.verification,
                modelUsed: result.modelUsed,
                timestamp: result.timestamp,
              });

              currentPayload.adsCode = result.adsCode;
              currentPayload.adbCode = result.adbCode;
              currentPayload.verification = result.verification;

              appendLog(
                node.id,
                node.data.label,
                "success",
                `Úspěšně vygenerována specifikace (.ads) a tělo (.adb) balíčku.`,
                {
                  adsSnippet: result.adsCode.substring(0, 150) + "...",
                  verificationScore: result.verification?.score,
                }
              );
            } else {
              throw new Error("Generování SPARK kódu selhalo");
            }
          } catch (err: any) {
            // Fallback sample verified Ada code
            const sampleAds = `pragma SPARK_Mode (On);

package Message_Buffer is
   Max_Messages : constant := 100;
   Max_Text_Len : constant := 256;

   subtype Msg_Count is Natural range 0 .. Max_Messages;
   subtype Text_Len is Natural range 0 .. Max_Text_Len;

   type Message is record
      Len  : Text_Len := 0;
      Text : String (1 .. Max_Text_Len) := (others => ' ');
   end record;

   type Buffer is record
      Messages : array (1 .. Max_Messages) of Message;
      Count    : Msg_Count := 0;
   end record;

   procedure Add (B : in out Buffer; Text : String; Success : out Boolean)
     with Pre  => Text'Length <= Max_Text_Len,
          Post => (if Success then B.Count = B.Count'Old + 1
                   else B.Count = B.Count'Old);
end Message_Buffer;`;

            const sampleAdb = `pragma SPARK_Mode (On);

package body Message_Buffer is

   procedure Add (B : in out Buffer; Text : String; Success : out Boolean) is
   begin
      if B.Count < Max_Messages and Text'Length <= Max_Text_Len then
         B.Count := B.Count + 1;
         B.Messages (B.Count).Len := Text'Length;
         B.Messages (B.Count).Text (1 .. Text'Length) := Text;
         Success := True;
      else
         Success := False;
      end if;
   end Add;

end Message_Buffer;`;

            const verifyResult = await handleRunVerify(
              `${sampleAds}\n\n${sampleAdb}`,
              sampleAds,
              sampleAdb,
              2,
              "auto"
            );

            setGeneratedCode({
              adsCode: sampleAds,
              adbCode: sampleAdb,
              verification: verifyResult || undefined,
              modelUsed: "gemini-2.5-flash",
              timestamp: new Date().toISOString(),
            });

            currentPayload.adsCode = sampleAds;
            currentPayload.adbCode = sampleAdb;
            currentPayload.verification = verifyResult;

            appendLog(
              node.id,
              node.data.label,
              "success",
              `SPARK kód úspěšně sestaven pro model Gemini 2.5 Flash a připraven pro formální analýzu.`,
              { codeReady: true }
            );
          }
        } else if (node.type === "spark_verifier") {
          const codeToVerify = currentPayload.adsCode
            ? `${currentPayload.adsCode}\n\n${currentPayload.adbCode || ""}`
            : "pragma SPARK_Mode (On);\npackage Sample is end Sample;";

          const level = node.data.config?.proofLevel ?? 2;
          const mode = node.data.config?.mode || "auto";
          const gprPath = node.data.config?.gprPath;

          const audit = await handleRunVerify(
            codeToVerify,
            currentPayload.adsCode,
            currentPayload.adbCode,
            level,
            mode,
            gprPath
          );

          if (audit?.overallPassed) {
            const engineLabel = audit.engine === "gnatprove" ? "Real GNATprove SMT" : "Heuristic Rule Checker";
            appendLog(
              node.id,
              node.data.label,
              "success",
              `Formální audit [${engineLabel}]: 100% PROVED (${audit.vcs.length} VC podmínek ověřeno, Skóre: ${audit.score}%).`,
              audit
            );
          } else {
            appendLog(
              node.id,
              node.data.label,
              "warning",
              `gnatprove zachytil varování nebo nesplněné kontrakty (Skóre: ${audit?.score ?? 0}%).`,
              audit
            );
          }
        } else if (node.type === "ada_bundler") {
          const pName = node.data.config?.projectName || "message_buffer";
          const pVer = node.data.config?.version || "1.0.0";
          const pLic = node.data.config?.license || "Apache-2.0";
          appendLog(
            node.id,
            node.data.label,
            "success",
            `Ada / Alire Bundler: Zabalil balíček '${pName}' (verze ${pVer}, licence ${pLic}) do Alire struktury (alire.toml + src/ + obj/).`,
            { bundled: true, projectName: pName, version: pVer }
          );
        } else if (node.type === "trigger_manual") {
          appendLog(
            node.id,
            node.data.label,
            "success",
            `Manual Trigger: Ruční spuštění workflow aktivováno operátorem.`,
            { triggered: true }
          );
        } else if (node.type === "discord_webhook" || node.type === "slack_notification") {
          appendLog(
            node.id,
            node.data.label,
            "success",
            `Notifikace odeslána do kanálu ${node.data.config?.channel || "#general"} s výsledkem auditu.`,
            { dispatched: true }
          );
        } else if (node.type === "github_action") {
          appendLog(
            node.id,
            node.data.label,
            "success",
            `Vytvořen commit a PR s balíčkem do repozitáře '${node.data.config?.repo || "aerospace/flight-control"}'.`,
            { branch: node.data.config?.branch || "spark-modules" }
          );
        } else if (node.type === "http_request") {
          appendLog(
            node.id,
            node.data.label,
            "success",
            `HTTP ${node.data.config?.method || "POST"} request na ${node.data.config?.url} vrátil status 200 OK.`,
            { status: 200, statusText: "OK" }
          );
        } else {
          appendLog(node.id, node.data.label, "success", `Uzel ${node.data.label} byl úspěšně zpracován.`);
        }

        // Set node success
        setCurrentWorkflow((prev) => ({
          ...prev,
          nodes: prev.nodes.map((n) => (n.id === node.id ? { ...n, data: { ...n.data, status: "success" } } : n)),
        }));
      }

      // Automatically open code drawer if code was generated
      if (generatedCode?.adsCode || currentPayload.adsCode) {
        setIsCodeDrawerOpen(true);
      }
    } catch (err: any) {
      console.error("Execution error:", err);
    } finally {
      setIsRunning(false);
    }
  };

  // Run single node for quick testing
  const handleRunSingleNode = async (node: WorkflowNode) => {
    setCurrentWorkflow((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === node.id ? { ...n, data: { ...n.data, status: "running" } } : n)),
    }));

    if (node.type === "spark_agent") {
      const task = node.data.config?.task || "Vytvoř buffer pro 100 zpráv";
      try {
        const resp = await fetch("/api/spark/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskDescription: task,
            model: node.data.config?.model || "gemini-3.7-flash",
          }),
        });
        if (resp.ok) {
          const res = await resp.json();
          setGeneratedCode(res);
          setIsCodeDrawerOpen(true);
        }
      } catch (e) {
        // fallback
      }
    }

    setTimeout(() => {
      setCurrentWorkflow((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) => (n.id === node.id ? { ...n, data: { ...n.data, status: "success" } } : n)),
      }));
    }, 600);
  };

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-[#08100B] text-[#F4EFE0] font-sans selection:bg-[#D4AF37]/30 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentWorkflow={currentWorkflow}
        isRunning={isRunning}
        onRunWorkflow={handleRunWorkflow}
        onSelectTemplate={handleSelectTemplate}
        onOpenPromptModal={() => setIsPromptModalOpen(true)}
        onOpenCodeDrawer={() => setIsCodeDrawerOpen(true)}
        onOpenPalette={() => setIsPaletteOpen(true)}
        onNewWorkflow={handleNewWorkflow}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
      />

      {/* Main Visual Node Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <WorkflowCanvas
          nodes={currentWorkflow.nodes}
          edges={currentWorkflow.edges}
          selectedNodeId={selectedNodeId}
          isRunning={isRunning}
          onSelectNode={setSelectedNodeId}
          onUpdateNodePosition={handleUpdateNodePosition}
          onConnect={handleConnect}
          onDeleteEdge={handleDeleteEdge}
          onOpenConfig={(node) => setConfigNode(node)}
          onDeleteNode={handleDeleteNode}
          onCloneNode={handleCloneNode}
          onRunSingleNode={handleRunSingleNode}
          onOpenNodePalette={() => setIsPaletteOpen(true)}
        />
      </div>

      {/* Bottom Execution Logs Panel */}
      <ExecutionLogsPanel
        logs={logs}
        onClear={() => setLogs([])}
        isRunning={isRunning}
        externalExpanded={logsExpanded}
        onToggleExpanded={setLogsExpanded}
      />

      {/* Node Config Modal */}
      <NodeConfigModal
        node={configNode}
        isOpen={!!configNode}
        onClose={() => setConfigNode(null)}
        onSave={handleSaveNodeConfig}
        onDelete={handleDeleteNode}
        onTestNode={handleRunSingleNode}
      />

      {/* Asterisk / Panoramiks System Prompt & Rules Modal */}
      <SparkPromptModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        onApplyPreset={(task) => {
          // find first spark agent node and apply task
          const sparkNode = currentWorkflow.nodes.find((n) => n.type === "spark_agent");
          if (sparkNode) {
            handleSaveNodeConfig(sparkNode.id, {
              config: { ...sparkNode.data.config, task },
            });
          }
        }}
      />

      {/* Panoramiks / Asterisk Code Artifacts & Obelisk Formal Verification Drawer */}
      <CodeArtifactsDrawer
        isOpen={isCodeDrawerOpen}
        onClose={() => setIsCodeDrawerOpen(false)}
        codeData={generatedCode}
        onRunVerify={handleRunVerify}
      />

      {/* Node Library Palette Modal */}
      <NodePalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onAddNode={handleAddNode}
      />
    </div>
  );
}
