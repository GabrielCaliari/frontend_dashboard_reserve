"use client";

import { useState } from "react";
import { Button, Chip } from "@heroui/react";
import { Eye, EyeOff, Copy, Check, AlertTriangle } from "lucide-react";

interface BlogSecretKeyDisplayProps {
  secretKey?: string;
}

export default function BlogSecretKeyDisplay({
  secretKey,
}: BlogSecretKeyDisplayProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    if (!secretKey) return;
    try {
      await navigator.clipboard.writeText(secretKey);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy secret key:", error);
    }
  };

  if (!secretKey) {
    return (
      <div className="space-y-2 rounded-xl bg-content2 p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            Secret key
          </span>
          <Chip size="sm" variant="flat" color="default">
            Not Available
          </Chip>
        </div>
        <p className="text-xs leading-relaxed text-foreground-400">
          Secret key is only shown once during creation. Regenerate if needed.
        </p>
      </div>
    );
  }

  const maskedKey =
    secretKey.slice(0, 8) + "•".repeat(Math.max(0, secretKey.length - 8));

  return (
    <div className="space-y-3 rounded-xl bg-content2 p-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">Secret key</span>
        <Chip
          size="sm"
          variant="flat"
          color="warning"
          startContent={<AlertTriangle size={14} />}
        >
          Keep Secure
        </Chip>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-divider bg-content1 p-3">
        <code className="flex-1 break-all font-mono text-sm text-foreground">
          {isVisible ? secretKey : maskedKey}
        </code>
        <div className="flex gap-1 shrink-0">
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={() => setIsVisible(!isVisible)}
            aria-label={isVisible ? "Hide secret key" : "Show secret key"}
          >
            {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={handleCopy}
            aria-label="Copy secret key"
            color={isCopied ? "success" : "default"}
          >
            {isCopied ? <Check size={16} /> : <Copy size={16} />}
          </Button>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-foreground-400">
        Use this key to authenticate public API requests for this collection.
      </p>
    </div>
  );
}
