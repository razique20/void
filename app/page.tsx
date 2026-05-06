import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { ArrowRight, Cpu, Globe, ShieldCheck } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-black">
      <Navbar />
      
      {/* Hero Section */}
      <main className="flex-1 pt-48 pb-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-7xl md:text-[100px] font-bold tracking-[-0.07em] mb-8 leading-[0.95] text-gradient">
            VOID.<br />
            The silent workforce.
          </h1>
          
          <p className="text-[#86868b] text-xl md:text-2xl max-w-2xl mx-auto mb-12 font-medium tracking-tight">
            Deploy autonomous AI agents that work from within the void. Invisible. Infallible. Infinite.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link 
              href="/dashboard" 
              className="apple-button text-[17px] px-10"
            >
              Enter the Console
            </Link>
            <Link 
              href="#intelligence" 
              className="apple-button-secondary text-[17px] flex items-center gap-1 group"
            >
              Explore the tech <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Neural Core Section */}
        <div id="intelligence" className="max-w-6xl mx-auto mt-64 px-4 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-16 tracking-tight">V1 Core Architecture.</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             <div className="p-10 bg-[#111112] rounded-[40px] border border-white/5 space-y-6">
                <Cpu className="w-10 h-10 text-white mx-auto" />
                <h3 className="text-2xl font-bold">Deep Learning.</h3>
                <p className="text-[#86868b]">VOID absorbs your entire company data structure, creating a specialized brain for every task.</p>
             </div>
             <div className="p-10 bg-[#111112] rounded-[40px] border border-white/5 space-y-6">
                <Globe className="w-10 h-10 text-white mx-auto" />
                <h3 className="text-2xl font-bold">Global Sync.</h3>
                <p className="text-[#86868b]">Zero-latency response in any language. Your business operates everywhere, simultaneously.</p>
             </div>
             <div className="p-10 bg-[#111112] rounded-[40px] border border-white/5 space-y-6">
                <ShieldCheck className="w-10 h-10 text-white mx-auto" />
                <h3 className="text-2xl font-bold">Total Encryption.</h3>
                <p className="text-[#86868b]">Data isolation at the hardware level. VOID ensures your competitive edge remains private.</p>
             </div>
          </div>
        </div>

        {/* Cinematic Product Display */}
        <div className="max-w-6xl mx-auto mt-48 px-4">
          <div className="aspect-[21/9] bg-gradient-to-br from-[#1d1d1f] to-[#000000] rounded-[48px] border border-white/10 overflow-hidden relative group">
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="text-center space-y-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#86868b]">Architecture</span>
                  <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Form follows function.</h2>
               </div>
            </div>
            <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end">
               <p className="text-[#86868b] max-w-xs text-sm">Every element of VOID is engineered for absolute efficiency and peak performance.</p>
               <span className="text-white font-bold text-lg italic tracking-tighter">VOID Console v1.0</span>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="max-w-3xl mx-auto mt-64 text-center pb-32">
           <h2 className="text-5xl md:text-7xl font-bold tracking-tight mb-10">Scale into the VOID.</h2>
           <Link 
              href="/dashboard" 
              className="apple-button text-xl px-12"
            >
              Initialize VOID
            </Link>
        </div>
      </main>

      <footer className="py-20 px-6 border-t border-white/5 bg-[#000000] text-center">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-[#86868b] text-[12px]">
          <p>© {new Date().getFullYear()} VOID AI. Engineered in the shadows.</p>
          <div className="flex gap-6">
            <Link href="/" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/" className="hover:text-white transition-colors">Legal</Link>
            <Link href="/" className="hover:text-white transition-colors">Safety</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
