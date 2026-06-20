import { ChevronLeft, ChevronRight, LayoutDashboard, LogOut, UserRound } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/uiStore";

const navSections: {
  label: string;
  items: { to: string; label: string; superAdminOnly?: boolean }[];
}[] = [
  {
    label: "Genel",
    items: [
      { to: "/dashboard", label: "Panel" },
      { to: "/hero-content", label: "Ana sayfa hero" },
      { to: "/president-message", label: "Başkanın mesajı" },
    ],
  },
  {
    label: "İçerik",
    items: [
      { to: "/news", label: "Haberler" },
      { to: "/announcements", label: "Duyurular" },
      { to: "/events", label: "Etkinlikler" },
      { to: "/reports", label: "Raporlar" },
      { to: "/projects", label: "Projeler" },
      { to: "/geo-indications", label: "Coğrafi işaretler" },
    ],
  },
  {
    label: "Piyasa",
    items: [
      { to: "/prices", label: "Fiyatlar" },
      { to: "/databank-sync", label: "DataBank senkron", superAdminOnly: true },
      { to: "/currency-rates", label: "Döviz kurları" },
    ],
  },
  {
    label: "Kurumsal",
    items: [
      { to: "/services", label: "Hizmetler" },
      { to: "/leadership", label: "Yönetim" },
      { to: "/corporate-content", label: "Kurumsal içerik" },
      { to: "/corporate-documents", label: "Kurumsal belgeler" },
      { to: "/contact-submissions", label: "İletişim mesajları" },
      { to: "/chat-logs", label: "Sohbet kayıtları", superAdminOnly: true },
      { to: "/newsletter-subscribers", label: "E-bülten aboneleri" },
      { to: "/legal-pages", label: "Yasal sayfalar" },
      { to: "/map-districts", label: "Bölgesel harita" },
      { to: "/stats", label: "İstatistikler" },
      { to: "/media", label: "Medya" },
    ],
  },
  {
    label: "Ayarlar",
    items: [
      { to: "/settings", label: "Hesap" },
      { to: "/settings/admins", label: "Yöneticiler", superAdminOnly: true },
      { to: "/settings/audit-log", label: "Denetim günlüğü", superAdminOnly: true },
    ],
  },
];

function NavItem({ to, label }: { to: string; label: string }) {
  const end = to === "/dashboard" || to === "/settings";
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "block rounded-md px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-zinc-900 text-white"
            : "text-zinc-700 hover:bg-zinc-100",
        )
      }
    >
      {label}
    </NavLink>
  );
}

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const collapsed = useSidebarStore((s) => s.collapsed);
  const toggleSidebar = useSidebarStore((s) => s.toggle);
  const isSuperAdmin = user?.role === "super_admin";

  const visibleSections = navSections
    .map((sec) => ({
      ...sec,
      items: sec.items.filter(
        (item) => !item.superAdminOnly || isSuperAdmin,
      ),
    }))
    .filter((sec) => sec.items.length > 0);

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-zinc-200 bg-white transition-[width] md:flex",
          collapsed ? "w-16" : "w-56",
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b border-zinc-200 px-3">
          <LayoutDashboard className="h-6 w-6 shrink-0 text-zinc-800" />
          {!collapsed && <span className="font-semibold text-zinc-900">ETB Admin</span>}
        </div>
        <nav className="flex-1 space-y-6 overflow-y-auto p-3">
          {visibleSections.map((sec) => (
            <div key={sec.label}>
              {!collapsed && (
                <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  {sec.label}
                </p>
              )}
              <div className="space-y-0.5">
                {sec.items.map((item) =>
                  collapsed ? (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === "/dashboard" || item.to === "/settings"}
                      title={item.label}
                      className={({ isActive }) =>
                        cn(
                          "flex h-9 items-center justify-center rounded-md text-xs font-medium",
                          isActive ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-100",
                        )
                      }
                    >
                      {item.label.slice(0, 1)}
                    </NavLink>
                  ) : (
                    <NavItem key={item.to} to={item.to} label={item.label} />
                  ),
                )}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-zinc-200 p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center"
            type="button"
            onClick={toggleSidebar}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-zinc-200 bg-white/90 px-4 backdrop-blur">
          <p className="truncate text-sm text-zinc-600 md:hidden">ETB Yönetim</p>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-sm text-zinc-600 sm:inline">{user?.name}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <UserRound className="h-4 w-4" />
                  Hesap
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  Ayarlar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    await logout();
                    navigate("/login", { replace: true });
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Çıkış
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
