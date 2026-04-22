import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  PawPrint,
  Users,
  ClipboardList,
  ClipboardCheck,
  NotebookPen,
  Receipt,
  Users2,
  DoorClosed,
  DoorOpen,
  Settings,
  LogOut,
  Wrench,
  AlertTriangle,
  MessageSquare,
  BarChart3,
  BedDouble,
  Scissors,
  UserCog,
  FileText,
  Sparkles,
  HeartPulse,
  KeyRound,
  Layers,
  CreditCard,
  Megaphone,
  Phone,
  ChevronLeft,
  ChevronRight,
  MapPin,
  ShoppingCart,
  FileClock,
  FileCheck,
  Package,
  Tag,
  Boxes,
  Database,
  GitMerge,
  ScrollText,
  GraduationCap,
} from "lucide-react";
import Logo from "./Logo";
import { useAuth } from "@/hooks/useAuth";
import { useStaffUnreadCount } from "@/hooks/useConversations";
import { usePermissions } from "@/hooks/usePermissions";
import type { Permission } from "@/lib/permissions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebarCollapsed } from "@/hooks/useSidebarCollapsed";

const sections: Array<{
  label: string;
  items: Array<{ to: string; icon: any; label: string; badgeKey?: "messages"; permission?: Permission }>;
}> = [
  {
    label: "Overview",
    items: [{ to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" }],
  },
  {
    label: "Operations",
    items: [
      { to: "/calendar", icon: CalendarDays, label: "Calendar" },
      { to: "/reservations", icon: ClipboardList, label: "Reservations" },
      { to: "/standing-reservations", icon: CalendarDays, label: "Standing Reservations" },
      { to: "/group-classes", icon: GraduationCap, label: "Group Classes" },
      { to: "/dashboard/check-in-out", icon: ClipboardCheck, label: "Check-in/out" },
      { to: "/lodging", icon: BedDouble, label: "Lodging" },
      { to: "/grooming", icon: Scissors, label: "Grooming" },
    ],
  },
  {
    label: "Point of Sale",
    items: [
      { to: "/pos/cart", icon: ShoppingCart, label: "Shopping Cart" },
      { to: "/pos/open-invoices", icon: FileClock, label: "Open Invoices" },
      { to: "/pos/closed-invoices", icon: FileCheck, label: "Closed Invoices" },
      { to: "/pos/products", icon: Boxes, label: "Retail Products" },
      { to: "/pos/packages", icon: Package, label: "Packages" },
      { to: "/pos/promotions", icon: Tag, label: "Promotions" },
    ],
  },
  {
    label: "Facility",
    items: [
      { to: "/pets", icon: PawPrint, label: "Pets" },
      { to: "/owners", icon: Users, label: "Owners" },
      { to: "/messages", icon: MessageSquare, label: "Messages", badgeKey: "messages" },
      { to: "/playgroups", icon: Users2, label: "Playgroups", permission: "playgroups.manage" },
      { to: "/kennel-runs", icon: DoorClosed, label: "Kennel Runs", permission: "kennels.manage" },
      { to: "/suite-management", icon: DoorOpen, label: "Suite Management" },
      { to: "/groomer-management", icon: UserCog, label: "Groomer Management" },
    ],
  },
  {
    label: "Pet Care",
    items: [
      { to: "/care-logs", icon: NotebookPen, label: "Care Logs" },
      { to: "/report-cards", icon: FileText, label: "Report Cards" },
      { to: "/traits", icon: Sparkles, label: "Traits" },
      { to: "/pet-care", icon: HeartPulse, label: "Pet Care" },
    ],
  },
  {
    label: "Insights",
    items: [
      { to: "/incidents", icon: AlertTriangle, label: "Incidents" },
      { to: "/dashboard/analytics", icon: BarChart3, label: "Analytics", permission: "analytics.view" },
    ],
  },
  {
    label: "Management",
    items: [
      { to: "/user-management", icon: Users, label: "User Management" },
      { to: "/staff-codes", icon: KeyRound, label: "Staff Codes" },
      { to: "/service-types", icon: Layers, label: "Service Types" },
    ],
  },
  {
    label: "Settings",
    items: [
      { to: "/services", icon: Wrench, label: "Services", permission: "services.manage" },
      { to: "/invoices", icon: Receipt, label: "Invoices", permission: "invoices.create" },
      { to: "/settings/locations", icon: MapPin, label: "Locations", permission: "settings.locations" },
      { to: "/settings/data-import", icon: Database, label: "Data Import", permission: "data.import" },
      { to: "/settings/data-merge", icon: GitMerge, label: "Merge Duplicates", permission: "data.merge" },
      { to: "/settings/audit-log", icon: ScrollText, label: "Audit Log", permission: "audit.view" },
      { to: "/subscriptions", icon: CreditCard, label: "Subscriptions" },
      { to: "/marketing", icon: Megaphone, label: "Marketing" },
      { to: "/sms-comms", icon: Phone, label: "SMS & Comms" },
      { to: "/settings", icon: Settings, label: "Settings", permission: "settings.view" },
    ],
  },
];

export default function Sidebar({ orgName }: { orgName?: string | null }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const unreadMessages = useStaffUnreadCount();
  const { can } = usePermissions();
  const { collapsed, toggle } = useSidebarCollapsed();

  const visibleSections = sections
    .map((s) => ({ ...s, items: s.items.filter((i) => !i.permission || can(i.permission)) }))
    .filter((s) => s.items.length > 0);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const initials = `${profile?.first_name?.[0] ?? ""}${profile?.last_name?.[0] ?? ""}`.toUpperCase() || "??";
  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || profile?.email || "User";

  const width = collapsed ? "w-[68px]" : "w-[250px]";

  return (
    <TooltipProvider delayDuration={150}>
      <aside className={`flex h-screen ${width} flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200`}>
        <div className={`flex items-center ${collapsed ? "justify-center px-0" : "justify-between px-5"} pt-6 pb-4`}>
          {!collapsed && (
            <div className="min-w-0">
              <Logo className="text-sidebar-primary-foreground" />
              {orgName && (
                <div className="mt-1 pl-7 text-xs text-sidebar-foreground/70 truncate">{orgName}</div>
              )}
            </div>
          )}
          <button
            onClick={toggle}
            className="rounded-md p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-primary-foreground transition-colors"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <nav className={`flex-1 overflow-y-auto overflow-x-hidden ${collapsed ? "px-2" : "px-3"} py-2`}>
          {visibleSections.map((section) => (
            <div key={section.label} className="mb-5">
              {!collapsed && (
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-sidebar-foreground/50">
                  {section.label}
                </div>
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const badgeCount =
                    (item as { badgeKey?: string }).badgeKey === "messages" ? unreadMessages : 0;
                  const link = (
                    <NavLink
                      to={item.to}
                      end={item.to === "/dashboard"}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-md ${
                          collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2"
                        } text-[13px] font-medium transition-colors ${
                          isActive
                            ? "bg-sidebar-primary text-sidebar-primary-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        }`
                      }
                    >
                      <span className="relative">
                        <item.icon className="h-4 w-4 shrink-0" />
                        {collapsed && badgeCount > 0 && (
                          <span className="absolute -right-2 -top-1.5 inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white">
                            {badgeCount > 9 ? "9+" : badgeCount}
                          </span>
                        )}
                      </span>
                      {!collapsed && <span className="flex-1">{item.label}</span>}
                      {!collapsed && badgeCount > 0 && (
                        <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-white">
                          {badgeCount > 99 ? "99+" : badgeCount}
                        </span>
                      )}
                    </NavLink>
                  );
                  return (
                    <li key={item.to}>
                      {collapsed ? (
                        <Tooltip>
                          <TooltipTrigger asChild>{link}</TooltipTrigger>
                          <TooltipContent side="right">{item.label}</TooltipContent>
                        </Tooltip>
                      ) : (
                        link
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-sidebar-border px-3 py-3">
          <div className={`flex items-center ${collapsed ? "flex-col gap-2" : "gap-3"} rounded-md px-2 py-2`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
              {initials}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium text-sidebar-primary-foreground">{fullName}</div>
                <div className="truncate text-[11px] text-sidebar-foreground/60">{profile?.email}</div>
              </div>
            )}
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleSignOut}
                    className="rounded-md p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-primary-foreground transition-colors"
                    aria-label="Sign out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Sign out</TooltipContent>
              </Tooltip>
            ) : (
              <button
                onClick={handleSignOut}
                className="rounded-md p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-primary-foreground transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
