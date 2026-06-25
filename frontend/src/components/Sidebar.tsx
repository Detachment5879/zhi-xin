'use client';

import { useState, useEffect } from 'react';
import { BookOpen, BarChart3, Settings, GraduationCap, ChevronLeft, MessageCircle, Home, Menu, Lightbulb, Briefcase } from 'lucide-react';
import OrgInfo from './OrgInfo';

const NAV_ITEMS = [
  { id: 'home', label: '首页', icon: Home },
  { id: 'learn', label: '学习中心', icon: BookOpen },
  { id: 'chat', label: 'AI 助教', icon: MessageCircle },
  { id: 'knowledge', label: '知识库', icon: GraduationCap },
  { id: 'history', label: '学习记录', icon: BarChart3 },
  { id: 'wrong', label: '错题本', icon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> },
  { id: 'feynman', label: '费曼讲台', icon: Lightbulb },
  { id: 'case-study', label: '案例实战', icon: Briefcase },
  { id: 'profile', label: '画像设置', icon: Settings },
  { id: 'settings', label: '设置', icon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
];

interface SidebarProps {
  active: string;
  onChange: (id: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ active, onChange, collapsed, onToggle }: SidebarProps) {
  return (
    <>
      {/* Mobile backdrop */}
      {!collapsed && (
        <div className="fixed inset-0 bg-black/20 z-10 md:hidden" onClick={onToggle} />
      )}
      <aside className={`fixed left-0 top-0 h-full bg-white border-r border-slate-200 flex flex-col transition-all duration-300 z-20 ${
        collapsed ? 'w-16' : 'w-56'
      } ${collapsed ? 'md:w-16' : 'md:w-56'} ${
        !collapsed ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100">
        <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
          <GraduationCap size={18} className="text-white" />
        </div>
        {!collapsed && <span className="font-bold text-slate-800 text-lg tracking-tight">知薪</span>}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button key={item.id} onClick={() => onChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
              <Icon size={18} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && isActive && <div className="ml-auto w-1.5 h-5 bg-indigo-600 rounded-full" />}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-slate-100 p-3">
        <button onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors">
          <ChevronLeft size={14} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          {!collapsed && <span>收起菜单</span>}
        </button>
      </div>
    </aside>
    </>
  );
}
