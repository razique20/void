'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { 
  BookOpen, 
  Send, 
  Loader2, 
  CheckCircle2, 
  FileUp, 
  Type, 
  X, 
  Link2,
  BrainCircuit,
  Database,
  CloudUpload,
  Globe,
  ChevronRight,
  MessageSquare
} from 'lucide-react';

export default function TrainingPage() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'text' | 'file' | 'website'>('text');
  const [source, setSource] = useState('faq');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showSandbox, setShowSandbox] = useState(false);

  useEffect(() => {
    fetch('/api/workers')
      .then(res => res.json())
      .then(data => {
        setWorkers(data);
        if (data.length > 0) setSelectedWorker(data[0]._id);
      });
  }, []);

  const handleTrain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorker) return;
    
    setLoading(true);
    setSuccess(false);

    try {
      let res;
      if (mode === 'file' && file) {
        const formData = new FormData();
        formData.append('workerId', selectedWorker);
        formData.append('file', file);
        formData.append('source', 'file');
        
        res = await fetch('/api/train', {
          method: 'POST',
          body: formData,
        });
      } else if (mode === 'website') {
        res = await fetch(`/api/workers/${selectedWorker}/scrape`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
      } else {
        res = await fetch('/api/train', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workerId: selectedWorker,
            content,
            source,
          }),
        });
      }

      if (res.ok) {
        setSuccess(true);
        setContent('');
        setUrl('');
        setFile(null);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        try {
          const err = await res.json();
          alert(err.error || 'Failed to train worker');
        } catch {
          alert('Failed to train worker. Server returned an unexpected error.');
        }
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred during training');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen relative flex flex-col bg-background text-foreground transition-colors duration-300">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:flex h-full w-64 flex-col z-40 overflow-y-auto pt-20 bg-sidebar">
          <Sidebar />
        </div>
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-24 md:pt-28">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-[36px] font-bold tracking-tight leading-none mb-2 text-foreground">Knowledge Core.</h1>
              <p className="text-silver text-[16px] font-medium">Inject intelligence into your neural fleet.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Main Workspace */}
              <div className="lg:col-span-8 space-y-6">
                <form onSubmit={handleTrain} className="space-y-6">
                  
                  {/* Worker Selection */}
                  <div className="space-y-3">
                    <h2 className="text-[11px] font-bold text-silver uppercase tracking-[0.2em] px-1">Target Operative</h2>
                    <select 
                      className="w-full bg-foreground/5 rounded-[16px] px-5 py-3.5 text-base font-bold focus:outline-none focus:ring-1 focus:ring-foreground/10 transition-all appearance-none text-foreground"
                      value={selectedWorker}
                      onChange={(e) => setSelectedWorker(e.target.value)}
                    >
                      {workers.map(w => (
                        <option key={w._id} value={w._id} className="bg-background text-foreground">{w.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Ingestion Mode */}
                  <div className="space-y-3">
                    <h2 className="text-[11px] font-bold text-silver uppercase tracking-[0.2em] px-1">Ingestion Mode</h2>
                    <div className="flex p-1 bg-foreground/5 rounded-[16px]">
                      {[
                        { id: 'text', icon: Type, label: 'Manual' },
                        { id: 'file', icon: FileUp, label: 'Document' },
                        { id: 'website', icon: Globe, label: 'Website' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setMode(m.id as any)}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[12px] text-[12px] font-bold transition-all ${
                            mode === m.id 
                              ? 'bg-foreground text-background shadow-xl' 
                              : 'text-silver hover:text-foreground'
                          }`}
                        >
                          <m.icon className="w-4 h-4" />
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="bg-foreground/5 rounded-[20px] p-6 space-y-6 min-h-[280px] flex flex-col">
                    {mode === 'text' && (
                      <div className="space-y-6 flex-1 animate-in fade-in duration-500">
                        <div className="flex gap-3">
                          {['faq', 'manual', 'general'].map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setSource(t)}
                              className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                                source === t ? 'bg-apple-blue text-white' : 'bg-foreground/10 text-silver hover:bg-foreground/20'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                        <textarea 
                          required
                          rows={8}
                          placeholder="Paste the intelligence data here..."
                          className="w-full bg-transparent text-sm leading-relaxed focus:outline-none placeholder:text-silver/30 resize-none flex-1 text-foreground"
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                        />
                      </div>
                    )}

                    {mode === 'file' && (
                      <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in-95 duration-500">
                        <div className="w-full h-full bg-foreground/[0.02] rounded-[18px] flex flex-col items-center justify-center p-8 hover:bg-foreground/[0.04] transition-all cursor-pointer relative group">
                          <input 
                            type="file"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                          />
                          {file ? (
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-14 h-14 bg-apple-blue/10 rounded-[18px] flex items-center justify-center">
                                <FileUp className="w-7 h-7 text-apple-blue" />
                              </div>
                              <div className="text-center">
                                <p className="font-bold text-base text-foreground">{file.name}</p>
                                <p className="text-silver text-xs mt-1">Ready for neural ingestion</p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-4 text-center">
                              <div className="w-14 h-14 bg-foreground/5 rounded-[18px] flex items-center justify-center group-hover:scale-110 transition-transform">
                                <CloudUpload className="w-7 h-7 text-silver" />
                              </div>
                              <div>
                                <p className="font-bold text-base text-foreground">Drop Intelligence Brief</p>
                                <p className="text-silver text-sm mt-1">PDF, DOCX, or TXT (Max 10MB)</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {mode === 'website' && (
                      <div className="space-y-6 flex-1 flex flex-col justify-center animate-in slide-in-from-bottom-4 duration-500 px-4">
                        <div className="w-14 h-14 bg-emerald-500/10 rounded-[18px] flex items-center justify-center mx-auto mb-2">
                           <Globe className="w-7 h-7 text-emerald-500" />
                        </div>
                        <div className="text-center mb-2">
                           <h3 className="text-xl font-bold text-foreground">Uplink Website</h3>
                           <p className="text-silver text-sm mt-2">Enter the URL to scrape and digest intelligence.</p>
                        </div>
                        <input 
                          type="url"
                          placeholder="https://company.com/knowledge-base"
                          className="w-full bg-foreground/5 rounded-xl px-5 py-3.5 text-center font-bold focus:outline-none focus:ring-1 focus:ring-foreground/10 transition-all placeholder:text-silver/30 text-foreground"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  <button 
                    disabled={loading || !selectedWorker || (mode === 'text' ? !content : mode === 'file' ? !file : !url)}
                    className="w-full py-3.5 rounded-[16px] bg-foreground text-background text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 shadow-2xl shadow-foreground/5 group"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : success ? (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Ingestion Complete
                      </>
                    ) : (
                      <>
                        Inject Intelligence
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Status Pane */}
              <div className="lg:col-span-4 space-y-6">
                 {/* Test Sandbox */}
                 {selectedWorker && (
                   <div className="bg-foreground/5 rounded-[20px] overflow-hidden flex flex-col shadow-2xl transition-all duration-300">
                     <button
                       type="button"
                       onClick={() => setShowSandbox(!showSandbox)}
                       className="p-4 bg-foreground/5 flex justify-between items-center w-full focus:outline-none hover:bg-foreground/10 transition-colors"
                     >
                       <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                         <MessageSquare className="w-4 h-4 text-apple-blue" />
                         Test Sandbox
                       </h3>
                       <div className="flex items-center gap-3">
                         <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded">Live</span>
                         <span className="text-silver text-xs font-bold">{showSandbox ? 'Collapse' : 'Expand'}</span>
                       </div>
                     </button>
                     <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
                       showSandbox ? 'max-h-[450px] opacity-100' : 'max-h-0 opacity-0'
                     }`}>
                       <iframe 
                         src={`/share/${selectedWorker}`} 
                         className="w-full h-[400px] border-none"
                         title="Test Sandbox"
                       />
                     </div>
                   </div>
                 )}

                 <div className="bg-foreground/5 rounded-[20px] p-6 space-y-6">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-foreground/5 rounded-xl flex items-center justify-center">
                          <BrainCircuit className="w-5 h-5 text-foreground" />
                       </div>
                       <div>
                          <h3 className="font-bold text-base leading-tight text-foreground">Collective Intelligence</h3>
                          <p className="text-[11px] font-bold text-silver uppercase tracking-widest mt-1">System Health</p>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <div className="p-3 bg-foreground/5 rounded-xl flex justify-between items-center">
                          <span className="text-xs text-silver font-medium">Neural Chunks</span>
                          <span className="text-sm font-bold text-foreground">1,248</span>
                       </div>
                       <div className="p-3 bg-foreground/5 rounded-xl flex justify-between items-center">
                          <span className="text-xs text-silver font-medium">Sync Status</span>
                          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded">Optimal</span>
                       </div>
                    </div>

                    <div className="pt-4 text-center">
                       <p className="text-[11px] text-silver leading-relaxed">
                          All intelligence is encrypted and isolated per operative instance. 
                       </p>
                    </div>
                 </div>

                 <div className="p-6 bg-apple-blue/5 border border-apple-blue/10 rounded-[20px] flex flex-col items-center text-center gap-3">
                    <Database className="w-7 h-7 text-apple-blue" />
                    <h4 className="font-bold text-foreground">Neural Vectoring</h4>
                    <p className="text-xs text-apple-blue font-medium leading-relaxed">
                       Your operatives use vector-embeddings to retrieve this knowledge in real-time during conversations.
                    </p>
                 </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
