import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function Profile() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) {
    setLocation("/login");
    return null;
  }

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <div className="flex flex-col gap-8 pb-12 relative z-10 max-w-3xl mx-auto">
      <header className="flex flex-col items-center justify-center pt-12 pb-6 gap-6 border-b border-white/5">
        <div className="w-32 h-32 md:w-48 md:h-48 shadow-2xl rounded-full overflow-hidden box-glow-primary border-4 border-background">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary text-5xl font-bold">
              {user.displayName.charAt(0)}
            </div>
          )}
        </div>
        <div className="text-center">
          <h1 className="text-4xl font-bold font-display text-glow-primary mb-2">{user.displayName}</h1>
          <p className="text-muted-foreground">{user.email}</p>
          <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/50 text-sm font-medium">
            {user.isPremium ? "Premium Member" : "Free Tier"}
          </div>
        </div>
      </header>

      <section className="grid gap-4">
        <div className="glass-card p-6 rounded-xl border border-white/10">
          <h2 className="text-xl font-bold mb-4">Account Settings</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <div>
                <p className="font-medium">Subscription</p>
                <p className="text-sm text-muted-foreground">{user.isPremium ? "Active" : "Free"}</p>
              </div>
              <Button variant="outline" className="border-white/20">Manage</Button>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <div>
                <p className="font-medium">Password</p>
                <p className="text-sm text-muted-foreground">Last updated 3 months ago</p>
              </div>
              <Button variant="outline" className="border-white/20">Change</Button>
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-8">
          <Button variant="destructive" onClick={handleLogout} className="px-8 box-glow-destructive bg-destructive text-destructive-foreground">
            Log Out
          </Button>
        </div>
      </section>
    </div>
  );
}