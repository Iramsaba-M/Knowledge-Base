import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileText, ExternalLink } from 'lucide-react';

// Chat Message Component
const ChatMessage = ({ message }) => {
  const isUser = message.role === 'user';
  const [hoveredSource, setHoveredSource] = useState(null);

  // Helper to clean markdown/formatting for tooltips
  const cleanMarkdown = (text) => {
    if (!text) return "";
    return text
      .replace(/<br\s*\/?>/gi, ' ')            // Remove <br> tags
      .replace(/\|/g, ' ')                      // Remove table pipes
      .replace(/---/g, '')                      // Remove table separators
      .replace(/#/g, '')                        // Remove headers
      .replace(/\*{1,3}/g, '')                  // Remove bold/italic asterisks
      .replace(/_{1,3}/g, '')                  // Remove bold/italic underscores
      .replace(/`{1,3}/g, '')                  // Remove code blocks
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove markdown links
      .replace(/\s+/g, ' ')                     // Collapse multiple spaces
      .trim();
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 group animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div className={`relative max-w-[85%] sm:max-w-[80%] rounded-2xl px-5 py-4 shadow-sm transition-all ${isUser
        ? 'bg-primary-600 text-white'
        : 'bg-white text-slate-900 border border-slate-200'
        }`}>

        {/* Message Role Indicator (Small) */}
        {!isUser && (
          <div className="absolute -top-3 -left-2 bg-primary-100 text-primary-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary-200 uppercase tracking-wider">
            Assistant
          </div>
        )}

        <div className={`text-[15px] leading-relaxed prose prose-sm max-w-none ${isUser ? 'prose-invert' : 'prose-slate'}`}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="mb-3 last:mb-0 whitespace-pre-line">{children}</p>,
              ul: ({ children }) => <ul className="list-disc ml-5 mb-3">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal ml-5 mb-3">{children}</ol>,
              li: ({ children }) => <li className="mb-1.5">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold text-primary-900">{children}</strong>,
              code: ({ node, inline, className, children, ...props }) => {
                return (
                  <code className={`px-1.5 py-0.5 rounded text-[13px] font-mono ${isUser ? 'bg-primary-700/50 text-white' : 'bg-slate-100 text-slate-800'}`} {...props}>
                    {children}
                  </code>
                )
              }
            }}
          >
            {message.text}
          </ReactMarkdown>
        </div>

        {/* Citations Section */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-tight flex items-center gap-1">
                <FileText size={12} />
                Sources
              </span>
              {message.sources.map((source, idx) => (
                <div
                  key={idx}
                  className="relative"
                  onMouseEnter={() => setHoveredSource(idx)}
                  onMouseLeave={() => setHoveredSource(null)}
                >
                  <button className="flex items-center gap-1.5 bg-slate-50 hover:bg-primary-50 border border-slate-200 hover:border-primary-200 px-2 py-1 rounded-md text-[11px] text-slate-600 hover:text-primary-700 transition-all cursor-default">
                    <span className="max-w-[120px] truncate font-medium">{source.document_name}</span>
                    <span className="bg-slate-200 group-hover:bg-primary-100 px-1 rounded text-[9px]">p.{source.page_number}</span>
                  </button>

                  {/* Perplexity-style Tooltip with Hover Bridge */}
                  {hoveredSource === idx && (
                    <div className="absolute bottom-full left-0 pb-3 z-50 w-72 animate-in zoom-in-95 duration-200">
                      <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2 text-primary-600">
                            <FileText size={14} />
                            <span className="text-[12px] font-semibold truncate max-w-[180px]">{source.document_name}</span>
                          </div>
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Page {source.page_number}</span>
                        </div>
                        {/* Redesigned Tooltip Body for Full Text + Scroll */}
                        <div className="text-[13.5px] leading-relaxed text-slate-700 bg-slate-50/50 p-3 rounded-lg border border-slate-100 max-h-48 overflow-y-auto custom-scrollbar">
                          "{cleanMarkdown(source.chunk_text)}"
                        </div>
                        <div className="mt-3 flex justify-end">
                          <div className="flex items-center gap-1 text-[10px] text-primary-600 font-medium opacity-50">
                            <ExternalLink size={10} />
                            Reference {idx + 1}
                          </div>
                        </div>
                        {/* Arrow Down */}
                        <div className="absolute -bottom-1 left-4 w-3 h-3 bg-white border-b border-r border-slate-200 rotate-45 transform translate-y-1/2"></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;