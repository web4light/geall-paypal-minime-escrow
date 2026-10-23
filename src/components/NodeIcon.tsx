import React from "react";
import {
  Webhook,
  Clock,
  Github,
  PlayCircle,
  Cpu,
  ShieldCheck,
  ShieldAlert,
  Package,
  Sparkles,
  GitPullRequest,
  GitCommit,
  MessageSquare,
  Slack,
  Globe,
  Mail,
  GitBranch,
  Code,
  Layers,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileCode,
  Terminal,
  Activity,
  Zap,
} from "lucide-react";

interface NodeIconProps {
  name: string;
  className?: string;
}

export const NodeIcon: React.FC<NodeIconProps> = ({ name, className = "w-5 h-5" }) => {
  switch (name.toLowerCase()) {
    case "webhook":
      return <Webhook className={className} />;
    case "clock":
      return <Clock className={className} />;
    case "github":
      return <Github className={className} />;
    case "playcircle":
      return <PlayCircle className={className} />;
    case "cpu":
      return <Cpu className={className} />;
    case "shieldcheck":
      return <ShieldCheck className={className} />;
    case "shieldalert":
      return <ShieldAlert className={className} />;
    case "package":
      return <Package className={className} />;
    case "sparkles":
      return <Sparkles className={className} />;
    case "gitpullrequest":
      return <GitPullRequest className={className} />;
    case "gitcommit":
      return <GitCommit className={className} />;
    case "messagesquare":
      return <MessageSquare className={className} />;
    case "slack":
      return <Slack className={className} />;
    case "globe":
      return <Globe className={className} />;
    case "mail":
      return <Mail className={className} />;
    case "gitbranch":
      return <GitBranch className={className} />;
    case "code":
      return <Code className={className} />;
    case "terminal":
      return <Terminal className={className} />;
    case "activity":
      return <Activity className={className} />;
    case "zap":
      return <Zap className={className} />;
    default:
      return <Layers className={className} />;
  }
};

export const StatusIcon: React.FC<{ status?: string; className?: string }> = ({ status, className = "w-4 h-4" }) => {
  switch (status) {
    case "success":
      return <CheckCircle className={`text-emerald-400 ${className}`} />;
    case "warning":
      return <AlertTriangle className={`text-amber-400 ${className}`} />;
    case "error":
      return <XCircle className={`text-rose-400 ${className}`} />;
    case "running":
      return <Activity className={`text-blue-400 animate-spin ${className}`} />;
    default:
      return <div className={`w-2 h-2 rounded-full bg-slate-600 ${className}`} />;
  }
};
