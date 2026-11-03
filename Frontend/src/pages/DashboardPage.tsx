import { useAuth } from "../features/auth/hooks/useAuth";
import { Button } from "../components/ui/Button";

export function DashboardPage() {
  const { user, isAdmin, logout } = useAuth();

  return (
    <div style={{ maxWidth: "800px", margin: "40px auto", padding: "var(--space-6)" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "var(--space-6)",
          paddingBottom: "var(--space-4)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div>
          <h1>Inventory Dashboard</h1>
          <p style={{ marginTop: "var(--space-1)" }}>
            Welcome back, <strong>{user?.fullName}</strong>!
          </p>
        </div>
        <Button variant="secondary" onClick={logout}>
          Sign Out
        </Button>
      </div>

      <div
        style={{
          backgroundColor: "var(--color-bg-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-6)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-3)",
        }}
      >
        <h2>Your Profile</h2>
        <p><strong>Email:</strong> {user?.email}</p>
        <p>
          <strong>Role:</strong>{" "}
          <span
            style={{
              display: "inline-block",
              padding: "2px 8px",
              borderRadius: "var(--radius-sm)",
              fontSize: "var(--font-size-xs)",
              fontWeight: "var(--font-weight-semibold)",
              backgroundColor: isAdmin ? "var(--color-primary-light)" : "var(--color-bg-muted)",
              color: isAdmin ? "var(--color-primary)" : "var(--color-text-secondary)",
              textTransform: "uppercase",
            }}
          >
            {user?.role}
          </span>
        </p>
        <p style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-xs)" }}>
          Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "recently"}
        </p>
      </div>
    </div>
  );
}

