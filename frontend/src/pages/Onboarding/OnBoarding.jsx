import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Laptop, Loader2} from 'lucide-react';
import { z } from 'zod';
import { useUiStore } from '@/stores/ui.store.js'; 
import Loader from '@/components/Loader.jsx';

// --- SHADCN COMPONENTS ---
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import WelcomeStep from './Welcome';
import AvatarStep from './AvatarSetup';
import InterestsStep from './InterestSetup';
import { useOnboardingMutation } from '@/features/user/api/userApi';
import { Navigate, useBlocker, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/features/auth/authSlice';
import { useGetMeQuery } from '@/features/auth/api/authApi';

// --- ZOD SCHEMAS ---
const step2Schema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters").max(30, "Name is too long"),
  avatarUrl: z.any().optional(), // Modify based on your actual file handling
});

const step3Schema = z.object({
  interests: z.array(z.string()).min(3, "Please select at least 3 interests"),
});

function Onboarding() {
  const { setTheme } = useUiStore();
  const [ onboarding, { isLoading, isSuccess, data } ] = useOnboardingMutation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [errors, setErrors] = useState({}); // Store validation errors
  
  const [formData, setFormData] = useState({
    displayName: '',
    avatarUrl: null,
    avatarFile: null,
    interests: [],
  });

  useBlocker(
    ({ currentLocation, nextLocation }) => (
      isLoading && currentLocation.pathname !== nextLocation.pathname
    )
  );
  useEffect(() => {
    const isOnboarded = data?.data?.isOnboarded;
    if(isSuccess && isOnboarded) {      
      navigate('/', { replace: true });
    }
  }, [isSuccess, navigate]);

  // --- SMOOTH THEME TOGGLE (View Transition) ---
  const handleThemeChange = (newTheme) => {
    if (!document.startViewTransition) {
      setTheme(newTheme);
      return;
    }
    document.startViewTransition(() => {
      setTheme(newTheme);
    });
  };

  const updateData = (k, v) => {
    setFormData((p) => ({ ...p, [k]: v }));
    // Clear error for this field when user types
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: null }));
  };

  // --- NAVIGATION WITH VALIDATION ---
  const validateStep = (currentStep) => {
    try {
      if (currentStep === 2) step2Schema.parse(formData);
      if (currentStep === 3) step3Schema.parse(formData);
      setErrors({}); // Clear errors if valid
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = {};
        error.errors.forEach((err) => {
          // Map Zod path to our state keys
          const path = err.path[0];
          fieldErrors[path] = err.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setDirection(1);
      setStep((p) => p + 1);
    }
  };

  const prevStep = () => { setDirection(-1); setStep((p) => p - 1); };
  
  const handleSkip = () => { 
    if(step === 3) handleFinalSubmit(); 
    else {
      setDirection(1);
      setStep((p) => p + 1);
    }
  };

  const handleFinalSubmit = async () => {
    const payload = new FormData();

    // 1. Append Text Data
    payload.append('name', formData.displayName);
    
    // Future if i add interests fields in backend.
    // payload.append('interests', JSON.stringify(formData.interests));

    // 2. Handle Avatar Strategy
    if (formData.avatarFile) {
      // CASE A: User Uploaded a Photo -> Send Binary
      payload.append('avatar', formData.avatarFile); 
      payload.append('avatarType', 'file');
    } else if (formData.avatarUrl) {
      // CASE B: User Generated an Avatar -> Send URL String
      payload.append('avatar', formData.avatarUrl); 
      payload.append('avatarType', 'url');
    }

    // 3. Send to Backend
    try {
      const response = await onboarding(payload).unwrap();
      console.log(response);
    } catch (error) {
      console.error(error);
    }
  };

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
    center: { x: 0, opacity: 1, transition: { duration: 0.3, type: "spring", bounce: 0.2 } },
    exit: (dir) => ({ x: dir > 0 ? -50 : 50, opacity: 0, transition: { duration: 0.2 } }),
  };

  return (
    // Removed "transition-colors duration-500" to fix lag
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* --- THE UI LOCK OVERLAY --- */}
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/60 backdrop-blur-md"
          >
            <div className="flex flex-col items-center gap-4 bg-background/80 p-8 rounded-3xl border border-white/10 shadow-2xl">
              <Loader2 className="h-10 w-10 animate-spin text-foreground" />
              <h3 className="text-xl font-['Outfit'] font-medium text-foreground tracking-tight">
                Entering Nexus...
              </h3>
              <p className="text-sm font-['Outfit'] text-muted-foreground">
                Personalizing your feed
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- TOP BAR --- */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-20">
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <motion.div 
              key={i} 
              initial={false}
              animate={{
                width: step >= i ? 32 : 8,
                backgroundColor: step >= i ? "hsl(var(--primary))" : "hsl(var(--muted))"
              }}
              className="h-1.5 rounded-full"
            />
          ))}
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full backdrop-blur-sm bg-background/50">
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleThemeChange("light")}>
              <Sun className="mr-2 h-4 w-4" /> Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleThemeChange("dark")}>
              <Moon className="mr-2 h-4 w-4" /> Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleThemeChange("system")}>
              <Laptop className="mr-2 h-4 w-4" /> System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* --- CONTENT --- */}
      <div className="w-full max-w-lg z-10">
        <AnimatePresence mode='wait' custom={direction}>
          
          {step === 1 && (
            <motion.div key="step1" custom={direction} variants={variants} initial="enter" animate="center" exit="exit">
              <WelcomeStep onNext={nextStep} />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" custom={direction} variants={variants} initial="enter" animate="center" exit="exit">
              <AvatarStep 
                data={formData} 
                updateData={updateData} 
                errors={errors} // Pass errors down
                onNext={nextStep} 
                onBack={prevStep}
                onSkip={handleSkip}
              />
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" custom={direction} variants={variants} initial="enter" animate="center" exit="exit">
              <InterestsStep 
                data={formData} 
                updateData={updateData} 
                errors={errors} // Pass errors down
                onSubmit={handleFinalSubmit}
                isLoading={isLoading}
                onBack={prevStep}
                onSkip={handleSkip}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <div className="absolute top-[-10%] left-[-10%] w-125 h-125 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-125 h-125 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
    </div>
  );
};
export default function OnboardingContainer() {
  const user = useSelector(selectCurrentUser);
  const { isLoading } = useGetMeQuery();

  if(isLoading) {
    return <Loader />
  }
  if(user?.isOnboarded) {
    return <Navigate to={'/'} replace/>
  }
  return <Onboarding />
}