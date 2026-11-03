import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { loginSchema, type LoginFormValues } from "../schemas/auth.schema";
import { useAuth } from "../hooks/useAuth";
import { ApiError } from "../../../lib/api-error";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import styles from "./AuthForm.module.css";

export function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);

  // If the user tried to access a protected page before logging in, redirect back there
  const fromLocation = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      await login(values);
      navigate(fromLocation, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.isUnauthorized()) {
          setServerError("Invalid email or password.");
        } else if (err.isRateLimited()) {
          setServerError("Too many login attempts. Please wait a minute and try again.");
        } else {
          setServerError(err.message || "Login failed. Please try again.");
        }
      } else {
        setServerError("An unexpected error occurred. Please check your connection.");
      }
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h1 className={styles.title}>Welcome Back</h1>
        <p className={styles.subtitle}>
          Sign in to your Inventory Management account
        </p>
      </div>

      {serverError && (
        <div className={styles.alertError} role="alert">
          <AlertCircle size={18} />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
        <Input
          label="Email Address"
          type="email"
          placeholder="admin@inventory.local"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          style={{ width: "100%", marginTop: "var(--space-2)" }}
        >
          Sign In
        </Button>
      </form>

      <div className={styles.footer}>
        <span>Don&apos;t have an account?</span>
        <Link to="/register" className={styles.footerLink}>
          Register as Staff
        </Link>
      </div>
    </div>
  );
}

