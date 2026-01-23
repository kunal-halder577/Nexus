"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FcGoogle } from "react-icons/fc";
import { Eye, EyeOff, Loader2 } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useGetMeQuery, useRegisterMutation } from "@/features/auth/api/authApi.js";
import useAuthStore from "@/stores/auth.store.js";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Loader from "@/components/Loader";

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
      navigate('/onboarding', { replace: true });
      console.log("API Response:", response.data);
    } catch (err) {
      console.error("Registration Error:", err);
    }
  };

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
        <Button
          variant="outline"
          className="w-full cursor-pointer"
          type="button"
        >
          <FcGoogle className="mr-2 h-5 w-5" />
          Continue with Google
        </Button>
        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
};

const RegisterPage = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const {isError, isLoading} = useGetMeQuery(undefined, {
    skip: !isAuthenticated
  });
  
  if(!isAuthenticated || isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Register />
      </div>
    )
  }
  if(isLoading) {
    return <Loader />
  }
  return <Navigate to={'/'} />
}
export default RegisterPage;