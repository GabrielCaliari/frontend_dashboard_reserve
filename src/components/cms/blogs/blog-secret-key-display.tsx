'use client';

import { useState } from 'react';
import { Button, Chip } from "@heroui/react";
import { Eye, EyeOff, Copy, Check, AlertTriangle } from 'lucide-react';

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
      console.error('Failed to copy secret key:', error);
    }
  };

  // If no secret key, show message
  if (!secretKey) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-default-700">Secret Key:</span>
          <Chip
            size="sm"
            variant="flat"
            color="default"
          >
            Not Available
          </Chip>
        </div>
        <p className="text-xs text-default-500">
          Secret key is only shown once during blog creation. Regenerate if needed.
        </p>
      </div>
    );
  }

  const maskedKey = secretKey.slice(0, 8) + '•'.repeat(secretKey.length - 8);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-default-700">Secret Key:</span>
        <Chip
          size="sm"
          variant="flat"
          color="warning"
          startContent={<AlertTriangle size={14} />}
        >
          Keep Secure
        </Chip>
      </div>

      <div className="flex items-center gap-2 p-3 bg-default-100 rounded-lg">
        <code className="flex-1 text-sm font-mono text-default-700 break-all">
          {isVisible ? secretKey : maskedKey}
        </code>
        <div className="flex gap-1">
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={() => setIsVisible(!isVisible)}
            aria-label={isVisible ? 'Hide secret key' : 'Show secret key'}
          >
            {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={handleCopy}
            aria-label="Copy secret key"
            color={isCopied ? 'success' : 'default'}
          >
            {isCopied ? <Check size={16} /> : <Copy size={16} />}
          </Button>
        </div>
      </div>

      <p className="text-xs text-default-500">
        Use this key to authenticate public API requests for this blog.
      </p>
    </div>
  );
}
