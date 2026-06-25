'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import Markdown from '@/components/Markdown';

interface Message { role: string; content: string; context?: string[] }
interface Conversation { id: string; title: string; messages: Message[]; updatedAt: string }

export default function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const convs: Conversation[] = JSON.parse(localStorage.getItem('chat_conversations') || '[]');
      return convs.length > 0 ? convs[0].messages : [];
    } catch { return []; }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Sync with conversations storage
  const syncMessages = (msgs: Message[]) => {
    setMessages(msgs);
    localStorage.setItem('chat_messages', JSON.stringify(msgs.slice(-50)));
    try {
      const convs: Conversation[] = JSON.parse(localStorage.getItem('chat_conversations') || '[]');
      if (convs.length > 0) {
        convs[0].messages = msgs;
        convs[0].updatedAt = new Date().toISOString();
        if (msgs.length > 0 && convs[0].title === '新对话') {
          convs[0].title = msgs[0].content.slice(0, 30);
        }
        localStorage.setItem('chat_conversations', JSON.stringify(convs));
      }
    } catch {}
  };

  // Poll for changes from the chat page
  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => {
      try {
        const convs: Conversation[] = JSON.parse(localStorage.getItem('chat_conversations') || '[]');
        if (convs.length > 0) {
          const latest = convs[0].messages;
          if (JSON.stringify(latest) !== JSON.stringify(messages)) {
            setMessages(latest);
          }
        }
      } catch {}
    }, 1000);
    return () => clearInterval(interval);
  }, [open, messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput('');
    const newMsgs = [...messages, { role: 'user' as const, content: msg }];
    syncMessages(newMsgs);
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history: messages.slice(-10) }),
      });
      const data = await res.json();
      const updated = [...newMsgs, { role: 'assistant' as const, content: data.reply, context: data.context_used }];
      syncMessages(updated);
    } catch {
      syncMessages([...newMsgs, { role: 'assistant', content: '抱歉，暂时无法回答。' }]);
    }
    setLoading(false);
  };

  return (
    <div>
      {!open && (
        <button onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-2xl shadow-indigo-300/50 flex items-center justify-center transition-all hover:scale-105 active:scale-95 z-50">
          <MessageCircle size={24} />
        </button>
      )}
      {open && (
        <div className="fixed bottom-6 right-6 w-96 h-[520px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-indigo-600 text-white">
            <div className="flex items-center gap-2">
              <Bot size={18} /><span className="font-semibold text-sm">小薪</span>
            </div>
            <button onClick={() => setOpen(false)} className="hover:bg-white/10 rounded-lg p-1 transition-colors"><X size={16} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.length === 0 && (
              <div className="text-center text-slate-400 mt-16">
                <Bot size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">你好！我是小薪</p>
                <p className="text-xs mt-1">可以问我知识点、学习情况、薄弱环节</p>
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  {['我有哪些薄弱点？', '讲解FOB术语', '我的进度？'].map(q => (
                    <button key={q} onClick={() => setInput(q)}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors">{q}</button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}>
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5"><Bot size={13} className="text-indigo-600" /></div>
                )}
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-br-md' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-md'}`}>
                  {m.role === 'user' ? <div className="whitespace-pre-wrap">{m.content}</div> : <Markdown content={m.content} />}
                  {m.context && m.context.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                      {m.context.map(c => (<span key={c} className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">{c}</span>))}
                    </div>
                  )}
                </div>
                {m.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 mt-0.5"><User size={13} className="text-white" /></div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0"><Bot size={13} className="text-indigo-600" /></div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-2.5">
                  <div className="flex gap-1.5">
                    {[0,1,2].map(i => (<div key={i} className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: `${i*0.1}s` }} />))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div className="p-3 border-t border-slate-200 bg-white">
            <div className="flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send(); }}
                placeholder="问小薪..." className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
              <button onClick={send} disabled={loading || !input.trim()}
                className="w-9 h-9 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors"><Send size={14} /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
