import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Center, useAnimations, useGLTF } from "@react-three/drei";
import { SkeletonUtils } from "three-stdlib";
import type { Group } from "three";
import type { AvatarAnimationClip, AvatarId } from "@/lib/avatarModels";
import { avatarModelUrl } from "@/lib/avatarModels";

const SIZE_CONFIG = {
  chip: { px: 32, scale: 0.3, fov: 42, cameraY: 1, cameraZ: 2.1 },
  lobby: { px: 56, scale: 0.42, fov: 40, cameraY: 1, cameraZ: 2.15 },
  row: { px: 40, scale: 0.34, fov: 42, cameraY: 1, cameraZ: 2.2 },
  podium: { px: 80, scale: 0.44, fov: 40, cameraY: 1, cameraZ: 2.5 },
  hero: { px: 220, scale: 0.48, fov: 38, cameraY: 1, cameraZ: 2.8 },
} as const;

export type AvatarCanvasSize = keyof typeof SIZE_CONFIG;

function AvatarModelMesh({
  avatarId,
  clip,
  scale,
}: {
  avatarId: AvatarId;
  clip: AvatarAnimationClip;
  scale: number;
}) {
  const group = useRef<Group>(null);
  const url = avatarModelUrl(avatarId);
  const { scene, animations } = useGLTF(url);
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    Object.values(actions).forEach((action) => action?.stop());
    const action = actions[clip];
    if (!action) return;
    action.reset().fadeIn(0.2).play();
    return () => {
      action.fadeOut(0.15);
    };
  }, [actions, clip]);

  return (
    <group ref={group}>
      <Center>
        <primitive object={clone} scale={scale} />
      </Center>
    </group>
  );
}

function AvatarScene({
  avatarId,
  clip,
  size,
}: {
  avatarId: AvatarId;
  clip: AvatarAnimationClip;
  size: AvatarCanvasSize;
}) {
  const cfg = SIZE_CONFIG[size];
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 5, 2]} intensity={1.1} />
      <directionalLight position={[-2, 2, -1]} intensity={0.3} />
      <AvatarModelMesh avatarId={avatarId} clip={clip} scale={cfg.scale} />
    </>
  );
}

export function AnimatedAvatarCanvas({
  avatarId,
  clip = "idle",
  size = "row",
  className,
  framed = true,
}: {
  avatarId: AvatarId;
  clip?: AvatarAnimationClip;
  size?: AvatarCanvasSize;
  className?: string;
  /** Rounded background ring; off for lobby-style chips */
  framed?: boolean;
}) {
  const cfg = SIZE_CONFIG[size];
  return (
    <div
      className={`shrink-0 overflow-hidden ${framed ? "rounded-full bg-muted/30 ring-1 ring-border" : ""} ${className ?? ""}`}
      style={{ width: cfg.px, height: cfg.px }}
    >
      <Canvas
        key={`${avatarId}-${clip}-${size}`}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, cfg.cameraY, cfg.cameraZ], fov: cfg.fov }}
        style={{ width: cfg.px, height: cfg.px }}
      >
        <Suspense fallback={null}>
          <AvatarScene avatarId={avatarId} clip={clip} size={size} />
        </Suspense>
      </Canvas>
    </div>
  );
}

/** Dev lab: scene content without canvas wrapper (orbit controls added externally). */
export function AvatarSceneContent({
  avatarId,
  clip,
  scale = 0.42,
}: {
  avatarId: AvatarId;
  clip: AvatarAnimationClip;
  scale?: number;
}) {
  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[4, 6, 3]} intensity={1.15} />
      <directionalLight position={[-3, 2, -2]} intensity={0.35} />
      <AvatarModelMesh avatarId={avatarId} clip={clip} scale={scale} />
    </>
  );
}

export { SIZE_CONFIG as AVATAR_CANVAS_SIZES };
