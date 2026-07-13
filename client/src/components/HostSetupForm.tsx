import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { GameMode } from "@/lib/gameTypes";
import { CATEGORIES } from "@/lib/qbreader";
import type { HostSetupFormValues } from "@/lib/roomStorage";
import { ChevronDown, Swords, Users } from "lucide-react";

interface HostSetupFormProps {
  value: HostSetupFormValues;
  onChange: (next: HostSetupFormValues) => void;
}

const HostSetupForm = ({ value, onChange }: HostSetupFormProps) => {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const update = (patch: Partial<HostSetupFormValues>) => {
    onChange({ ...value, ...patch });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-body font-medium text-foreground">Game Mode</label>
        <div className="grid grid-cols-2 gap-3">
          <ModeButton
            active={value.mode === "ffa"}
            onClick={() => update({ mode: "ffa" })}
            icon={<Swords className="w-5 h-5" />}
            label="Free For All"
          />
          <ModeButton
            active={value.mode === "teams"}
            onClick={() => update({ mode: "teams" })}
            icon={<Users className="w-5 h-5" />}
            label="Teams"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-body font-medium text-foreground">Difficulty</label>
        <div className="grid grid-cols-3 gap-2">
          {["easy", "medium", "hard"].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => update({ difficulty: d })}
              className={`h-10 rounded-lg font-body text-sm font-medium capitalize transition-all ${
                value.difficulty === d
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-body font-medium text-foreground">Category (optional)</label>
        <select
          value={value.category}
          onChange={(e) => update({ category: e.target.value })}
          className="w-full h-12 rounded-xl bg-muted border border-border px-4 font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-body font-medium text-foreground">Tossups in game</label>
        <input
          type="number"
          min={1}
          max={50}
          value={value.questionCount}
          onChange={(e) => update({ questionCount: Number(e.target.value) || 10 })}
          className="w-full h-12 rounded-xl bg-muted border border-border px-4 font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
      </div>

      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-xl border border-border bg-muted/40 px-4 py-3 text-left text-sm font-body font-medium text-foreground hover:bg-muted/60 transition-colors">
          Advanced settings
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${advancedOpen ? "rotate-180" : ""}`}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-body font-medium text-foreground">
              Points (interrupt — mid question)
            </label>
            <input
              type="number"
              min={0}
              max={500}
              value={value.correctMidRevealPoints}
              onChange={(e) => update({ correctMidRevealPoints: Number(e.target.value) || 0 })}
              className="w-full h-11 rounded-xl bg-muted border border-border px-3 font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-muted-foreground font-body">
              Awarded when the reader marks a buzz correct before the full tossup is revealed.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-body font-medium text-foreground">
              Points (after full question)
            </label>
            <input
              type="number"
              min={0}
              max={500}
              value={value.correctFullRevealPoints}
              onChange={(e) => update({ correctFullRevealPoints: Number(e.target.value) || 0 })}
              className="w-full h-11 rounded-xl bg-muted border border-border px-3 font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-body font-medium text-foreground">
              Negative points (wrong on interrupt)
            </label>
            <input
              type="number"
              min={0}
              max={500}
              value={value.negPoints}
              onChange={(e) => update({ negPoints: Number(e.target.value) || 0 })}
              className="w-full h-11 rounded-xl bg-muted border border-border px-3 font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-muted-foreground font-body">
              Subtracted when wrong before the full question is shown (same rules as before for
              team vs FFA).
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-body font-medium text-foreground">
              Answer countdown (seconds)
            </label>
            <input
              type="number"
              min={0}
              max={120}
              value={value.answerCountdownSeconds}
              onChange={(e) => update({ answerCountdownSeconds: Number(e.target.value) || 0 })}
              className="w-full h-11 rounded-xl bg-muted border border-border px-3 font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-muted-foreground font-body">
              After a buzz, time before an automatic incorrect (0 = off). Reader can still judge
              sooner.
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

const ModeButton = ({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center justify-center gap-2 h-12 rounded-xl font-body text-sm font-medium transition-all ${
      active
        ? "bg-primary text-primary-foreground glow-primary"
        : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
    }`}
  >
    {icon}
    {label}
  </button>
);

export default HostSetupForm;
