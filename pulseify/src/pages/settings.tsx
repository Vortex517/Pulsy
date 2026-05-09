import { Switch } from "@/components/ui/switch";

export default function Settings() {
  return (
    <div className="flex flex-col gap-8 pb-12 relative z-10 max-w-3xl mx-auto pt-12">
      <header className="border-b border-white/5 pb-6">
        <h1 className="text-4xl font-bold font-display text-glow-primary">Settings</h1>
      </header>

      <section className="glass-card rounded-xl p-6 border border-white/5">
        <h2 className="text-xl font-bold mb-6 text-primary">Audio Quality</h2>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">High Quality Streaming</h3>
              <p className="text-sm text-muted-foreground">Stream at 320kbps when on Wi-Fi</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Data Saver</h3>
              <p className="text-sm text-muted-foreground">Set audio quality to low (24kbps) to save data</p>
            </div>
            <Switch />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Audio Normalization</h3>
              <p className="text-sm text-muted-foreground">Set the same volume level for all tracks</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </section>

      <section className="glass-card rounded-xl p-6 border border-white/5">
        <h2 className="text-xl font-bold mb-6 text-secondary">Playback</h2>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Crossfade</h3>
              <p className="text-sm text-muted-foreground">Allows you to crossfade between songs</p>
            </div>
            <Switch />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Autoplay</h3>
              <p className="text-sm text-muted-foreground">Enjoy nonstop listening. When your audio ends, we'll play something similar.</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </section>
    </div>
  );
}