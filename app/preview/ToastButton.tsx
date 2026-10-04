"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ToastButton() {
  return (
    <Button variant="outline" onClick={() => toast.success("Listo", { description: "Así se ve un aviso." })}>
      Lanzar aviso
    </Button>
  );
}
