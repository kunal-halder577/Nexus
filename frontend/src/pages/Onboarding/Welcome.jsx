import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Aperture, ArrowRight } from "lucide-react";

const WelcomeStep = ({ onNext }) => (
  <Card className="border-none shadow-none bg-transparent text-center">
    <CardHeader className="flex flex-col items-center gap-8">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative group"
      >
        {/* Glow Effect */}
        <div className="absolute -inset-1 bg-linear-to-r from-cyan-500 to-blue-600 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
        
        {/* Glass Box */}
        <div className="relative w-24 h-24 bg-background/80 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl">
           
           {/* 2. The Aperture Animation (The Mechanism) */}
           <motion.div
             animate={{
               rotate: [-90, 90, 0],
               scale: [0, 1.2, 1] 
             }}
             transition={{ 
               duration: 1.5, 
               ease: "easeInOut", 
               times: [0, 0.6, 1],
               delay: 0.2 
             }}
           >
             <Aperture className="w-10 h-10 text-foreground/90" strokeWidth={1.5} />
           </motion.div>

        </div>
      </motion.div>

      {/* 2. Your Layout (Exact code provided + Tech Subtitle) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
       <h1 className="
          text-center text-4xl font-['Outfit'] font-extralight uppercase tracking-[0.5em] 
          text-foreground pl-[0.5em]
        ">
          Nexus
        </h1>
        
        {/* Technical Sub-line: Monospace font adds the 'developer/engineer' aesthetic */}
        <div className="flex items-center justify-center gap-3 mt-4 opacity-60">
          <div className="h-px w-6 bg-foreground/30"></div>
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
            Establish Digital Identity
          </p>
          <div className="h-px w-6 bg-foreground/30"></div>
        </div>
      </motion.div>

    </CardHeader>

    <CardContent className="pt-10">
      <Button
        onClick={onNext}
        className="group relative px-8 py-6 rounded-full bg-foreground text-background font-medium tracking-wide hover:bg-foreground/90 transition-all overflow-hidden"
      >
        <span className="relative z-10 flex items-center gap-2">
          Connect Identity 
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </span>
        
        {/* Subtle shine effect on hover */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-linear-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 ease-in-out" />
      </Button>
    </CardContent>
  </Card>
);

export default WelcomeStep;