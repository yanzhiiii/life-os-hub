import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4 text-center border-none shadow-xl">
        <CardContent className="pt-12 pb-12">
          <div className="mb-6 flex justify-center">
            <div className="p-4 bg-red-100 rounded-full">
              <AlertCircle className="h-12 w-12 text-red-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 font-display">404 Page Not Found</h1>
          <p className="text-gray-500 mb-8 max-w-xs mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link href="/">
            <Button className="w-full max-w-xs rounded-xl h-11">
              Return Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
