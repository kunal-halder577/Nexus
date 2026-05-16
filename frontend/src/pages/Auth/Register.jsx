"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button.jsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input.jsx";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator.jsx";
import { useRegisterMutation, useGoogleLoginMutation } from "@/features/auth/api/authApi.js";
import { useGoogleLogin } from '@react-oauth/google';
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

// Schema definition (Zod works the same in JS and TS)
const dataSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "One uppercase letter is required.")
    .regex(/[a-z]/, "One lowercase letter is required.")
    .regex(/[0-9]/, "One number is required.")
    .regex(/[^a-zA-Z0-9]/, "One special character is required."),
  confirmPassword: z
    .string()
    .min(1, "Confirm password is required")
}).superRefine((data, ctx) => {
  if(data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Passwords do not match",
      path: ["confirmPassword"],
    })
  }
});

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [register] = useRegisterMutation();
  const [googleLogin] = useGoogleLoginMutation();
  const navigate = useNavigate();

  // Initialize Form
  const form = useForm({
    resolver: zodResolver(dataSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  const { isSubmitting } = form.formState;

  const onSubmit = async (data) => {
    try {
      const response = await register(data).unwrap();
      toast.success('User registered successfully.');
      navigate('/onboarding', { replace: true });
      console.log("API Response:", response.data);
    } catch (err) {
      toast.error('Registration failed.');
      console.error("Registration Error:", err);
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const response = await googleLogin({ access_token: tokenResponse.access_token }).unwrap();
        toast.success('User registered successfully.');
        const isOnboarded = response.data?.isOnboarded;
        if (!isOnboarded) {
          navigate('/onboarding', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } catch (err) {
        toast.error(err.data?.message || err.message || 'Google registration failed.');
        console.error("Google Registration Error:", err);
      }
    },
    onError: () => toast.error('Google registration failed.'),
  });
  
  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader>
        <CardTitle>Register</CardTitle>
        <CardDescription>Create your account to get started.</CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* Username Field */}
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input 
                      autoComplete="username"
                      placeholder="johndoe123" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className={'min-h-5'}/>
                </FormItem>
              )}
            />

            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete='email'
                      placeholder="john@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className={'min-h-5'}/>
                </FormItem>
              )}
            />

            {/* Password Field with Toggle */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="********"
                        autoComplete="new-password"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent cursor-pointer"
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="sr-only">
                          {showPassword ? "Hide password" : "Show password"}
                        </span>
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage className={'min-h-5'}/>
                </FormItem>
              )}
            />

            {/* ConfirmPassword Field */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="********"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent cursor-pointer"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="sr-only">
                          {showConfirmPassword ? 
                            "Hide confirm password" : "Show confirm password"
                          }
                        </span>
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage className={'min-h-5'}/>
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full cursor-pointer" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Register"
              )}
            </Button>

            <div className="relative my-2">
              <Separator />
              <span className="absolute left-1/2 -translate-x-1/2 -top-2 bg-background px-2 text-xs text-muted-foreground">
                OR
              </span>
            </div>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
        <div className="w-full flex justify-center">
          <Button 
            type="button" 
            variant="outline" 
            className="w-full flex items-center justify-center gap-2 cursor-pointer h-10" 
            onClick={() => loginWithGoogle()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
            </svg>
            Continue with Google
          </Button>
        </div>
        <div className="text-center text-sm text-muted-foreground mt-2">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
};

export default Register;