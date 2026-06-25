'use client';

import { useState, useEffect } from 'react';
import { Settings, GraduationCap, BookOpen, Users, Hash, Globe, Calendar, Save, CheckCircle2 } from 'lucide-react';

export default function TeacherSettings() {
  const [orgInfo, setOrgInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  // Course info
  const [courseName, setCourseName] = useState('国际贸易实务');
  const [courseEdition, setCourseEdition] = useState('第七版');
  const [semester, setSemester] = useState('2025-2026 第二学期');
  const [instructor, setInstructor] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/org/info').then(r => r.json()).catch(() => null),
      fetch('/api/progress').then(r => r.json()).catch(() => null),
    ]).then(([org, progress]) => {
      setOrgInfo(org);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-7 w-24 bg-slate-200 rounded-lg" />
            {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings size={22} className="text-indigo-600" />
          <h1 className="text-xl font-bold text-slate-800">教师设置</h1>
        </div>
        <p className="text-sm text-slate-500 mb-6">管理课程、班级和系统偏好</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Settings (2 cols) */}
          <div className="lg:col-span-2 space-y-5">

            {/* Course Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h2 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
                <BookOpen size={16} className="text-indigo-600" /> 课程信息
              </h2>
              <p className="text-xs text-slate-500 mb-4">当前课程的基本设置</p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">课程名称</label>
                  <input
                    value={courseName}
                    onChange={e => setCourseName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">教材版本</label>
                    <input
                      value={courseEdition}
                      onChange={e => setCourseEdition(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">学期</label>
                    <input
                      value={semester}
                      onChange={e => setSemester(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">授课教师</label>
                  <input
                    value={instructor}
                    onChange={e => setInstructor(e.target.value)}
                    placeholder="输入教师姓名"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Class Management */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h2 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
                <Users size={16} className="text-indigo-600" /> 班级管理
              </h2>
              <p className="text-xs text-slate-500 mb-4">管理系统中的班级和学生分配</p>

              {orgInfo ? (
                <div className="space-y-3">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="text-sm font-semibold text-slate-700 mb-2">当前组织架构</div>
                    {orgInfo.departments?.map((dept: any) => (
                      <div key={dept.name} className="mb-3 last:mb-0">
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                          <Globe size={12} /> {dept.name}
                        </div>
                        {dept.majors?.map((major: any) => (
                          <div key={major.name} className="ml-4 mb-2 last:mb-0">
                            <div className="text-xs text-slate-600 font-medium">{major.name}</div>
                            <div className="flex flex-wrap gap-1.5 mt-1 ml-2">
                              {major.classes?.map((cls: any) => (
                                <span key={cls.name} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-medium">
                                  {cls.name} ({cls.student_count || 0}人)
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )) || <p className="text-xs text-slate-400">暂无组织架构数据</p>}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    班级和学生分配通过 Supabase 数据库直接管理。当前系统支持院系-专业-班级三级架构。
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-4 text-center">加载组织信息中...</p>
              )}
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              className={`w-full py-3.5 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 ${
                saved
                  ? 'bg-emerald-500 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:shadow-lg hover:shadow-indigo-200'
              }`}
            >
              {saved ? <><CheckCircle2 size={18} /> 已保存</> : <><Save size={16} /> 保存设置</>}
            </button>
          </div>

          {/* Right: Quick info */}
          <div className="space-y-4">
            {/* Course Stats */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h2 className="font-semibold text-slate-800 text-sm mb-4 flex items-center gap-2">
                <Hash size={14} className="text-indigo-600" /> 课程概况
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">知识点</span>
                  <span className="font-medium text-slate-700">86</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">章节</span>
                  <span className="font-medium text-slate-700">22</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">题库总量</span>
                  <span className="font-medium text-slate-700">244题</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">题型</span>
                  <span className="font-medium text-slate-700">判断 / 选择 / 简答</span>
                </div>
                <hr className="border-slate-100" />
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">教材</span>
                  <span className="font-medium text-slate-700">{courseName} ({courseEdition})</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">学期</span>
                  <span className="font-medium text-slate-700">{semester}</span>
                </div>
              </div>
            </div>

            {/* System Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h2 className="font-semibold text-slate-800 text-sm mb-4 flex items-center gap-2">
                <GraduationCap size={14} className="text-indigo-600" /> 系统信息
              </h2>
              <div className="space-y-2 text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>系统版本</span>
                  <span className="font-mono text-slate-700">知薪 v2.2</span>
                </div>
                <div className="flex justify-between">
                  <span>LLM 引擎</span>
                  <span className="text-slate-700">DeepSeek</span>
                </div>
                <div className="flex justify-between">
                  <span>数据库</span>
                  <span className="text-slate-700">Supabase</span>
                </div>
                <div className="flex justify-between">
                  <span>熔断阈值</span>
                  <span className="text-slate-700">3 轮</span>
                </div>
                <div className="flex justify-between">
                  <span>通过线</span>
                  <span className="text-slate-700">80%</span>
                </div>
                <div className="flex justify-between">
                  <span>审核通过线</span>
                  <span className="text-slate-700">67%</span>
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
              <div className="text-xs text-amber-700 leading-relaxed">
                <span className="font-semibold">💡 提示：</span>
                课程信息修改后需重启后端生效。班级和学生数据请通过 Supabase SQL Editor 管理。
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
