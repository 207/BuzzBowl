import { difficultyLabelFromNumbers } from "@/lib/qbreader";
import type { ServerGameSettings, ServerGameMode } from "@/types/serverGame";

interface LobbySettingsSummaryProps {
  gameMode: ServerGameMode;
  settings: ServerGameSettings;
}

const LobbySettingsSummary = ({ gameMode, settings }: LobbySettingsSummaryProps) => {
  const modeLabel = gameMode === "team" ? "Teams Mode" : "Free For All";
  const playLabel = settings.playMode === "remote" ? "Remote" : "House party";
  const difficulty = difficultyLabelFromNumbers(settings.difficulties);
  const categories = settings.category
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  const categoryLabel =
    categories.length === 0
      ? "All Categories"
      : categories.length === 1
        ? categories[0]
        : `${categories.length} categories`;

  return (
    <div className="game-card p-4 space-y-2 text-sm font-body">
      <p className="font-medium text-foreground">Game settings</p>
      <p className="text-muted-foreground">
        {modeLabel} · {playLabel} · {difficulty} · {categoryLabel} · {settings.questionCount}{" "}
        question
        {settings.questionCount !== 1 ? "s" : ""}
      </p>
    </div>
  );
};

export default LobbySettingsSummary;
