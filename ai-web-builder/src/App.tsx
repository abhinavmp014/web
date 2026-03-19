import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Layout, MessageSquare, Code, Play, ArrowLeft, Loader2, Sparkles, Globe, Laptop, Smartphone, Copy, Check, Download, ExternalLink, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { generateInitialWebsite, updateWebsite, ChatMessage } from './services/geminiService';
import { cn } from './lib/utils';

type View = 'landing' | 'workspace';
type WorkspaceTab = 'preview' | 'code';

const LoadingView = ({ prompt }: { prompt: string }) => (
  <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 font-sans overflow-hidden">
    <div className="relative">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="w-32 h-32 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-emerald-400 animate-pulse" />
      </div>
    </div>
    
    <div className="mt-12 text-center space-y-4 max-w-md">
      <h2 className="text-2xl font-bold tracking-tight">Creating your website...</h2>
      <p className="text-zinc-500 text-sm italic">
        " {prompt} "
      </p>
      <div className="flex justify-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
            className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
          />
        ))}
      </div>
    </div>

    {/* Immersive Background */}
    <div className="fixed inset-0 -z-10">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 blur-[150px] rounded-full animate-pulse" />
    </div>
  </div>
);

export default function App() {
  const [view, setView] = useState<View>('landing');
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('preview');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [websiteCode, setWebsiteCode] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [isUpdating, setIsUpdating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleInitialGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      const code = await generateInitialWebsite(prompt);
      setWebsiteCode(code);
      setView('workspace');
      setChatHistory([{ role: 'model', content: "I've created your website! How would you like to refine it?" }]);
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim() || isUpdating) return;

    const userMsg = currentMessage;
    setCurrentMessage('');
    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: userMsg }];
    setChatHistory(newHistory);
    setIsUpdating(true);

    try {
      const updatedCode = await updateWebsite(websiteCode, userMsg, newHistory);
      setWebsiteCode(updatedCode);
      setChatHistory(prev => [...prev, { role: 'model', content: "I've updated the website based on your request." }]);
    } catch (error) {
      console.error("Update failed:", error);
      setChatHistory(prev => [...prev, { role: 'model', content: "Sorry, I encountered an error while updating the website." }]);
    } finally {
      setIsUpdating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(websiteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  const downloadHtml = () => {
    const blob = new Blob([websiteCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isGenerating) {
    return <LoadingView prompt={prompt} />;
  }

  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl w-full text-center space-y-8"
        >
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
              <Sparkles className="w-10 h-10 text-emerald-400" />
            </div>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight leading-tight">
            Build your vision <br />
            <span className="text-emerald-400 italic font-serif font-light">instantly.</span>
          </h1>
          
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto">
            Describe the website you want to build. Our AI will handle the code, design, and responsiveness in seconds.
          </p>

          <form onSubmit={handleInitialGenerate} className="relative mt-12 group">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A luxury travel agency landing page with a dark theme..."
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-6 px-8 pr-32 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-zinc-600"
              disabled={isGenerating}
            />
            <button
              type="submit"
              disabled={isGenerating || !prompt.trim()}
              className="absolute right-3 top-3 bottom-3 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isGenerating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Generate
                  <Play className="w-4 h-4 fill-current" />
                </>
              )}
            </button>
          </form>

          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {['Portfolio', 'SaaS Landing', 'E-commerce', 'Blog', 'Event Page'].map((tag) => (
              <button
                key={tag}
                onClick={() => setPrompt(`A modern ${tag.toLowerCase()} website`)}
                className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-sm text-zinc-400 hover:text-white hover:border-zinc-700 transition-all"
              >
                {tag}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Background Decoration */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0a0a0a] text-zinc-300 flex flex-col overflow-hidden font-sans">
      {/* Header */}
      <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-900/50 backdrop-blur-md z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setView('landing')}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-zinc-800 mx-2" />
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-white">AI Web Builder Workspace</span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          <button 
            onClick={() => setActiveTab('preview')}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2",
              activeTab === 'preview' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Layout className="w-3.5 h-3.5" />
            Preview
          </button>
          <button 
            onClick={() => setActiveTab('code')}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2",
              activeTab === 'code' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Code className="w-3.5 h-3.5" />
            Code
          </button>
        </div>

        <div className="flex items-center gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          <button 
            onClick={() => setPreviewMode('desktop')}
            className={cn(
              "p-2 rounded-lg transition-all",
              previewMode === 'desktop' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Laptop className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setPreviewMode('mobile')}
            className={cn(
              "p-2 rounded-lg transition-all",
              previewMode === 'mobile' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowDeployModal(true)}
            className="px-4 py-2 bg-zinc-800 text-white font-semibold rounded-lg text-sm hover:bg-zinc-700 transition-all flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Deploy
          </button>
          <button 
            onClick={downloadHtml}
            className="px-4 py-2 bg-emerald-500 text-black font-semibold rounded-lg text-sm hover:bg-emerald-400 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </header>

      {/* Deploy Modal */}
      <AnimatePresence>
        {showDeployModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xl w-full p-8 relative"
            >
              <button 
                onClick={() => setShowDeployModal(false)}
                className="absolute top-4 right-4 p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Globe className="w-6 h-6 text-emerald-400" />
                Deploy to Vercel
              </h2>

              <div className="space-y-6 text-zinc-400">
                <div className="space-y-3">
                  <p className="font-medium text-zinc-200">Step 1: Download your code</p>
                  <p className="text-sm">Click the "Download" button to get your <code className="bg-zinc-950 px-1.5 py-0.5 rounded text-emerald-400">index.html</code> file.</p>
                </div>

                <div className="space-y-3">
                  <p className="font-medium text-zinc-200">Step 2: Create a Vercel project</p>
                  <p className="text-sm">Go to <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Vercel.com</a> and create a new project. You can simply drag and drop your <code className="bg-zinc-950 px-1.5 py-0.5 rounded text-emerald-400">index.html</code> file into a new GitHub repository and connect it to Vercel.</p>
                </div>

                <div className="space-y-3">
                  <p className="font-medium text-zinc-200">Step 3: Instant Deployment</p>
                  <p className="text-sm">Vercel will automatically detect the HTML file and deploy it as a static site. Your website will be live in seconds!</p>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    onClick={() => {
                      downloadHtml();
                      setShowDeployModal(false);
                    }}
                    className="flex-1 py-3 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-all"
                  >
                    Download & Go to Vercel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Editor/Preview Panel */}
        <div className="flex-1 bg-zinc-950 relative flex items-center justify-center p-8 overflow-hidden">
          {activeTab === 'preview' ? (
            <motion.div 
              key="preview"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-500",
                previewMode === 'desktop' ? "w-full h-full" : "w-[375px] h-[667px]"
              )}
            >
              <iframe
                srcDoc={websiteCode}
                title="Website Preview"
                className="w-full h-full border-none"
              />
            </motion.div>
          ) : (
            <motion.div 
              key="code"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full h-full bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden flex flex-col"
            >
              <div className="px-4 py-2 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-zinc-500">index.html</span>
                  <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded uppercase font-bold tracking-wider">Editable</span>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-md text-[10px] font-medium transition-all"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy Code
                    </>
                  )}
                </button>
              </div>
              <textarea
                value={websiteCode}
                onChange={(e) => setWebsiteCode(e.target.value)}
                spellCheck={false}
                className="flex-1 w-full bg-transparent p-6 font-mono text-sm text-emerald-400/90 focus:outline-none resize-none selection:bg-emerald-500/20"
              />
            </motion.div>
          )}
          
          {/* Grid Background */}
          <div className="absolute inset-0 -z-10 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        {/* Chat Panel */}
        <div className="w-[400px] border-l border-zinc-800 flex flex-col bg-zinc-900/30 backdrop-blur-sm">
          <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Design Assistant</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <AnimatePresence initial={false}>
              {chatHistory.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex flex-col max-w-[85%]",
                    msg.role === 'user' ? "ml-auto items-end" : "items-start"
                  )}
                >
                  <div className={cn(
                    "p-3 rounded-2xl text-sm leading-relaxed",
                    msg.role === 'user' 
                      ? "bg-emerald-500 text-black font-medium" 
                      : "bg-zinc-800 text-zinc-200"
                  )}>
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isUpdating && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-zinc-500 text-xs italic"
              >
                <Loader2 className="w-3 h-3 animate-spin" />
                Updating your website...
              </motion.div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 bg-zinc-900/50 border-t border-zinc-800">
            <form onSubmit={handleSendMessage} className="relative">
              <textarea
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder="Ask to change colors, add sections..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 resize-none h-24 transition-all"
              />
              <button
                type="submit"
                disabled={!currentMessage.trim() || isUpdating}
                className="absolute right-3 bottom-3 p-2 bg-emerald-500 text-black rounded-lg hover:bg-emerald-400 transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="text-[10px] text-zinc-600 mt-2 text-center">
              AI can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
