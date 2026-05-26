'use client';

import { Input } from'@heroui/react';
import { useState, useEffect } from'react';

interface CurrencyInputProps {
 label: string;
 placeholder?: string;
 value: string;
 onValueChange: (value: string) => void;
 currency?:'brl' |'usd';
 isRequired?: boolean;
 isDisabled?: boolean;
 classNames?: any;
 size?:'sm' |'md' |'lg';
 description?: string;
}

export function CurrencyInput({
 label,
 placeholder ='0,00',
 value,
 onValueChange,
 currency ='brl',
 isRequired = false,
 isDisabled = false,
 classNames,
 size,
 description,
}: CurrencyInputProps) {
 const [displayValue, setDisplayValue] = useState('');

 // Formatar valor para exibição
 const formatCurrency = (val: string): string => {
 if (!val) return'';
 
 // Remove tudo exceto números
 const numbers = val.replace(/\D/g,'');
 if (!numbers) return'';
 
 // Converte para número e divide por 100 (centavos)
 const amount = parseFloat(numbers) / 100;
 
 // Formata com 2 casas decimais
 return amount.toFixed(2).replace('.',',');
 };

 // Converter valor formatado para número
 const parseValue = (formatted: string): string => {
 if (!formatted) return'';
 
 // Remove tudo exceto números e vírgula
 const cleaned = formatted.replace(/[^\d,]/g,'');
 
 // Converte vírgula para ponto
 const withDot = cleaned.replace(',','.');
 
 return withDot;
 };

 // Atualizar display quando value externo mudar
 useEffect(() => {
 if (value) {
 setDisplayValue(formatCurrency(value.replace('.',',')));
 } else {
 setDisplayValue('');
 }
 }, [value]);

 const handleChange = (newValue: string) => {
 // Formata o valor
 const formatted = formatCurrency(newValue);
 setDisplayValue(formatted);
 
 // Envia o valor numérico de volta
 const numeric = parseValue(formatted);
 onValueChange(numeric);
 };

 const currencySymbol = currency ==='brl' ?'R$' :'$';

 return (
 <Input
 type="text"
 label={label}
 placeholder={placeholder}
 value={displayValue}
 onValueChange={handleChange}
 startContent={
 <span className="text-muted-foreground text-sm font-medium">
 {currencySymbol}
 </span>
 }
 isRequired={isRequired}
 isDisabled={isDisabled}
 classNames={classNames}
 size={size}
 description={description}
 />
 );
}
