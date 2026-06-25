'use client';

import { useState, useEffect } from 'react';
import { XCircle, ChevronDown, ChevronUp, Lightbulb, BookOpen } from 'lucide-react';

interface WrongAnswer {
  question_id: string;
  kp_name: string;
  question_text: string;
  type: string;
  options: string[] | null;
  correct_answer: string;
  explanation: string | null;
  wrong_at: string;
}

export default function WrongAnswersPage() {
  const [items, setItems] = useState<WrongAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch('/api/records/wrong-answers')
      .then(r => r.json())
      .then(data => { setItems(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const toggle = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-7 w-24 bg-slate-200 rounded-lg" />
          <div className="h-4 w-48 bg-slate-100 rounded" />
          {[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-slate-100 rounded-2xl" />)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-2">
          <XCircle size={22} className="text-rose-600" />
          <h1 className="text-xl font-bold text-slate-800">错题本</h1>
        </div>
        <p className="text-sm text-slate-500 mb-6">{items.length} 道错题 · 来自你的所有学习记录</p>

        {items.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">暂无错题</p>
            <p className="text-sm">完成一些学习后，做错的题目会出现在这里</p>
          </div>
        )}

        <div className="space-y-3">
          {items.map(item => (
            <div key={item.question_id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <button onClick={() => toggle(item.question_id)} className="w-full p-4 text-left flex items-start gap-3 hover:bg-slate-50 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✗</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{item.type === 'single_choice' ? '单选' : item.type === 'true_false' ? '判断' : '问答'}</span>
                    <span className="text-[10px] text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">{item.kp_name}</span>
                  </div>
                  <p className="text-sm text-slate-700 font-medium">{item.question_text}</p>
                </div>
                {expanded[item.question_id] ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
              </button>

              {expanded[item.question_id] && (
                <div className="px-4 pb-4 border-t border-slate-50 pt-3 space-y-3">
                  {item.options && (
                    <div className="grid grid-cols-2 gap-2">
                      {item.options.map((opt: string) => {
                        const letter = opt.charAt(0);
                        const isCorrect = letter === item.correct_answer;
                        return (
                          <div key={letter} className={`px-3 py-2 rounded-xl text-xs font-medium border ${isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                            <span className="font-mono text-[10px] mr-1">{letter}.</span>
                            {opt.substring(3)}
                            {isCorrect && ' ✓'}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {!item.options && (
                    <div className="bg-emerald-50 rounded-xl p-3 text-xs text-emerald-700">
                      <span className="font-semibold">正确答案：</span>{item.correct_answer}
                    </div>
                  )}
                  {item.explanation && (
                    <div className="flex items-start gap-2 bg-amber-50 rounded-xl p-3">
                      <Lightbulb size={14} className="text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800">{item.explanation}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
