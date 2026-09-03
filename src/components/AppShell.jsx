import PropTypes from "prop-types";
import {
  Map,
  Eye,
  Zap,
  TrendingUp,
  Bandage,
  Settings as SettingsIcon,
  PenLine,
} from "lucide-react";
import SidebarNavItem from "./SidebarNavItem";
import BottomNavItem from "./BottomNavItem";
import { useAppStore } from "../store/useAppStore";
import logoDp from "../assets/logo-dp.png";

// `mobileLabel` kept short on purpose — 6 items across a ~360px screen
// have very little room. `label` is the full desktop version.
const NAV_ITEMS = [
  { key: "journey", label: "Journey Map", mobileLabel: "Map", icon: Map },
  { key: "awareness", label: "Awareness", mobileLabel: "Aware", icon: Eye },
  { key: "action", label: "Action", mobileLabel: "Action", icon: Zap },
  { key: "growth", label: "Growth", mobileLabel: "Growth", icon: TrendingUp },
  { key: "recovery", label: "Recovery", mobileLabel: "Recover", icon: Bandage },
];

export default function AppShell({ children }) {
  const currentView = useAppStore((s) => s.currentView);
  const setView = useAppStore((s) => s.setView);

  return (
    <div className="flex min-h-screen flex-col bg-navy-950 md:flex-row">
      {/*
        A single logo element, fixed to the true top-right corner of the
        viewport — same position on desktop and mobile, independent of the
        sidebar/header layout below it. Sized generously since it's no
        longer squeezed next to the "Compoundly" wordmark.
      */}
      <img
        src={logoDp}
        alt="BINUS University Faculty of Humanities — Digital Psychology"
        className="fixed right-3 top-3 z-30 h-10 w-auto md:right-4 md:top-4 md:h-14"
      />

      {/* --- Desktop sidebar (md and up) --- */}
      <nav className="hidden w-60 flex-shrink-0 flex-col gap-1 border-r border-subtle p-md md:flex">
        <div className="mb-lg px-md py-2 text-lg font-bold text-accent-primary">
          Compoundly
        </div>

        <SidebarNavItem
          icon={PenLine}
          label="Daily Reflection"
          active
          onClick={() => setView("growth")}
        />

        <div className="my-sm border-t border-subtle" />

        {NAV_ITEMS.map((item) => (
          <SidebarNavItem
            key={item.key}
            icon={item.icon}
            label={item.label}
            active={currentView === item.key}
            onClick={() => setView(item.key)}
          />
        ))}

        <div className="flex-1" />

        <SidebarNavItem
          icon={SettingsIcon}
          label="Settings"
          active={currentView === "settings"}
          onClick={() => setView("settings")}
        />
      </nav>

      {/* --- Mobile top bar (below md) --- */}
      {/* pr-16 reserves clear space on the right for the fixed logo below,
          so it never overlaps the Settings/Daily Reflection buttons. */}
      <header className="flex items-center justify-between border-b border-subtle p-md pr-16 md:hidden">
        <span className="text-lg font-bold text-accent-primary">
          Compoundly
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setView("growth")}
            aria-label="Daily Reflection"
            className="rounded-sm p-2 text-accent-primary hover:bg-white/5"
          >
            <PenLine size={20} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => setView("settings")}
            aria-label="Settings"
            className={`rounded-sm p-2 hover:bg-white/5 ${currentView === "settings" ? "text-accent-primary" : "text-text-secondary"}`}
          >
            <SettingsIcon size={20} strokeWidth={2} />
          </button>
        </div>
      </header>

      {/* --- Main content --- */}
      {/* Extra bottom padding on mobile so content never sits under the fixed tab bar */}
      <main className="flex-1 overflow-y-auto p-lg pb-24 md:p-3xl md:pb-3xl">
        {children}
      </main>

      {/* --- Mobile bottom tab bar (below md) --- */}
      <nav className="fixed inset-x-0 bottom-0 z-10 flex items-stretch border-t border-subtle bg-navy-950 pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV_ITEMS.map((item) => (
          <BottomNavItem
            key={item.key}
            icon={item.icon}
            label={item.mobileLabel}
            active={currentView === item.key}
            onClick={() => setView(item.key)}
          />
        ))}
      </nav>
    </div>
  );
}

AppShell.propTypes = {
  children: PropTypes.node,
};
