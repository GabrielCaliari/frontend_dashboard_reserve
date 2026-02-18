"use client";

import { useState } from "react";
import { Copy, Check, Key, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Alert, AlertDescription } from "@/src/components/ui/alert";

interface SecretKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  secretKey: string;
  blogTitle: string;
}

export function SecretKeyDialog({
  open,
  onOpenChange,
  secretKey,
  blogTitle,
}: SecretKeyDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(secretKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-content1 border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl text-foreground flex items-center gap-2">
            <Key className="w-6 h-6 text-purple-400" />
            Secret Key Generated
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Secret key for: <span className="text-blue-400 font-semibold">{blogTitle}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <Alert className="bg-yellow-500/10 border-border">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-400 text-sm">
              Save this key now! For security reasons, it won't be shown again.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Secret Key</label>
            <div className="flex gap-2">
              <div className="flex-1 bg-content2 border border-border rounded-md p-3 font-mono text-sm text-foreground break-all">
                {secretKey}
              </div>
              <Button
                onClick={handleCopy}
                className="bg-purple-600 hover:bg-purple-700 text-white shrink-0"
                size="icon"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-border rounded-md p-4 space-y-2">
            <h4 className="text-sm font-semibold text-blue-400">How to use this key:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Include it in API requests as a Bearer token</li>
              <li>Keep it secure and never commit it to version control</li>
              <li>You can regenerate it anytime if compromised</li>
            </ul>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={() => onOpenChange(false)}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              I've Saved the Key
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
