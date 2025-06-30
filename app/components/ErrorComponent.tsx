import { Card, CardHeader, CardTitle } from "@/app/components/ui/card";

interface ErrorComponent {
  error: { message: string; cause?: unknown };
}

export const ErrorComponent: React.FC<ErrorComponent> = ({ error }) => {
  return (
    <>
      <div className="h-screen flex items-center justify-center">
        <Card className="p-4 text-center w-2/6">
          <CardHeader>
            <CardTitle className="text-red-500">{error.message}</CardTitle>
            <p className="text-muted-foreground">
              {typeof error.cause === "string" ? error.cause : ""}
            </p>
          </CardHeader>
        </Card>
      </div>
    </>
  );
};
