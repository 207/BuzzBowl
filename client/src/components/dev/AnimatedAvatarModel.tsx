import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { Group } from "three";
import type { AvatarAnimationClip, AvatarId } from "@/lib/avatarModels";
import { AvatarSceneContent } from "@/components/avatars/AnimatedAvatarCanvas";

export function AnimatedAvatarViewer({
  avatarId,
  clip,
  autoRotate = false,
}: {
  avatarId: AvatarId;
  clip: AvatarAnimationClip;
  autoRotate?: boolean;
}) {
  const group = useRef<Group>(null);

  useFrame((_, delta) => {
    if (autoRotate && group.current) group.current.rotation.y += delta * 0.35;
  });

  return (
    <group ref={group}>
      <AvatarSceneContent avatarId={avatarId} clip={clip} />
      <OrbitControls
        enablePan={false}
        minDistance={1.2}
        maxDistance={5}
        target={[0, 0.75, 0]}
      />
    </group>
  );
}
