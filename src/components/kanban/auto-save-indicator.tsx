"use client";

import { useEffect, useState } from "react";
import { Check, Save } from "lucide-react";
import { cn } from "@/src/common/utils";
import { useTranslations } from "next-intl";

interface AutoSaveIndicatorProps {
  saving: boolean;
  saved: boolean;
  className?: string;
}

export default function AutoSaveIndicator({
  saving,
  saved,
  className,
}: AutoSaveIndicatorProps) {
  const t = useTranslations("kanban");
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (saved) {
      setShowSaved(true);
      const timer = setTimeout(() => {
        setShowSaved(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [saved]);

  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      {saving && (
        <>
          <Save className="h-3.5 w-3.5 animate-pulse" />
          <span>{t("saving")}</span>
        </>
      )}

      {showSaved && !saving && (
        <>
          <Check className="h-3.5 w-3.5 text-green-500" />
          <span className="text-green-500">{t("saved")}</span>
        </>
      )}
    </div>
  );
}
