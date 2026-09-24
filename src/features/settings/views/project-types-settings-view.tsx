"use client";

import {
  Building2,
  CheckCircle2,
  FolderKanban,
  Landmark,
  Layers,
  Plus,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { useProjectRegistryStore } from "@/features/project-registry/stores/project-registry-store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";

import { useProjectTypeStore } from "../stores/project-type-store";

import styles from "./project-types-settings.module.css";

export function ProjectTypesSettingsView() {
  const projects = useProjectRegistryStore((state) => state.projects);
  const types = useProjectTypeStore((s) => s.types);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const deferredSearch = useDeferredValue(search);

  const projectCountByType = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const project of projects) {
      counts[project.projectType] = (counts[project.projectType] ?? 0) + 1;
    }
    return counts;
  }, [projects]);

  const departments = useMemo(
    () => [...new Set(types.map((t) => t.department))].sort(),
    [types],
  );

  const filtered = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    return types.filter((type) => {
      if (department !== "all" && type.department !== department) return false;
      if (query && !`${type.name} ${type.description} ${type.department}`.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [deferredSearch, department, types]);

  const activeCount = types.filter((t) => t.active).length;
  const totalProjects = Object.values(projectCountByType).reduce((sum, c) => sum + c, 0);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div>
            <p className={styles.eyebrow}>Configuration</p>
            <h1>Project Types</h1>
            <p>Manage the classification categories used across the project registry and reports.</p>
          </div>
          <Link href="/settings/project-types/new" className={styles.addButton}>
            <Plus size={16} /> Add Type
          </Link>
        </div>
      </section>

      <div className={styles.body}>
        <section className={styles.summaryGrid}>
          <article>
            <span className={styles.summaryIcon}>
              <Layers size={18} />
            </span>
            <div>
              <span>Total types</span>
              <strong>{types.length}</strong>
              <small>classification categories</small>
            </div>
          </article>
          <article>
            <span className={styles.summaryIcon}>
              <CheckCircle2 size={18} />
            </span>
            <div>
              <span>Active</span>
              <strong>{activeCount}</strong>
              <small>available for new proposals</small>
            </div>
          </article>
          <article>
            <span className={styles.summaryIcon}>
              <FolderKanban size={18} />
            </span>
            <div>
              <span>Total projects</span>
              <strong>{totalProjects}</strong>
              <small>using these types</small>
            </div>
          </article>
          <article>
            <span className={styles.summaryIcon}>
              <Building2 size={18} />
            </span>
            <div>
              <span>Departments</span>
              <strong>{departments.length}</strong>
              <small>implementing offices</small>
            </div>
          </article>
        </section>

        <section className={styles.filterCard}>
          <div className={styles.filterRow}>
            <label className={styles.searchBox}>
              <Search size={15} />
              <input
                aria-label="Search project types"
                placeholder="Search type name, description, or department"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className={styles.compactSelect} aria-label="Department">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        {filtered.length > 0 ? (
          <div className={styles.typeGrid}>
            {filtered.map((type) => {
              const Icon = type.icon;
              const count = projectCountByType[type.name] ?? 0;
              return (
                <Link key={type.id} href={`/settings/project-types/${type.id}`} className={styles.typeCard} style={{ textDecoration: "none" }}>
                  <span
                    className={styles.typeIconWrap}
                    style={{ color: type.color, background: `${type.color}14` }}
                  >
                    <Icon size={22} />
                  </span>
                  <div className={styles.typeContent}>
                    <div className={styles.typeHeader}>
                      <h3 className={styles.typeName}>{type.name}</h3>
                      <span className={`${styles.statusBadge} ${type.active ? styles.statusActive : styles.statusInactive}`}>
                        {type.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className={styles.typeDescription}>{type.description}</p>
                    <div className={styles.typeMeta}>
                      <span className={styles.metaChip}>
                        <FolderKanban size={10} /> {count} project{count !== 1 ? "s" : ""}
                      </span>
                      <span className={styles.metaChip}>
                        <Building2 size={10} /> {type.department}
                      </span>
                    </div>
                    <div className={styles.fundTags}>
                      {type.eligibleFunds.map((fund) => (
                        <span key={fund} className={styles.fundTag}>
                          <Landmark size={8} /> {fund}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <section className={styles.emptyState}>
            <Layers size={34} />
            <h2>No project types found</h2>
            <p>Adjust the search or department filter to see results.</p>
          </section>
        )}
      </div>

    </div>
  );
}
