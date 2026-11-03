import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { useCurrentUser } from "../features/auth/hooks/useCurrentUser";
import { Plus } from "lucide-react";

export function CategoriesPage() {
  const { isAdmin } = useCurrentUser();

  return (
    <PageContainer
      title="Categories"
      description="Organize products into hierarchical categories."
      actions={
        isAdmin && (
          <Button variant="primary" size="md">
            <Plus size={16} />
            <span>Add Category</span>
          </Button>
        )
      }
    >
      <div
        style={{
          backgroundColor: "var(--color-bg-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-8)",
          textAlign: "center",
          color: "var(--color-text-secondary)",
        }}
      >
        <p>Categories management and creation form will be integrated in Milestone 5.</p>
      </div>
    </PageContainer>
  );
}

