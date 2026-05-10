export default function NexusMinimalLoader() {
  return (
    // 1. bg-background: Adapts to white (light) or dark gray/black (dark)
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      
      {/* Tip: In a production app, move this import to your layout.tsx or globals.css 
        to avoid flashing or reloading fonts.
      */}
      <div className="w-64 flex flex-col gap-6">
        {/* Typography Updates:
            - text-foreground: Automatically creates high contrast text (black in light mode, white in dark mode).
            - pl-[0.5em]: This is a "pro" design tip. Wide tracking adds space to the *right* of every letter. 
              To make it visually centered, we add equal padding to the *left*.
        */}
         <h1 className="
          text-center text-4xl font-['Outfit'] font-extralight uppercase tracking-[0.5em] 
          text-foreground pl-[0.5em]
        ">
          Nexus
        </h1>

        {/* The Elegant Line Track */}
        {/* bg-muted: Uses your shadcn 'muted' color (usually a subtle gray) for the track */}
        <div className="relative h-0.5 w-full overflow-hidden bg-muted">
          
          {/* The Moving Gradient:
             - via-blue-500: Keeps your brand color visible in both modes.
             - dark:via-blue-400: OPTIONAL - makes the blue slightly brighter in dark mode for better visibility.
          */}
          <div className="absolute inset-0 w-full bg-linear-to-r from-transparent via-blue-500 dark:via-blue-400 to-transparent animate-loading-bar opacity-80"></div>
        
        </div>
      </div>
    </div>
  );
}