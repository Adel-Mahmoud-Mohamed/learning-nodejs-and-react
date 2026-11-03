import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { loginSchema, registerSchema } from "../schemas/auth.schema";
import { useAuth } from "../hooks/useAuth";

describe("Auth Validation Schemas", () => {
  it("rejects login if email is not valid or empty", () => {
    const invalidEmail = loginSchema.safeParse({ email: "not-an-email", password: "Password123!" });
    expect(invalidEmail.success).toBe(false);

    const emptyPassword = loginSchema.safeParse({ email: "user@test.com", password: "" });
    expect(emptyPassword.success).toBe(false);

    const validLogin = loginSchema.safeParse({ email: "user@test.com", password: "Password123!" });
    expect(validLogin.success).toBe(true);
  });

  it("enforces password minimum length and confirmation match in register schema", () => {
    // Password too short (< 8 chars)
    const shortPassword = registerSchema.safeParse({
      fullName: "Adel Mahmoud",
      email: "adel@test.com",
      password: "short",
      confirmPassword: "short",
    });
    expect(shortPassword.success).toBe(false);

    // Mismatched passwords
    const mismatched = registerSchema.safeParse({
      fullName: "Adel Mahmoud",
      email: "adel@test.com",
      password: "StrongPassword123!",
      confirmPassword: "DifferentPassword123!",
    });
    expect(mismatched.success).toBe(false);
    if (!mismatched.success) {
      expect(mismatched.error.issues[0]?.message).toBe("Passwords do not match");
    }

    // Valid registration
    const valid = registerSchema.safeParse({
      fullName: "Adel Mahmoud",
      email: "adel@test.com",
      password: "StrongPassword123!",
      confirmPassword: "StrongPassword123!",
    });
    expect(valid.success).toBe(true);
  });
});

describe("useAuth hook guard", () => {
  it("throws error when used outside of AuthProvider", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    function TestComponent() {
      useAuth();
      return <div>Test</div>;
    }

    expect(() => render(<TestComponent />)).toThrow(
      "useAuth must be used within an <AuthProvider>."
    );

    consoleErrorSpy.mockRestore();
  });
});
