'use client';

import { useState, useEffect } from 'react';
import { Clock, CheckCircle2, RotateCcw, AlertCircle, TrendingUp } from 'lucide-react';

interface Session {
  id: string;
  kp_name: string;
  cycle_number: number;
  pre_test_score: number | null;
  post_test_score: number | null;
  final_decision: string | null;
  target: string;
  started_at: string;
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/records/sessions')
      .then(r => r.json())
      .then(data => { setSessions(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const decisions: Record<string, { icon: any; color: string; label: string }> = {
    pass: { icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50', label: '通过' },
    skip: { icon: TrendingUp, color: 'text-blue-600 bg-blue-50', label: '跳过' },
    retry: { icon: RotateCcw, color: 'text-amber-600 bg-amber-50', label: '重学' },
    fuse: { icon: AlertCircle, color: 'text-red-600 bg-red-50', label: '熔断' },
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-7 w-24 bg-slate-200 rounded-lg" />
          <div className="h-4 w-48 bg-slate-100 rounded" />
          {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-slate-100 rounded-2xl" />)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-2">
          <Clock size={22} className="text-indigo-600" />
          <h1 className="text-xl font-bold text-slate-800">学习记录</h1>
        </div>
        <p className="text-sm text-slate-500 mb-6">{sessions.length} 条记录</p>

        {sessions.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Clock size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">暂无记录</p>
            <p className="text-sm">完成一次学习循环后，记录会出现在这里</p>
          </div>
        )}

        <div className="space-y-3">
          {sessions.map(s => {
            const d = s.final_decision ? decisions[s.final_decision] || decisions.fuse : null;
            const DecIcon = d?.icon;
            return (
              <div key={s.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-slate-800">{s.kp_name}</span>
                      <span className="text-[10px] text-slate-400">第 {s.cycle_number} 轮</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      {s.pre_test_score != null && (
                        <span className={s.pre_test_score >= 0.8 ? 'text-emerald-600' : s.pre_test_score >= 0.5 ? 'text-amber-600' : 'text-red-500'}>
                          前测 {(s.pre_test_score * 100).toFixed(0)}%
                        </span>
                      )}
                      {s.pre_test_score != null && s.post_test_score != null && <span className="text-slate-300">→</span>}
                      {s.post_test_score != null && (
                        <span className={s.post_test_score >= 0.8 ? 'text-emerald-600 font-semibold' : s.post_test_score >= 0.5 ? 'text-amber-600' : 'text-red-500'}>
                          后测 {(s.post_test_score * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                  {d && DecIcon && (
                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium ${d.color}`}>
                      <DecIcon size={13} />
                      {d.label}
                    </div>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 mt-2">
                  {new Date(s.started_at).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
