'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, Eye, FileText, Headphones, Target, Award, BookOpen, Sparkles, User, GraduationCap, TrendingUp, Clock, CheckCircle2, AlertCircle, BarChart3 } from 'lucide-react';
import CognitiveRadar from '@/components/CognitiveRadar';

const STYLES = [
  { value: 'visual', label: '视觉型', icon: Eye, desc: '偏好图表、思维导图、视频', tip: 'AI 会优先生成思维导图和结构化图表' },
  { value: 'auditory', label: '听觉型', icon: Headphones, desc: '偏好音频讲解、讨论', tip: 'AI 会用口语化表达，适合朗读学习' },
  { value: 'reading', label: '阅读型', icon: FileText, desc: '偏好文字讲义、笔记', tip: 'AI 会生成详细的结构化讲义' },
];

const GOALS = [
  { value: 'exam', label: '应试备考', icon: Target, desc: '侧重考点、真题、得分技巧', tip: 'AI 会标注考点频率和答题模板' },
  { value: 'practical', label: '实战应用', icon: Award, desc: '侧重案例、场景、实操', tip: 'AI 会用真实贸易案例讲解' },
  { value: 'basic', label: '基础入门', icon: BookOpen, desc: '侧重概念、原理、框架', tip: 'AI 会从零讲起，多举例多类比' },
];

const EXPLAIN_STYLES = [
  { value: 'concise', label: '简洁', desc: '言简意赅，只讲关键要点', tip: '适合复习和快速浏览' },
  { value: 'balanced', label: '适中', desc: '核心内容展开讲，其他点到为止', tip: '大多数人最舒服的节奏' },
  { value: 'detailed', label: '详细', desc: '多举例、多类比，确保理解透彻', tip: '适合第一次接触某个知识点' },
];

export default function ProfilePage() {
  const [cognitiveStyle, setCognitiveStyle] = useState('reading');
  const [learningGoal, setLearningGoal] = useState('basic');
  const [explanationStyle, setExplanationStyle] = useState('balanced');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState('');

  // 学习概况
  const [stats, setStats] = useState({ totalKPs: 0, mastered: 0, avgAccuracy: 0, totalSessions: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    // 并行加载画像 + 学习进度
    Promise.all([
      fetch('/api/profile?user_id=00000000-0000-0000-0000-000000000005'),
      fetch('/api/progress'),
    ])
      .then(async ([profileRes, progressRes]) => {
        if (profileRes.ok) {
          const data = await profileRes.json();
          if (data.cognitive_style) setCognitiveStyle(data.cognitive_style);
          if (data.learning_goal) setLearningGoal(data.learning_goal);
          if (data.explanation_style) setExplanationStyle(data.explanation_style);
        }
        if (progressRes.ok) {
          const p = await progressRes.json();
          setStats({
            totalKPs: p.total_kps || 0,
            mastered: p.mastered || 0,
            avgAccuracy: p.avg_accuracy || 0,
            totalSessions: p.total_sessions || 0,
          });
        }
      })
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setSaveError('');
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: '00000000-0000-0000-0000-000000000005',
          cognitive_style: cognitiveStyle,
          learning_goal: learningGoal,
          explanation_style: explanationStyle,
        }),
      });
      if (!res.ok) throw new Error('保存失败');
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setSaveError(e.message || '保存失败，请重试');
    }
    setLoading(false);
  };

  const scoreStyle = cognitiveStyle==='visual'?100:cognitiveStyle==='reading'?50:0;
  const scoreGoal = learningGoal==='practical'?100:learningGoal==='exam'?50:0;
  const scoreExplain = explanationStyle==='detailed'?100:explanationStyle==='balanced'?50:0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings size={22} className="text-indigo-600" />
          <h1 className="text-xl font-bold text-slate-800">画像设置</h1>
        </div>
        <p className="text-sm text-slate-500 mb-8">设置你的学习偏好，AI 将据此生成最适合你的学习材料</p>

        {/* ============================================ */}
        {/* 个人档案 */}
        {/* ============================================ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-6">
          <h2 className="font-semibold text-slate-800 text-sm mb-4 flex items-center gap-2">
            <User size={15} className="text-indigo-600" /> 个人档案
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-slate-400 mb-0.5">姓名</div>
              <div className="text-sm font-semibold text-slate-800">邵逸飞</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-0.5">学号</div>
              <div className="text-sm font-mono text-slate-600">2023108560149</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-0.5">学部</div>
              <div className="text-sm text-slate-600">国际教育学部</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-0.5">专业 · 班级</div>
              <div className="text-sm text-slate-600">国际经济与贸易 · 国贸一班</div>
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* 学习概况 */}
        {/* ============================================ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-6">
          <h2 className="font-semibold text-slate-800 text-sm mb-4 flex items-center gap-2">
            <BarChart3 size={15} className="text-indigo-600" /> 学习概况
          </h2>
          {statsLoading ? (
            <div className="grid grid-cols-4 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-8 w-12 bg-slate-100 rounded mb-1" />
                  <div className="h-3 w-16 bg-slate-50 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-indigo-50 rounded-xl p-3">
                <div className="text-2xl font-bold text-indigo-700">{stats.totalKPs}</div>
                <div className="text-xs text-indigo-500">知识点总数</div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3">
                <div className="text-2xl font-bold text-emerald-700">{stats.mastered}</div>
                <div className="text-xs text-emerald-500">已掌握</div>
              </div>
              <div className="bg-amber-50 rounded-xl p-3">
                <div className="text-2xl font-bold text-amber-700">{stats.avgAccuracy}%</div>
                <div className="text-xs text-amber-500">平均正确率</div>
              </div>
              <div className="bg-purple-50 rounded-xl p-3">
                <div className="text-2xl font-bold text-purple-700">{stats.totalSessions}</div>
                <div className="text-xs text-purple-500">学习次数</div>
              </div>
            </div>
          )}
        </div>

        {/* ============================================ */}
        {/* 偏好设置 + 雷达 */}
        {/* ============================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Settings (2 cols) */}
          <div className="lg:col-span-2 space-y-5">
            {/* Cognitive Style */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h2 className="font-semibold text-slate-800 mb-1">认知风格</h2>
              <p className="text-xs text-slate-500 mb-4">你更倾向于哪种方式接收信息？这会影响 AI 生成材料的格式。</p>
              <div className="grid grid-cols-3 gap-2">
                {STYLES.map(s => {
                  const Icon = s.icon;
                  const selected = cognitiveStyle === s.value;
                  return (
                    <button key={s.value} onClick={() => setCognitiveStyle(s.value)}
                      className={`p-3 rounded-xl border-2 transition-all text-left ${
                        selected ? 'border-indigo-300 bg-indigo-50 shadow-sm' : 'border-slate-100 hover:border-slate-300'
                      }`}>
                      <Icon size={18} className={selected ? 'text-indigo-600' : 'text-slate-400'} />
                      <div className={`text-sm font-semibold mt-1.5 ${selected ? 'text-indigo-700' : 'text-slate-700'}`}>{s.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{s.desc}</div>
                      {selected && <div className="text-[10px] text-indigo-400 mt-1 leading-tight">💡 {s.tip}</div>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Learning Goal */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h2 className="font-semibold text-slate-800 mb-1">学习目标</h2>
              <p className="text-xs text-slate-500 mb-4">你学习这门课的主要目的是？这会影响 AI 选取哪些内容重点展开。</p>
              <div className="grid grid-cols-3 gap-2">
                {GOALS.map(g => {
                  const Icon = g.icon;
                  const selected = learningGoal === g.value;
                  return (
                    <button key={g.value} onClick={() => setLearningGoal(g.value)}
                      className={`p-3 rounded-xl border-2 transition-all text-left ${
                        selected ? 'border-amber-300 bg-amber-50 shadow-sm' : 'border-slate-100 hover:border-slate-300'
                      }`}>
                      <Icon size={18} className={selected ? 'text-amber-600' : 'text-slate-400'} />
                      <div className={`text-sm font-semibold mt-1.5 ${selected ? 'text-amber-700' : 'text-slate-700'}`}>{g.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{g.desc}</div>
                      {selected && <div className="text-[10px] text-amber-500 mt-1 leading-tight">💡 {g.tip}</div>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Explanation Style */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h2 className="font-semibold text-slate-800 mb-1">解释风格</h2>
              <p className="text-xs text-slate-500 mb-4">你更喜欢 AI 怎么跟你讲知识？这影响内容篇幅和深度。</p>
              <div className="grid grid-cols-3 gap-2">
                {EXPLAIN_STYLES.map(e => {
                  const selected = explanationStyle === e.value;
                  return (
                    <button key={e.value} onClick={() => setExplanationStyle(e.value)}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${
                        selected ? 'border-emerald-300 bg-emerald-50 shadow-sm' : 'border-slate-100 hover:border-slate-300'
                      }`}>
                      <div className={`text-sm font-semibold ${selected ? 'text-emerald-700' : 'text-slate-700'}`}>{e.label}</div>
                      <div className="text-[10px] text-slate-500 mt-1">{e.desc}</div>
                      {selected && <div className="text-[10px] text-emerald-500 mt-1 leading-tight">💡 {e.tip}</div>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Save button */}
            {saveError && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-sm text-red-700 flex items-center gap-2">
                <AlertCircle size={14} /> {saveError}
              </div>
            )}

            <button onClick={handleSave} disabled={loading}
              className={`w-full py-3.5 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 ${
                saved
                  ? 'bg-emerald-500 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:shadow-lg hover:shadow-indigo-200 active:scale-[0.99] disabled:opacity-50'
              }`}>
              {saved ? (
                <><CheckCircle2 size={18} /> 已保存</>
              ) : loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> 保存中...</>
              ) : (
                <><Save size={16} /> 保存设置</>
              )}
            </button>
          </div>

          {/* Right: Radar + Preview (1 col) */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sticky top-6">
              <h2 className="font-semibold text-slate-800 text-sm mb-4 flex items-center gap-2">
                <Sparkles size={14} className="text-indigo-600" /> 学习画像
              </h2>
              <CognitiveRadar visualScore={scoreStyle} practicalScore={scoreGoal} detailScore={scoreExplain} />
              <div className="flex justify-center gap-4 mt-4 text-[10px] text-slate-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-400" /> 视觉型</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> 实战型</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> 详细型</span>
              </div>

              {/* Preview of AI behavior */}
              <div className="mt-5 pt-4 border-t border-slate-100">
                <div className="text-xs text-slate-400 mb-3 flex items-center gap-1">
                  <Sparkles size={11} /> AI 将这样为你服务
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">输出格式</span>
                    <span className="font-medium text-indigo-600">
                      {cognitiveStyle==='visual'?'思维导图':cognitiveStyle==='auditory'?'口语化讲解':'结构化讲义'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">内容侧重</span>
                    <span className="font-medium text-amber-600">
                      {learningGoal==='exam'?'考点+真题':learningGoal==='practical'?'案例+场景':'概念+原理'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">解释深度</span>
                    <span className="font-medium text-emerald-600">
                      {explanationStyle==='concise'?'提纲要领':explanationStyle==='balanced'?'适中展开':'详细讲解'}
                    </span>
                  </div>
                </div>
              </div>

              {/* When settings take effect */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="text-[10px] text-slate-400 leading-relaxed">
                  这些设置将在下次「学习中心」启动 KSTAR 循环时生效，AI 会根据你的画像生成个性化学习材料。随时可以回来调整。
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
