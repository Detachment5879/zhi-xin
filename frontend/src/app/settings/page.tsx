'use client';

import { useState } from 'react';
import { Settings, User, Mail, LogOut, Trash2, Globe, Cpu, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const [showReset, setShowReset] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const clearSessions = async () => {
    if (!confirm('确定要删除所有学习记录吗？此操作不可撤销。')) return;
    setLoading(true); setActionMsg('');
    try {
      const res = await fetch('/api/records/sessions?student_id=00000000-0000-0000-0000-000000000005&limit=100');
      const sessions = await res.json();
      for (const s of sessions) {
        await fetch(`/api/records/delete-session?id=${s.id}`, { method: 'DELETE' });
      }
      setActionMsg('✅ 学习记录已清除');
      setTimeout(() => setActionMsg(''), 3000);
    } catch { setActionMsg('❌ 清除失败'); }
    setLoading(false);
  };

  const resetAll = async () => {
    if (!confirm('确定要重置所有数据吗？包括学习记录、画像设置等。此操作不可撤销。')) return;
    setShowReset(false); setLoading(true); setActionMsg('');
    try {
      // Clear sessions
      const res = await fetch('/api/records/sessions?student_id=00000000-0000-0000-0000-000000000005&limit=100');
      const sessions = await res.json();
      for (const s of sessions) {
        await fetch(`/api/records/delete-session?id=${s.id}`, { method: 'DELETE' });
      }
      // Clear profile
      await fetch('/api/profile/reset?user_id=00000000-0000-0000-0000-000000000005', { method: 'POST' });
      setActionMsg('✅ 所有数据已重置');
      setTimeout(() => setActionMsg(''), 3000);
    } catch { setActionMsg('❌ 重置失败'); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings size={22} className="text-slate-600" />
          <h1 className="text-xl font-bold text-slate-800">设置</h1>
        </div>
        <p className="text-sm text-slate-500 mb-6">账户与偏好设置</p>

        {actionMsg && (
          <div className={`rounded-2xl p-4 mb-4 text-sm font-medium ${actionMsg.startsWith('✅') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {actionMsg}
          </div>
        )}

        {/* Account */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-4">
          <h2 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
            <User size={16} className="text-indigo-600" /> 个人信息
          </h2>
          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-500">姓名</span>
              <span className="text-sm text-slate-700 font-medium">邵逸飞</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-slate-50">
              <span className="text-sm text-slate-500">学号</span>
              <span className="text-sm text-slate-700">2023108560149</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-slate-50">
              <span className="text-sm text-slate-500">学院</span>
              <span className="text-sm text-slate-700">国际教育学部</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-slate-50">
              <span className="text-sm text-slate-500">专业</span>
              <span className="text-sm text-slate-700">国际经济与贸易（中外合办）</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-slate-50">
              <span className="text-sm text-slate-500">班级</span>
              <span className="text-sm text-slate-700">2023级国际经济与贸易一班</span>
            </div>
          </div>
        </div>

        {/* Account */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-4">
          <h2 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
            <User size={16} className="text-indigo-600" /> 账户信息
          </h2>
          <div className="space-y-4 mt-4">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-500">头像</span>
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm">S</div>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-slate-50">
              <span className="text-sm text-slate-500">邮箱</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-700">user@example.com</span>
                <Mail size={14} className="text-slate-400" />
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-slate-50">
              <span className="text-sm text-slate-500">密码</span>
              <button onClick={() => alert('密码修改功能将在后续版本中开放')}
                className="text-sm text-indigo-600 hover:text-indigo-500 font-medium transition-colors">修改</button>
            </div>
          </div>
        </div>

        {/* System */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-4">
          <h2 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
            <Cpu size={16} className="text-indigo-600" /> 系统信息
          </h2>
          <div className="space-y-4 mt-4">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-500">AI 模型</span>
              <span className="text-sm text-slate-700">DeepSeek Chat (V4 Pro)</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-slate-50">
              <span className="text-sm text-slate-500">数据库</span>
              <span className="text-sm text-slate-700 flex items-center gap-1.5">
                <Globe size={12} className="text-emerald-500" /> Supabase PostgreSQL
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-slate-50">
              <span className="text-sm text-slate-500">版本</span>
              <span className="text-sm text-slate-700">v1.0.0</span>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6">
          <h2 className="font-semibold text-red-600 mb-1 flex items-center gap-2">
            <AlertCircle size={14} /> 危险操作
          </h2>
          <p className="text-xs text-slate-500 mt-1">以下操作不可撤销，请谨慎使用</p>
          <div className="flex gap-3 mt-4">
            <button onClick={clearSessions} disabled={loading}
              className="px-4 py-2 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50">
              {loading ? '处理中...' : '清除学习记录'}
            </button>
            <button onClick={() => setShowReset(true)} disabled={loading}
              className="px-4 py-2 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50">
              重置所有数据
            </button>
          </div>
          {showReset && (
            <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-200">
              <p className="text-sm text-red-700 mb-3">确认重置所有数据？这将删除所有学习记录和画像设置。</p>
              <div className="flex gap-2">
                <button onClick={resetAll} disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-500 transition-colors">
                  {loading ? '重置中...' : '确认重置'}
                </button>
                <button onClick={() => setShowReset(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
                  取消
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Logout */}
        <button onClick={() => window.location.reload()}
          className="w-full mt-6 py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
          <LogOut size={16} /> 退出登录
        </button>
      </div>
    </div>
  );
}
