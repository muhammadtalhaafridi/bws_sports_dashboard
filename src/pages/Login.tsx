import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { AuthCard } from "../components/AuthCard";
import { PasswordInput } from "../components/PasswordInput";
import { FieldError } from "../components/ui";
import { useAuth } from "../hooks/useAuth";
import { api, getErrorMessage } from "../lib/api";
import { safeRedirect } from "../lib/redirect";
import { emailField } from "../lib/schemas";
import type { AuthResponse } from "../lib/types";

const schema = z.object({ email: emailField, password: z.string().min(1, "Password is required") });
type FormValues = z.infer<typeof schema>;

export function Login() {
  const { login, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = safeRedirect(params.get("redirect"));

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => (await api.post<AuthResponse>("/auth/login", values)).data,
    onSuccess: ({ token, user }) => {
      if (user.role !== "ADMIN") {
        toast.error("This account does not have admin access");
        return;
      }
      login(token, user);
      toast.success(`Welcome, ${user.name.split(" ")[0]}`);
      navigate(redirect, { replace: true });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Login failed")),
  });

  if (isLoggedIn) return <Navigate to={redirect} replace />;

  return (
    <AuthCard title="Login" subtitle="Sign in to manage the shop">
      <form className="form" onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate>
        <label className="field">
          <span>Email</span>
          <input className="input" type="email" autoComplete="email" placeholder="admin@bwssports.com" {...register("email")} />
          <FieldError message={errors.email?.message} />
        </label>
        <label className="field">
          <span>Password</span>
          <PasswordInput autoComplete="current-password" {...register("password")} />
          <FieldError message={errors.password?.message} />
        </label>
        <button className="btn btn-primary btn-block" disabled={mutation.isPending}>
          {mutation.isPending ? "Signing in..." : "Login"}
        </button>
        <Link to="/forgot-password" className="center small">
          Forgot password?
        </Link>
      </form>
    </AuthCard>
  );
}
