import { useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { AVATAR_IDS, avatarModelUrl } from "@/lib/avatarModels";

let preloaded = false;

/** Warm the GLB cache once per session (safe to call from multiple pages). */
export function useAvatarModelPreload(): void {
  useEffect(() => {
    if (preloaded) return;
    preloaded = true;
    AVATAR_IDS.forEach((id) => useGLTF.preload(avatarModelUrl(id)));
  }, []);
}
