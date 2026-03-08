"use client";

import { useState } from "react";
import { Copy, Check, Key, AlertTriangle, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/src/components/ui/sheet";
import { Button } from "@/src/components/ui/button";
import { Alert, AlertDescription } from "@/src/components/ui/alert";

interface SecretKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  secretKey?: string | null;
  blogTitle: string;
  onConfirmRegenerate?: () => void;
  isPending?: boolean;
}

export function SecretKeyDialog({
  open,
  onOpenChange,
  secretKey,
  blogTitle,
  onConfirmRegenerate,
  isPending = false,
}: SecretKeyDialogProps) {
  const [copied, setCopied] = useState(false);
  const isConfirmationStep = !secretKey && !!onConfirmRegenerate;

  const handleCopy = async () => {
    if (!secretKey) {
      return;
    }

    try {
      await navigator.clipboard.writeText(secretKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex h-full w-full flex-col overflow-hidden border-border bg-content1 p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border px-6 py-4 text-left">
          <SheetTitle className="text-2xl text-foreground flex items-center gap-2">
            <Key className="w-6 h-6 text-purple-400" />
            {isConfirmationStep ? "Regenerate Secret Key" : "Secret Key Generated"}
          </SheetTitle>
          <SheetDescription className="text-muted-foreground">
            Secret key for: <span className="text-blue-400 font-semibold">{blogTitle}</span>
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-4">
            {isConfirmationStep ? (
              <>
                <Alert className="bg-yellow-500/10 border-border">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <AlertDescription className="text-yellow-400 text-sm">
                    This will immediately invalidate the current secret key. Any integrations using the existing key will stop working until updated.
                  </AlertDescription>
                </Alert>

                <div className="rounded-lg border border-border bg-content2 p-4 text-sm text-muted-foreground">
                  Use this only if the current key was compromised or you intentionally need to rotate credentials for this blog.
                </div>
              </>
            ) : (
              <>
                <Alert className="bg-yellow-500/10 border-border">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <AlertDescription className="text-yellow-400 text-sm">
                    Save this key now. For security reasons, it won't be shown again.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Secret Key</label>
                  <div className="flex gap-2">
                    <div className="flex-1 rounded-md border border-border bg-content2 p-3 font-mono text-sm text-foreground break-all">
                      {secretKey}
                    </div>
                    <Button
                      onClick={handleCopy}
                      className="bg-purple-600 hover:bg-purple-700 text-white shrink-0"
                      size="icon"
                      type="button"
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
                  <h4 className="text-sm font-semibold text-blue-400">How to use this key</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Include it in API requests as a Bearer token</li>
                    <li>Keep it secure and never commit it to version control</li>
                    <li>You can regenerate it anytime if compromised</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="border-t border-border px-6 py-4">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {isConfirmationStep ? "Cancel" : "Close"}
            </Button>

            {isConfirmationStep ? (
              <Button
                type="button"
                onClick={onConfirmRegenerate}
                className="bg-amber-600 hover:bg-amber-700 text-white"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  "Regenerate Key"
                )}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => onOpenChange(false)}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                I've Saved the Key
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
