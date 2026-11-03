import { Package } from "lucide-react";
import { LoginForm } from "../features/auth/components/LoginForm";
import styles from "./AuthLayout.module.css";

export function LoginPage() {
  return (
    <div className={styles.container}>
      <div className={styles.brandHeader}>
        <Package className={styles.brandIcon} size={28} />
        <span>Inventory Hub</span>
      </div>
      <LoginForm />
    </div>
  );
}

