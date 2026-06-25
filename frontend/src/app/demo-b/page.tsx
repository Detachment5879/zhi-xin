'use client';

// Demo B — 极简工具风格（Linear / Notion / Vercel 方向）

export default function DemoB() {
  return (
    <div className="min-h-screen bg-[#0a0a0b] font-sans text-[#e4e4e7]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-2.5 border-b border-[#1f1f22]">
        <div className="flex items-center gap-2.5">
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-[#a78bfa]">
            <rect width="8" height="8" x="0" y="0" rx="1.5" fill="currentColor"/>
            <rect width="8" height="8" x="10" y="0" rx="1.5" fill="currentColor" opacity="0.6"/>
            <rect width="8" height="8" x="0" y="10" rx="1.5" fill="currentColor" opacity="0.6"/>
            <rect width="8" height="8" x="10" y="10" rx="1.5" fill="currentColor" opacity="0.3"/>
          </svg>
          <span className="font-semibold text-sm tracking-tight">KSTAR</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#71717a]">知识库</span>
          <span className="text-xs text-[#71717a]">学习统计</span>
          <div className="w-6 h-6 rounded-md bg-[#27272a] flex items-center justify-center text-[10px] font-medium text-[#a78bfa]">S</div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Phase indicator */}
        <div className="flex items-center gap-2 mb-12">
          {['选择', '前测', '诊断', '目标', '学习', '后测'].map((label, i) => (
            <div key={label} className="flex-1">
              <div className={`h-1 rounded-full ${i < 2 ? 'bg-[#a78bfa]' : i === 2 ? 'bg-[#a78bfa]' : 'bg-[#27272a]'}`} />
              <p className={`text-[10px] mt-1.5 ${i <= 2 ? 'text-[#a78bfa]' : 'text-[#3f3f46]'}`}>{label}</p>
            </div>
          ))}
        </div>

        {/* Pre-test */}
        <div className="animate-in">
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#71717a] mb-1">K · Pre-test</p>
              <h2 className="text-lg font-semibold tracking-tight">FOB术语</h2>
            </div>
            <span className="text-xs text-[#52525b]">3 questions · Cycle 1</span>
          </div>

          {/* Question */}
          <div className="border border-[#1f1f22] rounded-lg p-5 mb-2 bg-[#0c0c0e]">
            <div className="flex gap-3">
              <span className="text-[10px] text-[#52525b] font-mono mt-0.5">01</span>
              <div className="flex-1">
                <p className="text-sm font-medium mb-3 text-[#e4e4e7]">FOB 术语下，风险转移的临界点是？</p>
                <div className="space-y-1.5">
                  {['A. 货物越过船舷', 'B. 货物到达目的港', 'C. 买方付款时', 'D. 签订合同时'].map((opt, i) => (
                    <button key={opt} className={`w-full text-left px-3 py-2.5 rounded-md text-xs transition-colors ${i === 0 ? 'bg-[#1c1c20] border border-[#a78bfa]/30 text-[#e4e4e7]' : 'text-[#52525b] hover:bg-[#121214] hover:text-[#a1a1aa]'}`}>
                      <span className="text-[10px] text-[#52525b] mr-2 font-mono">{String.fromCharCode(65 + i)}</span>
                      {opt.substring(3)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {[2, 3].map(n => (
            <div key={n} className="border border-[#1f1f22] rounded-lg p-5 mb-2 bg-[#0c0c0e] opacity-30">
              <div className="flex gap-3">
                <span className="text-[10px] text-[#3f3f46] font-mono mt-0.5">0{n}</span>
                <p className="text-sm text-[#3f3f46]">Question pending</p>
              </div>
            </div>
          ))}

          <button className="w-full mt-4 py-2.5 bg-[#fafafa] hover:bg-[#e4e4e7] text-[#0a0a0b] rounded-lg text-sm font-medium transition-colors active:scale-[0.99]">
            Submit Answers
          </button>
        </div>

        {/* Diagnosis */}
        <div className="mt-20">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-xs text-[#a1a1aa]">Accuracy</span>
            <span className="text-sm font-semibold text-amber-400">60%</span>
          </div>

          <div className="border border-[#1f1f22] rounded-lg p-5 bg-[#0c0c0e]">
            <p className="text-[10px] uppercase tracking-widest text-[#71717a] mb-3">S+T · Diagnosis</p>
            <div className="space-y-2 text-xs text-[#a1a1aa]">
              <div className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-emerald-500" />
                <span>Mastered: FOB基本定义, 风险转移点</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-amber-400" />
                <span>Partial: 费用划分</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-red-500" />
                <span>Weak: 装运责任细节, 与CIF对比</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] text-[#52525b]">Error pattern:</span>
                <span className="px-1.5 py-0.5 rounded bg-[#1c1c20] text-[10px]">概念混淆</span>
              </div>
            </div>
            <button className="w-full mt-4 py-2 bg-[#fafafa] hover:bg-[#e4e4e7] text-[#0a0a0b] rounded-lg text-sm font-medium transition-colors">
              Set Target →
            </button>
          </div>
        </div>

        {/* Result */}
        <div className="mt-20 text-center">
          <div className="border border-[#1f1f22] rounded-lg p-10 bg-[#0c0c0e]">
            <div className="text-4xl mb-3">✓</div>
            <h2 className="text-lg font-semibold mb-1 tracking-tight">Passed</h2>
            <p className="text-xs text-[#52525b] mb-6">85% accuracy · Move to next</p>
            <div className="flex gap-2 justify-center">
              <button className="px-4 py-2 bg-[#fafafa] hover:bg-[#e4e4e7] text-[#0a0a0b] rounded-lg text-sm font-medium transition-colors">
                Continue
              </button>
              <button className="px-4 py-2 border border-[#1f1f22] hover:border-[#3f3f46] text-[#a1a1aa] rounded-lg text-sm transition-colors">
                Back to List
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
