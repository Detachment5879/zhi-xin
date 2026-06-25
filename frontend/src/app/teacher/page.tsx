'use client';

import { useState, useEffect } from 'react';
import { Users, TrendingUp, AlertCircle, CheckCircle2, RotateCcw, BarChart3, ChevronRight, X, Flag, BookOpen, Sparkles, Download, Search, Eye, Briefcase } from 'lucide-react';

export default function TeacherPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [reviewStats, setReviewStats] = useState<any>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentDetail, setStudentDetail] = useState<any[]>([]);
  const [caseStudyData, setCaseStudyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState('');
  const [tab, setTab] = useState<'overview'|'students'|'review'>('overview');

  useEffect(() => {
    const url = `/api/teacher/students${classFilter ? `?class_id=${classFilter}` : ''}`;
    Promise.all([
      fetch(url).then(r => r.json()),
      fetch('/api/teacher/review-stats').then(r => r.json()),
    ]).then(([s, r]) => {
      setStudents(s); setReviewStats(r); setLoading(false);
    }).catch(() => setLoading(false));
  }, [classFilter]);

  const openStudent = async (student: any) => {
    setSelectedStudent(student);
    try {
      const [detailRes, csRes] = await Promise.all([
        fetch(`/api/teacher/student/${student.student_id}`),
        fetch(`/api/teacher/student/${student.student_id}/case-study`),
      ]);
      const data = await detailRes.json();
      const csData = await csRes.json();
      setStudentDetail(Array.isArray(data) ? data : []);
      setCaseStudyData(Array.isArray(csData) ? csData : []);
    } catch { setStudentDetail([]); setCaseStudyData([]); }
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50"><div className="max-w-5xl mx-auto px-6 py-8"><div className="animate-pulse space-y-4"><div className="h-7 w-24 bg-slate-200 rounded-lg"/>{[1,2,3].map(i=><div key={i} className="h-32 bg-slate-100 rounded-2xl"/>)}</div></div></div>
  );

  const atRisk = students.filter(s => s.fused > 0 || (s.avg_accuracy < 50 && s.total_sessions > 2));
  const struggling = students.filter(s => s.retried > 1 || (s.avg_accuracy >= 50 && s.avg_accuracy < 70 && s.total_sessions > 2));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-2">
          <Users size={22} className="text-indigo-600" />
          <h1 className="text-xl font-bold text-slate-800">教师工作台</h1>
        </div>

        {/* Alert cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { icon: Flag, value: atRisk.length, label: '需关注', color: 'text-red-600 bg-red-50', border: 'border-red-100' },
            { icon: AlertCircle, value: struggling.length, label: '待提升', color: 'text-amber-600 bg-amber-50', border: 'border-amber-100' },
            { icon: CheckCircle2, value: students.filter(s => s.passed > 0).length, label: '有进步', color: 'text-emerald-600 bg-emerald-50', border: 'border-emerald-100' },
            { icon: Users, value: students.length, label: '总学生', color: 'text-indigo-600 bg-indigo-50', border: 'border-indigo-100' },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className={`bg-white rounded-2xl p-4 shadow-sm border ${stat.border}`}>
                <div className={`w-9 h-9 rounded-xl ${stat.color} flex items-center justify-center mb-2`}><Icon size={16} /></div>
                <div className={`text-xl font-bold ${stat.color.split(' ')[0]}`}>{stat.value}</div>
                <div className="text-xs text-slate-500">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* AI Review Stats */}
        {reviewStats && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-6">
            <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-purple-600" /> AI 内容质量
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div><div className="text-lg font-bold text-purple-600">{reviewStats.avg_score}分</div><div className="text-[10px] text-slate-400">平均审核分</div></div>
              <div><div className="text-lg font-bold text-emerald-600">{reviewStats.passed}</div><div className="text-[10px] text-slate-400">审核通过</div></div>
              <div><div className="text-lg font-bold text-red-500">{reviewStats.failed}</div><div className="text-[10px] text-slate-400">审核未过</div></div>
              <div><div className="text-lg font-bold text-slate-700">{reviewStats.total_generations}</div><div className="text-[10px] text-slate-400">总生成次数</div></div>
              <div><div className="text-lg font-bold text-indigo-600">{reviewStats.passed + reviewStats.failed > 0 ? Math.round(reviewStats.passed / (reviewStats.passed + reviewStats.failed) * 100) : 0}%</div><div className="text-[10px] text-slate-400">通过率</div></div>
            </div>
            {reviewStats.by_type?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
                {reviewStats.by_type.map((t: any) => (
                  <span key={t.type} className="text-[10px] bg-slate-50 px-2 py-1 rounded-full text-slate-500">
                    {t.type}: {t.passed}/{t.total} 通过
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Student list */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <Search size={16} className="text-indigo-600" /> 学生列表
            </h2>
            <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 bg-white">
              <option value="">全部班级</option>
              {[...new Set(students.map(s => s.class_name).filter(Boolean))].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* At-risk alert */}
          {atRisk.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4 flex items-start gap-2">
              <Flag size={14} className="text-red-500 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-red-700">{atRisk.length} 名学生需要关注</div>
                <div className="text-[10px] text-red-500 mt-0.5">
                  {atRisk.map(s => s.student_id).join('、')} — 熔断或持续低正确率
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto">
            {students.map(s => (
              <button key={s.student_id} onClick={() => openStudent(s)}
                className={`text-left bg-slate-50 rounded-xl p-3.5 border transition-all ${
                  selectedStudent?.student_id === s.student_id ? 'border-indigo-300 ring-2 ring-indigo-100 bg-white' : 'border-transparent hover:border-slate-200 hover:bg-white'
                } ${
                  s.fused > 0 ? 'border-l-4 border-l-red-400' : s.avg_accuracy < 50 && s.total_sessions > 2 ? 'border-l-4 border-l-amber-400' : ''
                }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      s.fused > 0 ? 'bg-red-400' : s.avg_accuracy < 50 ? 'bg-amber-400' : s.passed > 0 ? 'bg-emerald-400' : 'bg-slate-300'
                    }`} />
                    <div>
                      <span className="text-sm font-semibold text-slate-700">{s.student_id}</span>
                      {s.class_name && <span className="text-[10px] text-slate-400 ml-2">{s.class_name}</span>}
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-300" />
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div><div className="text-sm font-bold text-slate-700">{s.total_sessions}</div><div className="text-[9px] text-slate-400">次数</div></div>
                  <div><div className="text-sm font-bold text-emerald-600">{s.passed}</div><div className="text-[9px] text-slate-400">通过</div></div>
                  <div><div className="text-sm font-bold text-amber-600">{s.retried}</div><div className="text-[9px] text-slate-400">重学</div></div>
                  <div><div className={`text-sm font-bold ${s.avg_accuracy >= 70 ? 'text-emerald-600' : s.avg_accuracy >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{s.avg_accuracy}%</div><div className="text-[9px] text-slate-400">正确率</div></div>
                </div>
                {s.mastered_names?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {s.mastered_names.map((n: string) => (
                      <span key={n} className="text-[9px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full">{n}</span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Student detail modal/sidebar */}
        {selectedStudent && (
          <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-white shadow-2xl border-l border-slate-200 z-40 overflow-y-auto">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800">{selectedStudent.student_id}</h3>
                <button onClick={() => setSelectedStudent(null)} className="p-1 hover:bg-slate-100 rounded-lg"><X size={18} className="text-slate-400"/></button>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-indigo-50 rounded-xl p-3 text-center"><div className="text-lg font-bold text-indigo-600">{selectedStudent.total_sessions}</div><div className="text-[10px] text-slate-500">学习次数</div></div>
                <div className="bg-emerald-50 rounded-xl p-3 text-center"><div className="text-lg font-bold text-emerald-600">{selectedStudent.avg_accuracy}%</div><div className="text-[10px] text-slate-500">正确率</div></div>
                <div className="bg-purple-50 rounded-xl p-3 text-center"><div className="text-lg font-bold text-purple-600">{selectedStudent.kps_mastered}/{selectedStudent.kps_attempted}</div><div className="text-[10px] text-slate-500">已掌握</div></div>
              </div>

              <h4 className="font-semibold text-sm text-slate-700 mb-2">学习记录</h4>
              {studentDetail.length === 0 ? <p className="text-xs text-slate-400 py-4 text-center">暂无记录</p> : (
                <div className="space-y-2">
                  {studentDetail.map((r: any, i: number) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-slate-700">{r.kp_name}</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                          r.decision === 'pass' ? 'bg-emerald-100 text-emerald-600' : r.decision === 'retry' ? 'bg-amber-100 text-amber-600' : r.decision === 'fuse' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'
                        }`}>{r.decision || '进行中'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span>第{r.cycle}轮</span>
                        {r.pre_test != null && <span>前测 {(r.pre_test*100).toFixed(0)}%</span>}
                        {r.post_test != null && <span>→ 后测 {(r.post_test*100).toFixed(0)}%</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                <button className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-500 transition-colors flex items-center justify-center gap-1.5">
                  <Eye size={14} /> 查看详细报告
                </button>
                <button className="px-3 py-2.5 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors" onClick={() => {
                  const headers = '姓名,知识点,轮次,前测,后测,结果\n';
                  const rows = studentDetail.map((r: any) =>
                    `"${selectedStudent.student_id}","${r.kp_name}",${r.cycle},${r.pre_test!=null?(r.pre_test*100).toFixed(0):'-'},${r.post_test!=null?(r.post_test*100).toFixed(0):'-'},${r.decision||'进行中'}`
                  ).join('\n');
                  const blob = new Blob(['\uFEFF' + headers + rows], {type: 'text/csv;charset=utf-8;'});
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url; a.download = `学生记录_${selectedStudent.student_id}.csv`; a.click();
                }}>
                  <Download size={14} />
                </button>
              </div>

              {/* Case study results */}
              {caseStudyData.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <h4 className="font-semibold text-sm text-slate-700 mb-2 flex items-center gap-1.5">
                    <Briefcase size={13} className="text-indigo-600" /> 案例实战
                  </h4>
                  <div className="space-y-2">
                    {caseStudyData.map((cs: any, i: number) => (
                      <div key={i} className="p-2.5 bg-purple-50 rounded-xl">
                        <div className="text-xs font-medium text-slate-700">{cs.scenario}</div>
                        <div className="flex items-center justify-between mt-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            cs.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                          }`}>
                            {cs.status === 'completed' ? '已完成' : '进行中'}
                          </span>
                          {cs.status === 'completed' && (
                            <span className="text-[10px] text-purple-600 font-medium">
                              正确 {cs.correct_count}/{cs.current_step}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
