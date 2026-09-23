"use client";

import {
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  Landmark,
  LogOut,
  MapPin,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  ShieldCheck,
  SunMedium,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { type JurisdictionScope, useShellStore } from "@/stores/shell-store";

import styles from "./app-shell.module.css";
import { getNavigationLabel, NAVIGATION_SECTIONS } from "./navigation";

const FISCAL_YEARS = ["2026", "2025", "2024"];

const JURISDICTIONS: Array<{ value: JurisdictionScope; label: string }> = [
  { value: "municipal", label: "Municipality-wide" },
  { value: "all-barangays", label: "All barangays" },
  { value: "poblacion", label: "Poblacion" },
  { value: "gadgaron", label: "Gadgaron" },
  { value: "sinalmacan", label: "Sinalmacan" },
];

function Sidebar() {
  const pathname = usePathname();
  const [openModules, setOpenModules] = useState<Set<string>>(() => {
    const activeModule = NAVIGATION_SECTIONS.flatMap((section) => section.items).find((item) =>
      item.children?.some((child) => child.href === pathname),
    );
    return activeModule ? new Set([activeModule.label]) : new Set();
  });
  const collapsed = useShellStore((state) => state.sidebarCollapsed);
  const mobileOpen = useShellStore((state) => state.mobileSidebarOpen);
  const toggleSidebar = useShellStore((state) => state.toggleSidebar);
  const setMobileOpen = useShellStore((state) => state.setMobileSidebarOpen);

  return (
    <>
      <button
        className={`${styles.scrim} ${mobileOpen ? styles.scrimVisible : ""}`}
        type="button"
        aria-label="Close navigation"
        onClick={() => setMobileOpen(false)}
      />
      <aside
        className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""} ${mobileOpen ? styles.sidebarMobileOpen : ""}`}
        aria-label="Main navigation"
      >
        <div className={styles.brandRow}>
          <Link className={styles.brand} href="/" aria-label="Matnog project management home">
            <span className={styles.brandMark} aria-hidden="true">
              <SunMedium size={20} strokeWidth={2.2} />
            </span>
            <span className={styles.brandCopy}>
              <strong>MATNOG</strong>
              <small>Project Management</small>
            </span>
          </Link>
          <button
            className={styles.mobileClose}
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          >
            <X size={19} />
          </button>
        </div>

        <div className={styles.municipalityCard}>
          <span className={styles.municipalityIcon} aria-hidden="true">
            <Landmark size={17} />
          </span>
          <span className={styles.municipalityCopy}>
            <small>Local government unit</small>
            <strong>Matnog, Sorsogon</strong>
          </span>
          <ShieldCheck className={styles.verifiedIcon} size={15} aria-label="Verified workspace" />
        </div>

        <nav className={styles.navigation}>
          {NAVIGATION_SECTIONS.map((section) => (
            <section className={styles.navSection} key={section.label}>
              <h2>{section.label}</h2>
              <div className={styles.navItems}>
                {section.items.map((item) => {
                  const active = pathname === item.href;
                  const childActive = item.children?.some((child) => child.href === pathname) ?? false;
                  const expanded = openModules.has(item.label);
                  const Icon = item.icon;

                  if (item.children?.length) {
                    return (
                      <div className={styles.navModule} key={item.label}>
                        <button
                          className={`${styles.navParent} ${childActive ? styles.navParentActive : ""} ${item.emphasis === "alert" ? styles.navParentAlert : ""}`}
                          type="button"
                          title={collapsed ? item.label : undefined}
                          aria-expanded={expanded}
                          onClick={() => {
                            if (collapsed) toggleSidebar();
                            setOpenModules((current) => {
                              const next = new Set(current);
                              if (next.has(item.label)) next.delete(item.label);
                              else next.add(item.label);
                              return next;
                            });
                          }}
                        >
                          <Icon size={18} strokeWidth={1.9} aria-hidden="true" />
                          <span>{item.label}</span>
                          {item.emphasis === "alert" ? <i className={styles.alertDot} aria-hidden="true" /> : null}
                          <ChevronRight className={styles.moduleChevron} size={14} aria-hidden="true" />
                        </button>
                        {expanded ? (
                          <div className={styles.navChildren}>
                            {item.children.map((child) => {
                              const current = pathname === child.href;
                              return (
                                <Link
                                  className={current ? styles.navChildActive : ""}
                                  href={child.href}
                                  key={child.href}
                                  aria-current={current ? "page" : undefined}
                                  onClick={() => setMobileOpen(false)}
                                >
                                  {child.label}
                                </Link>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    );
                  }

                  return (
                    <Link
                      className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
                      href={item.href ?? "/"}
                      key={item.label}
                      title={collapsed ? item.label : undefined}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setMobileOpen(false)}
                    >
                      <Icon size={18} strokeWidth={1.9} aria-hidden="true" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <button
            className={styles.collapseButton}
            type="button"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={toggleSidebar}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            <span>Collapse sidebar</span>
          </button>
          <p>Municipality of Matnog · 2026</p>
        </div>
      </aside>
    </>
  );
}

function TopNavigation() {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const setMobileOpen = useShellStore((state) => state.setMobileSidebarOpen);
  const fiscalYear = useShellStore((state) => state.fiscalYear);
  const setFiscalYear = useShellStore((state) => state.setFiscalYear);
  const jurisdiction = useShellStore((state) => state.jurisdiction);
  const setJurisdiction = useShellStore((state) => state.setJurisdiction);

  useEffect(() => {
    function closeProfile(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setProfileOpen(false);
    }

    document.addEventListener("mousedown", closeProfile);
    return () => document.removeEventListener("mousedown", closeProfile);
  }, []);

  return (
    <header className={styles.topbar}>
      <div className={styles.titleGroup}>
        <button
          className={styles.mobileMenu}
          type="button"
          aria-label="Open navigation"
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={20} />
        </button>
        <div>
          <span>Project workspace</span>
          <h1>{getNavigationLabel(pathname)}</h1>
        </div>
      </div>

      <label className={styles.searchBox}>
        <Search size={17} aria-hidden="true" />
        <span className={styles.srOnly}>Search projects</span>
        <input type="search" placeholder="Search projects, contractors, barangays…" />
        <kbd>⌘ K</kbd>
      </label>

      <div className={styles.topbarActions}>
        <label className={styles.compactSelect}>
          <CalendarDays size={16} aria-hidden="true" />
          <span className={styles.srOnly}>Fiscal year</span>
          <select value={fiscalYear} onChange={(event) => setFiscalYear(event.target.value)}>
            {FISCAL_YEARS.map((year) => (
              <option key={year} value={year}>
                FY {year}
              </option>
            ))}
          </select>
          <ChevronDown size={14} aria-hidden="true" />
        </label>

        <label className={`${styles.compactSelect} ${styles.jurisdictionSelect}`}>
          <MapPin size={16} aria-hidden="true" />
          <span className={styles.srOnly}>Jurisdiction scope</span>
          <select value={jurisdiction} onChange={(event) => setJurisdiction(event.target.value as JurisdictionScope)}>
            {JURISDICTIONS.map((scope) => (
              <option key={scope.value} value={scope.value}>
                {scope.label}
              </option>
            ))}
          </select>
          <ChevronDown size={14} aria-hidden="true" />
        </label>

        <button className={styles.iconButton} type="button" aria-label="Notifications">
          <Bell size={18} />
          <span className={styles.notificationDot} aria-hidden="true" />
        </button>

        <div className={styles.profile} ref={profileRef}>
          <button
            className={styles.profileTrigger}
            type="button"
            aria-label="Open account menu"
            aria-haspopup="menu"
            aria-expanded={profileOpen}
            onClick={() => setProfileOpen((open) => !open)}
          >
            <span className={styles.avatar} aria-hidden="true">
              <UserRound size={17} />
            </span>
            <span className={styles.profileCopy}>
              <strong>Engr. Mara D. Reyes</strong>
              <small>Municipal Engineer</small>
            </span>
            <ChevronDown size={14} aria-hidden="true" />
          </button>

          {profileOpen ? (
            <div className={styles.profileMenu} role="menu">
              <div className={styles.profileMenuHeader}>
                <span className={styles.avatar} aria-hidden="true">
                  <UserRound size={17} />
                </span>
                <div>
                  <strong>Engr. Mara D. Reyes</strong>
                  <small>Municipal Engineering Office</small>
                </div>
              </div>
              <div className={styles.menuDivider} />
              <button type="button" role="menuitem">
                <CircleUserRound size={16} /> Profile
              </button>
              <button type="button" role="menuitem">
                <Settings size={16} /> Workspace settings
              </button>
              <div className={styles.menuDivider} />
              <button type="button" role="menuitem">
                <LogOut size={16} /> Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const collapsed = useShellStore((state) => state.sidebarCollapsed);
  const mobileOpen = useShellStore((state) => state.mobileSidebarOpen);
  const setMobileOpen = useShellStore((state) => state.setMobileSidebarOpen);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [setMobileOpen]);

  return (
    <div
      className={`${styles.shell} ${collapsed ? styles.shellCollapsed : ""} ${mobileOpen ? styles.shellLocked : ""}`}
    >
      <Sidebar />
      <div className={styles.mainColumn}>
        <TopNavigation />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
