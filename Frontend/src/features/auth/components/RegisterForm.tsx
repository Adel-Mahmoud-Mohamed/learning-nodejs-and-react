import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { registerSchema, type RegisterFormValues } from "../schemas/auth.schema";
import { useAuth } from "../hooks/useAuth";
import { ApiError } from "../../../lib/api-error";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import styles from "./AuthForm.module.css";

export function RegisterForm() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    setSuccessMessage(null);

    try {
      await registerUser({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
      });

      setSuccessMessage("Account created successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.isConflict()) {
          setServerError("An account with this email address already exists.");
        } else if (err.isValidation()) {
          setServerError("Please verify the provided information meets the requirements.");
        } else {
          setServerError(err.message || "Registration failed. Please try again.");
        }
      } else {
        setServerError("Unable to reach the server. Please check your connection.");
      }
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h1 className={styles.title}>Create Account</h1>
        <p className={styles.subtitle}>
          Register as a staff member to view inventory
        </p>
      </div>

      {serverError && (
        <div className={styles.alertError} role="alert">
          <AlertCircle size={18} />
          <span>{serverError}</span>
        </div>
      )}

      {successMessage && (
        <div className={styles.alertSuccess} role="status">
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
        <Input
          label="Full Name"
          type="text"
          placeholder="Jane Doe"
          autoComplete="name"
          error={errors.fullName?.message}
          {...register("fullName")}
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="jane@inventory.local"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />

        <Input
          label="Password"
          type="password"
          placeholder="Minimum 8 characters"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="Repeat your password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          style={{ width: "100%", marginTop: "var(--space-2)" }}
        >
          Create Account
        </Button>
      </form>

      <div className={styles.footer}>
        <span>Already have an account?</span>
        <Link to="/login" className={styles.footerLink}>
          Sign in
        </Link>
      </div>
    </div>
  );
}

