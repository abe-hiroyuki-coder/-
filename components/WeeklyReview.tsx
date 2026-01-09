
import React from 'react';
import { Insight, Theme } from '../types';

interface WeeklyReviewProps {
  insights: Insight[];
  theme: Theme | null;
}

const WeeklyReview: React.FC<WeeklyReviewProps> = ({ insights, theme }) => {
  const recentInsights = insights
    .filter(i => Date.now() - i.createdAt < 7 * 24 * 60 * 60 * 1000)
    .sort((a, b) => b.createdAt - a.createdAt);

  if (!theme) return null;

  return (
    <div className="p-6 space-y-8">
      <header className="space-y-1">
        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Self-Reflect</span>
        <h2 className="text-2xl font-black">今週のふりかえり</h2>
        <p className="text-sm text-slate-500">{theme.name} について</p>
      </header>

      <section className="bg-slate-900 text-white p-6 rounded-[40px] shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <h3 className="text-indigo-400 text-xs font-black uppercase">今週の「核」</h3>
          {recentInsights.length > 0 ? (
            <p className="text-lg font-bold leading-relaxed">
              今週は新たに <span className="text-3xl text-indigo-400">{recentInsights.length}</span> 個の気づきが得られました。
              それらをつなぎ合わせて、構造が見えてきましたか？
            </p>
          ) : (
            <p className="text-slate-400">
              まだ今週の気づきはありません。
              少し立ち止まって、今日の出来事から問いを立ててみませんか？
            </p>
          )}
        </div>
        <div className="absolute -bottom-10 -right-10 text-9xl opacity-10">🧘</div>
      </section>

      <section className="space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">ピックアップ</h3>
        {recentInsights.slice(0, 3).map(ins => (
          <div key={ins.id} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm italic text-sm text-slate-600">
            "{ins.body}"
          </div>
        ))}
      </section>

      <section className="bg-amber-50 p-6 rounded-3xl border border-amber-100 space-y-3">
        <h3 className="text-amber-600 text-xs font-black uppercase">師匠からの問い</h3>
        <p className="text-slate-800 font-bold">
          「今週の学びを一言でまとめるとしたら、何ですか？ また、それは当初の目標にどう近づいていますか？」
        </p>
      </section>

      <button 
        onClick={() => window.history.back()}
        className="w-full bg-slate-100 text-slate-600 p-4 rounded-2xl font-bold"
      >
        戻る
      </button>
    </div>
  );
};

export default WeeklyReview;
