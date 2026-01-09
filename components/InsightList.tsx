
import React, { useState } from 'react';
import { Insight } from '../types';

interface InsightListProps {
  insights: Insight[];
  allInsights: Insight[];
  linkInsights: (id1: string, id2: string) => void;
  deleteInsight: (id: string) => void;
  updateInsight: (id: string, body: string) => void;
}

const InsightList: React.FC<InsightListProps> = ({ insights, allInsights, linkInsights, deleteInsight, updateInsight }) => {
  const [linkingFrom, setLinkingFrom] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const saveEdit = () => {
    if (editingId && editValue.trim()) {
      updateInsight(editingId, editValue);
      setEditingId(null);
    }
  };

  const sorted = [...insights].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="p-6 space-y-6 h-full overflow-y-auto">
      <header className="flex justify-between items-end shrink-0">
        <div>
          <h2 className="text-xl font-black">気づきログ</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Thought History</p>
        </div>
        {linkingFrom && <button onClick={() => setLinkingFrom(null)} className="text-xs font-bold text-red-500">キャンセル</button>}
      </header>

      {linkingFrom && (
        <div className="bg-indigo-600 text-white p-4 rounded-2xl text-xs font-bold animate-pulse shadow-lg">
          🔗 リンクさせる別の気づきをタップしてください
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-300 italic gap-4">
          <span className="text-5xl">🌫️</span>
          <p className="text-sm font-medium">まだ記録がありません</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map(ins => (
            <div 
              key={ins.id} 
              onClick={() => linkingFrom && linkingFrom !== ins.id ? (linkInsights(linkingFrom, ins.id), setLinkingFrom(null)) : null} 
              className={`p-5 rounded-3xl border transition-all ${
                linkingFrom === ins.id ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-500' : 'border-slate-100 bg-white shadow-sm'
              } ${linkingFrom && linkingFrom !== ins.id ? 'cursor-pointer hover:border-indigo-300' : ''}`}
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] text-slate-400 font-bold">{new Date(ins.createdAt).toLocaleDateString()}</span>
                {!linkingFrom && !editingId && (
                  <div className="flex gap-3">
                    <button onClick={(e) => { e.stopPropagation(); setLinkingFrom(ins.id); }} className="text-[10px] font-black text-indigo-600 uppercase">リンク</button>
                    <button onClick={(e) => { e.stopPropagation(); setEditingId(ins.id); setEditValue(ins.body); }} className="text-[10px] font-black text-slate-400 uppercase">編集</button>
                    <button onClick={(e) => { e.stopPropagation(); if(confirm("この気づきを削除しますか？")) deleteInsight(ins.id); }} className="text-[10px] font-black text-red-300 uppercase">削除</button>
                  </div>
                )}
              </div>
              
              {editingId === ins.id ? (
                <div className="space-y-3">
                  <textarea 
                    autoFocus 
                    value={editValue} 
                    onChange={(e) => setEditValue(e.target.value)} 
                    className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-medium outline-none ring-2 ring-indigo-500" 
                    rows={3} 
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingId(null)} className="text-xs font-bold text-slate-400 px-4 py-2">戻る</button>
                    <button onClick={saveEdit} className="text-xs font-black text-white bg-indigo-600 px-6 py-2 rounded-xl shadow-lg active:scale-95 transition-transform">保存する</button>
                  </div>
                </div>
              ) : (
                <p className="text-slate-800 text-sm font-medium leading-relaxed whitespace-pre-wrap">{ins.body}</p>
              )}

              {ins.linkedToIds.length > 0 && !editingId && (
                <div className="mt-3 flex gap-1">
                  {ins.linkedToIds.map((_, idx) => (
                    <div key={idx} className="w-1.5 h-1.5 rounded-full bg-indigo-200"></div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InsightList;
