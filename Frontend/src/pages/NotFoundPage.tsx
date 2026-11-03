import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";

export function NotFoundPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--space-4)",
        textAlign: "center",
        padding: "var(--space-4)",
      }}
    >
      <h1 style={{ fontSize: "4rem", color: "var(--color-primary)" }}>404</h1>
      <h2>Page Not Found</h2>
      <p style={{ maxWidth: "400px" }}>
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to="/">
        <Button variant="primary">Return to Dashboard</Button>
      </Link>
    </div>
  );
}

