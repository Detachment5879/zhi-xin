'use client';

import { useState, useEffect } from 'react';
import { GraduationCap, Zap, Target, Sparkles, BookOpen, CheckCircle2, AlertCircle, Lightbulb, ChevronRight, ArrowRight, RotateCcw, BarChart3, Menu, Settings, ChevronDown } from 'lucide-react';
import AuthPage from './auth';
import Sidebar from '@/components/Sidebar';
import ProfilePage from './profile/page';
import MindMapViewer from '@/components/MindMapViewer';
import Markdown from '@/components/Markdown';
import WrongAnswersPage from './wrong-answers/page';
import HistoryPage from './history/page';
import ChatPage from './chat/page';
import Dashboard from './dashboard/page';
import KnowledgePage from './knowledge/page';
import SettingsPage from './settings/page';
import TeacherPage from './teacher/page';
import TeacherLayout from './TeacherLayout';
import FeynmanPage from './feynman/page';
import CaseStudyPage from './case-study/page';
import ChatBubble from '@/components/ChatBubble';

interface Question { id: string; type: string; question_text: string; options: string[] | null; }

interface KPItem { id: string; name: string; }
interface Chapter { chapter: string; points: KPItem[] }

const STEPS_ICONS = [Zap, Target, Sparkles, BookOpen, CheckCircle2];
const STEPS_LABELS = ['前测诊断', '锁定目标', 'AI 生成', '学习材料', '后测验证'];

function LearnPage() {
  const [tree, setTree] = useState<Chapter[]>([]);
  const [expandedCh, setExpandedCh] = useState<Record<string, boolean>>({});
  const [phase, setPhase] = useState<'idle'|'pretest'|'diagnosis'|'target'|'resource'|'posttest'|'done'>('idle');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string,string>>({});
  const [sessionId, setSessionId] = useState(''); const [kpName, setKpName] = useState('');
  const [cycleNum, setCycleNum] = useState(0); const [diagnosis, setDiagnosis] = useState('');
  const [accuracy, setAccuracy] = useState(0); const [target, setTarget] = useState('');
  const [resource, setResource] = useState<any>(null);
  const [reflection, setReflection] = useState(''); const [decision, setDecision] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [loading, setLoading] = useState(false); const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/knowledge/tree')
      .then(r => r.json())
      .then(treeData => {
        setTree(treeData);
        if (treeData.length > 0) setExpandedCh({ [treeData[0].chapter]: true });
      })
      .catch(() => {});
  }, []);

  const toggleCh = (ch: string) => setExpandedCh(prev => ({ ...prev, [ch]: !prev[ch] }));

  const call = async (path: string, body?: any) => {
    const res = await fetch(`/api${path}`, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    if (!res.ok) { const err = await res.json().catch(()=>({detail:res.statusText})); throw new Error(err.detail||'请求失败'); }
    return res.json();
  };

  const startCycle = async (kpId: string, name: string) => {
    setLoading(true); setError('');
    try {
      const data = await call('/kstar/cycle/start', { student_id: '00000000-0000-0000-0000-000000000005', kp_id: kpId });
      if (data.action==='redirect') { setError(data.message); setLoading(false); return; }
      setSessionId(data.session_id); setKpName(data.kp_name); setCycleNum(data.cycle_num);
      setQuestions(data.questions); setAnswers({}); setPhase('pretest');
    } catch(e:any) { setError(e.message); }
    setLoading(false);
  };

  const submitPreTest = async () => {
    setLoading(true); setError('');
    try {
      const ans = Object.entries(answers).map(([qid,a])=>({question_id:qid,answer:a}));
      const data = await call('/kstar/cycle/submit-pre-test',{session_id:sessionId,answers:ans});
      setAccuracy(data.accuracy);
      data.action==='skip' ? (setDecision('skip'),setPhase('done')) : (setDiagnosis(data.diagnosis),setPhase('diagnosis'));
    } catch(e:any) { setError(e.message); }
    setLoading(false);
  };

  const generateTarget = async () => {
    setLoading(true); setError('');
    try {
      const data = await call('/kstar/cycle/generate-target',{session_id:sessionId,diagnosis,course_goal:`掌握${kpName}`});
      setTarget(data.target); setPhase('target');
    } catch(e:any) { setError(e.message); }
    setLoading(false);
  };

  const generateResource = async () => {
    setLoading(true); setError('');
    try { const data = await call('/kstar/cycle/generate-resource',{session_id:sessionId}); setResource(data); setPhase('resource'); }
    catch(e:any) { setError(e.message); }
    setLoading(false);
  };

  const startPostTest = async () => {
    setLoading(true); setError('');
    try { const data = await call('/kstar/cycle/fetch-post-test',{session_id:sessionId}); setQuestions(data.questions); setAnswers({}); setPhase('posttest'); }
    catch(e:any) { setError(e.message); }
    setLoading(false);
  };

  const submitPostTest = async () => {
    setLoading(true); setError('');
    try {
      const ans = Object.entries(answers).map(([qid,a])=>({question_id:qid,answer:a}));
      const data = await call('/kstar/cycle/submit-post-test',{session_id:sessionId,answers:ans});
      setAccuracy(data.accuracy); setDecision(data.decision); setReflection(data.reflection); setNextAction(data.next_action); setPhase('done');
    } catch(e:any) { setError(e.message); }
    setLoading(false);
  };

  const reset = () => {
    setPhase('idle'); setQuestions([]); setAnswers({}); setSessionId(''); setKpName(''); setCycleNum(0);
    setDiagnosis(''); setAccuracy(0); setTarget(''); setResource(null); setReflection(''); setDecision(''); setNextAction(''); setError('');
  };

  const getStepIdx = () => {
    if (phase==='pretest') return 1;
    if (phase==='diagnosis'||phase==='target') return 2;
    if (phase==='resource') return 4;
    if (phase==='posttest'||phase==='done') return 5;
    return 0;
  };

  const renderQuestion = (q: Question, i: number) => (
    <div key={q.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-3 hover:border-indigo-200 transition-all">
      <div className="flex gap-3">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${answers[q.id] ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
          {answers[q.id] ? '✓' : i+1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 mb-3">{q.question_text}</p>
          {q.type === 'open' ? (
            <textarea value={answers[q.id]||''} onChange={e=>setAnswers({...answers,[q.id]:e.target.value})}
              className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm focus:border-indigo-300 focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all" rows={2} />
          ) : q.type === 'true_false' ? (
            <div className="flex gap-2">
              {['true','false'].map(v=>(
                <button key={v} onClick={()=>setAnswers({...answers,[q.id]:v})}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${answers[q.id]===v ? 'bg-indigo-50 text-indigo-700 border-2 border-indigo-300' : 'bg-slate-50 text-slate-600 border-2 border-transparent hover:border-slate-300'}`}>
                  {v==='true'?'✓ 正确':'✗ 错误'}
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {(q.options||[]).map(o=>(
                <button key={o.charAt(0)} onClick={()=>setAnswers({...answers,[q.id]:o.charAt(0)})}
                  className={`text-left px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${answers[q.id]===o.charAt(0) ? 'bg-indigo-50 text-indigo-700 border-2 border-indigo-300' : 'bg-slate-50 text-slate-600 border-2 border-transparent hover:border-slate-300'}`}>
                  <span className="text-[10px] text-slate-400 mr-1.5 font-mono">{o.charAt(0)}.</span>{o.substring(3)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Compact header */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-6 py-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur text-white/80 text-xs font-medium mb-2 border border-white/10">
            <BarChart3 size={12} /> 1 课 · 3 知识点
          </div>
          <h1 className="text-xl font-bold tracking-tight">知薪 循环学习</h1>
          <p className="text-indigo-200 text-sm mt-0.5">基于多智能体与大模型的个性化学习系统</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
        {/* Step Indicator */}
        {phase !== 'idle' && (
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-4 -mt-10 relative z-10">
            <div className="flex items-center justify-between">
              {STEPS_ICONS.map((Icon, i) => {
                const stepNum = [1, 2, 3, 4, 5][i];
                const isActive = stepNum === getStepIdx();
                const isDone = stepNum < getStepIdx();
                return (
                  <div key={i} className="flex items-center flex-1">
                    <div className={`flex flex-col items-center gap-1 ${isDone||isActive?'':'opacity-40'}`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        isDone ? 'bg-emerald-100 text-emerald-600' : isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110' : 'bg-slate-100 text-slate-400'}`}>
                        {isDone ? <CheckCircle2 size={16} /> : <Icon size={15} />}
                      </div>
                      <span className={`text-[10px] font-medium ${isActive?'text-indigo-600':isDone?'text-emerald-600':'text-slate-400'}`}>{STEPS_LABELS[i]}</span>
                    </div>
                    {i < 4 && <div className={`flex-1 h-0.5 mx-1 rounded-full ${i < getStepIdx()-1 ? 'bg-emerald-300' : i === getStepIdx()-1 ? 'bg-gradient-to-r from-emerald-300 to-slate-200' : 'bg-slate-200'}`} />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700 flex items-start gap-3">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div style={{whiteSpace:'pre-wrap'}}>{error}</div>
          </div>
        )}

        {/* IDLE: KP Tree */}
        {phase === 'idle' && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-800">📚 选择要学习的知识点</h2>
            <p className="text-xs text-slate-400 -mt-1">{tree.length}章 · {tree.flatMap(c=>c.points).length}个知识点</p>
            {tree.map(ch => (
              <div key={ch.chapter} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <button onClick={() => toggleCh(ch.chapter)}
                  className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    {expandedCh[ch.chapter] ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                    <span className="font-semibold text-slate-800">{ch.chapter}</span>
                    <span className="text-xs text-slate-400">{ch.points.length}知识点</span>
                  </div>
                </button>
                {expandedCh[ch.chapter] && (
                  <div className="border-t border-slate-50">
                    {ch.points.map(kp => (
                      <button key={kp.id} onClick={() => startCycle(kp.id, kp.name)} disabled={loading}
                        className="w-full text-left p-3.5 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors group flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm text-slate-700 group-hover:text-indigo-600 transition-colors">{kp.name}</div>
                          <div className="text-xs text-slate-400 mt-0.5">国际贸易实务</div>
                        </div>
                        <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* PRETEST */}
        {phase === 'pretest' && (
          <div className="animate-fadeIn">
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">K 阶段</span>
            <h2 className="text-lg font-bold text-slate-800 mt-2 mb-1">前测诊断 · {kpName}</h2>
            <p className="text-sm text-slate-500 mb-4">第 {cycleNum} 轮 · 共 {questions.length} 题</p>
            {questions.map((q,i) => renderQuestion(q,i))}
            <button onClick={submitPreTest} disabled={loading}
              className="w-full mt-4 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-semibold transition-all hover:shadow-lg hover:shadow-indigo-200 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? '诊断中...' : <>{'提交答案'} <ArrowRight size={16} /></>}
            </button>
          </div>
        )}

        {/* DIAGNOSIS */}
        {phase === 'diagnosis' && (
          <div className="animate-fadeIn">
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">S 阶段</span>
            <h2 className="text-lg font-bold text-slate-800 mt-2 mb-1">诊断结果</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle size={18} className="text-amber-600" />
                  <span className="text-sm font-semibold text-amber-700">正确率 {(accuracy*100).toFixed(0)}%</span>
                </div>
                <div className="w-32 h-2 bg-amber-200 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full transition-all" style={{width:`${accuracy*100}%`}} />
                </div>
              </div>
              <div className="p-6">
                <Markdown content={diagnosis} />
              </div>
            </div>
            <button onClick={generateTarget} disabled={loading}
              className="w-full mt-4 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-semibold transition-all hover:shadow-lg hover:shadow-indigo-200 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? '分析中...' : <>{'下一步：锁定学习目标'} <ChevronRight size={16} /></>}
            </button>
          </div>
        )}

        {/* TARGET */}
        {phase === 'target' && (
          <div className="animate-fadeIn">
            <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">T 阶段</span>
            <h2 className="text-lg font-bold text-slate-800 mt-2 mb-1">当前学习目标</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <Markdown content={target} />
            </div>
            <button onClick={generateResource} disabled={loading}
              className="w-full mt-4 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-semibold transition-all hover:shadow-lg hover:shadow-indigo-200 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? '生成中...' : <>{'下一步：AI 生成学习材料'} <Sparkles size={16} /></>}
            </button>
          </div>
        )}

        {/* RESOURCE */}
        {phase === 'resource' && resource && (
          <div className="animate-fadeIn">
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">A 阶段</span>
            <h2 className="text-lg font-bold text-slate-800 mt-2 mb-1">学习材料</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-indigo-600" />
                  <span className="text-sm font-semibold text-indigo-700">{resource.label}</span>
                </div>
                {resource.review && (
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium ${resource.review.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    <CheckCircle2 size={11} /> ReviewAgent {resource.review.score}分
                  </span>
                )}
              </div>
              <div className="p-6">
                {resource.resource_type === 'mind_map' ? (
                  <MindMapViewer content={resource.content} />
                ) : (
                  <Markdown content={resource.content} />
                )}
              </div>
            </div>
            <button onClick={startPostTest} disabled={loading}
              className="w-full mt-4 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-semibold transition-all hover:shadow-lg hover:shadow-emerald-200 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? '加载后测题...' : <>{'我已学完，开始后测'} <CheckCircle2 size={16} /></>}
            </button>
          </div>
        )}

        {/* POSTTEST */}
        {phase === 'posttest' && (
          <div className="animate-fadeIn">
            <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">R 阶段</span>
            <h2 className="text-lg font-bold text-slate-800 mt-2 mb-1">后测验证 · {kpName}</h2>
            <p className="text-sm text-slate-500 mb-4">{questions.length} 道题检验学习效果</p>
            {questions.map((q,i) => renderQuestion(q,i))}
            <button onClick={submitPostTest} disabled={loading}
              className="w-full mt-4 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-semibold transition-all hover:shadow-lg hover:shadow-indigo-200 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? '评估中...' : '提交后测'}
            </button>
          </div>
        )}

        {/* DONE */}
        {phase === 'done' && (
          <div className="animate-fadeIn text-center">
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-10">
              <div className={`w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center ${decision==='pass'||decision==='skip' ? 'bg-emerald-100' : decision==='retry' ? 'bg-amber-100' : 'bg-red-100'}`}>
                {decision==='pass'||decision==='skip' ? <CheckCircle2 size={40} className="text-emerald-600" />
                  : decision==='retry' ? <RotateCcw size={40} className="text-amber-600" />
                  : <AlertCircle size={40} className="text-red-500" />}
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">
                {decision==='pass'?'恭喜通过！':decision==='skip'?'已掌握，跳过！':decision==='retry'?'需要再学一轮':'已熔断'}
              </h2>
              <p className="text-slate-500 mb-1">正确率 {(accuracy*100).toFixed(0)}%</p>
              {reflection && <div className="text-sm text-slate-500 mt-2 mb-4"><Markdown content={reflection} /></div>}
              <div className="flex gap-3 justify-center mt-6">
                {decision==='retry' && (
                  <button onClick={()=>startCycle(tree.flatMap(c=>c.points).find(k=>k.name===kpName)?.id||'',kpName)}
                    className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-semibold transition-all flex items-center gap-2">
                    <RotateCcw size={14} /> 再学一轮
                  </button>
                )}
                <button onClick={reset} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-semibold transition-all flex items-center gap-2">
                  选下一个知识点 <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {loading && (
          <div className="fixed inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl px-8 py-6 flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-slate-600 font-medium">AI 正在思考...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [role, setRole] = useState<'student' | 'teacher' | null>(null);
  const [navActive, setNavActive] = useState('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') return window.innerWidth < 768;
    return false;
  });

  useEffect(() => {
    const handler = () => setSidebarCollapsed(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  if (!role) return <AuthPage onLogin={setRole} />;

  if (role === 'teacher') return <TeacherLayout sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} />;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar active={navActive} onChange={setNavActive} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'md:ml-16 ml-0' : 'md:ml-56 ml-0'}`}>
        <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="md:hidden fixed top-4 left-4 z-30 w-10 h-10 bg-white rounded-xl shadow-lg border border-slate-200 flex items-center justify-center">
          <Menu size={18} className="text-slate-600" />
        </button>
        {navActive === 'home' && <Dashboard onNavigate={setNavActive} onStartLearn={(kpId, name) => { setNavActive('learn'); }} />}
        {navActive === 'learn' && <LearnPage />}
        {navActive === 'knowledge' && <KnowledgePage onStartLearn={(kpId, name) => { setNavActive('learn'); }} />}
        {navActive === 'history' && <HistoryPage />}
        {navActive === 'chat' && <ChatPage />}
        {navActive === 'wrong' && <WrongAnswersPage />}
        {navActive === 'feynman' && <FeynmanPage />}
        {navActive === 'case-study' && <CaseStudyPage />}
        {navActive === 'profile' && <ProfilePage />}
        {navActive === 'settings' && <SettingsPage />}
      </main>
      {navActive !== 'chat' && <ChatBubble />}
    </div>
  );
}
