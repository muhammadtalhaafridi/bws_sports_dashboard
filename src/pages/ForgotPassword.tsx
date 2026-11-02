import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { z } from "zod";
import { AuthCard } from "../components/AuthCard";
import { FieldError } from "../components/ui";
import { api, getErrorMessage } from "../lib/api";
import { emailField } from "../lib/schemas";

const schema = z.object({ email: emailField });
type FormValues = z.infer<typeof schema>;

export function ForgotPassword() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) =>
      (await api.post<{ message: string; devResetLink?: string }>("/auth/forgot-password", { ...values, from: "dashboard" }))
        .data,
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (mutation.isSuccess) {
    return (
      <AuthCard title="Check your email" subtitle={mutation.data.message}>
        {mutation.data.devResetLink && (
          <p className="dev-note">
            Development mode (no email server set up): <a href={mutation.data.devResetLink}>open your reset link</a>
          </p>
        )}
        <Link to="/login" className="btn btn-primary btn-block">
          Back to login
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Forgot password" subtitle="We will email you a reset link">
      <form className="form" onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate>
        <label className="field">
          <span>Email</span>
          <input className="input" type="email" {...register("email")} />
          <FieldError message={errors.email?.message} />
        </label>
        <button className="btn btn-primary btn-block" disabled={mutation.isPending}>
          {mutation.isPending ? "Sending..." : "Send reset link"}
        </button>
        <Link to="/login" className="center small">
          Back to login
        </Link>
      </form>
    </AuthCard>
  );
}
