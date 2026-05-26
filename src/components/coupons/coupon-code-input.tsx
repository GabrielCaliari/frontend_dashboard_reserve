"use client";

import { useState, useEffect, useCallback } from "react";
import { Input, Button, Chip } from "@heroui/react";
import { Tag, X, Check, AlertCircle, Clock } from "lucide-react";
import { couponsService } from "@/src/common/services/coupons-service";
import type {
  ValidateCouponPayload,
  CouponValidationResult,
} from "@/src/common/@types/@coupons";
import { isAxiosError } from "axios";

const RATE_LIMIT_LOCKOUT_SECONDS = 60;

interface CouponCodeInputProps {
  cartItems: ValidateCouponPayload["cartItems"];
  context: "b2b" | "b2c";
  onValidated?: (result: CouponValidationResult | null) => void;
}

export function CouponCodeInput({
  cartItems,
  context,
  onValidated,
}: CouponCodeInputProps) {
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [result, setResult] = useState<CouponValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for rate limit lockout
  useEffect(() => {
    if (!lockedUntil) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockedUntil.getTime() - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedUntil(null);
        setCountdown(0);
        clearInterval(interval);
      } else {
        setCountdown(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  const handleApply = useCallback(async () => {
    if (!code.trim() || isValidating || lockedUntil) return;

    setIsValidating(true);
    setError(null);
    setResult(null);

    try {
      const res = await couponsService.validate({
        codes: [code.trim().toUpperCase()],
        cartItems,
        context,
      });
      setResult(res);
      onValidated?.(res);
    } catch (err) {
      if (isAxiosError(err)) {
        if (err.response?.status === 429) {
          const until = new Date(Date.now() + RATE_LIMIT_LOCKOUT_SECONDS * 1000);
          setLockedUntil(until);
          setCountdown(RATE_LIMIT_LOCKOUT_SECONDS);
          setError("Muitas tentativas — aguarde 1 minuto.");
        } else {
          setError(err.response?.data?.message ?? "Cupom inválido.");
        }
      } else {
        setError("Erro ao validar cupom.");
      }
      onValidated?.(null);
    } finally {
      setIsValidating(false);
    }
  }, [code, cartItems, context, isValidating, lockedUntil, onValidated]);

  function handleClear() {
    setCode("");
    setResult(null);
    setError(null);
    onValidated?.(null);
  }

  const isLocked = !!lockedUntil;
  const canApply = !isLocked && code.trim().length > 0 && !isValidating;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Código do cupom"
          value={code}
          onValueChange={(v) => {
            setCode(v.toUpperCase());
            if (error) setError(null);
            if (result) setResult(null);
          }}
          isDisabled={isLocked}
          startContent={<Tag className="w-4 h-4 text-muted-foreground" />}
          classNames={{
            inputWrapper: "bg-[#0d0d20] border-border",
            input: "uppercase text-foreground",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleApply();
          }}
        />
        <Button
          color="primary"
          isDisabled={!canApply}
          isLoading={isValidating}
          onPress={handleApply}
          className="shrink-0"
        >
          Aplicar
        </Button>
      </div>

      {/* Success result */}
      {result?.valid && result.coupons.map((c) => (
        <div
          key={c.code}
          className="flex items-center justify-between rounded-lg bg-success/10 border border-success/20 px-3 py-2"
        >
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-success" />
            <div>
              <Chip size="sm" variant="flat" className="font-mono mr-2">{c.code}</Chip>
              <span className="text-sm text-foreground">{c.description}</span>
            </div>
          </div>
          <button onClick={handleClear} className="text-muted-foreground hover:text-foreground ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-danger/10 border border-danger/20 px-3 py-2">
          {isLocked ? (
            <Clock className="w-4 h-4 text-danger shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-danger shrink-0" />
          )}
          <p className="text-sm text-danger">
            {error}
            {isLocked && countdown > 0 && (
              <span className="ml-1 font-mono">({countdown}s)</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
