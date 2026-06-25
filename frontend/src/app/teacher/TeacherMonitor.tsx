'use client';

import { useState, useEffect } from 'react';
import { Activity, Zap, Users, MessageCircle, TrendingUp, AlertCircle, CheckCircle2, RotateCcw, XCircle, Target, Award, BookOpen } from 'lucide-react';

interface StudentItem {
  student_id: string;
  display_name: string;
  cycles: number;
  passed: number;
  retried: number;
  fused: number;
  avg_score: number;
  kps_touched: number;
  case_studies: number;
  case_completed: number;
  case_score: number;
  reviews_done: number;
  review_avg: number;
  ai_touches: number;
  engagement: number;
  risk_level: string;
  active_week: boolean;
  last_active: string;
}

interface MonitorData {
  summary: {
    total_students: number;
    active_week: number;
    total_cycles: number;
    total_case_studies: number;
    total_reviews: number;
    total_ai_touches: number;
  };
  students: StudentItem[];
}

export default function TeacherMonitor() {
  const [data, setData] = useState<MonitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null);
  const [sortBy, setSortBy] = useState<'engagement' | 'ai_touches' | 'avg_score' | 'risk'>('engagement');

  useEffect(() => {
    fetch('/api/teacher/monitor')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-7 w-32 bg-slate-200 rounded-lg" />
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center text-slate-400">
          <Activity size={48} className="mx-auto mb-4 opacity-30" />
          <p>暂无监控数据。学生开始使用后数据会出现在这里。</p>
        </div>
      </div>
    );
  }

  const s = data.summary;
  const students = [...data.students].sort((a, b) => {
    if (sortBy === 'engagement') return b.engagement - a.engagement;
    if (sortBy === 'ai_touches') return b.ai_touches - a.ai_touches;
    if (sortBy === 'avg_score') return b.avg_score - a.avg_score;
    // risk: high > medium > normal
    const riskOrder: Record<string, number> = { high: 3, medium: 2, normal: 1 };
    return (riskOrder[b.risk_level] || 0) - (riskOrder[a.risk_level] || 0);
  });

  const highRisk = students.filter(st => st.risk_level === 'high');
  const inactive = students.filter(st => !st.active_week && st.engagement < 20);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-2">
          <Activity size={22} className="text-indigo-600" />
          <h1 className="text-xl font-bold text-slate-800">学习监控</h1>
        </div>
        <p className="text-sm text-slate-500 mb-6">学生互动投入度与 AI 使用深度分析</p>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          {[
            { icon: Users, value: s.total_students, label: '学生总数', color: 'text-indigo-600 bg-indigo-50' },
            { icon: Activity, value: s.active_week, label: '本周活跃', color: 'text-emerald-600 bg-emerald-50' },
            { icon: Zap, value: s.total_ai_touches, label: 'AI 交互次数', color: 'text-purple-600 bg-purple-50' },
            { icon: MessageCircle, value: s.total_cycles, label: '学习循环', color: 'text-amber-600 bg-amber-50' },
            { icon: BookOpen, value: s.total_case_studies, label: '案例实战', color: 'text-rose-600 bg-rose-50' },
            { icon: Award, value: s.total_reviews, label: '复习次数', color: 'text-cyan-600 bg-cyan-50' },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
                <div className={`w-8 h-8 rounded-lg ${stat.color} flex items-center justify-center mx-auto mb-2`}>
                  <Icon size={14} />
                </div>
                <div className="text-xl font-bold text-slate-800">{stat.value}</div>
                <div className="text-[10px] text-slate-500">{stat.label}</div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main table (3 cols) */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
                <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Users size={16} className="text-indigo-600" /> 学生互动深度
                </h2>
                <div className="flex gap-1.5">
                  {[
                    { key: 'engagement' as const, label: '投入度' },
                    { key: 'ai_touches' as const, label: 'AI交互' },
                    { key: 'avg_score' as const, label: '成绩' },
                    { key: 'risk' as const, label: '风险' },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => setSortBy(opt.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        sortBy === opt.key ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table header */}
              <div className="grid grid-cols-10 gap-2 px-4 py-2.5 bg-slate-50 text-[10px] text-slate-500 font-medium border-b border-slate-100">
                <div className="col-span-2">学生</div>
                <div className="text-center">投入度</div>
                <div className="text-center">AI交互</div>
                <div className="text-center">循环</div>
                <div className="text-center">案例</div>
                <div className="text-center">复习</div>
                <div className="text-center">均分</div>
                <div className="text-center">状态</div>
              </div>

              {/* Table body */}
              <div className="max-h-[500px] overflow-y-auto">
                {students.map(st => (
                  <button
                    key={st.student_id}
                    onClick={() => setSelectedStudent(st === selectedStudent ? null : st)}
                    className={`w-full grid grid-cols-10 gap-2 px-4 py-3 text-left border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                      selectedStudent?.student_id === st.student_id ? 'bg-indigo-50/50' : ''
                    } ${
                      st.risk_level === 'high' ? 'border-l-4 border-l-red-400' : st.risk_level === 'medium' ? 'border-l-4 border-l-amber-400' : ''
                    }`}
                  >
                    <div className="col-span-2 flex items-center gap-2 min-w-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${
                        st.risk_level === 'high' ? 'bg-red-400' : st.risk_level === 'medium' ? 'bg-amber-400' : st.active_week ? 'bg-emerald-400' : 'bg-slate-300'
                      }`} />
                      <span className="text-xs font-medium text-slate-700 truncate">{st.display_name || st.student_id?.slice(0, 14)}</span>
                    </div>

                    {/* Engagement bar */}
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${st.engagement >= 70 ? 'bg-emerald-400' : st.engagement >= 30 ? 'bg-indigo-400' : 'bg-amber-400'}`}
                          style={{ width: `${st.engagement}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 w-7 text-right">{st.engagement}</span>
                    </div>

                    <div className="text-center text-xs text-purple-600 font-medium">{st.ai_touches}</div>
                    <div className="text-center text-xs text-slate-600">{st.cycles}</div>
                    <div className="text-center text-xs text-slate-600">{st.case_studies}</div>
                    <div className="text-center text-xs text-slate-600">{st.reviews_done}</div>
                    <div className={`text-center text-xs font-medium ${st.avg_score >= 70 ? 'text-emerald-600' : st.avg_score >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                      {st.avg_score}%
                    </div>
                    <div className="flex items-center justify-center gap-0.5">
                      {st.risk_level === 'high' && <AlertCircle size={12} className="text-red-500" title="高风险" />}
                      {st.risk_level === 'medium' && <AlertCircle size={12} className="text-amber-500" title="需关注" />}
                      {st.risk_level === 'normal' && st.active_week && <CheckCircle2 size={12} className="text-emerald-500" title="正常" />}
                      {!st.active_week && st.risk_level === 'normal' && <span className="text-[9px] text-slate-400">休眠</span>}
                    </div>
                  </button>
                ))}

                {students.length === 0 && (
                  <div className="text-center py-12 text-xs text-slate-400">暂无学生数据</div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar (1 col) */}
          <div className="space-y-4">
            {/* Alerts */}
            {highRisk.length > 0 && (
              <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle size={14} className="text-red-500" />
                  <span className="text-sm font-semibold text-red-700">高风险学生</span>
                </div>
                <div className="space-y-1.5">
                  {highRisk.map(st => (
                    <div key={st.student_id} className="text-xs text-red-600 flex justify-between">
                      <span className="truncate">{st.display_name || st.student_id?.slice(0, 12)}</span>
                      <span>熔断{st.fused} 重学{st.retried}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {inactive.length > 0 && (
              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={14} className="text-amber-500" />
                  <span className="text-sm font-semibold text-amber-700">低活跃学生</span>
                </div>
                <div className="space-y-1.5">
                  {inactive.slice(0, 5).map(st => (
                    <div key={st.student_id} className="text-xs text-amber-600">
                      {st.display_name || st.student_id?.slice(0, 12)} · {st.cycles}轮·投入度{st.engagement}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Student detail popup */}
            {selectedStudent && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                <h3 className="font-semibold text-sm text-slate-800 mb-3 truncate">{selectedStudent.display_name || selectedStudent.student_id}</h3>
                <div className="space-y-2.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">投入度评分</span>
                    <span className="font-medium text-indigo-600">{selectedStudent.engagement}/100</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">AI 交互估算</span>
                    <span className="font-medium text-purple-600">{selectedStudent.ai_touches} 次</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">学习循环</span>
                    <span className="font-medium text-slate-700">{selectedStudent.cycles} 轮</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">案例实战</span>
                    <span className="font-medium text-slate-700">
                      {selectedStudent.case_studies > 0
                        ? `${selectedStudent.case_completed}/${selectedStudent.case_studies} 完成`
                        : '未参与'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">艾宾浩斯复习</span>
                    <span className="font-medium text-slate-700">{selectedStudent.reviews_done} 次</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">平均正确率</span>
                    <span className={`font-medium ${selectedStudent.avg_score >= 70 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {selectedStudent.avg_score}%
                    </span>
                  </div>
                  <hr className="border-slate-100" />
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                    <div className="bg-emerald-50 rounded-lg p-1.5">
                      <div className="font-bold text-emerald-600">{selectedStudent.passed}</div>
                      <div className="text-slate-500">通过</div>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-1.5">
                      <div className="font-bold text-amber-600">{selectedStudent.retried}</div>
                      <div className="text-slate-500">重学</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-1.5">
                      <div className="font-bold text-red-500">{selectedStudent.fused}</div>
                      <div className="text-slate-500">熔断</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    最近活跃：{selectedStudent.last_active ? new Date(selectedStudent.last_active).toLocaleDateString('zh-CN') : '无'}
                  </div>
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
              <h3 className="text-xs font-semibold text-slate-600 mb-2">图例</h3>
              <div className="space-y-1.5 text-[10px] text-slate-500">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-400" /> 本周活跃</div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-300" /> 未活跃</div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-400" /> 高风险</div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-400" /> 需关注</div>
              </div>
              <div className="mt-2 text-[9px] text-slate-400 leading-relaxed">
                投入度 = 学习循环×5 + 案例×10 + 复习×3 + 活跃加分<br />
                AI交互 = 循环×3 + 案例×4（估算值）
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
