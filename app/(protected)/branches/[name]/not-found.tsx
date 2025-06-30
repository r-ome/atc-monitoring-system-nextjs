import {
  Card,
  CardTitle,
  CardDescription,
  CardHeader,
} from "@/app/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex w-screen h-screen justify-center items-center overflow-hidden">
      <Card className="w-2/6">
        <CardHeader>
          <CardTitle>Page not found :(</CardTitle>
          <CardDescription>Branch doesn't exist</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
