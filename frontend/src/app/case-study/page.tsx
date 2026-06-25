'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Briefcase, ChevronRight, RotateCcw, CheckCircle2, AlertCircle, Star, TrendingUp } from 'lucide-react';

interface Scenario {
  id: string;
  slug: string;
  title: string;
  difficulty: number;
  description: string;
  max_steps: number;
  knowledge_point_names: string[];
}

interface Message {
  role: 'system' | 'user';
  content: string;
  options?: { id: string; text: string }[];
  evaluation?: string;
}

interface ActiveSession {
  session_id: string;
  title: string;
  max_steps: number;
  current_step: number;
  correct_count: number;
  conversation: Message[];
}

interface ResultData {
  total_correct: number;
  total_steps: number;
  accuracy: number;
  rating: string;
  decisions: { step: number; choice: string; correct: boolean | null; correct_answer?: string }[];
}

export default function CaseStudyPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [phase, setPhase] = useState<'list' | 'playing' | 'result'>('list');
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentOptions, setCurrentOptions] = useState<{ id: string; text: string }[]>([]);
  const [step, setStep] = useState(0);
  const [maxSteps, setMaxSteps] = useState(8);
  const [correctCount, setCorrectCount] = useState(0);
  const [result, setResult] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 加载场景列表 + 检查未完成会话
  useEffect(() => {
    Promise.all([
      fetch('/api/case-study/scenarios').then(r => r.json()),
      fetch('/api/case-study/session').then(r => r.json()),
    ])
      .then(([scData, sessData]) => {
        console.log('case-study API response:', scData);
        setScenarios(scData.scenarios || []);
        if (sessData.has_active) {
          setPhase('playing');
          setSession(sessData);
          setMessages(sessData.conversation || []);
          setSessionId(sessData.session_id);
          setStep(sessData.current_step);
          setMaxSteps(sessData.max_steps);
          setCorrectCount(sessData.correct_count);
          // 取最后一条系统消息的 options
          const lastSys = [...(sessData.conversation || [])].reverse().find((m: Message) => m.role === 'system' && m.options);
          if (lastSys) setCurrentOptions(lastSys.options || []);
        }
      })
      .catch((err) => {
        console.error('case-study load error:', err);
        setError('加载场景失败，请确认后端已重启');
      });
  }, []);

  const startScenario = async (scenarioId: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/case-study/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_id: scenarioId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || '启动失败');

      setSessionId(data.session_id);
      setMaxSteps(data.max_steps);
      setStep(data.step);
      setCorrectCount(0);
      setMessages([
        { role: 'system' as const, content: data.narrative, options: data.options },
      ]);
      setCurrentOptions(data.options);
      setPhase('playing');
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const makeChoice = async (choice: string) => {
    if (!sessionId) return;
    setLoading(true);
    setError('');

    // 立即显示学生选择
    const choiceMsg: Message = { role: 'user', content: choice };
    setMessages(prev => [...prev, choiceMsg]);
    setCurrentOptions([]); // 清空选项，等新选项

    try {
      const res = await fetch('/api/case-study/choose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, choice }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || '请求失败');

      // 更新学生消息的 evaluation
      setMessages(prev => {
        const updated = [...prev];
        const lastUser = [...updated].reverse().findIndex(m => m.role === 'user');
        if (lastUser >= 0) {
          updated[updated.length - 1 - lastUser] = {
            ...updated[updated.length - 1 - lastUser],
            evaluation: data.evaluation,
          };
        }
        return updated;
      });

      // 添加系统回复
      setMessages(prev => [...prev, {
        role: 'system',
        content: data.narrative,
        options: data.options || [],
      }]);

      setCurrentOptions(data.options || []);
      setStep(data.step);

      if (data.concluded && data.result) {
        setCorrectCount(data.result.total_correct);
        setResult(data.result);
        setPhase('result');
      } else {
        setCorrectCount(prev => data.evaluation === 'correct' ? prev + 1 : prev);
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const reset = () => {
    setPhase('list');
    setSession(null);
    setMessages([]);
    setCurrentOptions([]);
    setStep(0);
    setCorrectCount(0);
    setResult(null);
    setSessionId('');
    setError('');
  };

  // ==================== 场景列表 ====================
  if (phase === 'list') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 text-white">
          <div className="max-w-4xl mx-auto px-6 py-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur text-white/80 text-xs font-medium mb-3 border border-white/10">
              <Briefcase size={12} /> 案例实战
            </div>
            <h1 className="text-2xl font-bold tracking-tight">真实贸易案例</h1>
            <p className="text-indigo-200 text-sm mt-1">扮演真实角色，在分支剧情中做出决策</p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700 mb-4 flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {scenarios.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase size={40} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">暂无可用场景</p>
              <p className="text-xs text-slate-400 mt-1">请在 Supabase 中添加 case_study_scenarios</p>
            </div>
          ) : (
            <div className="space-y-4">
              {scenarios.map(sc => (
                <div key={sc.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:border-indigo-200 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">{sc.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {Array.from({ length: sc.difficulty }).map((_, i) => (
                          <Star key={i} size={12} className="text-amber-400 fill-amber-400" />
                        ))}
                        <span className="text-xs text-slate-400">{sc.max_steps} 步</span>
                      </div>
                    </div>
                    <button
                      onClick={() => startScenario(sc.id)}
                      disabled={loading}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {loading ? '加载中...' : <>开始挑战 <ChevronRight size={14} /></>}
                    </button>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">{sc.description}</p>
                  {sc.knowledge_point_names && sc.knowledge_point_names.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {sc.knowledge_point_names.map(kp => (
                        <span key={kp} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-medium">
                          {kp}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==================== 进行中 ====================
  if (phase === 'playing') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 flex flex-col">
        {/* Top bar */}
        <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between mb-2">
              <button onClick={reset} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
                <ArrowLeft size={14} /> 返回
              </button>
              <span className="text-sm font-semibold text-slate-700">
                {session?.title || '案例实战'}
              </span>
              <span className="text-xs text-slate-400">
                第 {step}/{maxSteps} 步
              </span>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${(step / maxSteps) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700 flex items-center gap-2">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            {messages.map((msg, i) => {
              const isUser = msg.role === 'user';
              const isFirstNarrative = i === 0 && !isUser;

              return (
                <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 ${
                    isFirstNarrative
                      ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100'
                      : isUser
                        ? msg.evaluation === 'correct'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : msg.evaluation === 'wrong'
                            ? 'bg-red-50 text-red-800 border border-red-200'
                            : 'bg-indigo-600 text-white'
                        : 'bg-white border border-slate-200'
                  }`}>
                    {isUser && msg.evaluation === 'correct' && (
                      <div className="flex items-center gap-1 text-xs text-emerald-600 mb-1">
                        <CheckCircle2 size={12} /> 正确
                      </div>
                    )}
                    {isUser && msg.evaluation === 'wrong' && (
                      <div className="flex items-center gap-1 text-xs text-red-500 mb-1">
                        <AlertCircle size={12} /> 需改进
                      </div>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              );
            })}

            {/* Loading indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    AI 正在推演剧情...
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Options bar */}
        {!loading && currentOptions.length > 0 && phase === 'playing' && (
          <div className="bg-white border-t border-slate-100 sticky bottom-0">
            <div className="max-w-3xl mx-auto px-6 py-4">
              <div className="text-xs text-slate-400 mb-2">📋 请选择你的决策：</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentOptions.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => makeChoice(opt.id)}
                    disabled={loading}
                    className="text-left px-4 py-3 rounded-xl border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-sm font-medium text-slate-700 hover:text-indigo-700 transition-all disabled:opacity-50"
                  >
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-100 text-indigo-600 text-xs font-bold mr-2">
                      {opt.id}
                    </span>
                    {opt.text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==================== 结局 ====================
  if (phase === 'result' && result) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center">
            {/* Rating icon */}
            <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
              result.accuracy >= 0.8 ? 'bg-emerald-100' : result.accuracy >= 0.6 ? 'bg-amber-100' : 'bg-red-100'
            }`}>
              {result.accuracy >= 0.8 ? (
                <CheckCircle2 size={40} className="text-emerald-600" />
              ) : result.accuracy >= 0.6 ? (
                <TrendingUp size={40} className="text-amber-600" />
              ) : (
                <AlertCircle size={40} className="text-red-500" />
              )}
            </div>

            <h1 className="text-2xl font-bold text-slate-800 mb-1">🎉 案例通关！</h1>
            <p className="text-slate-500 mb-4">{session?.title || '案例实战'}</p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="text-2xl font-bold text-slate-800">{result.total_correct}/{result.total_steps}</div>
                <div className="text-xs text-slate-400">正确决策</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="text-2xl font-bold text-indigo-600">{(result.accuracy * 100).toFixed(0)}%</div>
                <div className="text-xs text-slate-400">正确率</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="text-2xl font-bold text-amber-600">{result.rating}</div>
                <div className="text-xs text-slate-400">评级</div>
              </div>
            </div>

            {/* Decision list */}
            {result.decisions && result.decisions.length > 0 && (
              <div className="text-left space-y-2 mb-6">
                <div className="text-sm font-semibold text-slate-600 mb-2">📝 决策复盘</div>
                {result.decisions.map((d, i) => (
                  <div key={i} className={`flex items-center gap-2 p-2.5 rounded-xl text-sm ${
                    d.correct ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                  }`}>
                    <span>{d.correct ? '✅' : '❌'}</span>
                    <span className="text-xs text-slate-500">第{d.step}步：</span>
                    <span className="font-medium">{d.choice}</span>
                    {!d.correct && d.correct_answer && (
                      <span className="text-xs ml-auto">正确答案：{d.correct_answer}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={reset}
                className="px-6 py-3 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 rounded-2xl font-semibold transition-all flex items-center gap-2"
              >
                <RotateCcw size={14} /> 重玩
              </button>
              <button
                onClick={reset}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-semibold transition-all"
              >
                返回场景列表
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
