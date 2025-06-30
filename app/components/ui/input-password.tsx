"use client";

import * as React from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { Input, type InputProps } from "@/app/components/ui/input";
import { cn } from "@/app/lib/utils";

const PasswordInput = React.forwardRef<
  HTMLInputElement,
  InputProps & { error?: Record<string, string[] | null> }
>(({ className, name, error, ...props }, ref) => {
  const errorMessage = error?.[name as string]?.[0];
  const [showPassword, setShowPassword] = React.useState(false);
  const disabled =
    props.value === "" || props.value === undefined || props.disabled;

  console.log(errorMessage);

  return (
    <div className="relative">
      <Input
        type={showPassword ? "text" : "password"}
        name={name}
        className={cn("hide-password-toggle pr-10", className)}
        ref={ref}
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
        onClick={() => setShowPassword((prev) => !prev)}
        disabled={disabled}
      >
        {showPassword && !disabled ? (
          <EyeIcon className="h-4 w-4" aria-hidden="true" />
        ) : (
          <EyeOffIcon className="h-4 w-4" aria-hidden="true" />
        )}
        <span className="sr-only">
          {showPassword ? "Hide password" : "Show password"}
        </span>
      </Button>
      <>
        {errorMessage ? (
          <span className="text-red-500 -mt-2 text-xs">{errorMessage}</span>
        ) : null}
      </>

      {/* hides browsers password toggles */}
      <style>{`
					.hide-password-toggle::-ms-reveal,
					.hide-password-toggle::-ms-clear {
						visibility: hidden;
						pointer-events: none;
						display: none;
					}
				`}</style>
    </div>
  );
});
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
