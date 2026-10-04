import { createCn } from "cn/config";

// Las sombras de token propio (`shadow-card`, `shadow-raised`, en app/globals.css) entran al grupo
// de tamaños de sombra: sin esto `cn` las toma por colores y no las fusiona con `shadow-md` ni
// con `shadow-none`.
export const cn = createCn({
  extend: { classGroups: { shadow: [{ shadow: ["card", "raised"] }] } },
});
