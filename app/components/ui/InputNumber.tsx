"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { forwardRef, useCallback, useEffect, useState } from "react";
import { NumericFormat, NumericFormatProps } from "react-number-format";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { cn } from "@/app/lib/utils";

export interface InputNumberProps
  extends Omit<NumericFormatProps, "value" | "onValueChange"> {
  stepper?: number;
  thousandSeparator?: string;
  placeholder?: string;
  defaultValue?: number;
  min?: number;
  max?: number;
  value?: number; // Controlled value
  suffix?: string;
  prefix?: string;
  onValueChange?: (value: number | undefined) => void;
  fixedDecimalScale?: boolean;
  decimalScale?: number;
  hasStepper?: boolean;
  error?: Record<string, string[]> | null;
}

export const InputNumber = forwardRef<HTMLInputElement, InputNumberProps>(
  (
    {
      stepper,
      thousandSeparator,
      placeholder,
      defaultValue,
      min = -Infinity,
      max = Infinity,
      onValueChange,
      fixedDecimalScale = false,
      decimalScale = 0,
      suffix,
      prefix,
      value: controlledValue,
      error,
      hasStepper = true,
      ...props
    },
    ref
  ) => {
    const [errorMessage, setErrorMessage] = useState<string | undefined>();

    const [value, setValue] = useState<number | undefined>(
      controlledValue ?? defaultValue
    );

    const handleIncrement = useCallback(() => {
      setValue((prev) =>
        prev === undefined ? stepper ?? 1 : Math.min(prev + (stepper ?? 1), max)
      );
    }, [stepper, max]);

    const handleDecrement = useCallback(() => {
      setValue((prev) =>
        prev === undefined
          ? -(stepper ?? 1)
          : Math.max(prev - (stepper ?? 1), min)
      );
    }, [stepper, min]);

    useEffect(() => {
      setErrorMessage(error?.[props.name as string]?.[0]);
    }, [error]);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (!ref) return;
        if (
          document.activeElement ===
          (ref as React.RefObject<HTMLInputElement>).current
        ) {
          if (e.key === "ArrowUp") {
            handleIncrement();
          } else if (e.key === "ArrowDown") {
            handleDecrement();
          }
        }
      };

      window.addEventListener("keydown", handleKeyDown);

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }, [handleIncrement, handleDecrement, ref]);

    useEffect(() => {
      if (controlledValue !== undefined) {
        setValue(controlledValue);
      }
    }, [controlledValue]);

    const handleChange = (values: {
      value: string;
      floatValue: number | undefined;
    }) => {
      const newValue =
        values.floatValue === undefined ? undefined : values.floatValue;
      setValue(newValue);
      setErrorMessage(undefined);
      if (onValueChange) {
        onValueChange(newValue);
      }
    };

    const handleBlur = () => {
      if (value !== undefined) {
        if (value < min) {
          setValue(min);
          (ref as React.RefObject<HTMLInputElement>).current!.value =
            String(min);
        } else if (value > max) {
          setValue(max);
          (ref as React.RefObject<HTMLInputElement>).current!.value =
            String(max);
        }
      }
    };

    return (
      <>
        <div className="flex items-center">
          <NumericFormat
            value={value}
            onValueChange={handleChange}
            thousandSeparator={thousandSeparator}
            decimalScale={decimalScale}
            fixedDecimalScale={fixedDecimalScale}
            allowNegative={min < 0}
            valueIsNumericString
            onBlur={handleBlur}
            max={max}
            min={min}
            suffix={suffix}
            prefix={prefix}
            customInput={Input}
            placeholder={placeholder}
            className={cn(
              // REMOVED "relative" class from the one below so that it will not be visible on overflow sticky table headers
              "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
              { "rounded-r-none": hasStepper },
              { "border-red-500": !!errorMessage }
            )}
            getInputRef={ref}
            {...props}
          />
          {hasStepper ? (
            <div className="flex flex-col">
              <Button
                aria-label="Increase value"
                className="px-2 h-1 rounded-l-none rounded-br-none border-input border-l-0 border-b-[0.5px] focus-visible:relative"
                variant="outline"
                onClick={handleIncrement}
                disabled={value === max}
                type="button"
              >
                <ChevronUp size={15} />
              </Button>
              <Button
                aria-label="Decrease value"
                className="px-2 h-1 rounded-l-none rounded-tr-none border-input border-l-0 border-t-[0.5px] focus-visible:relative"
                variant="outline"
                onClick={handleDecrement}
                type="button"
                disabled={value === min}
              >
                <ChevronDown size={15} />
              </Button>
            </div>
          ) : null}
        </div>
        {errorMessage ? (
          <span className="text-red-500 -mt-1 text-xs">{errorMessage}</span>
        ) : null}
      </>
    );
  }
);
