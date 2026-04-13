import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Zap, Users } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");

  const handleQuickJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim()) {
      navigate(`/join/${joinCode.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="relative flex min-h-dvh w-full min-w-0 flex-col overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-hero" />

      {/* Floating decorative shapes */}
      <div className="absolute top-16 left-[10%] text-6xl animate-float opacity-20 select-none">🎯</div>
      <div className="absolute top-32 right-[15%] text-5xl animate-float opacity-15 select-none" style={{ animationDelay: "0.8s" }}>⚡</div>
      <div className="absolute bottom-32 left-[20%] text-4xl animate-float opacity-15 select-none" style={{ animationDelay: "1.5s" }}>🧠</div>
      <div className="absolute bottom-24 right-[10%] text-5xl animate-float opacity-20 select-none" style={{ animationDelay: "0.4s" }}>🏆</div>
      <div className="absolute top-1/2 left-[5%] text-3xl animate-float opacity-10 select-none" style={{ animationDelay: "2s" }}>✨</div>

      {/* Main content */}
      <main className="relative z-10 flex min-h-0 w-full min-w-0 flex-1 items-center justify-center px-4 py-20">
        <div className="mx-auto w-full max-w-xl space-y-10 text-center">
          {/* Logo / Title */}
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="inline-flex items-center justify-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-5 py-2 text-sm text-primary font-body font-medium">
              <span className="text-lg">🎮</span>
              Quiz bowl party game
            </div>

            <h1 className="flex w-full justify-center text-6xl md:text-8xl font-heading font-extrabold leading-[0.95] tracking-tight">
              <span className="text-gradient inline-block w-fit">BuzzBowl</span>
            </h1>

            <p className="text-base md:text-lg text-muted-foreground font-body max-w-md mx-auto leading-relaxed">
              Host on the big screen, buzz in from your phone. Free-for-all or teams — you pick.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-5">
            <Button
              variant="hero"
              size="xl"
              className="w-full max-w-xs mx-auto"
              onClick={() => navigate("/host")}
            >
              <Zap className="w-5 h-5" />
              Host a Game
            </Button>

            <div className="flex items-center gap-3 max-w-xs mx-auto">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground font-body uppercase tracking-widest">or join</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <form onSubmit={handleQuickJoin} className="flex items-stretch gap-3 max-w-sm mx-auto">
              <input
                type="text"
                placeholder="CODE"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="flex-1 min-w-0 h-14 rounded-xl bg-muted border border-border text-center font-heading text-xl font-bold tracking-[0.25em] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
              <Button variant="glow" size="xl" type="submit" disabled={!joinCode.trim()} className="h-14 shrink-0">
                <Users className="w-5 h-5" />
                Join
              </Button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-5 text-xs text-muted-foreground/50 font-body">
        Questions from QB Reader
      </footer>
    </div>
  );
};

export default Index;
