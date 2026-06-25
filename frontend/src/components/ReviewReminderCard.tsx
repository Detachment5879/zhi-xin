'use client';

import { useState, useEffect } from 'react';
import { Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';

interface DueItem {
  kp_id: string;
  kp_name: string;
  chapter: string;
  interval_day: number;
  days_since_learned: number;
  learned_at: string;
  source_session_id: string;
}

interface DueData {
  total_due: number;
  items: DueItem[];
}

export default function ReviewReminderCard({ onStartReview }: { onStartReview: (items: DueItem[]) => void }) {
  const [data, setData] = useState<DueData>({ total_due: 0, items: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/review/due')
      .then(r => r.json())
      .then(d => { setData(d || { total_due: 0, items: [] }); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-24 bg-slate-100 rounded" />
          <div className="h-8 w-12 bg-slate-100 rounded" />
          <div className="h-3 w-32 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  if (data.total_due === 0 || !data.items || data.items.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div className="flex items-center gap-2 mb-2">
          <Calendar size={16} className="text-slate-400" />
          <span className="text-sm font-semibold text-slate-600">今日待复习</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <CheckCircle2 size={14} className="text-emerald-400" />
          暂无待复习知识点
        </div>
      </div>
    );
  }

  // 按 interval 分组
  const day1 = data.items.filter(i => i.interval_day === 1);
  const day3 = data.items.filter(i => i.interval_day === 3);
  const day7 = data.items.filter(i => i.interval_day === 7);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-amber-200 p-5 hover:border-amber-300 transition-all">
      <div className="flex items-center gap-2 mb-3">
        <Calendar size={16} className="text-amber-500" />
        <span className="text-sm font-semibold text-slate-700">📅 今日待复习</span>
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-3xl font-bold text-amber-600">{data.total_due}</span>
        <span className="text-sm text-slate-500">个知识点</span>
      </div>

      <div className="space-y-1 mb-4 text-xs text-slate-500">
        {day1.length > 0 && <div>· 第1天复习：{day1.map(i => i.kp_name).join('、')}</div>}
        {day3.length > 0 && <div>· 第3天复习：{day3.map(i => i.kp_name).join('、')}</div>}
        {day7.length > 0 && <div>· 第7天复习：{day7.map(i => i.kp_name).join('、')}</div>}
      </div>

      <button
        onClick={() => onStartReview(data.items)}
        className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5"
      >
        开始复习 <ArrowRight size={14} />
      </button>
    </div>
  );
}
