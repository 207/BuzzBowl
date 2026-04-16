import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CircleHelp } from "lucide-react";

const RulesHelpButton = () => (
  <Dialog>
    <DialogTrigger asChild>
      <button
        type="button"
        aria-label="How to play"
        className="fixed bottom-5 right-5 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-muted/90 text-muted-foreground shadow-md backdrop-blur-sm transition-colors hover:border-primary/40 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        <CircleHelp className="h-5 w-5" strokeWidth={2} />
      </button>
    </DialogTrigger>
    <DialogContent className="max-h-[min(85vh,32rem)] max-w-md overflow-y-auto sm:max-w-lg">
      <DialogHeader>
        <DialogTitle className="font-heading">How to play</DialogTitle>
        <DialogDescription className="text-left font-body">
          BuzzBowl is a quiz-bowl style buzzer game. One person hosts; everyone else joins on their phones.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 text-sm font-body text-foreground pr-1">
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Choose a play mode</h3>
          <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
            <li>
              <span className="text-foreground">House party</span>: question text is on the host screen; non-readers buzz
              from their phones.
            </li>
            <li>
              <span className="text-foreground">Remote play</span>: no TV screen during gameplay; everyone (including the
              host) plays from a phone.
            </li>
          </ul>
        </section>
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Getting started</h3>
          <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
            <li>
              <span className="text-foreground">Host</span> creates a room and shares the game code.
            </li>
            <li>
              <span className="text-foreground">Players</span> join with a name. You can add an optional selfie to show on
              the host&apos;s big screen.
            </li>
            <li>In remote mode, the host also joins as a player from the lobby before starting.</li>
            <li>The host picks teams (if needed) and starts the game when everyone is ready.</li>
          </ul>
        </section>
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">During a tossup</h3>
          <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
            <li>
              Questions <span className="text-foreground">reveal a few words at a time</span>. The{" "}
              <span className="text-foreground">reader</span> (shown on screen) controls pause, show full question, skip,
              and judges after a buzz.
            </li>
            <li>
              If you&apos;re allowed to buzz, tap <span className="text-foreground">Buzz</span> as soon as you know the
              answer. The first valid buzz locks the tossup for that player.
            </li>
            <li>
              In <span className="text-foreground">free for all</span>, everyone can vote to skip; when all players have
              voted, the tossup is skipped (the reader can still skip immediately).
            </li>
            <li>
              The reader marks <span className="text-foreground">Correct</span> or <span className="text-foreground">Incorrect</span>
              . Wrong answers on an interrupt can cost points (depending on host settings).
            </li>
            <li>
              The host may turn on an <span className="text-foreground">answer countdown</span> after a buzz; when it hits
              zero, the buzz counts as incorrect if the reader hasn&apos;t judged yet.
            </li>
          </ul>
        </section>
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Between &amp; end</h3>
          <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
            <li>After each tossup there&apos;s a short break. The reader taps to go to the next question.</li>
            <li>When all tossups are done, scores and a podium appear on the host display.</li>
          </ul>
        </section>
        <p className="text-xs text-muted-foreground border-t border-border pt-3">
          Scoring details (points for interrupts vs after the full question, negs, timer length) are set by the host
          under Advanced settings when creating the room.
        </p>
      </div>
    </DialogContent>
  </Dialog>
);

export default RulesHelpButton;
