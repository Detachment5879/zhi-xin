'use client';

import { useState } from 'react';
import { GraduationCap, Users } from 'lucide-react';

interface AuthPageProps {
  onLogin: (role: 'student' | 'teacher') => void;
}

export default function AuthPage({ onLogin }: AuthPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');

  const auth = async (_path: string, body: any) => {
    // 本地模式：模拟认证，直接放行
    // 生产环境可替换为真实认证（Supabase Auth / NextAuth 等）
    await new Promise(r => setTimeout(r, 300)); // 模拟网络延迟
    if (!body.email || !body.password) {
      throw new Error('请输入邮箱和密码');
    }
    if (body.password.length < 3) {
      throw new Error('密码至少3位');
    }
    return { user: { email: body.email } };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      if (isRegister) {
        await auth('signup', { email, password });
        setError('注册成功！请登录');
        setIsRegister(false);
      } else {
        await auth('token?grant_type=password', { email, password });
        onLogin(role);
      }
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #eef2ff, #faf5ff, #f0fdf4)' }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 24, padding: 36, boxShadow: '0 20px 60px rgba(0,0,0,0.06)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', padding: '8px 20px', borderRadius: 40, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
            <GraduationCap size={18} /> 知薪
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
            {isRegister ? '创建账号' : '欢迎回来'}
          </h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>基于多智能体的高校个性化学习系统</p>
        </div>

        {/* Role selector */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button onClick={() => setRole('student')}
            style={{ flex: 1, padding: '10px 16px', borderRadius: 12, border: role === 'student' ? '2px solid #6366f1' : '2px solid #e2e8f0', background: role === 'student' ? '#eef2ff' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: role === 'student' ? '#4f46e5' : '#94a3b8', transition: 'all 0.2s' }}>
            <GraduationCap size={16} /> 学生端
          </button>
          <button onClick={() => setRole('teacher')}
            style={{ flex: 1, padding: '10px 16px', borderRadius: 12, border: role === 'teacher' ? '2px solid #6366f1' : '2px solid #e2e8f0', background: role === 'teacher' ? '#eef2ff' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: role === 'teacher' ? '#4f46e5' : '#94a3b8', transition: 'all 0.2s' }}>
            <Users size={16} /> 教师端
          </button>
        </div>

        {error && <div style={{ padding: 10, borderRadius: 10, background: error.includes('成功') ? '#ecfdf5' : '#fef2f2', color: error.includes('成功') ? '#059669' : '#dc2626', fontSize: 13, marginBottom: 16 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="邮箱" value={email} onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 14, color: '#334155', marginBottom: 12, boxSizing: 'border-box', outline: 'none' }}
            onFocus={e => { e.target.style.borderColor = '#818cf8'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
            onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }} />
          <input type="password" placeholder="密码" value={password} onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 14, color: '#334155', marginBottom: 16, boxSizing: 'border-box', outline: 'none' }}
            onFocus={e => { e.target.style.borderColor = '#818cf8'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
            onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }} />

          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: 13, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
            {loading ? '...' : isRegister ? '注册' : `登录${role === 'teacher' ? '教师端' : '学生端'}`}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#94a3b8' }}>
          {isRegister ? '已有账号？' : '没有账号？'}
          <button onClick={() => { setIsRegister(!isRegister); setError(''); }}
            style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>{isRegister ? '登录' : '注册'}</button>
        </p>
      </div>
    </div>
  );
}
