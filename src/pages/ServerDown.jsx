import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function ServerDown() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-4">
          <img 
            src="https://cdn.dribbble.com/users/77121/screenshots/2083086/404.gif"
            alt="Caveman 404"
            className="mx-auto max-w-md w-full rounded-lg"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <h1 className="text-4xl font-bold text-foreground">Oops!</h1>
          <p className="text-xl text-muted-foreground">
            Looks like our server went on a prehistoric vacation.
          </p>
          <p className="text-lg text-muted-foreground">
            Please try again later.
          </p>
        </div>
        
        <div className="flex gap-4 justify-center">
          <Button 
            onClick={() => window.location.reload()}
            size="lg"
            className="gap-2"
          >
            <RefreshCw className="h-5 w-5" />
            Try Again
          </Button>
          <Button 
            onClick={() => navigate("/")}
            variant="outline"
            size="lg"
          >
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}
