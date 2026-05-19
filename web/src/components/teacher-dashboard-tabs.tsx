"use client";

import {
  ArrowUpDown,
  ExternalLink,
  Link2,
  Layers3,
  Map,
  UsersRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import { useState } from "react";

import {
  getTeacherDashboardHref,
  teacherDashboardLinks,
  teacherDashboardTabs,
  type TeacherDashboardTabId,
} from "@/lib/teacher-dashboard";

const tabIcons = {
  seguimiento: Layers3,
  mapa: Map,
  grupos: UsersRound,
  estructura: ArrowUpDown,
  enlaces: Link2,
} satisfies Record<TeacherDashboardTabId, ComponentType<{ className?: string }>>;

export function TeacherDashboardTabs({
  groupsPanel,
  mapPanel,
  progressPanel,
  structurePanel,
  initialTab = "seguimiento",
}: {
  groupsPanel: ReactNode;
  mapPanel: ReactNode;
  progressPanel: ReactNode;
  structurePanel: ReactNode;
  initialTab?: TeacherDashboardTabId;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TeacherDashboardTabId>(initialTab);
  const activeTabMeta = teacherDashboardTabs.find((tab) => tab.id === activeTab);
  const activePanel =
    activeTab === "seguimiento"
      ? progressPanel
      : activeTab === "mapa"
        ? mapPanel
        : activeTab === "grupos"
          ? groupsPanel
          : activeTab === "estructura"
            ? structurePanel
            : <TeacherLinksPanel />;

  function selectTab(tab: TeacherDashboardTabId) {
    setActiveTab(tab);
    router.replace(getTeacherDashboardHref(tab), { scroll: false });
  }

  return (
    <section className="grid gap-4">
      <div
        className="surface-card grid gap-2 p-2 sm:grid-cols-2 xl:grid-cols-5"
        role="tablist"
        aria-label="Panel de profesor"
      >
        {teacherDashboardTabs.map((tab) => {
          const Icon = tabIcons[tab.id];
          const selected = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`teacher-tab-${tab.id}`}
              id={`teacher-tab-button-${tab.id}`}
              onClick={() => selectTab(tab.id)}
              className={`flex min-h-16 items-center gap-3 rounded-[28px] px-4 text-left transition ${
                selected
                  ? "bg-white text-[var(--color-midnight-ink)]"
                  : "text-[var(--color-graphite)] hover:bg-[var(--color-canvas-white)]"
              }`}
            >
              <span
                className={`grid size-10 shrink-0 place-items-center rounded-full ${
                  selected
                    ? "bg-[var(--color-midnight-ink)] text-white"
                    : "bg-white text-[var(--color-steel-gray)]"
                }`}
              >
                <Icon className="size-5" />
              </span>
              <span className="grid gap-0.5">
                <span className="font-semibold">{tab.label}</span>
                <span className="hidden text-xs leading-5 text-[var(--color-steel-gray)] md:block">
                  {tab.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div
        id={`teacher-tab-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`teacher-tab-button-${activeTab}`}
        className="grid gap-4"
      >
        {activeTabMeta ? (
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">{activeTabMeta.label}</p>
              <h2 className="mt-1 text-2xl font-semibold text-[var(--color-midnight-ink)]">
                {activeTabMeta.description}
              </h2>
            </div>
          </div>
        ) : null}

        <div key={activeTab} className="contents">
          {activePanel}
        </div>
      </div>
    </section>
  );
}

function TeacherLinksPanel() {
  return (
    <section className="grid gap-3 sm:grid-cols-2">
      {teacherDashboardLinks.map((link) => (
        <a
          key={link.href}
          href={link.href}
          target="_blank"
          rel="noreferrer"
          className="subtle-card group flex min-h-36 flex-col justify-between gap-5 p-5 transition hover:bg-white"
        >
          <span className="flex items-start justify-between gap-4">
            <span>
              <span className="text-lg font-semibold text-[var(--color-midnight-ink)]">
                {link.label}
              </span>
              <span className="mt-2 block text-sm leading-6 text-[var(--color-graphite)]">
                {link.description}
              </span>
            </span>
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-[var(--color-steel-gray)] transition group-hover:text-[var(--color-midnight-ink)]">
              <ExternalLink className="size-5" />
            </span>
          </span>
          <span className="truncate text-xs text-[var(--color-steel-gray)]">
            {link.href}
          </span>
        </a>
      ))}
    </section>
  );
}
