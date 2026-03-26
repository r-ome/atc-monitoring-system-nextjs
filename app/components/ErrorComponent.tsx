import { AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/app/components/ui/alert";

interface ErrorComponent {
  error: { message: string; cause?: unknown };
}

export const ErrorComponent: React.FC<ErrorComponent> = ({ error }) => {
  return (
    <div className="h-screen flex items-center justify-center">
      <div className="w-full max-w-md">
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>{error.message}</AlertTitle>
          {typeof error.cause === "string" && (
            <AlertDescription>{error.cause}</AlertDescription>
          )}
        </Alert>
      </div>
    </div>
  );
};
