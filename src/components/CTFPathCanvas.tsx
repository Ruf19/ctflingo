import { useMemo } from 'react';
import { CheckCircle2, Lock, Play, Terminal, Flag } from 'lucide-react';
import type { CTFPathNode, CTFPathProgress } from '@/types';

interface CTFPathCanvasProps {
  nodes: CTFPathNode[];
  progress: CTFPathProgress | undefined;
  onNodeClick: (node: CTFPathNode) => void;
}

export function CTFPathCanvas({ nodes, progress, onNodeClick }: CTFPathCanvasProps) {
  // Calculate canvas dimensions based on node positions
  const { width, height, minX, minY } = useMemo(() => {
    if (nodes.length === 0) return { width: 800, height: 600, minX: 0, minY: 0 };
    
    const xs = nodes.map(n => n.position_x);
    const ys = nodes.map(n => n.position_y);
    
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    // Add padding around the content
    const padding = 100;
    return {
      width: Math.max(800, maxX - minX + padding * 2),
      height: Math.max(600, maxY - minY + padding * 2),
      minX: minX - padding,
      minY: minY - padding
    };
  }, [nodes]);

  // Determine node states
  const getNodeState = (node: CTFPathNode) => {
    if (!progress) return 'locked'; // Not started
    
    if (progress.completed) return 'completed'; // Path finished
    
    if (node.node_order < progress.current_node_order) return 'completed';
    if (node.node_order === progress.current_node_order) return 'current';
    return 'locked';
  };

  // Generate SVG path for connections
  const connections = useMemo(() => {
  const lines: { x1: number; y1: number; x2: number; y2: number; state: string }[] = [];
  
  for (let i = 0; i < nodes.length - 1; i++) {
    const current = nodes[i];
    const next = nodes[i + 1];
    
    // Adjust coordinates relative to canvas min values
    const x1 = current.position_x - minX;
    const y1 = current.position_y - minY;
    const x2 = next.position_x - minX;
    const y2 = next.position_y - minY;
    
    // Connection is active if current node is completed
    const state = getNodeState(current) === 'completed' ? 'active' : 'inactive';
    
    lines.push({ x1, y1, x2, y2, state });
  }
  return lines;
}, [nodes, progress, minX, minY]);

  if (nodes.length === 0) {
    return (
      <div className="bg-[#09090b] border border-[#27272a] rounded-2xl p-12 text-center">
        <Terminal className="w-12 h-12 text-[#27272a] mx-auto mb-4" />
        <p className="text-[#71717a] font-medium">No nodes configured for this path yet.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-x-auto overflow-y-hidden bg-[#050505] border border-[#27272a] rounded-2xl shadow-inner scrollbar-hide">
      {/* Cyber Grid Background */}
      <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none" />
      
      <div 
        className="relative min-w-full min-h-full"
        style={{ width: width, height: height }}
      >
        <svg 
          width={width} 
          height={height} 
          className="absolute top-0 left-0 pointer-events-none"
        >
          <defs>
            {/* Glow filter for active lines */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          
          {/* Render Connections */}
          {connections.map((line, i) => (
            <path
              key={i}
              d={`M ${line.x1} ${line.y1} Q ${(line.x1 + line.x2) / 2} ${line.y1} ${(line.x1 + line.x2) / 2} ${(line.y1 + line.y2) / 2} T ${line.x2} ${line.y2}`}
              fill="none"
              stroke={line.state === 'active' ? '#84cc16' : '#27272a'}
              strokeWidth="3"
              strokeDasharray={line.state === 'active' ? "0" : "8 8"}
              strokeLinecap="round"
              className="transition-all duration-500"
              filter={line.state === 'active' ? "url(#glow)" : undefined}
            />
          ))}
        </svg>

        {/* Render Nodes */}
        {nodes.map((node) => {
          const state = getNodeState(node);
          const x = node.position_x - minX;
          const y = node.position_y - minY;
          
          return (
            <div
              key={node.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
              style={{ left: x, top: y }}
            >
              <button
                onClick={() => onNodeClick(node)}
                disabled={state === 'locked'}
                className={`
                  relative flex flex-col items-center justify-center w-24 h-24 rounded-2xl border-2 transition-all duration-300
                  ${state === 'completed' 
                    ? 'bg-[#84cc16]/10 border-[#84cc16]/50 shadow-[0_0_20px_rgba(132,204,22,0.2)]' 
                    : state === 'current'
                    ? 'bg-[#f97316]/10 border-[#f97316]/50 shadow-[0_0_25px_rgba(249,115,22,0.3)] animate-pulse-green scale-110 z-10'
                    : 'bg-[#09090b] border-[#27272a] opacity-50 grayscale cursor-not-allowed'
                  }
                  ${state !== 'locked' ? 'hover:scale-110 hover:z-20 cursor-pointer' : ''}
                `}
              >
                {/* Node Content */}
                {state === 'completed' ? (
                  <CheckCircle2 className="w-8 h-8 text-[#84cc16] fill-[#84cc16]/20" />
                ) : state === 'current' ? (
                  <div className="relative">
                    <Play className="w-8 h-8 text-[#f97316] fill-[#f97316]/20" />
                    <div className="absolute -top-2 -right-2 w-3 h-3 bg-[#f97316] rounded-full animate-ping" />
                  </div>
                ) : (
                  <Lock className="w-6 h-6 text-[#52525b]" />
                )}
                
                {/* Node Label (Order) */}
                <span className={`
                  absolute -bottom-8 text-xs font-mono font-bold px-2 py-0.5 rounded border
                  ${state === 'completed' 
                    ? 'text-[#84cc16] border-[#84cc16]/30 bg-[#050505]' 
                    : state === 'current'
                    ? 'text-[#f97316] border-[#f97316]/30 bg-[#050505]'
                    : 'text-[#52525b] border-[#27272a] bg-[#050505]'
                  }
                `}>
                  NODE {String(node.node_order + 1).padStart(2, '0')}
                </span>

                {/* Challenge Title Tooltip (on hover) */}
                {state !== 'locked' && node.challenge && (
                  <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-48 p-3 bg-[#09090b] border border-[#27272a] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                    <p className="text-xs font-bold text-white truncate mb-1">{node.challenge.title}</p>
                    <p className="text-[10px] text-[#71717a] font-mono uppercase">{node.challenge.difficulty}</p>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#27272a]" />
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}