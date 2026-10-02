"use client";

import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function ShareButton({ title, text }: { title: string; text?: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url: window.location.href,
        });
      } catch (error) {
        // Ignorar errores de cancelación del usuario
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="self-start gap-2"
      onClick={handleShare}
      title="Compartir"
    >
      <Share2 className="size-4" />
      <span className="hidden sm:inline">
        {copied ? "Enlace copiado" : "Compartir"}
      </span>
    </Button>
  );
}
