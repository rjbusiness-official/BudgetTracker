"use client";

import { useState } from "react";
import type { InputHTMLAttributes } from "react";
import { useAmountPrivacy } from "@/src/context/AmountPrivacyContext";
import { maskAmount } from "@/src/utils/amountPrivacy";

export default function AmountInput(props: InputHTMLAttributes<HTMLInputElement>) {
  if (props.type !== "number") return <input {...props} />;
  return <MonetaryInput {...props} />;
}

function MonetaryInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const { hidden } = useAmountPrivacy();
  const [localValue, setLocalValue] = useState(props.defaultValue ?? "");
  const value = props.value ?? localValue;
  if (hidden) return <>
    <input {...props} type="text" name={undefined} value={value === "" ? "" : maskAmount(Number(value))} defaultValue={undefined} readOnly onChange={undefined} placeholder="Amounts hidden" title="Show amounts from Financial Summary to edit this field." />
    {props.name && <input type="hidden" name={props.name} value={value} />}
  </>;
  return <input {...props} value={props.value} defaultValue={props.defaultValue} onChange={event => { setLocalValue(event.target.value); props.onChange?.(event); }} />;
}
