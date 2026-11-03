import { useParams, Link } from "react-router-dom";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { ArrowLeft } from "lucide-react";

export function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <PageContainer
      title={`Product #${id}`}
      description="Detailed inventory and specification information."
      actions={
        <Link to="/products">
          <Button variant="secondary" size="md">
            <ArrowLeft size={16} />
            <span>Back to Products</span>
          </Button>
        </Link>
      }
    >
      <div
        style={{
          backgroundColor: "var(--color-bg-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-8)",
          color: "var(--color-text-secondary)",
        }}
      >
        <p>Product details view for ID: {id}. Full data hook integration in Milestone 4.</p>
      </div>
    </PageContainer>
  );
}

