'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, Sparkles, Plus, MessageCircle, Trash2 } from 'lucide-react';
import Markdown from '@/components/Markdown';

interface Message { role: string; content: string; context?: string[] }
interface Conversation { id: string; title: string; messages: Message[]; updatedAt: string }

function loadConversations(): Conversation[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem('chat_conversations') || '[]'); } catch { return []; }
}
function saveConversations(convs: Conversation[]) {
  localStorage.setItem('chat_conversations', JSON.stringify(convs));
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);
  const [activeId, setActiveId] = useState<string>(() => {
    const convs = loadConversations();
    return convs.length > 0 ? convs[0].id : '';
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find(c => c.id === activeId);
  const messages = activeConv?.messages || [];

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { saveConversations(conversations); }, [conversations]);

  // Sync with bubble chat
  useEffect(() => {
    if (activeConv && activeConv.messages.length > 0) {
      localStorage.setItem('chat_messages', JSON.stringify(activeConv.messages.slice(-50)));
    }
  }, [activeConv]);

  const updateConv = (id: string, updates: Partial<Conversation>) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c));
  };

  const newChat = () => {
    const id = Date.now().toString();
    setConversations(prev => [{ id, title: '新对话', messages: [], updatedAt: new Date().toISOString() }, ...prev]);
    setActiveId(id);
  };

  const deleteChat = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (id === activeId) {
      const remaining = conversations.filter(c => c.id !== id);
      setActiveId(remaining.length > 0 ? remaining[0].id : '');
    }
  };

  const send = async () => {
    if (!input.trim() || loading || !activeId) return;
    const msg = input.trim();
    setInput('');
    const userMsg: Message = { role: 'user', content: msg };

    // Auto-title if first message
    const conv = conversations.find(c => c.id === activeId);
    const isFirst = conv && conv.messages.length === 0;

    updateConv(activeId, { messages: [...messages, userMsg], title: isFirst ? msg.slice(0, 30) : conv?.title || '新对话' });
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history: messages.slice(-10) }),
      });
      const data = await res.json();
      const assistantMsg: Message = { role: 'assistant', content: data.reply, context: data.context_used };
      updateConv(activeId, { messages: [...messages, userMsg, assistantMsg] });
    } catch {
      updateConv(activeId, { messages: [...messages, userMsg, { role: 'assistant', content: '抱歉，暂时无法回答。' }] });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 flex">
      {/* Sidebar - hidden on mobile by default */}
      <div className="hidden md:flex w-64 border-r border-slate-200 bg-white flex-col shrink-0">
        <button onClick={newChat}
          className="m-3 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-all active:scale-[0.98]">
          <Plus size={15} /> 新对话
        </button>
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {conversations.map(conv => (
            <div key={conv.id}
              onClick={() => setActiveId(conv.id)}
              className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer text-sm transition-colors mb-0.5 ${
                conv.id === activeId ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
              }`}>
              <MessageCircle size={14} className="shrink-0" />
              <span className="flex-1 truncate">{conv.title}</span>
              <button onClick={e => { e.stopPropagation(); deleteChat(conv.id); }}
                className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all p-0.5">
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main chat */}
      <div className="flex-1 flex flex-col">
        <div className="max-w-3xl mx-auto px-6 py-8 w-full flex-1 flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <Bot size={22} className="text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-800">AI 助教</h1>
          </div>
          <p className="text-sm text-slate-500 mb-6">{activeConv?.title || '新对话'}</p>

          {/* Messages */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-4 overflow-y-auto" style={{ minHeight: 400, maxHeight: 'calc(100vh - 280px)' }}>
            {messages.length === 0 && (
              <div className="text-center text-slate-400 pt-16">
                <Bot size={56} className="mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium text-slate-500">有什么可以帮你的？</p>
                <p className="text-sm mt-1">试试下面的问题，或直接输入你想问的</p>
                <div className="flex flex-wrap gap-2 justify-center mt-6">
                  {['我有哪些薄弱点？', '帮我讲解FOB术语', '我的学习进度如何？'].map(q => (
                    <button key={q} onClick={() => setInput(q)}
                      className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full text-sm text-indigo-600 hover:bg-indigo-100 transition-colors">{q}</button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 mb-6 ${m.role === 'user' ? 'justify-end' : ''}`}>
                {m.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                    <Bot size={15} className="text-indigo-600" />
                  </div>
                )}
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-br-md' : 'bg-slate-50 text-slate-700 rounded-bl-md'}`}>
                  {m.role === 'user' ? <div className="whitespace-pre-wrap">{m.content}</div> : <Markdown content={m.content} />}
                  {m.context && m.context.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-200/50 flex flex-wrap gap-1">
                      {m.context.map(c => (
                        <span key={c} className="text-[10px] text-slate-400 bg-white/50 px-1.5 py-0.5 rounded">{c}</span>
                      ))}
                    </div>
                  )}
                </div>
                {m.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
                    <User size={15} className="text-white" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 mb-6">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                  <Bot size={15} className="text-indigo-600" />
                </div>
                <div className="bg-slate-50 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex gap-3">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send(); }}
              placeholder="输入你的问题..."
              className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 bg-white" />
            <button onClick={send} disabled={loading || !input.trim()}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-2xl font-semibold flex items-center gap-2 transition-all active:scale-[0.98]">
              <Send size={15} /><span>发送</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
