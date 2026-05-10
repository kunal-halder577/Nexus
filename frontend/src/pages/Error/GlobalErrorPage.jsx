import { useRouteError, isRouteErrorResponse, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, ArrowLeft, Wifi } from "lucide-react";

export default function GlobalErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();

  const is404 = isRouteErrorResponse(error) && error.status === 404;
  const errorCode = isRouteErrorResponse(error) ? error.status : "500";
  const errorMessage =
    !isRouteErrorResponse(error) ? error?.message || "Something went wrong" : null;

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-background overflow-hidden">

      {/* Ambient background blobs — indigo tinted, theme aware */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-500/8" />
        <div className="absolute -bottom-32 -right-32 h-[28rem] w-[28rem] rounded-full bg-indigo-400/8 blur-3xl dark:bg-indigo-600/10" />
      </div>

      {/* Main card */}
      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col items-center px-6 py-16 text-center">

        {/* Icon badge */}
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
          {is404 ? (
            <Wifi className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
          ) : (
            <AlertTriangle className="h-7 w-7 text-indigo-500" strokeWidth={1.5} />
          )}
        </div>

        {/* Error code */}
        <p className="mb-1 text-[5rem] font-bold leading-none tracking-tighter text-indigo-600 dark:text-indigo-400">
          {errorCode}
        </p>

        {/* Title */}
        <h1 className="mb-3 text-xl font-semibold tracking-tight text-foreground">
          {is404 ? "Page not found" : "Something went wrong"}
        </h1>

        {/* Description */}
        <p className="mb-8 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {is404
            ? "This page doesn't exist or may have been moved. Check the URL or head back to your feed."
            : "An unexpected error occurred. Try refreshing — if it keeps happening, we're likely already on it."}
        </p>

        {/* Dev error box */}
        {errorMessage && (
          <div className="mb-8 w-full rounded-lg border border-border bg-muted/50 px-4 py-3 text-left">
            <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-widest text-indigo-500">
              Error details
            </p>
            <p className="break-words text-xs text-muted-foreground font-mono">
              {errorMessage}
            </p>
          </div>
        )}

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

        {/* Brand footer */}
        <p className="mt-12 text-xs text-muted-foreground/40 tracking-widest uppercase">
          Nexus
        </p>

      </div>
    </div>
  );
}
