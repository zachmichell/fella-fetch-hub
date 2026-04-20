import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  PawPrint,
  Users,
  ClipboardList,
  NotebookPen,
  Receipt,
  Users2,
  DoorClosed,
  Settings,
  LogOut,
  Wrench,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";
import Logo from "./Logo";
import { useAuth } from "@/hooks/useAuth";
import { useStaffUnreadCount } from "@/hooks/useConversations";

const sections = [
  {
    label: "Overview",
    items: [
      { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/schedule", icon: CalendarDays, label: "Schedule" },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/pets", icon: PawPrint, label: "Pets" },
      { to: "/owners", icon: Users, label: "Owners" },
      { to: "/services", icon: Wrench, label: "Services" },
      { to: "/reservations", icon: ClipboardList, label: "Reservations" },
      { to: "/care-logs", icon: NotebookPen, label: "Care Logs" },
      { to: "/messages", icon: MessageSquare, label: "Messages", badgeKey: "messages" as const },
      { to: "/incidents", icon: AlertTriangle, label: "Incidents" },
      { to: "/invoices", icon: Receipt, label: "Invoices" },
    ],
  },
  {
    label: "Facility",
    items: [
      { to: "/playgroups", icon: Users2, label: "Playgroups" },
      { to: "/kennel-runs", icon: DoorClosed, label: "Kennel Runs" },
    ],
  },
  {
    label: "Settings",
    items: [{ to: "/settings", icon: Settings, label: "Settings" }],
  },
];

export default function Sidebar({ orgName }: { orgName?: string | null }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const unreadMessages = useStaffUnreadCount();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const initials = `${profile?.first_name?.[0] ?? ""}${profile?.last_name?.[0] ?? ""}`.toUpperCase() || "??";
  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || profile?.email || "User";

  return (
    <aside className="flex h-screen w-[250px] flex-col bg-sidebar text-sidebar-foreground">
      <div className="px-5 pt-6 pb-4">
        <Logo className="text-sidebar-primary-foreground" />
        {orgName && (
          <div className="mt-1 pl-7 text-xs text-sidebar-foreground/70 truncate">{orgName}</div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {sections.map((section) => (
          <div key={section.label} className="mb-5">
            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-sidebar-foreground/50">
              {section.label}
            </div>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const badgeCount =
                  (item as { badgeKey?: string }).badgeKey === "messages" ? unreadMessages : 0;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === "/dashboard"}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${
                          isActive
                            ? "bg-sidebar-primary text-sidebar-primary-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {badgeCount > 0 && (
                        <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1.5 text-[10px] font-bold text-white">
                          {badgeCount > 99 ? "99+" : badgeCount}
                        </span>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border px-3 py-3">
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium text-sidebar-primary-foreground">{fullName}</div>
            <div className="truncate text-[11px] text-sidebar-foreground/60">{profile?.email}</div>
          </div>
          <button
            onClick={handleSignOut}
            className="rounded-md p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-primary-foreground transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
