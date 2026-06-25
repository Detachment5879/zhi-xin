'use client';

import { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';

export default function OrgInfo({ collapsed }: { collapsed: boolean }) {
  const [org, setOrg] = useState({ department: '', major: '', class: '', display_name: '', student_number: '' });

  useEffect(() => {
    Promise.all([
      fetch('/api/org/student/00000000-0000-0000-0000-000000000005').then(r => r.json()),
      fetch('/api/profile?user_id=00000000-0000-0000-0000-000000000005').then(r => r.json()),
    ]).then(([o, p]) => setOrg({ ...o, display_name: p.display_name || '', student_number: p.student_number || '' })).catch(() => {});
  }, []);

  if (!org.class) return null;

  return (
    <div className={`mb-2 px-2 ${collapsed ? 'hidden' : ''}`}>
      <div className="bg-slate-50 rounded-xl px-2.5 py-2 text-[10px] text-slate-500 space-y-0.5">
        <div className="font-medium text-slate-700 text-[11px]">{org.display_name || '学生'}</div>
        <div className="text-[9px] text-slate-400">{org.student_number}</div>
        <div className="border-t border-slate-200/50 mt-1 pt-1">
          <div className="flex items-center gap-1.5"><Building2 size={11} className="text-slate-400" />{org.department}</div>
          <div className="ml-[18px]">{org.major}</div>
          <div className="ml-[18px] font-medium text-slate-600">{org.class}</div>
        </div>
      </div>
    </div>
  );
}
