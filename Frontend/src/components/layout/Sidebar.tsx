import { NavLink, Link } from "react-router-dom";
import { LayoutDashboard, Boxes, Layers, Package } from "lucide-react";
import { useCurrentUser } from "../../features/auth/hooks/useCurrentUser";
import styles from "./Sidebar.module.css";

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const navItems: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/products", label: "Products", icon: Boxes },
  { to: "/categories", label: "Categories", icon: Layers },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, isAdmin } = useCurrentUser();

  // Get user initials for avatar
  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  return (
    <>
      {/* Mobile background backdrop */}
      {isOpen && (
        <div
          className={styles.backdrop}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`}
        aria-label="Main Navigation"
      >
        {/* Brand header */}
        <Link to="/" className={styles.brand} onClick={onClose}>
          <Package className={styles.brandIcon} size={24} />
          <span>Inventory Hub</span>
        </Link>

        {/* Navigation links */}
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={onClose}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.navItemActive : ""}`
                }
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User profile card */}
        <div className={styles.userCard}>
          <div className={styles.userAvatar} aria-hidden="true">
            {initials}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName} title={user?.fullName}>
              {user?.fullName || "User"}
            </span>
            <span
              className={`${styles.userRole} ${
                isAdmin ? styles.roleAdmin : styles.roleStaff
              }`}
            >
              {user?.role}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}

