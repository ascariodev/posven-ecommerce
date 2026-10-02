"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

export type ActionNotice = { kind: "error" | "success"; message: string };

export function useActionToast(notice: ActionNotice | null | undefined): void {
  const shown = useRef<ActionNotice | null>(null);

  useEffect(() => {
    if (!notice || shown.current === notice) return;
    shown.current = notice;
    if (notice.kind === "error") toast.error(notice.message);
    else toast.success(notice.message);
  }, [notice]);
}
