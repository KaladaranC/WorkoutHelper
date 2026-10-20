import type { MetadataRoute } from "next";
import { BASE_PATH } from "@/lib/base-path";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Spotter: home workouts with form feedback",
    short_name: "Spotter",
    start_url: `${BASE_PATH}/`,
    display: "standalone",
    background_color: "#f2f3ef",
    theme_color: "#c33528",
    icons: [{ src: `${BASE_PATH}/icon.svg`, sizes: "any", type: "image/svg+xml" }],
  };
}
