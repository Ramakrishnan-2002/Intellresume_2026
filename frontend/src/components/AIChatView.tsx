import React, { useState, useRef, useEffect } from 'react';
import { ResumeData } from '../types';
import { Send, Bot, User, Sparkles, ArrowRight, Loader2, Compass } from 'lucide-react';
import { Button } from './ui/Button';
import { apiClient } from '../services/api';

interface AIChatViewProps {
  resumeData: ResumeData;
  onApplyImprovement?: (section: string, content: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

// Markdown formatting helper with sanitized tags
function markdownToHtml(md: string): string {
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headers
    .replace(/^#### (.*$)/gim, '<h4 class="text-slate-200 font-bold mt-2.5 mb-1 text-xs font-mono">$1</h4>')
    .replace(/^### (.*$)/gim, '<h3 class="text-slate-100 font-bold mt-3 mb-1.5 text-xs font-mono">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-slate-100 font-bold mt-3 mb-1.5 text-sm font-["Plus_Jakarta_Sans"]">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-white font-bold mt-3.5 mb-2 text-base font-["Plus_Jakarta_Sans"]">$1</h1>')
    // Bold & italic
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-blue-400 font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="text-slate-300 italic">$1</em>')
    // Code
    .replace(/`([^`]+)`/g, '<code class="bg-[#080c14] text-blue-300 px-1.5 py-0.5 rounded text-[11px] font-mono border border-white/10">$1</code>')
    // Lists
    .replace(/^\- (.*$)/gim, '<li class="ml-4 text-slate-300 text-xs leading-relaxed list-disc">$1</li>')
    .replace(/^\* (.*$)/gim, '<li class="ml-4 text-slate-300 text-xs leading-relaxed list-disc">$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 text-slate-300 text-xs leading-relaxed list-decimal">$1</li>');

  // Wrap consecutive <li> elements in <ul>
  html = html.replace(/(<li class="ml-4[^>]*list-disc"[^>]*>.*?<\/li>\n?)+/gs, (match) => `<ul class="space-y-1 my-2">${match}</ul>`);
  html = html.replace(/(<li class="ml-4[^>]*list-decimal"[^>]*>.*?<\/li>\n?)+/gs, (match) => `<ol class="space-y-1 my-2">${match}</ol>`);
  html = html.replace(/\n/g, '<br />');

  return html;
}

const STRATEGY_PROMPTS = [
  'Rewrite my latest job bullets to highlight quantifiable scale and p99 latency',
  'Audit my technical skills against modern Staff Engineer requirements',
  'Draft a 3-sentence executive summary positioning me as a systems architect',
  'What are 3 critical weaknesses in my experience descriptions?',
];

export const AIChatView: React.FC<AIChatViewProps> = ({
  resumeData,
  onApplyImprovement,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'ai',
      text: `Hello ${resumeData.personalInfo?.firstName || 'there'}! I am your Senior Career Architect. I've analyzed your active profile targeting **${resumeData.title || 'Software Engineering roles'}**.

How can I help you elevate your resume today? You can ask me to:
- Quantify bullet points with engineering metrics
- Audit your keyword alignment against specific job descriptions
- Draft a high-impact executive summary for senior roles`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText.trim();
    if (!text || isTyping) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    try {
      const response = await apiClient.chatWithCoach({
        message: text,
        resumeContext: {
          targetRole: resumeData.title,
          currentSummary: resumeData.personalInfo?.summary,
          recentRole: resumeData.experience?.[0]?.role,
          skills: resumeData.skills,
        },
      });

      const aiReply: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiReply]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const fallbackReply: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: 'When describing engineering achievements, lead with a strong action verb, specify technical constraints, and quantify the business outcome (e.g. latency, concurrency, cost savings).',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-[#080c14] text-[#f8fafc] font-sans">
      {/* Left Sidebar: Context & Strategy Prompts */}
      <div className="w-full md:w-72 lg:w-80 shrink-0 bg-[#0c1220] border-b md:border-b-0 md:border-r border-white/[0.08] p-5 flex flex-col justify-between overflow-y-auto no-print">
        <div className="space-y-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Career Context
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              The AI assistant is pre-grounded in your active resume structure.
            </p>
          </div>

          {/* Active Profile Snapshot */}
          <div className="p-3 rounded-lg bg-[#080c14] border border-white/[0.08] space-y-1.5 text-xs font-mono">
            <div className="text-slate-400 text-[10px]">TARGET ROLE</div>
            <div className="text-slate-200 font-semibold truncate">
              {resumeData.title || 'Software Engineer'}
            </div>
            <div className="text-[11px] text-slate-400 pt-1 border-t border-white/[0.06] flex items-center justify-between">
              <span>Positions: {resumeData.experience?.length || 0}</span>
              <span className="text-blue-400 font-semibold">
                Score: {resumeData.metrics?.resumeScore || 0}%
              </span>
            </div>
          </div>

          {/* Prompt Presets */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Recommended Inquiries
            </span>
            <div className="space-y-1.5">
              {STRATEGY_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  className="w-full text-left p-2.5 rounded-md bg-[#111a2e] hover:bg-[#16233d] border border-white/[0.06] text-xs text-slate-300 hover:text-white transition-colors cursor-pointer leading-relaxed group"
                >
                  <div className="flex items-start gap-1.5">
                    <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-blue-400 shrink-0 mt-0.5" />
                    <span>{prompt}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-white/[0.08] text-[10px] font-mono text-slate-400">
          Powered by Gemini 3.6 Flash
        </div>
      </div>

      {/* Right Area: Messages Stream & Input */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#080c14]">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isAi = msg.sender === 'ai';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[88%] sm:max-w-[80%] ${
                  isAi ? 'self-start' : 'self-end flex-row-reverse'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded flex items-center justify-center shrink-0 font-mono text-xs ${
                    isAi
                      ? 'bg-blue-950/60 text-blue-300 border border-blue-500/30'
                      : 'bg-[#18233d] text-slate-200 border border-white/10'
                  }`}
                >
                  {isAi ? <Bot className="w-4 h-4" /> : <User className="w-3.5 h-3.5" />}
                </div>

                <div className="space-y-1.5">
                  <div
                    className={`p-3.5 rounded-lg text-xs leading-relaxed ${
                      isAi
                        ? 'bg-[#0e1424] border border-white/[0.08] text-slate-200'
                        : 'bg-[#141d32] border border-white/10 text-white'
                    }`}
                  >
                    {isAi ? (
                      <div
                        className="space-y-1 text-slate-200"
                        dangerouslySetInnerHTML={{ __html: markdownToHtml(msg.text) }}
                      />
                    ) : (
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                    )}
                  </div>

                  <div className="text-[10px] font-mono text-slate-400 px-1">
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex gap-3 self-start items-center">
              <div className="w-7 h-7 rounded bg-blue-950/60 text-blue-300 border border-blue-500/30 flex items-center justify-center shrink-0 font-mono text-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div className="px-3 py-2 rounded-lg bg-[#0e1424] border border-white/[0.08] text-xs text-slate-400 flex items-center gap-1.5 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                <span>Generating career guidance...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-[#0c1220] border-t border-white/[0.08] no-print">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex gap-2 max-w-4xl mx-auto"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask for bullet rewrites, ATS strategy, or keyword advice..."
              disabled={isTyping}
              className="flex-1 h-9 bg-[#080c14] border border-white/10 rounded-md px-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-sans"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!inputText.trim() || isTyping}
              icon={<Send className="w-3.5 h-3.5" />}
            >
              Send
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};