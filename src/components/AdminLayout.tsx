import {
  ExternalLink,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Package,
  ShoppingBag,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { MdSportsCricket } from "react-icons/md";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useStats } from "../api/stats/queries";
import { useAuth } from "../hooks/useAuth";
import { WEBSITE_URL } from "../lib/api";
import { imageUrl } from "../lib/format";

const nav = [
  { to: "/", label: "Overview", Icon: LayoutDashboard },
  { to: "/products", label: "Products", Icon: Package },
  { to: "/categories", label: "Categories", Icon: FolderTree },
  { to: "/orders", label: "Orders", Icon: ShoppingBag, badge: "pendingOrders" },
  { to: "/customers", label: "Customers", Icon: Users },
  { to: "/messages", label: "Messages", Icon: Mail, badge: "unreadMessages" },
] as const;

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  // Shares the cache with the Overview page; used for the sidebar counters.
  const { data: stats } = useStats({ refetchInterval: 60 * 1000 });

  const onLogout = () => {
    logout();
    toast.success("Logged out");
    navigate("/login");
  };

  return (
    <div className="admin-shell">
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-logo">
          <MdSportsCricket size={26} />
          <span>
            BWS <em>Admin</em>
          </span>
          <button className="icon-btn sidebar-close" onClick={() => setOpen(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>
        <nav className="sidebar-nav">
          {nav.map((item) => {
            const count = "badge" in item ? (stats?.totals[item.badge] ?? 0) : 0;
            return (
              <NavLink key={item.to} to={item.to} end={item.to === "/"}>
                <item.Icon size={18} />
                <span>{item.label}</span>
                {count > 0 && <span className="nav-badge">{count}</span>}
              </NavLink>
            );
          })}
        </nav>
        <div className="sidebar-foot">
          <a href={WEBSITE_URL} target="_blank" rel="noreferrer">
            <ExternalLink size={16} /> View website
          </a>
          <button onClick={onLogout}>
            <LogOut size={16} /> Log out
          </button>
        </div>
      </aside>
      {open && <div className="sidebar-backdrop" onClick={() => setOpen(false)} />}

      <div className="admin-main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>
          <div className="topbar-user">
            {user?.image ? (
              <img src={imageUrl(user.image)} alt="" className="avatar" />
            ) : (
              <span className="avatar avatar-letter">{user?.name.charAt(0).toUpperCase()}</span>
            )}
            <div>
              <strong>{user?.name}</strong>
              <small>{user?.email}</small>
            </div>
          </div>
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
