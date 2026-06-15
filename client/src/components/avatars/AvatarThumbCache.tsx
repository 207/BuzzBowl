import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Center, useGLTF } from "@react-three/drei";
import { SkeletonUtils } from "three-stdlib";
import { AVATAR_IDS, avatarModelUrl, type AvatarId } from "@/lib/avatarModels";

const THUMB_PX = 64;
const THUMB_SCALE = 0.42;

export const AVATAR_THUMB_PX = THUMB_PX;

const globalThumbCache = new Map<AvatarId, string>();
let bakedThumbPx = 0;

function ensureThumbCacheSize() {
  if (bakedThumbPx !== THUMB_PX) {
    globalThumbCache.clear();
    bakedThumbPx = THUMB_PX;
  }
}

type ThumbCache = Partial<Record<AvatarId, string>>;

const AvatarThumbCacheContext = createContext<ThumbCache>({});

export function useAvatarThumbCache(): ThumbCache {
  return useContext(AvatarThumbCacheContext);
}

function BakerModel({ avatarId }: { avatarId: AvatarId }) {
  const { scene } = useGLTF(avatarModelUrl(avatarId));
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  return (
    <Center>
      <primitive object={clone} scale={THUMB_SCALE} />
    </Center>
  );
}

function CaptureFrame({
  avatarId,
  onCapture,
}: {
  avatarId: AvatarId;
  onCapture: (avatarId: AvatarId, dataUrl: string) => void;
}) {
  const { gl, scene, camera } = useThree();
  const done = useRef(false);

  useEffect(() => {
    done.current = false;
  }, [avatarId]);

  useEffect(() => {
    if (done.current) return;
    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (cancelled || done.current) return;
        done.current = true;
        gl.render(scene, camera);
        onCapture(avatarId, gl.domElement.toDataURL("image/png"));
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [avatarId, gl, scene, camera, onCapture]);

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[3, 5, 2]} intensity={1.1} />
      <directionalLight position={[-2, 2, -1]} intensity={0.25} />
      <BakerModel avatarId={avatarId} />
    </>
  );
}

function ThumbBaker({
  queue,
  onCapture,
}: {
  queue: AvatarId[];
  onCapture: (avatarId: AvatarId, dataUrl: string) => void;
}) {
  const current = queue[0];
  if (!current) return null;

  return (
    <div
      className="pointer-events-none fixed opacity-0"
      style={{ left: -9999, top: 0, width: THUMB_PX, height: THUMB_PX }}
      aria-hidden
    >
      <Canvas
        key={current}
        dpr={1}
        frameloop="demand"
        gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
        camera={{ position: [0, 1, 2.15], fov: 40 }}
        style={{ width: THUMB_PX, height: THUMB_PX }}
      >
        <CaptureFrame avatarId={current} onCapture={onCapture} />
      </Canvas>
    </div>
  );
}

export function AvatarThumbCacheProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    ensureThumbCacheSize();
    AVATAR_IDS.forEach((id) => useGLTF.preload(avatarModelUrl(id)));
  }, []);

  const [cache, setCache] = useState<ThumbCache>(() => {
    const initial: ThumbCache = {};
    for (const id of AVATAR_IDS) {
      const url = globalThumbCache.get(id);
      if (url) initial[id] = url;
    }
    return initial;
  });

  const [queue, setQueue] = useState<AvatarId[]>(() =>
    AVATAR_IDS.filter((id) => !globalThumbCache.has(id)),
  );

  const onCapture = useCallback((avatarId: AvatarId, dataUrl: string) => {
    globalThumbCache.set(avatarId, dataUrl);
    setCache((prev) => ({ ...prev, [avatarId]: dataUrl }));
    setQueue((prev) => prev.filter((id) => id !== avatarId));
  }, []);

  const value = useMemo(() => cache, [cache]);

  return (
    <AvatarThumbCacheContext.Provider value={value}>
      {children}
      {queue.length > 0 ? <ThumbBaker queue={queue} onCapture={onCapture} /> : null}
    </AvatarThumbCacheContext.Provider>
  );
}
