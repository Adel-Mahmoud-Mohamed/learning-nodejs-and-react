import { Package } from "lucide-react";
import { RegisterForm } from "../features/auth/components/RegisterForm";
import styles from "./AuthLayout.module.css";

export function RegisterPage() {
  return (
    <div className={styles.container}>
      <div className={styles.brandHeader}>
        <Package className={styles.brandIcon} size={28} />
        <span>Inventory Hub</span>
      </div>
      <RegisterForm />
    </div>
  );
}

