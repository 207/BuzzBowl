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
    <button
      type="button"
      onClick={copyCode}
      className="game-card w-full p-6 text-center space-y-3 hover:border-primary/40 hover:bg-muted/20"
    >
      <p className="text-sm text-muted-foreground font-body uppercase tracking-wider">
        Game Code
      </p>
      <div className="flex items-center justify-center gap-3">
        <span className="text-4xl font-heading font-bold tracking-[0.3em] text-gradient">
          {code}
        </span>
        <span className="p-2 rounded-lg bg-muted transition-colors text-muted-foreground">
          {copied ? <Check className="w-5 h-5 text-accent" /> : <Copy className="w-5 h-5" />}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        {copied ? "Link copied!" : "Click to copy invite link"}
      </p>
    </button>
  );
};

export default GameCodeDisplay;
