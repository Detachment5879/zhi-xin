'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, CheckCircle2, AlertCircle, BookOpen } from 'lucide-react';

export default function TeacherStats() {
  const [review, setReview] = useState<any>(null);
  const [daily, setDaily] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/teacher/review-stats').then(r => r.json()),
      fetch('/api/teacher/daily-stats').then(r => r.json()),
    ]).then(([r, d]) => { setReview(r); setDaily(d); }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50"><div className="max-w-4xl mx-auto px-6 py-8"><div className="animate-pulse space-y-4"><div className="h-7 w-24 bg-slate-200 rounded-lg"/>{[1,2,3].map(i=><div key={i} className="h-32 bg-slate-100 rounded-2xl"/>)}</div></div></div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-xl font-bold text-slate-800 mb-1">数据统计</h1>
        <p className="text-sm text-slate-500 mb-6">AI 内容审核与系统运行数据</p>

        {review ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              {[
                { label: '总生成', value: review.total_generations, color: 'text-indigo-600 bg-indigo-50' },
                { label: '审核通过', value: review.passed, color: 'text-emerald-600 bg-emerald-50' },
                { label: '审核未过', value: review.failed, color: 'text-red-600 bg-red-50' },
                { label: '通过率', value: `${review.total_generations > 0 ? Math.round(review.passed / (review.passed + review.failed) * 100) : 0}%`, color: 'text-purple-600 bg-purple-50' },
                { label: '平均分', value: `${review.avg_score}分`, color: 'text-amber-600 bg-amber-50' },
              ].map((stat, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
                  <div className={`text-2xl font-bold ${stat.color.split(' ')[0]}`}>{stat.value}</div>
                  <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {review.by_type?.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <h2 className="font-semibold text-slate-800 mb-4">按资源类型统计</h2>
                <div className="space-y-3">
                  {review.by_type.map((t: any) => (
                    <div key={t.type}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600">{t.label || t.type}</span>
                        <span className="text-slate-400">{t.passed}/{t.total} 通过</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${t.total > 0 ? (t.passed / t.total * 100) : 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-slate-400 py-16">
            <BarChart3 size={48} className="mx-auto mb-4 opacity-30" />
            <p>暂无审核数据。完成一些学习循环后统计会出现在这里。</p>
          </div>
        )}

        {/* Daily trend */}
        {daily.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mt-6">
            <h2 className="font-semibold text-slate-800 mb-4">学习趋势（近30天）</h2>
            <div className="h-40 flex items-end gap-1">
              {daily.slice(-20).map((d: any, i: number) => {
                const maxCount = Math.max(...daily.map((x: any) => x.count), 1);
                const h = Math.max(4, (d.count / maxCount) * 140);
                const avgH = d.avg_accuracy > 0 ? d.avg_accuracy / 100 * 140 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full" title={`${d.date}: ${d.count}次, 正确率${d.avg_accuracy}%`}>
                    <div className="relative w-full flex flex-col items-center" style={{ height: 140 }}>
                      <div className="absolute bottom-0 w-full max-w-[20px] rounded-t-sm bg-indigo-200" style={{ height: h }} />
                      {d.avg_accuracy > 0 && (
                        <div className="absolute bottom-0 w-1 rounded-t-full bg-emerald-500" style={{ height: avgH }} />
                      )}
                    </div>
                    <span className="text-[8px] text-slate-400 mt-1">{d.date.slice(5)}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-center gap-4 mt-3 text-[10px] text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-indigo-200" /> 学习次数</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> 正确率</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
