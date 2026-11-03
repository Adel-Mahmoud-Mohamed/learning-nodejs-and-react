import { useCurrentUser } from "../features/auth/hooks/useCurrentUser";
import { PageContainer } from "../components/layout/PageContainer";
import { Boxes, Layers, ShieldCheck, UserCheck } from "lucide-react";

export function DashboardPage() {
  const { user, isAdmin } = useCurrentUser();

  return (
    <PageContainer
      title="Dashboard"
      description={`Welcome back, ${user?.fullName || "User"}. Here is an overview of your inventory system.`}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "var(--space-4)",
          marginBottom: "var(--space-6)",
        }}
      >
        <div
          style={{
            backgroundColor: "var(--color-bg-surface)",
            padding: "var(--space-5)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-4)",
          }}
        >
          <div
            style={{
              padding: "var(--space-3)",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--color-primary-light)",
              color: "var(--color-primary)",
            }}
          >
            <Boxes size={24} />
          </div>
          <div>
            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
              Catalog
            </div>
            <div style={{ fontSize: "var(--font-size-lg)", fontWeight: "var(--font-weight-semibold)" }}>
              Products
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "var(--color-bg-surface)",
            padding: "var(--space-5)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-4)",
          }}
        >
          <div
            style={{
              padding: "var(--space-3)",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--color-success-bg)",
              color: "var(--color-success)",
            }}
          >
            <Layers size={24} />
          </div>
          <div>
            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
              Taxonomy
            </div>
            <div style={{ fontSize: "var(--font-size-lg)", fontWeight: "var(--font-weight-semibold)" }}>
              Categories
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "var(--color-bg-surface)",
            padding: "var(--space-5)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-4)",
          }}
        >
          <div
            style={{
              padding: "var(--space-3)",
              borderRadius: "var(--radius-md)",
              backgroundColor: isAdmin ? "var(--color-primary-light)" : "var(--color-bg-muted)",
              color: isAdmin ? "var(--color-primary)" : "var(--color-text-secondary)",
            }}
          >
            {isAdmin ? <ShieldCheck size={24} /> : <UserCheck size={24} />}
          </div>
          <div>
            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
              Access Level
            </div>
            <div
              style={{
                fontSize: "var(--font-size-lg)",
                fontWeight: "var(--font-weight-semibold)",
                textTransform: "capitalize",
              }}
            >
              {user?.role}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          backgroundColor: "var(--color-bg-surface)",
          padding: "var(--space-6)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--color-border)",
        }}
      >
        <h2 style={{ fontSize: "var(--font-size-lg)", marginBottom: "var(--space-3)" }}>
          System Ready
        </h2>
        <p style={{ color: "var(--color-text-secondary)", lineHeight: "var(--line-height-relaxed)" }}>
          The application layout, sidebar navigation, and authentication state are all active.
          Use the navigation links in the sidebar to access Products and Categories.
        </p>
      </div>
    </PageContainer>
  );
}
