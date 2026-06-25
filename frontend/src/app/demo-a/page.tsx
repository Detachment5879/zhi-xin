'use client';

import { useState } from 'react';
import { BookOpen, Target, Zap, ChevronRight, CheckCircle2, AlertCircle, Lightbulb, ArrowRight, RotateCcw, Sparkles, BarChart3, Users, GraduationCap } from 'lucide-react';

export default function DemoA() {
  const [step, setStep] = useState(1); // 0=intro, 1=pretest, 2=diagnosis, 3=target, 4=resource, 5=posttest, 6=done

  const steps = [
    { num: 1, label: '前测诊断', icon: Zap },
    { num: 2, label: '锁定目标', icon: Target },
    { num: 3, label: 'AI 生成', icon: Sparkles },
    { num: 4, label: '学习材料', icon: BookOpen },
    { num: 5, label: '后测验证', icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* ---- HERO HEADER ---- */}
      <header className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative max-w-5xl mx-auto px-6 py-12">
          <nav className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                <GraduationCap size={22} className="text-white" />
              </div>
              <span className="text-white font-bold text-xl tracking-tight">KSTAR</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/70 text-sm">知识库</span>
              <span className="text-white/70 text-sm mx-2">·</span>
              <span className="text-white/70 text-sm">学习统计</span>
              <div className="w-8 h-8 ml-2 bg-white/20 rounded-full flex items-center justify-center text-white text-sm font-semibold backdrop-blur">S</div>
            </div>
          </nav>
          <div className="text-center pb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur text-white/80 text-xs font-medium mb-4 border border-white/10">
              <BarChart3 size={12} />
              完成 3/15 知识点 · 正确率 78%
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">继续你的学习之旅</h1>
            <p className="text-indigo-200 text-sm">每一步都有 AI 陪伴，精准找到你最需要攻克的知识点</p>
          </div>
        </div>
      </header>

      {/* ---- STEP INDICATOR ---- */}
      <div className="max-w-4xl mx-auto px-6 -mt-5 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-5">
          <div className="flex items-center justify-between">
            {steps.map((s, i) => {
              const isActive = i + 1 === step;
              const isDone = i + 1 < step;
              const Icon = s.icon;
              return (
                <div key={s.num} className="flex items-center flex-1">
                  <div className={`flex flex-col items-center gap-1.5 ${isDone || isActive ? '' : 'opacity-40'}`}>
                    <div className={`
                      w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300
                      ${isDone ? 'bg-emerald-100 text-emerald-600' : isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110' : 'bg-slate-100 text-slate-400'}
                    `}>
                      {isDone ? <CheckCircle2 size={18} /> : <Icon size={16} />}
                    </div>
                    <span className={`text-[11px] font-medium ${isActive ? 'text-indigo-600' : isDone ? 'text-emerald-600' : 'text-slate-400'}`}>{s.label}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 rounded-full ${i < step - 1 ? 'bg-emerald-300' : i === step - 1 ? 'bg-gradient-to-r from-emerald-300 to-slate-200' : 'bg-slate-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ---- CONTENT AREA ---- */}
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">

        {/* PRE-TEST */}
        {step === 1 && (
          <div className="animate-fadeIn">
            <div className="mb-6">
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">K 阶段</span>
              <h2 className="text-xl font-bold text-slate-800 mt-2">前测诊断 · FOB 术语</h2>
              <p className="text-sm text-slate-500 mt-1">回答 3 道题，让 AI 定位你的薄弱点</p>
            </div>

            {[
              { num: 1, q: 'FOB 术语下，风险转移的临界点是？', opts: ['货物越过船舷', '货物到达目的港', '买方付款时', '签订合同时'], sel: 0 },
              { num: 2, q: 'FOB 价格构成不包括以下哪项？', opts: ['货物成本', '国内运费', '国际海运费', '装船费'], sel: -1 },
              { num: 3, q: 'FOB 术语下由买方负责租船订舱。', opts: ['正确', '错误'], sel: -1 },
            ].map((item) => (
              <div key={item.num} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-3 hover:border-indigo-200 transition-all duration-200">
                <div className="flex gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${item.sel >= 0 ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                    {item.sel >= 0 ? '✓' : item.num}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 mb-3">{item.q}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {item.opts.map((opt, i) => (
                        <button key={i} className={`
                          text-left px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150
                          ${i === item.sel
                            ? 'bg-indigo-50 text-indigo-700 border-2 border-indigo-300'
                            : 'bg-slate-50 text-slate-600 border-2 border-transparent hover:border-slate-300 hover:bg-slate-100'}
                        `}>
                          <span className="text-[10px] text-slate-400 mr-1.5 font-mono">{String.fromCharCode(65 + i)}.</span>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button onClick={() => setStep(2)} className="w-full mt-4 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-semibold transition-all hover:shadow-lg hover:shadow-indigo-200 active:scale-[0.99] flex items-center justify-center gap-2">
              提交答案 <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* DIAGNOSIS */}
        {step === 2 && (
          <div className="animate-fadeIn">
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">S 阶段</span>
            <h2 className="text-xl font-bold text-slate-800 mt-2 mb-1">诊断结果</h2>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              {/* Score bar */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle size={18} className="text-amber-600" />
                  <span className="text-sm font-semibold text-amber-700">正确率 60%</span>
                </div>
                <div className="w-32 h-2 bg-amber-200 rounded-full overflow-hidden">
                  <div className="h-full w-[60%] bg-amber-500 rounded-full" />
                </div>
              </div>

              <div className="p-6 space-y-3">
                {[
                  { color: 'emerald', text: 'FOB 基本定义、风险转移点', label: '已掌握' },
                  { color: 'amber', text: '费用划分', label: '部分理解' },
                  { color: 'red', text: '装运责任细节、与 CIF 的对比', label: '薄弱' },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 bg-${item.color}-500`} />
                    <div>
                      <span className={`text-[10px] font-semibold uppercase tracking-wide text-${item.color}-600 bg-${item.color}-50 px-1.5 py-0.5 rounded`}>{item.label}</span>
                      <p className="text-sm text-slate-600 mt-1">{item.text}</p>
                    </div>
                  </div>
                ))}

                <div className="flex items-start gap-3 pt-2 border-t border-slate-100">
                  <Lightbulb size={14} className="text-purple-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">错误模式</span>
                    <p className="text-sm text-slate-600 mt-1">概念混淆 — 学生对相邻概念（FOB vs CIF）区分不清</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Target size={14} className="text-indigo-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">建议</span>
                    <p className="text-sm text-slate-600 mt-1">优先攻克装运责任细节，重点对比 FOB 与 CIF 的差异</p>
                  </div>
                </div>
              </div>
            </div>

            <button onClick={() => setStep(3)} className="w-full mt-4 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-semibold transition-all hover:shadow-lg hover:shadow-indigo-200 active:scale-[0.99] flex items-center justify-center gap-2">
              下一步：锁定学习目标 <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* TARGET */}
        {step === 3 && (
          <div className="animate-fadeIn">
            <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">T 阶段</span>
            <h2 className="text-xl font-bold text-slate-800 mt-2 mb-1">当前学习目标</h2>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center shrink-0">
                  <Target size={24} className="text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">FOB 术语下的装运责任细节</h3>
                  <p className="text-sm text-slate-500 mt-1">明确卖方在装运港的责任边界 — 货物装船费用、理舱/平舱费由谁承担，何时风险从卖方转移至买方</p>
                  <div className="flex gap-3 mt-4">
                    <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-1 rounded-full">⏱ 预计 30 分钟</span>
                    <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-1 rounded-full">📊 优先级：高</span>
                  </div>
                </div>
              </div>
            </div>

            <button onClick={() => setStep(4)} className="w-full mt-4 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-semibold transition-all hover:shadow-lg hover:shadow-indigo-200 active:scale-[0.99] flex items-center justify-center gap-2">
              下一步：AI 生成学习材料 <Sparkles size={16} />
            </button>
          </div>
        )}

        {/* RESOURCE */}
        {step === 4 && (
          <div className="animate-fadeIn">
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">A 阶段</span>
            <h2 className="text-xl font-bold text-slate-800 mt-2 mb-1">学习材料</h2>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-indigo-600" />
                  <span className="text-sm font-semibold text-indigo-700">AI 生成 · 课程讲解文档</span>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-medium">
                  <CheckCircle2 size={11} /> ReviewAgent 91分
                </span>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-slate-800 mb-3">核心概念</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">FOB（Free On Board）是国际贸易中卖方在指定装运港将货物交到买方指定的船上即完成交货的术语。货物风险在越过船舷时从卖方转移至买方。</p>

                <h3 className="font-bold text-slate-800 mb-3">关键要点</h3>
                <ul className="space-y-2 mb-4">
                  {['卖方负责出口清关并承担货物装船前的一切费用', '装船费、理舱费、平舱费由负责运输的一方承担', 'FOB 价 = 货物成本 + 国内运费 + 装船费', '风险转移点：货物越过船舷'].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="text-indigo-400 mt-0.5">•</span> {item}
                    </li>
                  ))}
                </ul>

                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle size={14} className="text-amber-600" />
                    <span className="text-xs font-semibold text-amber-700">易混淆辨析</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                    <div className="bg-white rounded-lg p-3"><span className="font-semibold text-slate-800">FOB</span><br/>卖方不负责海运</div>
                    <div className="bg-white rounded-lg p-3"><span className="font-semibold text-slate-800">CIF</span><br/>卖方负责海运费+保险</div>
                  </div>
                </div>
              </div>
            </div>

            <button onClick={() => setStep(5)} className="w-full mt-4 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-semibold transition-all hover:shadow-lg hover:shadow-emerald-200 active:scale-[0.99] flex items-center justify-center gap-2">
              我已学完，开始后测 <CheckCircle2 size={16} />
            </button>
          </div>
        )}

        {/* POST-TEST */}
        {step === 5 && (
          <div className="animate-fadeIn">
            <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">R 阶段</span>
            <h2 className="text-xl font-bold text-slate-800 mt-2 mb-1">后测验证</h2>
            <p className="text-sm text-slate-500 mb-4">2 道题检验你的学习效果</p>

            {[
              { q: 'CIF 术语下由谁负责保险费？', opts: ['卖方', '买方', '承运人'] },
              { q: 'FOB 与 CIF 的风险转移点是否相同？', opts: ['相同，都是越过船舷', '不同，CIF更早转移', '不同，FOB更早转移'] },
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-3">
                <div className="flex gap-3">
                  <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold shrink-0">{idx + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800 mb-3">{item.q}</p>
                    <div className="flex flex-wrap gap-2">
                      {item.opts.map((opt, i) => (
                        <button key={i} className="px-3.5 py-2.5 rounded-xl text-xs font-medium bg-slate-50 text-slate-600 border-2 border-transparent hover:border-slate-300 hover:bg-slate-100 transition-all">
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button onClick={() => setStep(6)} className="w-full mt-4 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-semibold transition-all hover:shadow-lg hover:shadow-indigo-200 active:scale-[0.99]">
              提交后测
            </button>
          </div>
        )}

        {/* RESULT */}
        {step === 6 && (
          <div className="animate-fadeIn text-center">
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-10">
              <div className="w-20 h-20 mx-auto mb-6 bg-emerald-100 rounded-3xl flex items-center justify-center">
                <CheckCircle2 size={40} className="text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">恭喜通过！</h2>
              <p className="text-slate-500 mb-2">正确率 85%</p>

              <div className="flex justify-center gap-3 my-6">
                {[
                  { label: '已掌握', value: '3', color: 'emerald' },
                  { label: '正确率', value: '85%', color: 'indigo' },
                  { label: '审核分', value: '91', color: 'purple' },
                ].map((stat) => (
                  <div key={stat.label} className={`bg-${stat.color}-50 rounded-2xl px-5 py-3`}>
                    <div className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>

              <p className="text-sm text-slate-500 mb-6">反思：学生对 FOB 装运责任已基本掌握，建议进入下一个知识点</p>

              <div className="flex gap-3 justify-center">
                <button onClick={() => setStep(1)} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-semibold transition-all hover:shadow-lg hover:shadow-indigo-200 flex items-center gap-2">
                  继续学习 <ArrowRight size={16} />
                </button>
                <button onClick={() => setStep(1)} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-semibold transition-all flex items-center gap-2">
                  <RotateCcw size={14} /> 再学一轮
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step navigation for demo */}
        <div className="text-center mt-8 pb-12">
          <p className="text-xs text-slate-400 mb-2">Demo: 点击按钮切换阶段</p>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <button key={n} onClick={() => setStep(n)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${step === n ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
      `}</style>
    </div>
  );
}
