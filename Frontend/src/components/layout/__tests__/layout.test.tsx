import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PageContainer } from "../PageContainer";
import { Header } from "../Header";
import { Sidebar } from "../Sidebar";
import { AuthContext } from "../../../context/AuthContext";
import type { AuthContextValue, User } from "../../../features/auth/types/auth.types";

const mockAdminUser: User = {
  userId: 1,
  fullName: "Adel Mahmoud",
  email: "admin@inventory.local",
  role: "admin",
  createdAt: "2026-01-01T00:00:00.000Z",
};

const createMockAuthContext = (overrides?: Partial<AuthContextValue>): AuthContextValue => ({
  user: mockAdminUser,
  token: "fake-jwt-token",
  isAuthenticated: true,
  isLoading: false,
  isAdmin: true,
  isStaff: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  ...overrides,
});

describe("Layout Components", () => {
  it("PageContainer renders title, description, actions slot and children", () => {
    render(
      <PageContainer
        title="Products"
        description="Manage product catalog"
        actions={<button>New Item</button>}
      >
        <div>Table content goes here</div>
      </PageContainer>
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Products");
    expect(screen.getByText("Manage product catalog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New Item" })).toBeInTheDocument();
    expect(screen.getByText("Table content goes here")).toBeInTheDocument();
  });

  it("Header displays logged-in user name and triggers logout on click", () => {
    const mockAuth = createMockAuthContext();
    const toggleSidebar = vi.fn();

    render(
      <AuthContext.Provider value={mockAuth}>
        <Header onToggleSidebar={toggleSidebar} />
      </AuthContext.Provider>
    );

    expect(screen.getByText("Adel Mahmoud")).toBeInTheDocument();

    const logoutBtn = screen.getByRole("button", { name: /sign out/i });
    fireEvent.click(logoutBtn);
    expect(mockAuth.logout).toHaveBeenCalledTimes(1);

    const menuBtn = screen.getByLabelText(/toggle navigation menu/i);
    fireEvent.click(menuBtn);
    expect(toggleSidebar).toHaveBeenCalledTimes(1);
  });

  it("Sidebar renders navigation items, user avatar initials, and role", () => {
    const mockAuth = createMockAuthContext();
    const onClose = vi.fn();

    render(
      <MemoryRouter initialEntries={["/"]}>
        <AuthContext.Provider value={mockAuth}>
          <Sidebar isOpen={true} onClose={onClose} />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    // Initial letters "AM" for "Adel Mahmoud"
    expect(screen.getByText("AM")).toBeInTheDocument();
    expect(screen.getByText("admin")).toBeInTheDocument();

    // Navigation links
    expect(screen.getByRole("link", { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /products/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /categories/i })).toBeInTheDocument();
  });
});

