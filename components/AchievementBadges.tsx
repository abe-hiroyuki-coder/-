
import React from 'react';
import { Achievement } from '../types';

interface AchievementBadgesProps {
  achievements: Achievement[];
}

const AchievementBadges: React.FC<AchievementBadgesProps> = ({ achievements }) => {
  return (
    <div className="p-6 space-y-8">
      <header>
        <h2 className="text-xl font-black">熟達の称号</h2>
        <p className="text-xs text-slate-400">これまでの努力の証</p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        {achievements.map(a => (
          <div 
            key={a.id} 
            className={`p-5 rounded-3xl border flex flex-col items-center text-center space-y-3 transition-all ${
              a.unlockedAt 
                ? 'bg-white border-indigo-100 shadow-md ring-1 ring-indigo-50' 
                : 'bg-slate-50 border-slate-100 grayscale opacity-60'
            }`}
          >
            <span className="text-4xl">{a.icon}</span>
            <div className="space-y-1">
              <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{a.title}</p>
              <p className="text-[10px] text-slate-400 leading-tight font-medium">{a.description}</p>
            </div>
            {a.unlockedAt && (
              <span className="text-[9px] font-black text-indigo-600 uppercase">Unlocked</span>
            )}
          </div>
        ))}
      </div>

      <div className="bg-indigo-600 text-white p-6 rounded-3xl space-y-2">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Tips</h4>
        <p className="text-sm font-medium leading-relaxed">
          称号はあくまで過程の副産物です。
          本当の「熟達」は、あなたの中に生まれた思考の深まりにあります。
        </p>
      </div>
    </div>
  );
};

export default AchievementBadges;
