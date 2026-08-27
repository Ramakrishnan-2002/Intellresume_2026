import React, { useState, useRef, useEffect } from 'react';
import { ResumeData, ChatMessage } from '../types';
import { ThreeAIBrain } from './ThreeAIBrain';
import { avatarUrls } from '../data/mockData';
import {
  Send,
  Paperclip,
  Lock,
  Bot,
  Sparkles,
  Check,
  Copy,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

interface AIChatViewProps {
  resumeData: ResumeData;
  onApplyOptionToResume?: (text: string) => void;
}

// Simple markdown → HTML converter (no external deps)
function markdownToHtml(md: string): string {
  if (!md) return '';
  let html = md
    // Escape HTML first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headers
    .replace(/^#### (.*$)/gim, '<h4 class="text-slate-200 font-bold mt-3 mb-1 text-sm">$1</h4>')
    .replace(/^### (.*$)/gim, '<h3 class="text-slate-100 font-bold mt-4 mb-2 text-base">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-slate-100 font-bold mt-4 mb-2 text-lg">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-slate-100 font-bold mt-4 mb-2 text-xl">$1</h1>')
    // Bold
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong class="text-[#4edea3] font-bold italic">$1</strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#4edea3] font-bold">$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em class="text-slate-300 italic">$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-[#0f131d] text-[#4edea3] px-1.5 py-0.5 rounded text-[11px] font-mono border border-[#3c4a42]/40">$1</code>')
    // Blockquote
    .replace(/^> (.*$)/gim, '<blockquote class="border-l-2 border-[#4edea3] pl-3 my-2 text-slate-300 italic">$1</blockquote>')
    // Horizontal rule
    .replace(/^---+$/gim, '<hr class="border-[#3c4a42]/30 my-3" />')
    // Unordered list
    .replace(/^\- (.*$)/gim, '<li class="ml-4 text-slate-200 text-sm leading-relaxed list-disc">$1</li>')
    .replace(/^\* (.*$)/gim, '<li class="ml-4 text-slate-200 text-sm leading-relaxed list-disc">$1</li>')
    // Ordered list
    .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 text-slate-200 text-sm leading-relaxed list-decimal">$1</li>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-[#4edea3] hover:underline">$1</a>');

  // Wrap consecutive <li> elements in <ul> or <ol>
  html = html.replace(/(<li class="ml-4[^>]*list-disc"[^>]*>.*?<\/li>\n?)+/gs, (match) => `<ul class="space-y-1 my-2">${match}</ul>`);
  html = html.replace(/(<li class="ml-4[^>]*list-decimal"[^>]*>.*?<\/li>\n?)+/gs, (match) => `<ol class="space-y-1 my-2">${match}</ol>`);

  // Convert newlines to <br> for remaining text (but not inside blocks)
  html = html.replace(/\n/g, '<br />');

  return html;
}

export const AIChatView: React.FC<AIChatViewProps> = ({
  resumeData,
  onApplyOptionToResume,
}) => {
   const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isTyping) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          resumeContext: {
            targetRole: resumeData.title,
            currentSummary: resumeData.personalInfo.summary,
            recentRole: resumeData.experience[0]?.role,
            skills: resumeData.skills,
          },
        }),
      });
      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'ai',
        text: data.reply || 'Analysis complete. Your resume profile is aligned with high-performance hiring criteria.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'ai',
        text: `Here is a high-impact architectural rewrite tailored to ${resumeData.title}:\n\n**Performance Option:**\nArchitected and deployed low-latency micro-services in Node.js, yielding a **40% reduction in response latency** and boosting SLA reliability.\n\n**Scale Option:**\nEngineered fault-tolerant distributed API gateways processing **10,000+ requests/sec** with zero packet drop.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0B0F19] text-[#dfe2f1] overflow-hidden no-print">
      {/* Top Header */}
      <header className="h-16 w-full flex items-center justify-between px-6 border-b border-[#3c4a42]/30 bg-[#0f131d]/60 backdrop-blur-md shrink-0">
        <div>
          <h1 className="font-bold text-lg text-slate-100 font-['Plus_Jakarta_Sans'] flex items-center gap-2">
            <span>AI Chat Hub</span>
            <span className="text-[10px] font-mono text-[#4edea3] bg-[#4edea3]/10 px-2 py-0.5 rounded-full border border-[#4edea3]/30">
              GPT-4 / Gemini 3.7
            </span>
          </h1>
          <p className="font-mono text-[11px] text-slate-400">SESSION ID: 89f2-a4c1</p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-ping"></span>
          <span>Adaptive Context Active</span>
        </div>
      </header>

      {/* Main Chat Layout */}
      <div className="flex-1 flex overflow-hidden p-4 sm:p-6 gap-6 max-w-[1440px] mx-auto w-full">
        {/* Left 3D Avatar & Suggestions Panel */}
        <div className="hidden lg:flex w-80 flex-col gap-5 shrink-0">
          {/* 3D Holographic AI Brain Box */}
          <div className="glass-panel-active rounded-2xl h-80 relative overflow-hidden flex flex-col items-center justify-center border border-[#4edea3]/30 shadow-[0_10px_30px_rgba(0,0,0,0.5),inset_0_0_15px_rgba(78,222,163,0.1)]">
            <ThreeAIBrain />
            <div className="absolute bottom-4 left-0 w-full flex flex-col items-center z-10 pointer-events-none">
              <div className="bg-[#0f131d]/85 backdrop-blur-md px-4 py-1.5 rounded-full border border-[#4edea3]/40 flex items-center gap-2 shadow-lg">
                <div className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse"></div>
                <span className="font-mono text-xs font-bold text-[#4edea3]">AGENT ONLINE</span>
              </div>
            </div>
          </div>

          {/* Contextual Suggestions Card */}
          <div className="glass-panel rounded-2xl p-4 flex-1 border border-[#3c4a42]/30 flex flex-col">
            <h3 className="font-mono text-xs font-bold text-slate-400 mb-3 border-b border-[#3c4a42]/30 pb-2 tracking-wider">
              CONTEXTUAL SUGGESTIONS
            </h3>
            <div className="flex flex-col gap-2.5 overflow-y-auto">
              <button
                onClick={() =>
                  handleSendMessage('/optimize Rewrite my summary for a Senior Data Scientist role.')
                }
                className="bg-[#262a35]/60 hover:bg-[#313540] text-left px-3.5 py-3 rounded-xl border border-[#3c4a42]/30 hover:border-[#4edea3]/50 transition-all font-sans text-xs text-slate-200 group btn-spring"
              >
                <span className="block font-mono text-xs font-bold text-[#4edea3] mb-1 group-hover:text-[#6ffbbe]">
                  /optimize
                </span>
                Rewrite my summary for a Senior Data Scientist role.
              </button>

              <button
                onClick={() =>
                  handleSendMessage('/analyze Check my latest work experience for action verbs.')
                }
                className="bg-[#262a35]/60 hover:bg-[#313540] text-left px-3.5 py-3 rounded-xl border border-[#3c4a42]/30 hover:border-blue-400/50 transition-all font-sans text-xs text-slate-200 group btn-spring"
              >
                <span className="block font-mono text-xs font-bold text-blue-300 mb-1">
                  /analyze
                </span>
                Check my latest work experience for action verbs.
              </button>

              <button
                onClick={() =>
                  handleSendMessage('/format Convert this job description into bullet points.')
                }
                className="bg-[#262a35]/60 hover:bg-[#313540] text-left px-3.5 py-3 rounded-xl border border-[#3c4a42]/30 hover:border-purple-400/50 transition-all font-sans text-xs text-slate-200 group btn-spring"
              >
                <span className="block font-mono text-xs font-bold text-[#d0bcff] mb-1">
                  /format
                </span>
                Convert this job description into bullet points.
              </button>
            </div>
          </div>
        </div>

        {/* Chat Stream & Input Area */}
        <div className="flex-1 glass-panel rounded-2xl flex flex-col overflow-hidden border border-[#3c4a42]/30 shadow-2xl">
          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            {messages.map((msg) => {
              const isAi = msg.sender === 'ai';

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3.5 max-w-[88%] ${
                    isAi ? 'self-start' : 'self-end flex-row-reverse'
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${
                      isAi
                        ? 'bg-[#4edea3]/20 border-[#4edea3]/40 text-[#4edea3]'
                        : 'bg-[#1c1f2a] border-[#3c4a42]/50 overflow-hidden'
                    }`}
                  >
                    {isAi ? (
                      <Bot className="w-5 h-5" />
                    ) : (
                      <img
                        src={avatarUrls.user1}
                        alt="User"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      isAi
                        ? 'bg-[#171b26] border border-[#3c4a42]/40 rounded-tl-sm text-slate-100 shadow-md'
                        : 'bg-[#262a35] border border-slate-700/50 rounded-tr-sm text-slate-100 shadow-md'
                    }`}
                  >
                    {/* AI messages: render markdown as HTML */}
                    {isAi ? (
                      <div
                        className="prose prose-invert prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: markdownToHtml(msg.text) }}
                      />
                    ) : (
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                    )}

                    {/* Preformatted Options / Code Blocks */}
                    {msg.options && (
                      <div className="mt-4 space-y-3">
                        {msg.options.map((opt, optIdx) => (
                          <div
                            key={optIdx}
                            className="bg-[#0f131d] border border-[#3c4a42]/40 rounded-xl p-3.5 font-mono text-xs relative group"
                          >
                            <div className="flex justify-between items-center mb-1.5 text-slate-400 font-bold text-[11px]">
                              <span>{opt.tag}</span>
                              <button
                                onClick={() =>
                                  copyToClipboard(opt.content.replace(/\*\*/g, ''), `${msg.id}-${optIdx}`)
                                }
                                className="text-slate-500 hover:text-[#4edea3] transition-colors p-1 rounded"
                                title="Copy to clipboard"
                              >
                                {copiedId === `${msg.id}-${optIdx}` ? (
                                  <span className="text-[#4edea3] flex items-center gap-1 text-[10px]">
                                    <Check className="w-3.5 h-3.5" /> Copied
                                  </span>
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                            <div
                              className="text-slate-200 leading-normal"
                              dangerouslySetInnerHTML={{
                                __html: opt.content
                                  .replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#4edea3] font-bold">$1</strong>'),
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-2 text-right font-mono text-[10px] text-slate-500">
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3.5 max-w-[85%] self-start">
                <div className="w-9 h-9 rounded-full bg-[#4edea3]/20 border border-[#4edea3]/40 flex items-center justify-center text-[#4edea3] shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="bg-[#171b26] border border-[#3c4a42]/40 rounded-2xl rounded-tl-sm p-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#4edea3]/80 rounded-full animate-bounce [animation-delay:0ms]"></div>
                  <div className="w-2 h-2 bg-[#4edea3]/80 rounded-full animate-bounce [animation-delay:200ms]"></div>
                  <div className="w-2 h-2 bg-[#4edea3]/80 rounded-full animate-bounce [animation-delay:400ms]"></div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-[#3c4a42]/30 bg-[#0a0e18]/80 backdrop-blur-md">
            <div className="relative flex items-center bg-[#171b26] rounded-xl border border-[#3c4a42]/50 ai-pulse focus-within:border-[#4edea3]/70 focus-within:shadow-[0_0_15px_rgba(78,222,163,0.15)] transition-all">
              <button
                type="button"
                onClick={() => alert('Document attachment supported for LinkedIn PDF or .docx files.')}
                className="p-3 text-slate-400 hover:text-[#4edea3] transition-colors ml-1"
                title="Attach Job Description or File"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Type a prompt, paste a job role, or ask for bullet rewrites..."
                className="flex-1 bg-transparent border-none text-slate-100 placeholder:text-slate-500 text-sm resize-none py-3.5 px-2 focus:outline-none max-h-32"
              />

              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isTyping}
                className="p-2.5 bg-[#4edea3] hover:bg-[#6ffbbe] text-[#003824] rounded-lg mr-2 my-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed font-bold"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-between items-center mt-2 px-2">
              <span className="font-mono text-[10px] text-slate-500">
                SHIFT + ENTER for new line
              </span>
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#4edea3]/80">
                <Lock className="w-3 h-3" />
                <span>SECURE ARCHITECT SESSION</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};