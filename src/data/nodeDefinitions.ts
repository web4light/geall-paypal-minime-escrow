import { NodeCategory, NodeType } from "../types";

export interface NodeDefinition {
  type: NodeType;
  label: string;
  category: NodeCategory;
  description: string;
  iconName: string;
  defaultConfig: Record<string, any>;
  inputs: Array<{ id: string; name: string }>;
  outputs: Array<{ id: string; name: string }>;
}

export const NODE_DEFINITIONS: Record<NodeType, NodeDefinition> = {
  trigger_webhook: {
    type: "trigger_webhook",
    label: "Webhook Trigger",
    category: "trigger",
    description: "Spustí workflow při přijetí HTTP POST/GET požadavku",
    iconName: "Webhook",
    defaultConfig: {
      path: "/webhook/spark-trigger",
      method: "POST",
      authHeader: "",
    },
    inputs: [],
    outputs: [{ id: "main", name: "Data" }],
  },
  trigger_cron: {
    type: "trigger_cron",
    label: "Cron / Schedule",
    category: "trigger",
    description: "Periodické spouštění v zadaných časových intervalech",
    iconName: "Clock",
    defaultConfig: {
      cronExpression: "0 */4 * * *",
      timezone: "Europe/Prague",
    },
    inputs: [],
    outputs: [{ id: "main", name: "Trigger" }],
  },
  trigger_github: {
    type: "trigger_github",
    label: "GitHub Trigger",
    category: "trigger",
    description: "Reaguje na GitHub Webhook události (Issues, Push, PR)",
    iconName: "Github",
    defaultConfig: {
      repository: "organization/repo",
      event: "issues.opened",
      filterLabel: "spark-generate",
    },
    inputs: [],
    outputs: [{ id: "main", name: "Event Payload" }],
  },
  trigger_manual: {
    type: "trigger_manual",
    label: "Manual Trigger",
    category: "trigger",
    description: "Ruční spuštění workflow jedním kliknutím",
    iconName: "PlayCircle",
    defaultConfig: {
      testPayload: JSON.stringify({ task: "Vytvoř buffer pro 100 zpráv", priority: "high" }, null, 2),
    },
    inputs: [],
    outputs: [{ id: "main", name: "Payload" }],
  },
  spark_agent: {
    type: "spark_agent",
    label: "Asterisk Agent (Panoramiks)",
    category: "spark_ai",
    description: "Generuje formálně ověřitelný Panoramiks / Asterisk kód s kontrakty pro Obelisk",
    iconName: "Cpu",
    defaultConfig: {
      model: "local-qnx8-synthesizer",
      temperature: 0.2,
      packageName: "QNX_Neutrino_IPC_Guard",
      task: "Vytvoř QNX 8.0 Neutrino IPC Guard s děděním priorit a Pre/Post kontrakty.",
      strictGoldenRules: true,
      customPromptOverride: "",
    },
    inputs: [{ id: "main", name: "Input Payload" }],
    outputs: [
      { id: "main", name: "Asterisk Artifacts" },
      { id: "error", name: "On Error" },
    ],
  },
  spark_verifier: {
    type: "spark_verifier",
    label: "Obelisk Formal Verifier (GNATprove)",
    category: "spark_ai",
    description: "Kontroluje 10 nepřekročitelných pravidel Asterisk & generuje VCs přes Obelisk",
    iconName: "ShieldCheck",
    defaultConfig: {
      mode: "auto",
      proofLevel: 4,
      timeoutSec: 30,
      strictSubtypes: true,
      enforceContracts: true,
      checkNoHeap: true,
      checkNoExceptions: true,
    },
    inputs: [{ id: "main", name: "Panoramiks Code" }],
    outputs: [
      { id: "main", name: "Verified Artifact" },
      { id: "error", name: "Rule Violation" },
    ],
  },
  ada_bundler: {
    type: "ada_bundler",
    label: "Panoramiks / QNX Bundler",
    category: "spark_ai",
    description: "Zabalí .ads/.adb a QNX 8.0 resource manager do projektu (qcc / mkifs / Obelisk)",
    iconName: "Package",
    defaultConfig: {
      projectName: "qnx_neutrino_ipc_guard",
      version: "1.0.0",
      license: "Apache-2.0",
    },
    inputs: [{ id: "main", name: "Panoramiks Files" }],
    outputs: [{ id: "main", name: "QNX / Alire Bundle" }],
  },
  ai_gemini: {
    type: "ai_gemini",
    label: "Gemini AI Node",
    category: "spark_ai",
    description: "Obecný Gemini uzel pro analýzu, refaktoring či dokumentaci",
    iconName: "Sparkles",
    defaultConfig: {
      model: "gemini-2.5-flash",
      systemInstruction: "Jsi expert na formální metody a bezpečnostní kritické systémy.",
      promptTemplate: "Zanalyzuj následující bezpečnostní požadavky: {{input}}",
    },
    inputs: [{ id: "main", name: "Input" }],
    outputs: [{ id: "main", name: "Response" }],
  },
  github_action: {
    type: "github_action",
    label: "GitHub Commit / PR",
    category: "integration",
    description: "Uloží vygenerované .ads/.adb do GitHub repozitáře nebo vytvoří PR",
    iconName: "GitPullRequest",
    defaultConfig: {
      repo: "user/aerospace-ada-repo",
      branch: "spark-auto-modules",
      path: "src/",
      createPR: true,
      prTitle: "feat(spark): add verified Ada/SPARK package",
    },
    inputs: [{ id: "main", name: "Code Artifact" }],
    outputs: [{ id: "main", name: "PR / Commit Result" }],
  },
  discord_webhook: {
    type: "discord_webhook",
    label: "Discord Alert",
    category: "integration",
    description: "Odešle zprávu do Discord kanálu s výsledkem gnatprove auditu",
    iconName: "MessageSquare",
    defaultConfig: {
      webhookUrl: "https://discord.com/api/webhooks/DEMO/SPARK_CI",
      channel: "#spark-ci-alerts",
      embedColor: "#f59e0b",
      includeCodeSnippet: true,
    },
    inputs: [{ id: "main", name: "Data" }],
    outputs: [{ id: "main", name: "Status" }],
  },
  slack_notification: {
    type: "slack_notification",
    label: "Slack Notification",
    category: "integration",
    description: "Odešle interaktivní Block Kit zprávu do Slacku",
    iconName: "Slack",
    defaultConfig: {
      channel: "#safety-ada-builds",
      webhookUrl: "https://hooks.slack.com/services/DEMO/SLACK",
      notifyOnProofFailure: true,
    },
    inputs: [{ id: "main", name: "Payload" }],
    outputs: [{ id: "main", name: "Response" }],
  },
  http_request: {
    type: "http_request",
    label: "HTTP Request",
    category: "integration",
    description: "Volá libovolné REST API (GET, POST, PUT, DELETE)",
    iconName: "Globe",
    defaultConfig: {
      method: "POST",
      url: "https://api.example.com/ada/builds",
      headers: "Content-Type: application/json\nAuthorization: Bearer SECRET",
      body: JSON.stringify({ event: "spark_verification_completed" }, null, 2),
    },
    inputs: [{ id: "main", name: "Input" }],
    outputs: [{ id: "main", name: "API Response" }],
  },
  email_dispatch: {
    type: "email_dispatch",
    label: "Email Dispatcher",
    category: "integration",
    description: "Odešle email s přiloženými Ada specifikacemi a reportem",
    iconName: "Mail",
    defaultConfig: {
      to: "lead-engineer@safety-critical.aero",
      subject: "[SPARK CI] Nově ověřený Ada balíček",
      attachCode: true,
    },
    inputs: [{ id: "main", name: "Payload" }],
    outputs: [{ id: "main", name: "Sent Status" }],
  },
  condition_filter: {
    type: "condition_filter",
    label: "IF / Condition Filter",
    category: "logic",
    description: "Podmíněné větvení na základě formálního auditu nebo JSON dat",
    iconName: "GitBranch",
    defaultConfig: {
      condition: "verification.overallPassed == true",
    },
    inputs: [{ id: "main", name: "Input" }],
    outputs: [
      { id: "true", name: "True (Pass)" },
      { id: "false", name: "False (Fail)" },
    ],
  },
  js_code: {
    type: "js_code",
    label: "JavaScript Code Node",
    category: "logic",
    description: "Transformace dat a payloadu pomocí JS skriptu",
    iconName: "Code",
    defaultConfig: {
      code: `// Transform input payload
return {
  packageName: input.packageName || "Message_Buffer",
  task: input.task || "Vytvoř buffer pro 100 zpráv",
  timestamp: new Date().toISOString()
};`,
    },
    inputs: [{ id: "main", name: "Input" }],
    outputs: [{ id: "main", name: "Transformed" }],
  },
};
