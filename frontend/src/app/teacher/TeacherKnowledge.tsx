'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Plus, Pencil, ChevronDown, ChevronRight, CheckCircle2, Circle, Trash2 } from 'lucide-react';

interface KPItem {
  id: string; name: string; chapter: string; difficulty: number;
  description: string; progress: { attempts: number; passed: boolean };
}

export default function TeacherKnowledge() {
  const [tree, setTree] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCh, setExpandedCh] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch('/api/knowledge/tree')
      .then(r => r.json())
      .then(data => {
        setTree(data);
        if (data.length > 0) setExpandedCh({ [data[0].chapter]: true });
        setLoading(false);
      }).catch(() => setLoading(false));
  }, []);

  const toggleCh = (ch: string) => setExpandedCh(prev => ({ ...prev, [ch]: !prev[ch] }));

  const allKPs = tree.flatMap((c: any) => c.points);
  const total = allKPs.length;

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50"><div className="max-w-4xl mx-auto px-6 py-8"><div className="animate-pulse space-y-4"><div className="h-7 w-32 bg-slate-200 rounded-lg"/>{[1,2,3].map(i=><div key={i} className="h-20 bg-slate-100 rounded-2xl"/>)}</div></div></div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <BookOpen size={22} className="text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-800">知识库管理</h1>
          </div>
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-all active:scale-[0.98]">
            <Plus size={15} /> 添加知识点
          </button>
        </div>
        <p className="text-sm text-slate-500 mb-6">{tree.length} 章 · {total} 个知识点</p>

        <div className="grid grid-cols-3 gap-6">
          {/* Tree */}
          <div className="col-span-2 space-y-3">
            {tree.map((ch: any) => (
              <div key={ch.chapter} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <button onClick={() => toggleCh(ch.chapter)}
                  className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    {expandedCh[ch.chapter] ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                    <span className="font-semibold text-slate-800">{ch.chapter}</span>
                    <span className="text-xs text-slate-400">{ch.points.length}个</span>
                  </div>
                </button>
                {expandedCh[ch.chapter] && (
                  <div className="border-t border-slate-50">
                    {ch.points.map((kp: KPItem) => (
                      <div key={kp.id} className="p-3.5 flex items-center gap-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${kp.progress.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                          {kp.progress.passed ? <CheckCircle2 size={12} /> : <Circle size={8} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-700">{kp.name}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-400">
                              {'●'.repeat(kp.difficulty)}{'○'.repeat(5 - kp.difficulty)} 难度
                            </span>
                            {kp.description && <span className="text-[10px] text-slate-400 truncate">{kp.description}</span>}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors">
                            <Pencil size={13} className="text-slate-400" />
                          </button>
                          <button className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={13} className="text-slate-400 hover:text-red-500" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Stats */}
          <div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sticky top-6">
              <h2 className="font-semibold text-slate-800 mb-4">概览</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">章节</span>
                  <span className="text-slate-700 font-medium">{tree.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">知识点</span>
                  <span className="text-slate-700 font-medium">{total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">平均难度</span>
                  <span className="text-slate-700 font-medium">
                    {allKPs.length > 0 ? (allKPs.reduce((s, k) => s + k.difficulty, 0) / allKPs.length).toFixed(1) : '-'}
                  </span>
                </div>
                <hr className="border-slate-100" />
                <div className="text-xs text-slate-400">
                  点击知识点旁的 ✏️ 编辑详情<br/>
                  点击 🗑 删除知识点（谨慎操作）
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
