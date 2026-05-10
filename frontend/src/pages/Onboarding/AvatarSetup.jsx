import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";
import { X, User, Wand2, Check } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const AvatarStep = ({
  data,
  updateData,
  errors,
  onNext,
  onBack,
  onSkip,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const fileRef = useRef(null);

  const openFilePicker = () => fileRef.current?.click();

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Create Preview for UI
    const url = URL.createObjectURL(file);
    
    // 2. Update Store
    updateData("avatarUrl", url);  // Visuals
    updateData("avatarFile", file); // Actual Data to send
  };

  const removeAvatar = () => {
    updateData("avatarUrl", null);
    updateData("avatarFile", null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const generateAvatar = () => {
    const seed = Math.random().toString(36).substring(7);
    const generatedUrl = `https://api.dicebear.com/9.x/notionists/svg?seed=${seed}`;
    
    updateData("avatarUrl", generatedUrl);
    updateData("avatarFile", null); // Clear file because we are using a URL now
  };

  return (
    <Card
      className="
        relative w-full overflow-visible
        border border-white/10 bg-background/40
        shadow-2xl backdrop-blur-xl
        max-w-md mx-auto
      "
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />

      <CardHeader className="flex flex-row items-start justify-between pb-2 pt-6 px-6">
        <div className="space-y-1">
          <CardTitle className="text-2xl font-['Outfit'] font-medium tracking-tight text-foreground">
            Profile
          </CardTitle>
          <CardDescription className="text-sm font-['Outfit'] font-light text-muted-foreground/80">
            How should we address you?
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onSkip}
          className="h-8 -mr-2 text-xs font-['Outfit'] text-muted-foreground hover:text-foreground"
        >
          Skip
        </Button>
      </CardHeader>

      <CardContent className="space-y-6 px-6 pb-2">
        {/* --- CENTRAL AVATAR SECTION --- */}
        <div className="flex justify-center py-2">
          
          {/* PARENT WRAPPER: Handles positioning, but NOT hover logic */}
          <div className="relative">
            
            {/* 1. THE AVATAR (The 'group' is here, so only hovering THIS triggers the overlay) */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openFilePicker}
              className="
                group relative h-32 w-32 cursor-pointer rounded-full 
                border-2 border-dashed border-white/10 bg-white/5 
                flex items-center justify-center overflow-hidden
                transition-all duration-300
                hover:border-white/30 hover:bg-white/10 hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.1)]
                z-0
              "
            >
              {data.avatarUrl ? (
                <img
                  src={data.avatarUrl}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors">
                  <User className="h-10 w-10" strokeWidth={1} />
                </div>
              )}
              
              {/* Hover Overlay Text */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                 <span className="text-xs font-['Outfit'] tracking-widest uppercase text-white font-medium">
                   Upload
                 </span>
              </div>
            </motion.div>

            {/* 2. SATELLITE BUTTONS (Outside the 'group' div) */}
            {/* Since they are siblings to the avatar (not children), interacting with them won't trigger the avatar hover */}
            
            {/* Generate Button */}
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={generateAvatar}
                    className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-background shadow-lg text-foreground hover:bg-blue-500 hover:text-white hover:border-transparent transition-colors z-10"
                  >
                    <Wand2 className="h-4 w-4" />
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="right"><p>Generate Random</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>

             {/* Remove Button */}
            <AnimatePresence>
              {data.avatarUrl && (
                <motion.button
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  onClick={removeAvatar}
                  className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-red-500/20 bg-background text-muted-foreground hover:bg-red-500 hover:text-white transition-colors z-10 shadow-sm"
                >
                  <X className="h-3 w-3" />
                </motion.button>
              )}
            </AnimatePresence>

          </div>
        </div>

        {/* --- INPUT SECTION --- */}
        <div className="space-y-2 pt-2">
          <div className="relative">
            <Input
              value={data.displayName}
              onChange={(e) => updateData("displayName", e.target.value)}
              onFocus={() => setIsFocused(true)} // Track Focus
              onBlur={() => setIsFocused(false)} // Track Blur
              className="
                peer h-14 w-full border-0 bg-transparent px-0 pr-10
                text-xl font-['Outfit'] font-light text-foreground 
                placeholder:text-transparent 
                focus-visible:ring-0 focus-visible:border-transparent
                rounded-none
                z-10 relative
              "
              placeholder="" // CRITICAL: Leave empty so it doesn't conflict with custom label
            />

            {/* 1. Base Line (Inactive) */}
            <div className="absolute bottom-0 left-0 h-px w-full bg-white/10" />

            {/* 2. Active Line (Animated Expansion) */}
            <div className={`absolute bottom-0 left-0 h-[1.5px] w-full bg-foreground transition-transform duration-500 ease-out origin-left ${isFocused ? 'scale-x-100' : 'scale-x-0'}`} />

            {/* 3. Floating Label (Corrected Logic) */}
            <label
              className={`
                absolute left-0 pointer-events-none transition-all duration-300 ease-out
                ${(isFocused || data.displayName) 
                  ? "-top-3 text-xs text-foreground/80 font-medium tracking-wide" // Active State (Up)
                  : "top-4 text-base text-muted-foreground/50 font-light"           // Inactive State (Down)
                }
              `}
            >
              Display Name
            </label>

            {/* 4. Action Icons (Right Side - Fixed Spacing) */}
            <div className="absolute right-0 top-0 h-14 flex items-center pr-2 gap-2 z-20">
                <AnimatePresence initial={false}>
                    {data.displayName && (
                    <motion.button
                        key="clear"
                        type="button"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => updateData("displayName", "")}
                        className="p-1 rounded-full hover:bg-white/10 text-muted-foreground/40 hover:text-foreground transition-colors cursor-pointer"
                    >
                        <X className="h-4 w-4" />
                    </motion.button>
                    )}
                </AnimatePresence>

                <AnimatePresence initial={false}>
                    {data.displayName.length >= 2 && !errors.displayName && (
                    <motion.div
                        key="valid"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="text-emerald-500 p-1"
                    >
                        <Check className="h-4 w-4" />
                    </motion.div>
                    )}
                </AnimatePresence>
            </div>

          </div>

          {/* Error Message */}
          <AnimatePresence>
            {errors.displayName && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -5 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -5 }}
                className="flex items-center gap-1.5 text-xs font-['Outfit'] text-red-400/90 pt-1"
              >
                <AlertCircle className="h-3 w-3" />
                {errors.displayName}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between items-center px-6 pb-6 pt-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground hover:bg-transparent pl-0 font-['Outfit'] font-light"
        >
          Back
        </Button>
        <Button
          onClick={onNext}
          className="
            h-11 rounded-full px-8
            bg-foreground text-background
            hover:bg-foreground/90
            font-['Outfit'] font-medium
            shadow-lg shadow-foreground/5
          "
        >
          Continue
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AvatarStep;