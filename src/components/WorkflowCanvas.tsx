import React, { useState, useRef, useEffect } from "react";
import { Plus, ZoomIn, ZoomOut, Maximize2, Trash2, Zap } from "lucide-react";
import { WorkflowNode, WorkflowEdge, NodeType } from "../types";
import { WorkflowNodeCard } from "./WorkflowNodeCard";

interface WorkflowCanvasProps {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodeId: string | null;
  isRunning?: boolean;
  onSelectNode: (nodeId: string | null) => void;
  onUpdateNodePosition: (nodeId: string, position: { x: number; y: number }) => void;
  onConnect: (source: string, target: string, sourcePort?: string, targetPort?: string) => void;
  onDeleteEdge: (edgeId: string) => void;
  onOpenConfig: (node: WorkflowNode) => void;
  onDeleteNode: (nodeId: string) => void;
  onCloneNode: (node: WorkflowNode) => void;
  onRunSingleNode?: (node: WorkflowNode) => void;
  onOpenNodePalette: () => void;
}

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  nodes,
  edges,
  selectedNodeId,
  isRunning,
  onSelectNode,
  onUpdateNodePosition,
  onConnect,
  onDeleteEdge,
  onOpenConfig,
  onDeleteNode,
  onCloneNode,
  onRunSingleNode,
  onOpenNodePalette,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 100, y: 80 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Dragging node state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Interactive connection state
  const [connectingSource, setConnectingSource] = useState<{
    nodeId: string;
    portId: string;
  } | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Handle Pan Mouse Events
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === "svg") {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      onSelectNode(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    } else if (draggingNodeId) {
      const newX = (e.clientX - pan.x) / zoom - dragOffset.x;
      const newY = (e.clientY - pan.y) / zoom - dragOffset.y;
      onUpdateNodePosition(draggingNodeId, {
        x: Math.round(newX / 20) * 20, // 20px snap to grid
        y: Math.round(newY / 20) * 20,
      });
    }

    if (connectingSource) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setCursorPos({
          x: (e.clientX - rect.left - pan.x) / zoom,
          y: (e.clientY - rect.top - pan.y) / zoom,
        });
      }
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
    setConnectingSource(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((prev) => Math.min(Math.max(0.4, prev * zoomFactor), 2));
  };

  const startNodeDrag = (nodeId: string, e: React.MouseEvent) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    setDraggingNodeId(nodeId);
    setDragOffset({
      x: (e.clientX - pan.x) / zoom - node.position.x,
      y: (e.clientY - pan.y) / zoom - node.position.y,
    });
  };

  const handleStartConnection = (nodeId: string, portId: string) => {
    setConnectingSource({ nodeId, portId });
  };

  const handleEndConnection = (targetNodeId: string, targetPortId: string) => {
    if (connectingSource && connectingSource.nodeId !== targetNodeId) {
      onConnect(connectingSource.nodeId, targetNodeId, connectingSource.portId, targetPortId);
    }
    setConnectingSource(null);
  };

  // Node position helper for edge wires (standard 288px width, 120px approx height)
  const getNodeCenter = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    return {
      outputX: node.position.x + 288,
      outputY: node.position.y + 60,
      inputX: node.position.x,
      inputY: node.position.y + 60,
    };
  };

  const resetView = () => {
    setPan({ x: 100, y: 80 });
    setZoom(1);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      className="relative flex-1 w-full h-full overflow-hidden bg-gradient-to-br from-[#070E09] via-[#0B160E] to-[#08100B] cursor-crosshair select-none"
    >
      {/* Gallic Golden Mistletoe & Menhir Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `radial-gradient(#D4AF37 1.2px, transparent 1.2px)`,
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      />

      {/* Top Gallic Banner Badge on Canvas */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none hidden md:flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#0C1710]/90 border border-[#D4AF37]/35 backdrop-blur-md shadow-xl">
        <span className="text-xs font-gaul font-bold text-[#D4AF37] tracking-wider">
          🛡️ GALSKÁ TVRZ G(E)A(L)L
        </span>
        <span className="text-[#2A4230]">•</span>
        <span className="text-[11px] font-mono text-[#E2DEC9]">
          Panoramiks (Ada) + Asterisk (SPARK) + Obelisk (GNATprove) → QNX SDP 8.0
        </span>
      </div>

      {/* Left-side Floating Tools Panel */}
      <div className="absolute top-4 left-4 z-30 flex flex-col gap-1 p-1.5 rounded-xl bg-[#0D1911]/95 border border-[#D4AF37]/30 backdrop-blur-md shadow-2xl">
        <button
          onClick={onOpenNodePalette}
          title="Otevřít kovárnu a knihovnu galských uzlů"
          className="p-2 rounded-lg bg-[#D4AF37]/15 text-[#D4AF37] hover:bg-[#D4AF37]/25 transition-colors border border-[#D4AF37]/40"
        >
          <Plus className="w-4 h-4" />
        </button>
        <div className="h-px w-full bg-[#213426] my-0.5" />
        <button
          onClick={() => setZoom((z) => Math.min(z + 0.15, 2))}
          title="Přiblížit (+)"
          className="p-2 rounded-lg text-[#9CAEA2] hover:text-[#F4EFE0] hover:bg-[#162B1D] transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(z - 0.15, 0.4))}
          title="Oddálit (-)"
          className="p-2 rounded-lg text-[#9CAEA2] hover:text-[#F4EFE0] hover:bg-[#162B1D] transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={resetView}
          title="Vycentrovat zobrazení"
          className="p-2 rounded-lg text-[#9CAEA2] hover:text-[#F4EFE0] hover:bg-[#162B1D] transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Canvas Controls */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-1.5 p-1.5 rounded-xl bg-[#0D1911]/95 border border-[#D4AF37]/30 backdrop-blur-md shadow-2xl">
        <button
          onClick={() => setZoom((z) => Math.min(z + 0.15, 2))}
          title="Přiblížit (+)"
          className="p-2 rounded-lg text-[#9CAEA2] hover:text-[#F4EFE0] hover:bg-[#162B1D] transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <span className="text-[11px] font-mono text-[#D4AF37] px-1 min-w-[42px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.max(z - 0.15, 0.4))}
          title="Oddálit (-)"
          className="p-2 rounded-lg text-[#9CAEA2] hover:text-[#F4EFE0] hover:bg-[#162B1D] transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={resetView}
          title="Resetovat zobrazení"
          className="p-2 rounded-lg text-[#9CAEA2] hover:text-[#F4EFE0] hover:bg-[#162B1D] transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Add Node FAB */}
      <div className="absolute bottom-6 right-6 z-30">
        <button
          onClick={onOpenNodePalette}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#B8860B] hover:from-[#FDE047] hover:to-[#D4AF37] text-[#08100B] font-bold text-xs shadow-xl shadow-[#D4AF37]/25 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Přidat Galský Uzel
        </button>
      </div>

      {/* Transformable Graph Surface */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
        }}
        className="absolute inset-0 pointer-events-auto"
      >
        {/* SVG Bezier Edges / Connection Cables */}
        <svg className="absolute inset-0 w-[5000px] h-[5000px] pointer-events-none z-10 overflow-visible">
          <defs>
            <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#D4AF37" />
              <stop offset="50%" stopColor="#4ADE80" />
              <stop offset="100%" stopColor="#38BDF8" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="glow" />
              <feComposite in="SourceGraphic" in2="glow" operator="over" />
            </filter>
          </defs>

          {/* Rendered Workflow Edges */}
          {edges.map((edge) => {
            const sourcePos = getNodeCenter(edge.source);
            const targetPos = getNodeCenter(edge.target);

            const dx = Math.abs(targetPos.inputX - sourcePos.outputX) * 0.5;
            const pathData = `M ${sourcePos.outputX} ${sourcePos.outputY} C ${sourcePos.outputX + dx} ${
              sourcePos.outputY
            }, ${targetPos.inputX - dx} ${targetPos.inputY}, ${targetPos.inputX} ${targetPos.inputY}`;

            return (
              <g key={edge.id} className="pointer-events-auto group">
                {/* Background click target */}
                <path
                  d={pathData}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={14}
                  className="cursor-pointer"
                  onClick={() => onDeleteEdge(edge.id)}
                />
                {/* Visual cable */}
                <path
                  d={pathData}
                  fill="none"
                  stroke="url(#edgeGradient)"
                  strokeWidth={2.5}
                  className="group-hover:stroke-rose-400 transition-colors"
                />
                {/* Animated data particle when running */}
                {isRunning && (
                  <circle r="4" fill="#F27D26" filter="url(#glow)">
                    <animateMotion path={pathData} dur="1.8s" repeatCount="indefinite" />
                  </circle>
                )}
              </g>
            );
          })}

          {/* Active Connection Cable (while dragging) */}
          {connectingSource && (
            <path
              d={`M ${getNodeCenter(connectingSource.nodeId).outputX} ${
                getNodeCenter(connectingSource.nodeId).outputY
              } C ${getNodeCenter(connectingSource.nodeId).outputX + 80} ${
                getNodeCenter(connectingSource.nodeId).outputY
              }, ${cursorPos.x - 80} ${cursorPos.y}, ${cursorPos.x} ${cursorPos.y}`}
              fill="none"
              stroke="#F27D26"
              strokeWidth={2.5}
              strokeDasharray="6,4"
              className="animate-pulse"
            />
          )}
        </svg>

        {/* Nodes Layer */}
        <div className="absolute inset-0 z-20">
          {nodes.map((node) => (
            <div
              key={node.id}
              onMouseDown={(e) => {
                e.stopPropagation();
                onSelectNode(node.id);
                startNodeDrag(node.id, e);
              }}
            >
              <WorkflowNodeCard
                node={node}
                isSelected={selectedNodeId === node.id}
                onSelect={onSelectNode}
                onOpenConfig={onOpenConfig}
                onDelete={onDeleteNode}
                onClone={onCloneNode}
                onRunSingle={onRunSingleNode}
                onStartConnection={handleStartConnection}
                onEndConnection={handleEndConnection}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
