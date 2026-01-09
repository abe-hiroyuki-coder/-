
import React, { useMemo, useState } from 'react';
import { Insight } from '../types';

interface InsightGraphProps {
  insights: Insight[];
}

const InsightGraph: React.FC<InsightGraphProps> = ({ insights }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // SVG Size
  const width = 400;
  const height = 500;

  // Simple layout logic (randomized or circular)
  const nodes = useMemo(() => {
    return insights.map((ins, i) => {
      const angle = (i / insights.length) * Math.PI * 2;
      const radius = 100 + Math.random() * 40;
      return {
        ...ins,
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
      };
    });
  }, [insights]);

  const links = useMemo(() => {
    const pairs: { x1: number, y1: number, x2: number, y2: number }[] = [];
    nodes.forEach(node => {
      node.linkedToIds.forEach(targetId => {
        const target = nodes.find(n => n.id === targetId);
        if (target) {
          pairs.push({ x1: node.x, y1: node.y, x2: target.x, y2: target.y });
        }
      });
    });
    return pairs;
  }, [nodes]);

  const selectedInsight = nodes.find(n => n.id === selectedId);

  return (
    <div className="p-4 space-y-4 relative overflow-hidden h-full flex flex-col">
      <header className="shrink-0">
        <h2 className="text-xl font-black">思考の地図</h2>
        <p className="text-xs text-slate-400">気づきと気づきのつながり</p>
      </header>

      <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-inner relative overflow-hidden">
        {insights.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-300 text-sm italic">
            まだ地図には何もありません
          </div>
        ) : (
          <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            {/* Links */}
            {links.map((link, i) => (
              <line key={i} x1={link.x1} y1={link.y1} x2={link.x2} y2={link.y2} stroke="#E2E8F0" strokeWidth="2" strokeDasharray="4 2" />
            ))}
            {/* Nodes */}
            {nodes.map(node => (
              <g key={node.id} onClick={() => setSelectedId(node.id)} className="cursor-pointer">
                <circle 
                  cx={node.x} 
                  cy={node.y} 
                  r={selectedId === node.id ? 10 : 6} 
                  fill={selectedId === node.id ? '#4F46E5' : '#E0E7FF'} 
                  stroke={selectedId === node.id ? '#C7D2FE' : 'white'}
                  strokeWidth="2"
                  className="transition-all"
                />
              </g>
            ))}
          </svg>
        )}

        {/* Info Panel Overlay */}
        {selectedInsight && (
          <div className="absolute bottom-4 left-4 right-4 bg-slate-900/95 backdrop-blur-md text-white p-5 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Selected Insight</span>
              <button onClick={() => setSelectedId(null)} className="text-slate-500">×</button>
            </div>
            <p className="text-sm font-medium leading-relaxed">{selectedInsight.body}</p>
            <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase">
              <span>{new Date(selectedInsight.createdAt).toLocaleDateString()}</span>
              <span>つながり: {selectedInsight.linkedToIds.length}個</span>
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-slate-200 text-sm">💡</div>
        <p className="text-xs text-slate-500 leading-tight">
          気づきが増え、それらをつなげることで、あなただけの「熟達のコツ」が視覚化されていきます。
        </p>
      </div>
    </div>
  );
};

export default InsightGraph;
