export type NodeCategory = "trigger" | "spark_ai" | "integration" | "logic" | "output";

export type NodeType =
  | "trigger_webhook"
  | "trigger_cron"
  | "trigger_github"
  | "trigger_manual"
  | "spark_agent"
  | "spark_verifier"
  | "ada_bundler"
  | "ai_gemini"
  | "github_action"
  | "discord_webhook"
  | "slack_notification"
  | "http_request"
  | "email_dispatch"
  | "js_code"
  | "condition_filter";

export interface NodePort {
  id: string;
  name: string;
  type: "main" | "true" | "false" | "error";
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: {
    label: string;
    description: string;
    category: NodeCategory;
    icon: string;
    config: Record<string, any>;
    status?: "idle" | "running" | "success" | "warning" | "error";
    lastOutput?: any;
    executionTimeMs?: number;
    errorMsg?: string;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourcePort?: string;
  targetPort?: string;
  label?: string;
  animated?: boolean;
}

export interface VerificationCondition {
  id: string;
  check: string;
  status: string;
  time: string;
}

export interface RuleCheckResult {
  rule: number;
  title: string;
  passed: boolean;
  details: string;
}

export interface VerificationResult {
  overallPassed: boolean;
  score: number;
  engine?: "gnatprove" | "heuristic";
  issues: Array<{
    type: "error" | "warning" | "info";
    message: string;
    rule: number;
    line?: number;
    file?: string;
  }>;
  rulesChecked: RuleCheckResult[];
  vcs: VerificationCondition[];
  verifiedAt: string;
  executionTimeMs?: number;
  rawOutput?: string;
  toolchainInfo?: {
    available: boolean;
    version?: string;
    path?: string;
    provers?: string[];
  };
}

export interface ExecutionLog {
  id: string;
  nodeId: string;
  nodeName: string;
  status: "success" | "warning" | "error" | "info";
  message: string;
  timestamp: string;
  data?: any;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  updatedAt: string;
}

export interface SparkGeneratedCode {
  adsCode: string;
  adbCode: string;
  rawResponse?: string;
  verification?: VerificationResult;
  modelUsed?: string;
  timestamp?: string;
}

export interface ToolchainStatus {
  available: boolean;
  version: string | null;
  path: string | null;
  provers: string[];
  mode: "gnatprove" | "heuristic";
  gnatVersion?: string | null;
  gprbuildVersion?: string | null;
}
