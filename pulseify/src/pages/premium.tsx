import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Premium() {
  return (
    <div className="flex flex-col gap-12 pb-12 relative z-10 items-center max-w-5xl mx-auto pt-12">
      <header className="text-center max-w-2xl">
        <h1 className="text-5xl md:text-7xl font-bold font-display text-glow-accent mb-6">Go Premium.</h1>
        <p className="text-xl text-muted-foreground">Unlock the future of sound. High fidelity audio, no interruptions, complete control.</p>
      </header>

      <div className="grid md:grid-cols-2 gap-8 w-full">
        {/* Free Tier */}
        <div className="glass-card p-8 rounded-2xl border border-white/10 flex flex-col">
          <h2 className="text-2xl font-bold mb-2">Free</h2>
          <div className="text-4xl font-bold mb-6 font-mono">$0<span className="text-lg text-muted-foreground font-sans">/month</span></div>
          
          <ul className="space-y-4 mb-8 flex-1 text-muted-foreground">
            <li className="flex items-center gap-3">
              <Check className="text-primary w-5 h-5" /> Standard audio quality (160kbps)
            </li>
            <li className="flex items-center gap-3">
              <Check className="text-primary w-5 h-5" /> Ad-supported listening
            </li>
            <li className="flex items-center gap-3">
              <Check className="text-primary w-5 h-5" /> Shuffle play only on mobile
            </li>
            <li className="flex items-center gap-3">
              <Check className="text-primary w-5 h-5" /> 6 skips per hour
            </li>
          </ul>
          
          <Button variant="outline" className="w-full py-6 text-lg border-white/20" disabled>
            Current Plan
          </Button>
        </div>

        {/* Premium Tier */}
        <div className="glass-card p-8 rounded-2xl border border-accent/50 box-glow-accent flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-accent text-accent-foreground px-4 py-1 text-sm font-bold tracking-wider rounded-bl-lg">
            RECOMMENDED
          </div>
          <h2 className="text-2xl font-bold mb-2 text-accent">Premium</h2>
          <div className="text-4xl font-bold mb-6 font-mono">$9.99<span className="text-lg text-muted-foreground font-sans">/month</span></div>
          
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-center gap-3">
              <Check className="text-accent w-5 h-5" /> High fidelity audio (320kbps+)
            </li>
            <li className="flex items-center gap-3">
              <Check className="text-accent w-5 h-5" /> Ad-free music listening
            </li>
            <li className="flex items-center gap-3">
              <Check className="text-accent w-5 h-5" /> Play any track, anywhere
            </li>
            <li className="flex items-center gap-3">
              <Check className="text-accent w-5 h-5" /> Unlimited skips
            </li>
            <li className="flex items-center gap-3">
              <Check className="text-accent w-5 h-5" /> Offline listening
            </li>
          </ul>
          
          <Button className="w-full py-6 text-lg bg-accent text-accent-foreground hover:bg-accent/90 box-glow-accent">
            Get Premium
          </Button>
        </div>
      </div>
    </div>
  );
}