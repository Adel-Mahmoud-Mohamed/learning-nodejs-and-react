import { Menu, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { useCurrentUser } from "../../features/auth/hooks/useCurrentUser";
import styles from "./Header.module.css";

export interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { logout } = useAuth();
  const { user } = useCurrentUser();

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <button
          type="button"
          onClick={onToggleSidebar}
          className={styles.menuButton}
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>
        <span className={styles.title}>Inventory Management System</span>
      </div>

      <div className={styles.rightSection}>
        <div className={styles.userBadge}>
          <UserIcon size={16} color="var(--color-text-secondary)" />
          <span>{user?.fullName}</span>
        </div>

        <button
          type="button"
          onClick={logout}
          className={styles.logoutButton}
          title="Sign out of your account"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
}

