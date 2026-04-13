import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface GameCodeDisplayProps {
  code: string;
}

const GameCodeDisplay = ({ code }: GameCodeDisplayProps) => {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    const url = `${window.location.origin}/join/${code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="game-card p-6 text-center space-y-3">
      <p className="text-sm text-muted-foreground font-body uppercase tracking-wider">
        Game Code
      </p>
      <div className="flex items-center justify-center gap-3">
        <span className="text-4xl font-heading font-bold tracking-[0.3em] text-gradient">
          {code}
        </span>
        <button
          onClick={copyCode}
          className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground"
        >
          {copied ? <Check className="w-5 h-5 text-accent" /> : <Copy className="w-5 h-5" />}
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        {copied ? "Link copied!" : "Click to copy invite link"}
      </p>
    </div>
  );
};

export default GameCodeDisplay;
