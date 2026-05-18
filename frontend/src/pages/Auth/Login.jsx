import { Button } from "@/components/ui/button.jsx";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input.jsx";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { 
  Form,
  FormField, 
  FormMessage, 
  FormItem, 
  FormLabel,
  FormControl
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod"
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator.jsx";
import { useGetMeQuery, useLoginMutation, useGoogleLoginMutation } from "@/features/auth/api/authApi.js";
import { useGoogleLogin } from '@react-oauth/google';
import useAuthStore from "@/stores/auth.store.js";
import Loader from "@/components/Loader.jsx";
import { toast } from "sonner";

const dataSchema = z.object({
  identifier: z.string().min(1, "Username or Email is required").trim(),
  password: z.string().min(1, "Password is required"),
});

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [login] = useLoginMutation();
  const [googleLogin] = useGoogleLoginMutation();
  
  const navigate = useNavigate();

  const form = useForm({
    resolver: zodResolver(dataSchema),
    defaultValues: {
      identifier: "",
      password: ""
    }
  });
  const { isSubmitting } = form.formState;

  const onSubmit = async (data) => {
    const dataBody = {
      username: data.identifier,
      email: data.identifier,
      password: data.password
    }
    try {
      const response = await login(dataBody).unwrap();
      const isOnboarded = response.data?.isOnboarded;
      toast.success(`Welcome back! ${response.data?.user?.name}`)
      if(!isOnboarded) {
        navigate('/onboarding', { replace: true })
      } else {
        navigate('/', { replace: true })
      }
      console.log("API Response:", response.data);
    } catch (err) {
      toast.error(err.message || 'Login failed.');
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const response = await googleLogin({ access_token: tokenResponse.access_token }).unwrap();
        const isOnboarded = response.data?.isOnboarded;
        toast.success(`Welcome! ${response.data?.user?.name || ''}`);
        if (!isOnboarded) {
          navigate('/onboarding', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } catch (err) {
        toast.error(err.data?.message || err.message || 'Google login failed.');
      }
    },
    onError: () => toast.error('Google login failed.'),
  });
  
  return (
    <Card className={"w-full max-w-sm mx-auto"}>
      <CardHeader>
        <CardTitle>
            Login
        </CardTitle>
        <CardDescription>
            Login to your Account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Username or Email */}
              <FormField
                control={form.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username or Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="username or email"
                        autoComplete="username"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="min-h-5" />
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
                          autoComplete="current-password"
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
              <Button
                type="submit"
                className="w-full cursor-pointer"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>

              {/* Optional: Forgot password */}
              <div className="text-sm text-center">
                <button
                  type="button"
                  className="text-muted-foreground 
                  cursor-pointer hover:underline"
                  onClick={() => alert("Go to forgot password page")}
                >
                  Forgot password?
                </button>
              </div>
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
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-primary font-medium hover:underline">
            Sign up
          </Link>
        </div>
      </CardFooter>

    </Card>
  )
}

export default Login;