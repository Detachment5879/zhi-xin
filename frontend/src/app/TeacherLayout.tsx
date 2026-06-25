'use client';

import { useState } from 'react';
import { Users, BarChart3, BookOpen, Settings, GraduationCap, ChevronLeft, Menu, Home, TrendingUp } from 'lucide-react';
import TeacherPage from './teacher/page';
import TeacherHome from './teacher/TeacherHome';
import TeacherStats from './teacher/TeacherStats';
import TeacherKnowledge from './teacher/TeacherKnowledge';
import TeacherSettings from './teacher/TeacherSettings';
import TeacherMonitor from './teacher/TeacherMonitor';

const TEACHER_NAV = [
  { id: 'home', label: '工作台首页', icon: Home },
  { id: 'overview', label: '学生管理', icon: Users },
  { id: 'monitor', label: '学习监控', icon: BarChart3 },
  { id: 'stats', label: '数据统计', icon: TrendingUp },
  { id: 'knowledge', label: '知识库管理', icon: BookOpen },
  { id: 'settings', label: '设置', icon: Settings },
];

export default function TeacherLayout({ sidebarCollapsed, setSidebarCollapsed }: { sidebarCollapsed: boolean; setSidebarCollapsed: (v: boolean) => void }) {
  const [navActive, setNavActive] = useState('home');

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className={`fixed left-0 top-0 h-full bg-white border-r border-slate-200 flex flex-col transition-all duration-300 z-20 ${
        sidebarCollapsed ? 'w-16' : 'w-56'
      } ${sidebarCollapsed ? 'md:w-16' : 'md:w-56'} ${
        !sidebarCollapsed ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shrink-0">
            <GraduationCap size={18} className="text-white" />
          </div>
          {!sidebarCollapsed && <span className="font-bold text-slate-800 text-lg tracking-tight">知薪·教师</span>}
        </div>
        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {TEACHER_NAV.map(item => {
            const Icon = item.icon;
            return (
              <button key={item.id} onClick={() => setNavActive(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  navActive === item.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}>
                <Icon size={18} className={navActive === item.id ? 'text-indigo-600' : 'text-slate-400'} />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-slate-100 p-3">
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors">
            <ChevronLeft size={14} className={`transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
            {!sidebarCollapsed && <span>收起菜单</span>}
          </button>
        </div>
      </aside>

      <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'md:ml-16 ml-0' : 'md:ml-56 ml-0'}`}>
        <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="md:hidden fixed top-4 left-4 z-30 w-10 h-10 bg-white rounded-xl shadow-lg border border-slate-200 flex items-center justify-center">
          <Menu size={18} className="text-slate-600" />
        </button>
        {navActive === 'home' && <TeacherHome />}
        {navActive === 'overview' && <TeacherPage />}
        {navActive === 'monitor' && <TeacherMonitor />}
        {navActive === 'stats' && <TeacherStats />}
        {navActive === 'knowledge' && <TeacherKnowledge />}
        {navActive === 'settings' && <TeacherSettings />}
      </main>
    </div>
  );
}
