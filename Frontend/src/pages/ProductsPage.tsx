import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { useCurrentUser } from "../features/auth/hooks/useCurrentUser";
import { Plus } from "lucide-react";

export function ProductsPage() {
  const { isAdmin } = useCurrentUser();

  return (
    <PageContainer
      title="Products"
      description="View, search, and manage products in the inventory."
      actions={
        isAdmin && (
          <Button variant="primary" size="md">
            <Plus size={16} />
            <span>Add Product</span>
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
        <p>Product catalog, search, filtering, and table will be integrated in Milestone 4.</p>
      </div>
    </PageContainer>
  );
}

