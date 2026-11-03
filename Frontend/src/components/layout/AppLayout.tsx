import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import styles from "./AppLayout.module.css";

/**
 * Main application shell wrapping all authenticated views.
 * Controls the responsive sidebar drawer on smaller viewports.
 */
export function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className={styles.layout}>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className={styles.mainWrapper}>
        <Header onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />
        <main className={styles.mainContent}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

