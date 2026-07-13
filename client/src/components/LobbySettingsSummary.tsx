import { difficultyLabelFromNumbers } from "@/lib/qbreader";
import type { ServerGameSettings, ServerGameMode } from "@/types/serverGame";

interface LobbySettingsSummaryProps {
  gameMode: ServerGameMode;
  settings: ServerGameSettings;
}

const LobbySettingsSummary = ({ gameMode, settings }: LobbySettingsSummaryProps) => {
  const modeLabel = gameMode === "team" ? "Teams Mode" : "Free For All";
  const difficulty = difficultyLabelFromNumbers(settings.difficulties);
  const category = settings.category.trim() || "All Categories";

  return (
    <div className="game-card p-4 space-y-2 text-sm font-body">
      <p className="font-medium text-foreground">Game settings</p>
      <p className="text-muted-foreground">
        {modeLabel} · {difficulty} · {category} · {settings.questionCount} tossup
        {settings.questionCount !== 1 ? "s" : ""}
      </p>
    </div>
  );
};

export default LobbySettingsSummary;
