import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { FcGoogle } from "react-icons/fc";
import { z } from "zod"
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { useGetMeQuery, useLoginMutation } from "@/features/auth/api/authApi";
import useAuthStore from "@/stores/auth.store";
import Loader from "@/components/Loader.jsx";

const dataSchema = z.object({
  identifier: z.string().min(1, "Username or Email is required").trim(),
  password: z.string().min(1, "Password is required"),
});

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [login, { error }] = useLoginMutation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setAuth = useAuthStore((s) => s.setAuth);
  const logout = useAuthStore((s) => s.logout);
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
      setAuth(response.data.accessToken);
      navigate('/');
      console.log("API Response:", response.data);
    } catch (err) {
      logout();
      console.error("Login:", err);
    }
  };

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
        <Button
          variant="outline"
          className="w-full cursor-pointer"
          type="button"
        >
          <FcGoogle className="mr-2 h-5 w-5" />
          Continue with Google
        </Button>
        <div className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-primary font-medium hover:underline">
            Sign up
          </Link>
        </div>
      </CardFooter>

    </Card>
  )
}
const LoginPage = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const {isError, isLoading} = useGetMeQuery(undefined, {
    skip: !isAuthenticated
  });

  if(!isAuthenticated || isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Login />
      </div>
    )
  }
  if(isLoading) {
    return <Loader />
  }
  return <Navigate to={'/'} />
}
export default LoginPage;