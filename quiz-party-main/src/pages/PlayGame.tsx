import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/lib/gameStore";
import { fetchQuestions, type QBReaderQuestion } from "@/lib/qbreader";
import { Timer, Send, Trophy, ArrowRight, Home } from "lucide-react";

const PlayGame = () => {
  const navigate = useNavigate();
  const { code } = useParams();
  const gameState = useGameStore();

  const [questions, setQuestions] = useState<QBReaderQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [questionIndex, setQuestionIndex] = useState(0);

  const currentQ = questions[questionIndex];
  const isFinished = questionIndex >= questions.length && questions.length > 0;

  // Fetch questions on mount
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const qs = await fetchQuestions(
        gameState.totalQuestions,
        gameState.difficulty,
        gameState.category
      );
      setQuestions(qs);
      setLoading(false);
    };
    load();
  }, [gameState.difficulty, gameState.category, gameState.totalQuestions]);

  // Timer
  useEffect(() => {
    if (showAnswer || loading || isFinished) return;
    if (timeLeft <= 0) {
      setShowAnswer(true);
      return;
    }
    const t = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, showAnswer, loading, isFinished]);

  const checkAnswer = useCallback(() => {
    if (!currentQ || showAnswer) return;
    setShowAnswer(true);

    const correct = answer.trim().toLowerCase();
    const expected = currentQ.answer.toLowerCase()
      .replace(/\(.*?\)/g, "")
      .replace(/\[.*?\]/g, "")
      .trim();

    // Simple fuzzy match
    if (expected.includes(correct) && correct.length > 2) {
      gameState.awardPoints("host", 100 + timeLeft * 10);
    }
  }, [answer, currentQ, showAnswer, timeLeft, gameState]);

  const nextQuestion = () => {
    const next = questionIndex + 1;
    if (next >= questions.length) {
      gameState.endGame();
      setQuestionIndex(next);
    } else {
      setQuestionIndex(next);
      setAnswer("");
      setShowAnswer(false);
      setTimeLeft(30);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground font-body">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (isFinished) {
    return <ResultsScreen players={gameState.players} onHome={() => { gameState.resetGame(); navigate("/"); }} />;
  }

  if (!currentQ) return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-body text-muted-foreground">
            Question {questionIndex + 1} / {questions.length}
          </span>
          <div className="flex items-center gap-2">
            <Timer className={`w-4 h-4 ${timeLeft <= 10 ? "text-destructive" : "text-accent"}`} />
            <span className={`font-heading font-bold text-lg ${timeLeft <= 10 ? "text-destructive" : "text-foreground"}`}>
              {timeLeft}s
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300"
            style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Question */}
        <div className="game-card p-8 space-y-2">
          <span className="text-xs font-body text-primary uppercase tracking-wider">
            {currentQ.category}
          </span>
          <p className="text-lg md:text-xl font-body leading-relaxed text-foreground">
            {currentQ.question}
          </p>
        </div>

        {/* Answer input */}
        {!showAnswer ? (
          <div className="flex gap-3">
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && checkAnswer()}
              placeholder="Type your answer..."
              className="flex-1 h-14 rounded-xl bg-muted border border-border px-5 font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              autoFocus
            />
            <Button variant="hero" size="xl" onClick={checkAnswer}>
              <Send className="w-5 h-5" />
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="game-card p-5 border-accent/30">
              <p className="text-sm text-muted-foreground font-body mb-1">Answer</p>
              <p className="text-xl font-heading font-bold text-accent">{currentQ.answer}</p>
            </div>
            <Button variant="glow" size="xl" className="w-full" onClick={nextQuestion}>
              {questionIndex + 1 >= questions.length ? "See Results" : "Next Question"}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        )}

        {/* Score */}
        <div className="text-center">
          <span className="text-sm text-muted-foreground font-body">Score: </span>
          <span className="font-heading font-bold text-primary">
            {gameState.players[0]?.score || 0}
          </span>
        </div>
      </div>
    </div>
  );
};

const ResultsScreen = ({
  players,
  onHome,
}: {
  players: { name: string; score: number; avatar: string }[];
  onHome: () => void;
}) => {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 text-center">
        <Trophy className="w-16 h-16 text-accent mx-auto animate-float" />
        <h1 className="text-4xl font-heading font-extrabold text-gradient">Game Over!</h1>

        <div className="space-y-3">
          {sorted.map((p, i) => (
            <div
              key={p.name}
              className={`game-card p-4 flex items-center gap-4 ${i === 0 ? "border-accent/50 glow-accent" : ""}`}
            >
              <span className="text-2xl font-heading font-bold text-muted-foreground w-8">
                #{i + 1}
              </span>
              <span className="text-2xl">{p.avatar}</span>
              <span className="font-body font-semibold text-foreground flex-1 text-left">
                {p.name}
              </span>
              <span className="font-heading font-bold text-xl text-primary">{p.score}</span>
            </div>
          ))}
        </div>

        <Button variant="hero" size="xl" className="w-full" onClick={onHome}>
          <Home className="w-5 h-5" />
          Play Again
        </Button>
      </div>
    </div>
  );
};

export default PlayGame;
