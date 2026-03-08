"use client";

import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/common/lib/utils";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "default";
  isLoading?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  isLoading = false,
}: ConfirmationDialogProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: <AlertTriangle className="h-6 w-6 text-danger" />,
          iconBg: "bg-danger/10",
          confirmButton: "bg-danger hover:bg-danger/90 text-white",
        };
      case "warning":
        return {
          icon: <AlertCircle className="h-6 w-6 text-warning" />,
          iconBg: "bg-warning/10",
          confirmButton: "bg-warning hover:bg-warning/90 text-white",
        };
      default:
        return {
          icon: <Info className="h-6 w-6 text-primary" />,
          iconBg: "bg-primary/10",
          confirmButton: "bg-primary hover:bg-primary/90 text-white",
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-content1 border-border">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className={cn("rounded-full p-3", variantStyles.iconBg)}>
              {variantStyles.icon}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl text-foreground mb-2">
                {title}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {message}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            className="text-muted-foreground hover:text-foreground"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={variantStyles.confirmButton}
          >
            {isLoading ? "Processing..." : confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
