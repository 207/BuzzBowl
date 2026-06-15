import { Suspense, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Button } from "@/components/ui/button";
import { AnimatedAvatarViewer } from "@/components/dev/AnimatedAvatarModel";
import {
  AVATAR_ANIMATION_CLIPS,
  AVATAR_ANIMATION_LABELS,
  AVATAR_IDS,
  avatarDisplayName,
  avatarModelUrl,
  type AvatarAnimationClip,
  type AvatarId,
} from "@/lib/avatarModels";
import { ArrowLeft, RotateCw } from "lucide-react";

const AvatarPreviewLab = () => {
  const [avatarId, setAvatarId] = useState<AvatarId>("fox");
  const [clip, setClip] = useState<AvatarAnimationClip>("idle");
  const [autoRotate, setAutoRotate] = useState(false);

  useEffect(() => {
    AVATAR_IDS.forEach((id) => useGLTF.preload(avatarModelUrl(id)));
  }, []);

  return (
    <div className="min-h-dvh bg-background px-4 py-6 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-body uppercase tracking-wider text-muted-foreground">Dev only</p>
            <h1 className="mt-1 text-2xl font-heading font-bold text-foreground">Avatar preview lab</h1>
            <p className="mt-2 max-w-xl text-sm font-body text-muted-foreground">
              Browse Kenney animal GLBs and test animation clips before wiring them into the game UI.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Back home
            </Link>
          </Button>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
          <aside className="game-card max-h-[min(70vh,32rem)] overflow-y-auto scrollbar-themed p-3">
            <p className="mb-3 px-1 text-xs font-body font-semibold uppercase tracking-wider text-muted-foreground">
              Animals ({AVATAR_IDS.length})
            </p>
            <ul className="space-y-1">
              {AVATAR_IDS.map((id) => {
                const selected = id === avatarId;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => setAvatarId(id)}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm font-body transition-colors ${
                        selected
                          ? "bg-primary/15 font-semibold text-primary"
                          : "text-foreground hover:bg-muted/60"
                      }`}
                    >
                      {avatarDisplayName(id)}
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          <section className="flex min-w-0 flex-col gap-4">
            <div className="game-card overflow-hidden p-3 sm:p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-lg font-heading font-bold text-foreground">
                    {avatarDisplayName(avatarId)}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground">{avatarModelUrl(avatarId)}</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={autoRotate ? "default" : "outline"}
                  onClick={() => setAutoRotate((v) => !v)}
                >
                  <RotateCw className="h-4 w-4" />
                  Auto-rotate
                </Button>
              </div>

              <div className="h-[min(58vh,28rem)] w-full overflow-hidden rounded-xl border border-border/60 bg-muted/20">
                <Canvas
                  key={avatarId}
                  camera={{ position: [0, 1.1, 2.8], fov: 42 }}
                  gl={{ alpha: true, antialias: true }}
                >
                  <Suspense
                    fallback={
                      <mesh>
                        <boxGeometry args={[0.1, 0.1, 0.1]} />
                        <meshBasicMaterial color="#666" wireframe />
                      </mesh>
                    }
                  >
                    <AnimatedAvatarViewer avatarId={avatarId} clip={clip} autoRotate={autoRotate} />
                  </Suspense>
                </Canvas>
              </div>
              <p className="mt-2 text-center text-xs text-muted-foreground font-body">
                Drag to orbit · scroll to zoom
              </p>
            </div>

            <div className="game-card p-4">
              <p className="mb-3 text-xs font-body font-semibold uppercase tracking-wider text-muted-foreground">
                Animation clip
              </p>
              <div className="flex flex-wrap gap-2">
                {AVATAR_ANIMATION_CLIPS.map((name) => (
                  <Button
                    key={name}
                    type="button"
                    size="sm"
                    variant={clip === name ? "default" : "outline"}
                    onClick={() => setClip(name)}
                  >
                    {AVATAR_ANIMATION_LABELS[name]}
                  </Button>
                ))}
              </div>
              <p className="mt-3 text-xs font-body text-muted-foreground">
                Suggested for game over: 1st → <span className="text-foreground">Dance</span>, 2nd/3rd →{" "}
                <span className="text-foreground">Gesture +</span>, lists →{" "}
                <span className="text-foreground">Idle</span> or <span className="text-foreground">Static</span>.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AvatarPreviewLab;
