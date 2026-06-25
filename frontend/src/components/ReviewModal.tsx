'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

interface Question {
  id: string;
  type: string;
  question_text: string;
  options: string[] | null;
}

interface DueItem {
  kp_id: string;
  kp_name: string;
  interval_day: number;
  source_session_id: string;
}

interface ResultItem {
  question_id: string;
  correct: boolean;
  correct_answer: string;
  explanation: string;
}

interface ReviewResult {
  score: number;
  correct: number;
  total: number;
  passed: boolean;
  results: ResultItem[];
}

export default function ReviewModal({
  items,
  onClose,
}: {
  items: DueItem[];
  onClose: () => void;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);        // 当前第几个知识点
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [qIdx, setQIdx] = useState(0);                     // 当前第几题
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [error, setError] = useState('');
  const [doneItems, setDoneItems] = useState<number[]>([]); // 已完成的知识点索引

  const currentItem = items[currentIdx];
  const totalItems = items.length;

  // 加载当前知识点的题目
  useEffect(() => {
    if (!currentItem || doneItems.includes(currentIdx)) return;
    setLoading(true);
    setError('');
    setAnswers({});
    setQIdx(0);
    setSubmitted(false);
    setResult(null);

    fetch('/api/review/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kp_id: currentItem.kp_id,
        interval_day: currentItem.interval_day,
      }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.questions) {
          setQuestions(d.questions);
          setLoading(false);
        } else {
          setError('加载题目失败');
          setLoading(false);
        }
      })
      .catch(() => { setError('网络错误'); setLoading(false); });
  }, [currentIdx, currentItem?.kp_id]);

  const handleSubmit = async () => {
    if (!currentItem) return;
    setLoading(true);
    setError('');

    const ans = Object.entries(answers).map(([qid, a]) => ({
      question_id: qid,
      answer: a,
    }));

    try {
      const res = await fetch('/api/review/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: '00000000-0000-0000-0000-000000000005',
          kp_id: currentItem.kp_id,
          interval_day: currentItem.interval_day,
          answers: ans,
        }),
      });
      const data = await res.json();
      setResult(data);
      setSubmitted(true);
    } catch {
      setError('提交失败');
    }
    setLoading(false);
  };

  const goNext = () => {
    if (currentIdx < totalItems - 1) {
      setDoneItems([...doneItems, currentIdx]);
      setCurrentIdx(currentIdx + 1);
    } else {
      onClose(); // 全部完成
    }
  };

  // 无知识点
  if (totalItems === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <div className="text-sm font-semibold text-slate-800">
              📝 复习：{currentItem.kp_name}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              第{currentItem.interval_day}天复习 · 知识点 {currentIdx + 1}/{totalItems}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4 flex items-center gap-2">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {loading && (
            <div className="text-center py-10">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-400">加载中...</p>
            </div>
          )}

          {/* 答题 */}
          {!loading && !submitted && questions.length > 0 && (
            <div>
              <div className="text-xs text-slate-400 mb-3">
                第 {qIdx + 1}/{questions.length} 题
              </div>

              {/* 单题显示 */}
              {qIdx < questions.length && (
                <div key={questions[qIdx].id} className="bg-white rounded-2xl p-4 border border-slate-100 mb-4">
                  <p className="text-sm font-semibold text-slate-800 mb-3">
                    {questions[qIdx].question_text}
                  </p>

                  {questions[qIdx].type === 'true_false' ? (
                    <div className="flex gap-2">
                      {['true', 'false'].map(v => (
                        <button
                          key={v}
                          onClick={() => setAnswers({ ...answers, [questions[qIdx].id]: v })}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            answers[questions[qIdx].id] === v
                              ? 'bg-indigo-50 text-indigo-700 border-2 border-indigo-300'
                              : 'bg-slate-50 text-slate-600 border-2 border-transparent hover:border-slate-300'
                          }`}
                        >
                          {v === 'true' ? '✓ 正确' : '✗ 错误'}
                        </button>
                      ))}
                    </div>
                  ) : questions[qIdx].type === 'open' ? (
                    <textarea
                      value={answers[questions[qIdx].id] || ''}
                      onChange={e => setAnswers({ ...answers, [questions[qIdx].id]: e.target.value })}
                      className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm focus:border-indigo-300 focus:outline-none"
                      rows={2}
                    />
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {(questions[qIdx].options || []).map((o: string) => {
                        const letter = o.charAt(0);
                        return (
                          <button
                            key={letter}
                            onClick={() => setAnswers({ ...answers, [questions[qIdx].id]: letter })}
                            className={`text-left px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                              answers[questions[qIdx].id] === letter
                                ? 'bg-indigo-50 text-indigo-700 border-2 border-indigo-300'
                                : 'bg-slate-50 text-slate-600 border-2 border-transparent hover:border-slate-300'
                            }`}
                          >
                            <span className="text-xs text-slate-400 mr-1.5 font-mono">{letter}.</span>
                            {o.substring(2)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 翻题按钮 */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setQIdx(Math.max(0, qIdx - 1))}
                  disabled={qIdx === 0}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-30"
                >
                  <ChevronLeft size={14} /> 上一题
                </button>
                <span className="text-xs text-slate-400">{qIdx + 1} / {questions.length}</span>
                {qIdx < questions.length - 1 ? (
                  <button
                    onClick={() => setQIdx(qIdx + 1)}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                  >
                    下一题 <ChevronRight size={14} />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={loading || Object.keys(answers).length < questions.length}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold disabled:opacity-40 transition-all"
                  >
                    提交复习
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 结果 */}
          {submitted && result && (
            <div className="text-center py-4">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                result.passed ? 'bg-emerald-100' : 'bg-amber-100'
              }`}>
                {result.passed ? (
                  <CheckCircle2 size={30} className="text-emerald-600" />
                ) : (
                  <AlertCircle size={30} className="text-amber-600" />
                )}
              </div>
              <div className="text-xl font-bold text-slate-800 mb-1">
                {result.correct}/{result.total} 正确
              </div>
              <div className="text-sm text-slate-500 mb-4">
                正确率 {(result.score * 100).toFixed(0)}%
              </div>

              {/* 每题结果 */}
              <div className="space-y-2 mb-6 text-left">
                {result.results.map((r, i) => (
                  <div key={i} className={`p-3 rounded-xl text-xs ${
                    r.correct ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                  }`}>
                    <div className="font-medium mb-0.5">{r.correct ? '✅' : '❌'} 第 {i + 1} 题</div>
                    {!r.correct && (
                      <div>正确答案：{r.correct_answer}</div>
                    )}
                    {r.explanation && <div className="text-slate-500 mt-0.5">{r.explanation}</div>}
                  </div>
                ))}
              </div>

              <button
                onClick={goNext}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-semibold transition-all flex items-center justify-center gap-2"
              >
                {currentIdx < totalItems - 1 ? (
                  <>下一个知识点 <ArrowRight size={16} /></>
                ) : (
                  <>完成复习 <CheckCircle2 size={16} /></>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
