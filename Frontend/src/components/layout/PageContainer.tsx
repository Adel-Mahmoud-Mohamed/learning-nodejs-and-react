import { type ReactNode } from "react";
import styles from "./PageContainer.module.css";

export interface PageContainerProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

/**
 * Standardized page container providing consistent margins, typography header,
 * actions slot, and responsive spacing.
 */
export function PageContainer({
  title,
  description,
  actions,
  children,
}: PageContainerProps) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>{title}</h1>
          {description && <p className={styles.description}>{description}</p>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>

      <div className={styles.content}>{children}</div>
    </div>
  );
}

