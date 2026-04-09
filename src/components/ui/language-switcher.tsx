"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";
import { setCookie } from "cookies-next";
import ReactCountryFlag from "react-country-flag";
import { ChevronDown } from "lucide-react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from "@heroui/react";

const languages = [
  { code: "pt", label: "Português", country: "BR" },
  { code: "en", label: "English", country: "US" },
];

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [selected, setSelected] = useState(locale);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => setSelected(locale), [locale]);
  const current = languages.find((l) => l.code === selected) || languages[0];

  const handleLocaleChange = (langCode: string) => {
    if (langCode === locale) return;

    setCookie("NEXT_LOCALE", langCode, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });

    router.refresh();
    window.location.reload();
  };

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="flex items-center gap-2 px-3 py-2 hover:bg-foreground/10 transition-colors rounded-full border border-border min-w-[80px]"
        disabled
      >
        <ReactCountryFlag
          countryCode={current.country}
          svg
          className="rounded-full"
          style={{ width: 16, height: 16, objectFit: "cover" }}
        />
        <span className="font-bold text-xs uppercase tracking-widest text-foreground">
          {current.code}
        </span>
        <ChevronDown className="h-4 w-4 text-foreground" />
      </Button>
    );
  }

  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 px-3 py-2 hover:bg-foreground/10 transition-colors rounded-full border border-border"
        >
          <ReactCountryFlag
            countryCode={current.country}
            svg
            className="rounded-full"
            style={{ width: 16, height: 16, objectFit: "cover" }}
          />
          <span className="font-bold text-xs uppercase tracking-widest text-foreground">
            {current.code}
          </span>
          <ChevronDown className="h-4 w-4 text-foreground" />
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Language selection"
        selectionMode="single"
        selectedKeys={new Set([locale])}
        onAction={(key) => handleLocaleChange(key as string)}
        className="min-w-[160px] p-2 bg-popover border border-border rounded-[24px]"
      >
        {languages.map((lang) => (
          <DropdownItem
            key={lang.code}
            className={`flex items-center gap-3 px-4 py-3 rounded-full font-bold text-sm uppercase tracking-wider text-popover-foreground cursor-pointer transition-colors ${
              locale === lang.code
                ? "bg-foreground/10"
                : "hover:bg-foreground/10 focus:bg-foreground/10"
            }`}
          >
            <div className="flex items-center gap-3">
              <ReactCountryFlag
                countryCode={lang.country}
                svg
                className="rounded-full"
                style={{ width: 20, height: 20, objectFit: "cover" }}
              />
              <span>{lang.label}</span>
            </div>
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}
