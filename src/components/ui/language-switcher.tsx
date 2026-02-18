'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'nextjs-toploader/app';
import { setCookie } from 'cookies-next';
import { locales, type AppLocale } from '@/src/i18n/routing';
import { Languages } from 'lucide-react';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from '@nextui-org/react';

const localeLabels: Record<AppLocale, { label: string; flag: string }> = {
  pt: { label: 'Português', flag: '🇧🇷' },
  en: { label: 'English', flag: '🇺🇸' },
};

interface LanguageSwitcherProps {
  variant?: 'icon' | 'full';
}

export function LanguageSwitcher({ variant = 'icon' }: LanguageSwitcherProps) {
  const currentLocale = useLocale() as AppLocale;
  const router = useRouter();

  const handleLocaleChange = (locale: AppLocale) => {
    if (locale === currentLocale) return;

    setCookie('NEXT_LOCALE', locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });

    router.refresh();
    window.location.reload();
  };

  return (
    <Dropdown>
      <DropdownTrigger>
        {variant === 'full' ? (
          <Button
            variant="bordered"
            size="sm"
            className="border-gray-700 text-gray-300 hover:bg-white/5 gap-2 min-w-[130px]"
            startContent={
              <span className="text-base">{localeLabels[currentLocale].flag}</span>
            }
          >
            {localeLabels[currentLocale].label}
          </Button>
        ) : (
          <Button
            isIconOnly
            variant="light"
            size="sm"
            className="text-gray-400 hover:text-gray-200"
            aria-label="Switch language"
          >
            <Languages size={20} />
          </Button>
        )}
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Language selection"
        selectionMode="single"
        selectedKeys={new Set([currentLocale])}
        onAction={(key) => handleLocaleChange(key as AppLocale)}
        className="min-w-[160px]"
      >
        {locales.map((locale) => (
          <DropdownItem
            key={locale}
            startContent={
              <span className="text-base">{localeLabels[locale].flag}</span>
            }
            className={currentLocale === locale ? 'text-accent-foreground bg-accent' : ''}
          >
            {localeLabels[locale].label}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}
