'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, BookOpen, CheckCircle2, Lock, ArrowRight, Circle, Target } from 'lucide-react';

interface KPItem {
  id: string; name: string; difficulty: number;
  prerequisites: string[]; prerequisite_names: string[];
  description: string;
  progress: { attempts: number; passed: boolean; best_score: number };
}

interface Chapter {
  chapter: string; points: KPItem[];
}

export default function KnowledgePage({ onStartLearn }: { onStartLearn?: (kpId: string, name: string) => void }) {
  const [tree, setTree] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCh, setExpandedCh] = useState<Record<string, boolean>>({});
  const [selectedKP, setSelectedKP] = useState<KPItem | null>(null);

  useEffect(() => {
    fetch('/api/knowledge/tree')
      .then(r => r.json())
      .then(data => {
        setTree(data);
        // Expand first chapter by default
        if (data.length > 0) setExpandedCh({ [data[0].chapter]: true });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggleCh = (ch: string) => setExpandedCh(prev => ({ ...prev, [ch]: !prev[ch] }));
  const locked = (kp: KPItem) => {
    if (!kp.prerequisites.length) return false;
    return kp.prerequisites.some(pid => {
      const pre = tree.flatMap(c => c.points).find(p => p.id === pid);
      return pre && !pre.progress.passed;
    });
  };

  const total = tree.flatMap(c => c.points).length;
  const passed = tree.flatMap(c => c.points).filter(p => p.progress.passed).length;

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-7 w-24 bg-slate-200 rounded-lg" />
          <div className="h-4 w-48 bg-slate-100 rounded" />
          {[1,2,3].map(i => <div key={i} className="h-32 bg-slate-100 rounded-2xl" />)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen size={22} className="text-indigo-600" />
          <h1 className="text-xl font-bold text-slate-800">知识库</h1>
        </div>
        <p className="text-sm text-slate-500 mb-2">{tree.length} 章 · {total} 个知识点</p>

        {/* Progress bar */}
        <div className="flex items-center gap-3 mb-6 bg-white rounded-2xl p-4 border border-slate-100">
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${total > 0 ? (passed / total * 100) : 0}%` }} />
          </div>
          <span className="text-sm font-semibold text-slate-700">{passed}/{total}</span>
          <span className="text-xs text-slate-400">已掌握</span>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Tree */}
          <div className="col-span-2 space-y-3">
            {tree.map(ch => (
              <div key={ch.chapter} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <button onClick={() => toggleCh(ch.chapter)}
                  className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    {expandedCh[ch.chapter] ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                    <span className="font-semibold text-slate-800">{ch.chapter}</span>
                    <span className="text-xs text-slate-400">{ch.points.filter(p => p.progress.passed).length}/{ch.points.length}</span>
                  </div>
                </button>

                {expandedCh[ch.chapter] && (
                  <div className="border-t border-slate-50">
                    {ch.points.map(kp => {
                      const isLocked = locked(kp);
                      const isSelected = selectedKP?.id === kp.id;
                      return (
                        <button key={kp.id} onClick={() => setSelectedKP(isSelected ? null : kp)}
                          className={`w-full p-3.5 flex items-center gap-3 border-b border-slate-50 last:border-0 transition-colors text-left ${
                            isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50'
                          } ${isLocked ? 'opacity-50' : ''}`}>
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                            kp.progress.passed ? 'bg-emerald-100 text-emerald-600' : isLocked ? 'bg-slate-100 text-slate-400' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {kp.progress.passed ? <CheckCircle2 size={12} /> : isLocked ? <Lock size={10} /> : <Circle size={8} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-700">{kp.name}</span>
                              {kp.prerequisite_names.length > 0 && (
                                <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">前置: {kp.prerequisite_names.join(', ')}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-slate-400">
                                {'●'.repeat(kp.difficulty)}{'○'.repeat(5 - kp.difficulty)} 难度
                              </span>
                              {kp.progress.attempts > 0 && (
                                <span className={`text-[10px] ${kp.progress.passed ? 'text-emerald-600' : 'text-amber-600'}`}>
                                  {kp.progress.passed ? '✓' : '⏳'} {kp.progress.attempts}次
                                  {kp.progress.best_score > 0 && ` · 最佳${(kp.progress.best_score * 100).toFixed(0)}%`}
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRight size={14} className="text-slate-300" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Detail panel */}
          <div>
            {selectedKP ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sticky top-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-800">{selectedKP.name}</h3>
                  {locked(selectedKP) ? (
                    <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Lock size={10} /> 前置未通过
                    </span>
                  ) : selectedKP.progress.passed ? (
                    <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">已掌握</span>
                  ) : (
                    <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">待学习</span>
                  )}
                </div>

                <p className="text-sm text-slate-500 mb-4">{selectedKP.description || '暂无简介'}</p>

                <div className="space-y-2 text-xs mb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-400">难度</span>
                    <span>{'⭐'.repeat(selectedKP.difficulty)}</span>
                  </div>
                  {selectedKP.prerequisite_names.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">前置知识</span>
                      <span className="text-amber-600">{selectedKP.prerequisite_names.join(', ')}</span>
                    </div>
                  )}
                  {selectedKP.progress.attempts > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-400">尝试次数</span>
                        <span>{selectedKP.progress.attempts} 次</span>
                      </div>
                      {selectedKP.progress.best_score > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">最佳成绩</span>
                          <span className="text-emerald-600 font-medium">{(selectedKP.progress.best_score * 100).toFixed(0)}%</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {!locked(selectedKP) && !selectedKP.progress.passed && (
                  <button onClick={() => onStartLearn?.(selectedKP.id, selectedKP.name)}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                    <Target size={14} /> 开始学习
                  </button>
                )}
                {locked(selectedKP) && (
                  <div className="text-center text-xs text-slate-400 py-2">
                    请先完成前置知识点的学习
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 text-center sticky top-6">
                <BookOpen size={32} className="mx-auto mb-3 text-slate-300" />
                <p className="text-sm text-slate-400">点击左侧知识点查看详情</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
