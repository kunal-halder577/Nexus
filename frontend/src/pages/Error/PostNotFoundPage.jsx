import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileX, Compass } from "lucide-react";

export default function PostNotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[70vh] w-full flex-col items-center justify-center px-6 text-center">

      {/* Icon badge */}
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
        <FileX className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
      </div>

      {/* Title */}
      <h1 className="mb-2 text-xl font-semibold tracking-tight text-foreground">
        Post not found
      </h1>

      {/* Description */}
      <p className="mb-8 max-w-xs text-sm leading-relaxed text-muted-foreground">
        This post may have been deleted or the link might be incorrect.
      </p>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          onClick={() => navigate(-1)}
          variant="outline"
          className="gap-2 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </Button>
        <Button
          onClick={() => navigate("/")}
          className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500 cursor-pointer"
        >
          <Compass className="h-4 w-4" />
          Back to Feed
        </Button>
      </div>

    </div>
  );
}
