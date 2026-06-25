'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, GraduationCap, RotateCcw, ChevronDown, ChevronRight, CheckCircle2, Lightbulb, BookOpen } from 'lucide-react';

interface Message { role: string; content: string; }
interface KPItem { id: string; name: string; }

export default function FeynmanPage() {
  const [tree, setTree] = useState<any[]>([]);
  const [selectedKP, setSelectedKP] = useState<KPItem | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [expandedCh, setExpandedCh] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [phase, setPhase] = useState<'pick' | 'teaching' | 'done'>('pick');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/knowledge/tree')
      .then(r => r.json())
      .then(data => { setTree(data); if (data.length > 0) setExpandedCh({ [data[0].chapter]: true }); });
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const toggleCh = (ch: string) => setExpandedCh(prev => ({ ...prev, [ch]: !prev[ch] }));

  const startTeaching = (kp: KPItem) => {
    setSelectedKP(kp);
    setShowPicker(false);
    setPhase('teaching');
    setMessages([]);
    setScore(null);
    // AI 开场
    setLoading(true);
    fetch('/api/feynman/teach', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kp_name: kp.name, kp_id: kp.id, student_message: '', conversation_history: [] }),
    })
      .then(r => r.json())
      .then(data => { setMessages([{ role: 'assistant', content: data.reply }]); })
      .finally(() => setLoading(false));
  };

  const send = async () => {
    if (!input.trim() || loading || !selectedKP) return;
    const msg = input.trim();
    setInput('');
    const updated = [...messages, { role: 'user', content: msg }];
    setMessages(updated);
    setLoading(true);

    try {
      const res = await fetch('/api/feynman/teach', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kp_name: selectedKP.name, kp_id: selectedKP.id, student_message: msg, conversation_history: updated }),
      });
      const data = await res.json();
      const next = [...updated, { role: 'assistant', content: data.reply }];
      setMessages(next);
      if (data.score !== null && data.score !== undefined) {
        setScore(data.score);
        setPhase('done');
      }
    } catch { setMessages([...updated, { role: 'assistant', content: '出了点问题，请重试' }]); }
    setLoading(false);
  };

  const reset = () => {
    setPhase('pick');
    setSelectedKP(null);
    setMessages([]);
    setScore(null);
    setInput('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center">
              <Lightbulb size={20} className="text-amber-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">费曼讲台</h1>
              <p className="text-xs text-slate-500">你来讲，AI 来听，真懂假懂一试便知</p>
            </div>
          </div>
          {selectedKP && (
            <button onClick={() => setShowPicker(!showPicker)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:border-amber-300 transition-colors">
              <BookOpen size={14} /> {selectedKP.name}
              <ChevronDown size={12} />
            </button>
          )}
        </div>

        {/* Knowledge point picker */}
        {showPicker && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 mb-4 max-h-96 overflow-y-auto">
            {tree.map(ch => (
              <div key={ch.chapter}>
                <button onClick={() => toggleCh(ch.chapter)}
                  className="w-full px-3 py-2 flex items-center gap-2 hover:bg-slate-50 rounded-lg text-left">
                  {expandedCh[ch.chapter] ? <ChevronDown size={12} className="text-slate-400" /> : <ChevronRight size={12} className="text-slate-400" />}
                  <span className="text-sm font-semibold text-slate-700">{ch.chapter}</span>
                </button>
                {expandedCh[ch.chapter] && ch.points.map((kp: any) => (
                  <button key={kp.id} onClick={() => startTeaching({ id: kp.id, name: kp.name })}
                    className="w-full pl-10 pr-3 py-1.5 text-left hover:bg-amber-50 rounded-lg text-sm text-slate-600 hover:text-amber-700">
                    {kp.name}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Pick phase */}
        {phase === 'pick' && (
          <div className="text-center py-20">
            <GraduationCap size={56} className="mx-auto mb-6 text-amber-300" />
            <h2 className="text-lg font-bold text-slate-700 mb-2">选一个知识点，讲给 AI 听</h2>
            <p className="text-sm text-slate-500 mb-6">你能把一个概念给完全不懂的人讲明白，才是真的懂了</p>
            <button onClick={() => setShowPicker(true)}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-semibold transition-all hover:shadow-lg hover:shadow-amber-200 active:scale-[0.98]">
              选择知识点
            </button>
          </div>
        )}

        {/* Teaching phase */}
        {(phase === 'teaching' || phase === 'done') && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Score banner */}
            {score !== null && (
              <div className={`px-5 py-3 flex items-center gap-3 ${score >= 8 ? 'bg-emerald-50' : score >= 6 ? 'bg-amber-50' : 'bg-red-50'}`}>
                <CheckCircle2 size={18} className={score >= 8 ? 'text-emerald-600' : score >= 6 ? 'text-amber-600' : 'text-red-500'} />
                <span className={`text-sm font-semibold ${score >= 8 ? 'text-emerald-700' : score >= 6 ? 'text-amber-700' : 'text-red-700'}`}>
                  {score >= 8 ? '讲得很透彻！' : score >= 6 ? '基本理解，还有可深挖的地方' : '还有些概念没讲清楚，建议再复习一下'}
                </span>
                <span className="text-sm text-slate-500 ml-auto">{score} / 10 分</span>
              </div>
            )}

            {/* Messages */}
            <div className="p-5 space-y-4 min-h-[300px] max-h-[450px] overflow-y-auto">
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
                  {m.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                      <Bot size={15} className="text-amber-600" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === 'user' ? 'bg-amber-600 text-white rounded-br-md' : 'bg-slate-50 text-slate-700 rounded-bl-md'
                  }`}>
                    <div className="whitespace-pre-wrap">{m.content.replace(/\[SCORE:\d+分\].*/s, '')}</div>
                  </div>
                  {m.role === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-amber-600 flex items-center justify-center shrink-0">
                      <User size={15} className="text-white" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0"><Bot size={15} className="text-amber-600" /></div>
                  <div className="bg-slate-50 rounded-2xl rounded-bl-md px-4 py-3"><div className="flex gap-1.5">{[0,1,2].map(i=><div key={i} className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{animationDelay:`${i*0.1}s`}}/>)}</div></div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            {phase !== 'done' && (
              <div className="border-t border-slate-100 p-4">
                <div className="flex gap-2">
                  <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send(); }}
                    placeholder="用你自己的话讲解..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100" />
                  <button onClick={send} disabled={loading || !input.trim()}
                    className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white rounded-xl font-medium flex items-center gap-1.5 transition-all active:scale-[0.98]">
                    <Send size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Done actions */}
            {phase === 'done' && (
              <div className="border-t border-slate-100 p-4 flex gap-3 justify-center">
                <button onClick={reset}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-colors">
                  <RotateCcw size={14} /> 换一个知识点
                </button>
                <button onClick={() => setShowPicker(true)}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-medium flex items-center gap-1.5 transition-colors">
                  <GraduationCap size={14} /> 再讲一个
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
