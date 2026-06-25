'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, BookOpen, CheckCircle2, AlertCircle, Sparkles, Flag } from 'lucide-react';

export default function TeacherHome() {
  const [stats, setStats] = useState<any>({});
  const [chapterData, setChapterData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/teacher/students').then(r => r.json()),
      fetch('/api/teacher/review-stats').then(r => r.json()),
      fetch('/api/progress').then(r => r.json()),
      fetch('/api/teacher/chapter-difficulty').then(r => r.json()).catch(() => []),
    ]).then(([students, review, progress, chapters]) => {
      const atRisk = students.filter((s: any) => s.fused > 0 || (s.avg_accuracy < 50 && s.total_sessions > 2));
      setStats({ students: students.length, atRisk: atRisk.length, review, progress, recentStudents: students.slice(0, 5) });
      setChapterData(chapters || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50"><div className="max-w-5xl mx-auto px-6 py-8"><div className="animate-pulse space-y-4"><div className="h-7 w-32 bg-slate-200 rounded-lg"/>{[1,2,3].map(i=><div key={i} className="h-24 bg-slate-100 rounded-2xl"/>)}</div></div></div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-xl font-bold text-slate-800 mb-1">工作台首页</h1>
        <p className="text-sm text-slate-500 mb-6">教学管理概览</p>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { icon: Users, value: stats.students || 0, label: '学生总数', color: 'text-indigo-600 bg-indigo-50' },
            { icon: AlertCircle, value: stats.atRisk || 0, label: '需关注', color: 'text-red-600 bg-red-50', warn: stats.atRisk > 0 },
            { icon: BookOpen, value: stats.progress?.total_kps || 0, label: '知识点', color: 'text-purple-600 bg-purple-50' },
            { icon: Sparkles, value: stats.review?.avg_score ? `${stats.review.avg_score}分` : '-', label: 'AI审核均分', color: 'text-emerald-600 bg-emerald-50' },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className={`bg-white rounded-2xl p-4 shadow-sm border ${stat.warn ? 'border-red-200' : 'border-slate-100'}`}>
                <div className={`w-9 h-9 rounded-xl ${stat.color} flex items-center justify-center mb-2`}><Icon size={16} /></div>
                <div className={`text-xl font-bold ${stat.warn ? 'text-red-500' : 'text-slate-800'}`}>{stat.value}</div>
                <div className="text-xs text-slate-500">{stat.label}</div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AI Quality */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-purple-600" /> AI 内容质量
            </h2>
            {stats.review ? (
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1">
                    <div className="text-xs text-slate-500 mb-1">审核通过率</div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${stats.review.total_generations > 0 ? Math.round(stats.review.passed / (stats.review.passed + stats.review.failed) * 100) : 0}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">{stats.review.total_generations > 0 ? Math.round(stats.review.passed / (stats.review.passed + stats.review.failed) * 100) : 0}%</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="bg-slate-50 rounded-xl p-2"><div className="font-bold text-slate-700">{stats.review.total_generations}</div><div className="text-slate-400">总生成</div></div>
                  <div className="bg-emerald-50 rounded-xl p-2"><div className="font-bold text-emerald-600">{stats.review.passed}</div><div className="text-emerald-500">通过</div></div>
                  <div className="bg-red-50 rounded-xl p-2"><div className="font-bold text-red-500">{stats.review.failed}</div><div className="text-red-400">未通过</div></div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">暂无数据</p>
            )}
          </div>

          {/* Recent students */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Users size={16} className="text-indigo-600" /> 最近活跃学生
            </h2>
            {stats.recentStudents?.length > 0 ? (
              <div className="space-y-2">
                {stats.recentStudents.map((s: any) => (
                  <div key={s.student_id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${s.fused > 0 ? 'bg-red-400' : s.avg_accuracy < 50 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                      <span className="text-sm text-slate-700">{s.student_id?.slice(0, 10)}...</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-slate-500">{s.total_sessions}次</span>
                      <span className={s.avg_accuracy >= 70 ? 'text-emerald-600' : s.avg_accuracy >= 50 ? 'text-amber-600' : 'text-red-500'}>{s.avg_accuracy}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">暂无学生数据</p>
            )}
          </div>
        </div>

        {/* Chapter difficulty */}
        {chapterData.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Flag size={16} className="text-red-500" /> 章节困难度分析
            </h2>
            <p className="text-xs text-slate-500 mb-4">按失败率排序，帮助定位教学难点</p>
            <div className="space-y-3">
              {chapterData.slice(0, 8).map((ch: any) => (
                <div key={ch.chapter}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-600 font-medium truncate max-w-[200px]">{ch.chapter}</span>
                    <span className={`font-medium ${ch.fail_rate > 30 ? 'text-red-500' : ch.fail_rate > 15 ? 'text-amber-500' : 'text-slate-400'}`}>
                      {ch.fail_rate}% 失败 · 均分{ch.avg_score}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${ch.fail_rate > 30 ? 'bg-red-400' : ch.fail_rate > 15 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                        style={{ width: `${Math.min(ch.fail_rate, 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 w-8 text-right">{ch.total_attempts}次</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
