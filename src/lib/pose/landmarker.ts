"use client";

import type { PoseLandmarker } from "@mediapipe/tasks-vision";
import { BASE_PATH } from "@/lib/base-path";

export type ModelSize = "lite" | "full";

// One landmarker for the whole app. Creating one compiles WASM and uploads the
// model to the GPU, so keep it warm between exercises instead of rebuilding.
let cached: { size: ModelSize; promise: Promise<PoseLandmarker> } | null = null;

export function loadLandmarker(size: ModelSize): Promise<PoseLandmarker> {
  if (cached?.size === size) return cached.promise;
  cached?.promise.then((l) => l.close()).catch(() => {});

  const promise = (async () => {
    const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");
    const fileset = await FilesetResolver.forVisionTasks(`${BASE_PATH}/mediapipe/wasm`);
    const create = (delegate: "GPU" | "CPU") =>
      PoseLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: `${BASE_PATH}/models/pose_landmarker_${size}.task`, delegate },
        runningMode: "VIDEO",
        numPoses: 1,
      });
    try {
      return await create("GPU");
    } catch {
      // Some phones expose no usable WebGL2 context; the CPU path is slower but works.
      return await create("CPU");
    }
  })();

  cached = { size, promise };
  promise.catch(() => {
    if (cached?.promise === promise) cached = null;
  });
  return promise;
}
