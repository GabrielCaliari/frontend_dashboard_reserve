'use client';

import { useState, useEffect } from 'react';
import { Select, SelectItem, Input, Card, CardBody } from '@heroui/react';
import { useTranslations } from 'next-intl';
import {
  Infinity,
  Calendar,
  CreditCard,
  Clock,
  AlertCircle,
  Settings2,
} from 'lucide-react';
import type { BillingConfiguration, BillingMode, BillingInterval } from '@/src/common/@types/@billing-config';

type BillingPreset = 'monthly' | 'quarterly' | 'semiannual' | 'annual' | 'custom';

const PRESET_MAP: Record<Exclude<BillingPreset, 'custom'>, { interval: BillingInterval; intervalCount: number }> = {
  monthly:    { interval: 'month', intervalCount: 1 },
  quarterly:  { interval: 'month', intervalCount: 3 },
  semiannual: { interval: 'month', intervalCount: 6 },
  annual:     { interval: 'year',  intervalCount: 1 },
};

function resolvePreset(interval: BillingInterval, intervalCount: number): BillingPreset {
  if (interval === 'month' && intervalCount === 1) return 'monthly';
  if (interval === 'month' && intervalCount === 3) return 'quarterly';
  if (interval === 'month' && intervalCount === 6) return 'semiannual';
  if (interval === 'year'  && intervalCount === 1) return 'annual';
  return 'custom';
}

interface BillingConfigSelectorProps {
  value: BillingConfiguration;
  onChange: (config: BillingConfiguration) => void;
  isDisabled?: boolean;
}

export function BillingConfigSelector({
  value,
  onChange,
  isDisabled = false,
}: BillingConfigSelectorProps) {
  const t = useTranslations('payments.productsPage.billingConfig');

  const [preset, setPreset] = useState<BillingPreset>(() =>
    resolvePreset(value.interval, value.intervalCount)
  );

  useEffect(() => {
    setPreset(resolvePreset(value.interval, value.intervalCount));
  }, [value.interval, value.intervalCount]);

  const billingModes: Array<{
    value: BillingMode;
    icon: React.ReactNode;
    label: string;
    description: string;
    color: string;
    activeBg: string;
    activeBorder: string;
  }> = [
    {
      value: 'recurring_infinite',
      icon: <Infinity className="w-4 h-4" />,
      label: t('modeInfiniteLabel'),
      description: t('modeInfiniteDesc'),
      color: 'text-blue-400',
      activeBg: 'bg-blue-500/10',
      activeBorder: 'border-blue-500/50',
    },
    {
      value: 'recurring_limited',
      icon: <Calendar className="w-4 h-4" />,
      label: t('modeLimitedLabel'),
      description: t('modeLimitedDesc'),
      color: 'text-amber-400',
      activeBg: 'bg-amber-500/10',
      activeBorder: 'border-amber-500/50',
    },
    {
      value: 'one_time_expiring',
      icon: <CreditCard className="w-4 h-4" />,
      label: t('modeOneTimeLabel'),
      description: t('modeOneTimeDesc'),
      color: 'text-purple-400',
      activeBg: 'bg-purple-500/10',
      activeBorder: 'border-purple-500/50',
    },
  ];

  const presets: Array<{ value: BillingPreset; label: string }> = [
    { value: 'monthly',    label: t('presetMonthly') },
    { value: 'quarterly',  label: t('presetQuarterly') },
    { value: 'semiannual', label: t('presetSemiannual') },
    { value: 'annual',     label: t('presetAnnual') },
    { value: 'custom',     label: t('presetCustom') },
  ];

  const intervals: Array<{ value: BillingInterval; label: string }> = [
    { value: 'day',   label: t('intervalDay') },
    { value: 'week',  label: t('intervalWeek') },
    { value: 'month', label: t('intervalMonth') },
    { value: 'year',  label: t('intervalYear') },
  ];

  const handleModeChange = (mode: BillingMode) => {
    const next: BillingConfiguration = { ...value, mode };
    if (mode === 'recurring_infinite') {
      delete next.maxCharges;
      delete next.accessDuration;
      delete next.accessDurationUnit;
    } else if (mode === 'recurring_limited') {
      next.maxCharges = next.maxCharges || 12;
      delete next.accessDuration;
      delete next.accessDurationUnit;
    } else if (mode === 'one_time_expiring') {
      next.accessDuration = next.accessDuration || 12;
      next.accessDurationUnit = next.accessDurationUnit || 'month';
      delete next.maxCharges;
    }
    onChange(next);
  };

  const handlePresetChange = (p: BillingPreset) => {
    setPreset(p);
    if (p !== 'custom') {
      onChange({ ...value, ...PRESET_MAP[p] });
    }
  };

  const selectedMode = billingModes.find((m) => m.value === value.mode)!;
  const isRecurring = value.mode === 'recurring_infinite' || value.mode === 'recurring_limited';

  return (
    <div className="space-y-3">
      {/* ── Mode selector ── */}
      <div>
        <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
          {t('modeLabel')}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {billingModes.map((mode) => {
            const isActive = value.mode === mode.value;
            return (
              <button
                key={mode.value}
                type="button"
                onClick={() => handleModeChange(mode.value)}
                disabled={isDisabled}
                className={`p-2.5 rounded-lg border text-left transition-all flex flex-col items-center gap-1.5 ${
                  isActive
                    ? `${mode.activeBg} ${mode.activeBorder}`
                    : 'border-[#2a2a3e] bg-[#1a1a2e] hover:border-[#3a3a4e]'
                } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span className={isActive ? mode.color : 'text-gray-500'}>
                  {mode.icon}
                </span>
                <span className={`text-xs font-medium text-center leading-tight ${isActive ? 'text-gray-100' : 'text-gray-400'}`}>
                  {mode.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Mode description card */}
        <div className={`mt-2 p-2.5 rounded-lg border ${selectedMode.activeBg} ${selectedMode.activeBorder}`}>
          <p className={`text-xs ${selectedMode.color}`}>{selectedMode.description}</p>
        </div>
      </div>

      {/* ── Interval presets (recorrentes only) ── */}
      {isRecurring && (
        <div>
          <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
            {t('presetLabel')}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => {
              const isActive = preset === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => handlePresetChange(p.value)}
                  disabled={isDisabled}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    isActive
                      ? 'bg-primary/20 border-primary/50 text-primary'
                      : 'bg-[#1a1a2e] border-[#2a2a3e] text-gray-400 hover:border-[#3a3a4e] hover:text-gray-300'
                  } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${
                    p.value === 'custom' ? 'flex items-center gap-1' : ''
                  }`}
                >
                  {p.value === 'custom' && <Settings2 className="w-3 h-3" />}
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Custom interval inputs */}
          {preset === 'custom' && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Select
                label={t('intervalLabel')}
                selectedKeys={[value.interval]}
                onChange={(e) => onChange({ ...value, interval: e.target.value as BillingInterval })}
                isDisabled={isDisabled}
                size="sm"
                classNames={{ trigger: 'bg-[#1a1a2e] border-[#2a2a3e]' }}
              >
                {intervals.map((interval) => (
                  <SelectItem key={interval.value} value={interval.value}>
                    {interval.label}
                  </SelectItem>
                ))}
              </Select>
              <Input
                type="number"
                min="1"
                max="99"
                label={t('intervalCountLabel')}
                placeholder="1"
                value={value.intervalCount.toString()}
                onValueChange={(v) => onChange({ ...value, intervalCount: parseInt(v) || 1 })}
                isDisabled={isDisabled}
                size="sm"
                classNames={{ inputWrapper: 'bg-[#1a1a2e] border-[#2a2a3e]' }}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Mode-specific fields ── */}
      {value.mode === 'recurring_infinite' && (
        <Card className="bg-blue-500/10 border border-blue-500/20">
          <CardBody className="p-2.5">
            <div className="flex items-start gap-2">
              <Infinity className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-300/80">{t('infiniteInfoDesc')}</p>
            </div>
          </CardBody>
        </Card>
      )}

      {value.mode === 'recurring_limited' && (
        <div className="space-y-2">
          <Input
            type="number"
            min="1"
            max="999"
            label={t('maxChargesLabel')}
            placeholder="12"
            description={t('maxChargesDesc')}
            value={value.maxCharges?.toString() || ''}
            onValueChange={(v) => onChange({ ...value, maxCharges: parseInt(v) || 1 })}
            isDisabled={isDisabled}
            size="sm"
            classNames={{ inputWrapper: 'bg-[#1a1a2e] border-[#2a2a3e]' }}
            startContent={<Calendar className="w-3.5 h-3.5 text-gray-400" />}
          />
          <Card className="bg-amber-500/10 border border-amber-500/20">
            <CardBody className="p-2.5">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300/80">
                  {t('limitedInfoDesc', {
                    charges: value.maxCharges || 12,
                    interval: t(`interval${value.interval.charAt(0).toUpperCase() + value.interval.slice(1)}`),
                  })}
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {value.mode === 'one_time_expiring' && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              min="1"
              max="999"
              label={t('accessDurationLabel')}
              placeholder="12"
              value={value.accessDuration?.toString() || ''}
              onValueChange={(v) => onChange({ ...value, accessDuration: parseInt(v) || 1 })}
              isDisabled={isDisabled}
              size="sm"
              classNames={{ inputWrapper: 'bg-[#1a1a2e] border-[#2a2a3e]' }}
              startContent={<Clock className="w-3.5 h-3.5 text-gray-400" />}
            />
            <Select
              label={t('durationUnitLabel')}
              selectedKeys={[value.accessDurationUnit || 'month']}
              onChange={(e) =>
                onChange({ ...value, accessDurationUnit: e.target.value as 'day' | 'month' | 'year' })
              }
              isDisabled={isDisabled}
              size="sm"
              classNames={{ trigger: 'bg-[#1a1a2e] border-[#2a2a3e]' }}
            >
              <SelectItem key="day"   value="day">{t('intervalDay')}</SelectItem>
              <SelectItem key="month" value="month">{t('intervalMonth')}</SelectItem>
              <SelectItem key="year"  value="year">{t('intervalYear')}</SelectItem>
            </Select>
          </div>
          <Card className="bg-purple-500/10 border border-purple-500/20">
            <CardBody className="p-2.5">
              <div className="flex items-start gap-2">
                <CreditCard className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-purple-300/80">
                  {t('oneTimeInfoDesc', {
                    duration: value.accessDuration || 12,
                    unit: t(`interval${(value.accessDurationUnit || 'month').charAt(0).toUpperCase() + (value.accessDurationUnit || 'month').slice(1)}`),
                  })}
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
