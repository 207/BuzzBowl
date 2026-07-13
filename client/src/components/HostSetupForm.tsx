import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { CATEGORIES } from "@/lib/qbreader";
import type { HostSetupFormValues } from "@/lib/roomStorage";
import { ChevronDown, CircleHelp, Swords, Users } from "lucide-react";

interface HostSetupFormProps {
  value: HostSetupFormValues;
  onChange: (next: HostSetupFormValues) => void;
}

const HostSetupForm = ({ value, onChange }: HostSetupFormProps) => {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const selectedCategories = value.category
    ? value.category.split(",").map((c) => c.trim()).filter(Boolean)
    : [];

  const update = (patch: Partial<HostSetupFormValues>) => {
    onChange({ ...value, ...patch });
  };

  const setSelectedCategories = (categories: string[]) => {
    update({ category: categories.join(",") });
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
        <label className="text-sm font-body font-medium text-foreground">Play Mode</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => update({ playMode: "remote" })}
            className={`rounded-xl border px-3 py-3 text-left transition-all ${
              value.playMode === "remote"
                ? "border-primary/60 bg-primary/10 text-foreground"
                : "border-border bg-muted/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            <p className="font-body text-sm font-semibold">Remote play</p>
            <p className="mt-1 text-xs">No TV route during game; everyone plays on phone.</p>
          </button>
          <button
            type="button"
            onClick={() => update({ playMode: "house" })}
            className={`rounded-xl border px-3 py-3 text-left transition-all ${
              value.playMode === "house"
                ? "border-primary/60 bg-primary/10 text-foreground"
                : "border-border bg-muted/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            <p className="font-body text-sm font-semibold">House party</p>
            <p className="mt-1 text-xs">Question on host screen; judge controls from phone.</p>
          </button>
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
        <div className="scrollbar-themed max-h-44 space-y-2 overflow-y-auto rounded-xl border border-border bg-muted/30 p-3">
          {CATEGORIES.map((c) => {
            const checked = selectedCategories.includes(c);
            return (
              <label
                key={c}
                className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(next) => {
                    const isOn = next === true;
                    setSelectedCategories(
                      isOn
                        ? [...selectedCategories, c]
                        : selectedCategories.filter((x) => x !== c),
                    );
                  }}
                />
                <span>{c}</span>
              </label>
            );
          })}
        </div>
        <div className="flex gap-4">
          <button
            type="button"
            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            onClick={() => setSelectedCategories([...CATEGORIES])}
            disabled={selectedCategories.length === CATEGORIES.length}
          >
            Select all
          </button>
          <button
            type="button"
            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            onClick={() => setSelectedCategories([])}
            disabled={selectedCategories.length === 0}
          >
            Clear categories
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-body font-medium text-foreground">Questions in game</label>
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
        <CollapsibleContent className="space-y-4 pt-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-body font-medium text-foreground">
                Points (interrupt — mid question)
              </label>
              <FieldTooltip text="Awarded when the judge marks a buzz correct before the full question is revealed." />
            </div>
            <input
              type="number"
              min={0}
              max={500}
              value={value.correctMidRevealPoints}
              onChange={(e) => update({ correctMidRevealPoints: Number(e.target.value) || 0 })}
              className="w-full h-11 rounded-xl bg-muted border border-border px-3 font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
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
            <div className="flex items-center gap-2">
              <label className="text-sm font-body font-medium text-foreground">
                Negative points (wrong on interrupt)
              </label>
              <FieldTooltip text="Subtracted when wrong before the full question is shown (same rules as before for team vs FFA)." />
            </div>
            <input
              type="number"
              min={0}
              max={500}
              value={value.negPoints}
              onChange={(e) => update({ negPoints: Number(e.target.value) || 0 })}
              className="w-full h-11 rounded-xl bg-muted border border-border px-3 font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-body font-medium text-foreground">
                Answer countdown (seconds)
              </label>
              <FieldTooltip text="After a buzz, time before an automatic incorrect (0 = off). The judge can still score sooner." />
            </div>
            <input
              type="number"
              min={0}
              max={120}
              value={value.answerCountdownSeconds}
              onChange={(e) => update({ answerCountdownSeconds: Number(e.target.value) || 0 })}
              className="w-full h-11 rounded-xl bg-muted border border-border px-3 font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/40 px-3 py-3">
            <Checkbox
              className="mt-0.5"
              checked={value.allowMultipleBuzzes}
              onCheckedChange={(next) => update({ allowMultipleBuzzes: next === true })}
            />
            <span className="space-y-1">
              <span className="block text-sm font-body font-medium text-foreground">
                Allow multiple buzzes per question
              </span>
              <span className="block text-xs font-body text-muted-foreground">
                When off, each player gets one buzz per question — a wrong answer locks them out for
                the rest of it.
              </span>
            </span>
          </label>
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

const FieldTooltip = ({ text }: { text: string }) => (
  <TooltipProvider delayDuration={100}>
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Field description"
          className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
        >
          <CircleHelp className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs leading-snug">{text}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export default HostSetupForm;
