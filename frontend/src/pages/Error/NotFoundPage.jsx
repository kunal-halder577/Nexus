import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.jsx";
import { Home, ArrowLeft, SearchX } from "lucide-react";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-background overflow-hidden">

      {/* Ambient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-500/8" />
        <div className="absolute -bottom-32 -left-32 h-[28rem] w-[28rem] rounded-full bg-indigo-400/8 blur-3xl dark:bg-indigo-600/10" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col items-center px-6 py-16 text-center">

        {/* Icon badge */}
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
          <SearchX className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
        </div>

        {/* Code */}
        <p className="mb-1 text-[5rem] font-bold leading-none tracking-tighter text-indigo-600 dark:text-indigo-400">
          404
        </p>

        {/* Title */}
        <h1 className="mb-3 text-xl font-semibold tracking-tight text-foreground">
          Page not found
        </h1>

        {/* Description */}
        <p className="mb-8 max-w-sm text-sm leading-relaxed text-muted-foreground">
          This page doesn't exist or may have been moved.
          Check the URL or head back to your feed.
        </p>

        {/* Divider with URL hint */}
        <div className="mb-8 w-full rounded-lg border border-border bg-muted/50 px-4 py-3">
          <p className="break-all font-mono text-xs text-muted-foreground">
            {window.location.pathname}
          </p>
        </div>

        {/* Actions */}
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={() => navigate("/")}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500 cursor-pointer"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="gap-2 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </div>

        {/* Brand */}
        <p className="mt-12 text-xs tracking-widest uppercase text-muted-foreground/40">
          Nexus
        </p>

      </div>
    </div>
  );
}
