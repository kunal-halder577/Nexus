import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Code2, 
  Cpu, 
  Palette, 
  Rocket, 
  Bitcoin, 
  Gamepad2, 
  Headphones, 
  Zap, 
  Check,
  AlertCircle,
  Loader2
} from "lucide-react";

// Define topics with Icons for a premium feel
const TOPICS = [
  { id: 'Development', icon: Code2 },
  { id: 'AI', icon: Cpu },
  { id: 'Design', icon: Palette },
  { id: 'Startups', icon: Rocket },
  { id: 'Crypto', icon: Bitcoin },
  { id: 'Gaming', icon: Gamepad2 },
  { id: 'Music', icon: Headphones },
  { id: 'Productivity', icon: Zap },
];

const InterestsStep = ({ data, updateData, errors, onSubmit, onBack, onSkip, isLoading }) => {
  
  const toggleTopic = (topicId) => {
    const current = data.interests;
    const newData = current.includes(topicId) 
      ? current.filter(t => t !== topicId) 
      : [...current, topicId];
    updateData('interests', newData);
  };

  const selectedCount = data.interests.length;
  const isValid = selectedCount >= 3;

  return (
    <Card className="
        relative w-full overflow-hidden
        border border-white/10 bg-background/40
        shadow-2xl backdrop-blur-xl
        max-w-md mx-auto
    ">
      
      {/* Header */}
      <CardHeader className="flex flex-row items-start justify-between pb-4 pt-6 px-6">
        <div className="space-y-1">
          <CardTitle className="text-2xl font-['Outfit'] font-medium tracking-tight text-foreground">
            Curate Feed
          </CardTitle>
          <CardDescription className="text-sm font-['Outfit'] font-light text-muted-foreground/80 flex items-center gap-2">
            Select 3 topics
            {/* Dynamic Counter Pill */}
            <span className={`
              inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors duration-300
              ${isValid ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-muted-foreground'}
            `}>
              {selectedCount}/3
            </span>
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
      
      <CardContent className="px-6 pb-2 space-y-4">
        {/* The Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TOPICS.map((item) => {
            const isSelected = data.interests.includes(item.id);
            const Icon = item.icon;

            return (
              <motion.button
                key={item.id}
                onClick={() => toggleTopic(item.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  relative group flex flex-col items-center justify-center gap-3 
                  p-4 rounded-2xl border transition-all duration-300
                  aspect-square
                  ${isSelected 
                    ? 'border-foreground bg-foreground text-background shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]' 
                    : 'border-white/5 bg-white/5 text-muted-foreground hover:bg-white/10 hover:border-white/10'
                  }
                `}
              >
                {/* Icon */}
                <Icon 
                  strokeWidth={1.5} 
                  className={`w-6 h-6 transition-colors duration-300 ${isSelected ? 'text-background' : 'text-foreground/70'}`} 
                />
                
                {/* Label */}
                <span className="text-xs font-['Outfit'] font-medium tracking-wide">
                  {item.id}
                </span>

                {/* Checkmark (Absolute positioning for cleaner layout) */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div 
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute top-2 right-2 text-background"
                    >
                      <Check className="w-3 h-3" strokeWidth={3} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            )
          })}
        </div>
        
        {/* Error Message */}
        <div className="h-6 flex items-center justify-center">
          <AnimatePresence>
            {errors.interests && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -5 }}
                className="text-xs font-['Outfit'] text-red-400 flex items-center"
              >
                <AlertCircle className="w-3 h-3 mr-1.5" /> 
                {errors.interests}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between items-center px-6 pb-6 pt-0">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground hover:bg-transparent pl-0 font-['Outfit'] font-light"
        >
          Back
        </Button>
        <Button
            onClick={onSubmit}
            disabled={!isValid || isLoading}
            className="
                h-11 rounded-full px-8
                bg-foreground text-background
                hover:bg-foreground/90
                font-['Outfit'] font-medium
                shadow-lg shadow-foreground/5
                transition-all duration-300
                disabled:opacity-60 disabled:cursor-not-allowed
            "
        >
            {isLoading ? (
                <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Please wait...
                </span>
            ) : (
                <>
                {isValid ? "Enter Nexus" : `Select ${Math.max(0, 3 - selectedCount)} more`}
                </>
            )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default InterestsStep;