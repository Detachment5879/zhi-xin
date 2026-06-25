'use client';

import { useState, useEffect } from 'react';
import { BookOpen, MessageCircle, BarChart3, XCircle, GraduationCap, TrendingUp, Clock, ArrowRight, ChevronDown, ChevronRight } from 'lucide-react';
import ReviewReminderCard from '@/components/ReviewReminderCard';
import ReviewModal from '@/components/ReviewModal';

interface KPItem { id: string; name: string; difficulty: number; progress: { attempts: number; passed: boolean; best_score: number } }
interface Chapter { chapter: string; points: KPItem[] }

export default function Dashboard({ onNavigate, onStartLearn }: { onNavigate: (id: string) => void; onStartLearn: (kpId: string, name: string) => void }) {
  const [stats, setStats] = useState({ total: 0, passed: 0, avgAccuracy: 0, wrongCount: 0, totalKPs: 0, totalSessions: 0, chapters: [] as any[] });
  const [recent, setRecent] = useState<any[]>([]);
  const [tree, setTree] = useState<Chapter[]>([]);
  const [expandedCh, setExpandedCh] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [reviewItems, setReviewItems] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/progress').then(r => r.json()),
      fetch('/api/records/sessions?limit=5').then(r => r.json()),
      fetch('/api/knowledge/tree').then(r => r.json()),
    ])
      .then(([progress, sessions, treeData]) => {
        setTree(treeData);
        if (treeData.length > 0) setExpandedCh({ [treeData[0].chapter]: true });
        setRecent(sessions);
        setStats({
          ...progress,
          passed: progress.mastered || 0,
          total: progress.total_sessions || 0,
          avgAccuracy: progress.avg_accuracy || 0,
          wrongCount: 0,
          totalKPs: progress.total_kps || treeData.flatMap((c:Chapter) => c.points).length,
          totalSessions: progress.total_sessions || 0,
          chapters: progress.chapters || [],
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggleCh = (ch: string) => setExpandedCh(prev => ({ ...prev, [ch]: !prev[ch] }));
  const totalKps = tree.flatMap(c => c.points).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">👋 欢迎回来，邵逸飞</h1>
          <p className="text-slate-500 text-sm mt-1">国际教育学部 · 国际经济与贸易（中外合办） · 2023级国贸一班</p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
          {[
            { icon: BookOpen, value: stats.totalKPs, label: '知识点', color: 'text-indigo-600 bg-indigo-50' },
            { icon: TrendingUp, value: stats.mastered, label: '已掌握', color: 'text-emerald-600 bg-emerald-50' },
            { icon: GraduationCap, value: `${stats.avgAccuracy}%`, label: '正确率', color: 'text-purple-600 bg-purple-50' },
            { icon: XCircle, value: stats.totalSessions, label: '学习次数', color: 'text-rose-600 bg-rose-50' },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                  <Icon size={18} />
                </div>
                {loading ? (
                  <div className="h-7 w-12 bg-slate-100 rounded animate-pulse" />
                ) : (
                  <div className="text-2xl font-bold text-slate-800">{stat.value}</div>
                )}
                <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Start learning */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <BookOpen size={16} className="text-indigo-600" /> 开始学习 · {tree.length}章 {totalKps}知识点
              </h2>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {tree.map(ch => (
                  <div key={ch.chapter} className="border border-slate-100 rounded-xl overflow-hidden">
                    <button onClick={() => toggleCh(ch.chapter)}
                      className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left">
                      <div className="flex items-center gap-2">
                        {expandedCh[ch.chapter] ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                        <span className="text-sm font-semibold text-slate-700">{ch.chapter}</span>
                        <span className="text-xs text-slate-400">{ch.points.length}知识点</span>
                      </div>
                    </button>
                    {expandedCh[ch.chapter] && (
                      <div className="border-t border-slate-50 grid grid-cols-2 sm:grid-cols-3 gap-1 p-2">
                        {ch.points.map(kp => (
                          <button key={kp.id} onClick={() => onStartLearn(kp.id, kp.name)}
                            className="px-3 py-2 rounded-lg hover:bg-indigo-50 text-left text-xs font-medium text-slate-600 hover:text-indigo-700 transition-colors truncate">
                            {kp.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Chapter progress */}
            {stats.chapters && stats.chapters.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <TrendingUp size={16} className="text-indigo-600" /> 章节进度
                </h2>
                <div className="space-y-3">
                  {stats.chapters.map((ch: any) => (
                    <div key={ch.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600">{ch.name}</span>
                        <span className="text-slate-400">{ch.mastered}/{ch.total}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${ch.total > 0 ? (ch.mastered / ch.total * 100) : 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent activity */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Clock size={16} className="text-indigo-600" /> 最近学习
              </h2>
              {recent.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">还没有学习记录，选一个知识点开始吧</p>
              ) : (
                <div className="space-y-2">
                  {recent.slice(0, 3).map((s, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${s.final_decision === 'pass' ? 'bg-emerald-400' : s.final_decision === 'retry' ? 'bg-amber-400' : s.final_decision === 'fuse' ? 'bg-red-400' : 'bg-slate-300'}`} />
                        <span className="text-sm text-slate-700">{s.kp_name}</span>
                        {s.post_test_score != null && (
                          <span className={`text-xs font-medium ${s.post_test_score >= 0.8 ? 'text-emerald-600' : s.post_test_score >= 0.5 ? 'text-amber-600' : 'text-red-500'}`}>
                            {(s.post_test_score * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">
                        {new Date(s.started_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => onNavigate('history')} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-500 mt-3 font-medium">
                查看全部 <ArrowRight size={12} />
              </button>
            </div>
          </div>

          {/* Right: shortcuts */}
          <div className="space-y-4">
            <ReviewReminderCard onStartReview={(items) => { setReviewItems(items); setShowReview(true); }} />

            <button onClick={() => onNavigate('chat')} className="w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:border-indigo-300 hover:shadow-md transition-all text-left group">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:bg-indigo-100 transition-colors">
                <MessageCircle size={18} />
              </div>
              <div className="font-semibold text-sm text-slate-800">AI 助教</div>
              <div className="text-xs text-slate-500 mt-1">问任何学习相关问题</div>
            </button>

            <button onClick={() => onNavigate('wrong')} className="w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:border-rose-300 hover:shadow-md transition-all text-left group">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3 group-hover:bg-rose-100 transition-colors">
                <XCircle size={18} />
              </div>
              <div className="font-semibold text-sm text-slate-800">错题本</div>
              <div className="text-xs text-slate-500 mt-1">回顾所有做错的题目</div>
            </button>

            <button onClick={() => onNavigate('profile')} className="w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:border-purple-300 hover:shadow-md transition-all text-left group">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:bg-purple-100 transition-colors">
                <BarChart3 size={18} />
              </div>
              <div className="font-semibold text-sm text-slate-800">画像设置</div>
              <div className="text-xs text-slate-500 mt-1">调整你的学习偏好</div>
            </button>
          </div>
        </div>
      </div>

      {showReview && (
        <ReviewModal items={reviewItems} onClose={() => setShowReview(false)} />
      )}
    </div>
  );
}
