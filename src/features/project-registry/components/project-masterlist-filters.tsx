import { Columns3, Filter, Search, SlidersHorizontal, X } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";

import type { ProjectFilters } from "../types/project";
import styles from "../views/project-masterlist.module.css";
import type { ProjectTableColumn } from "./project-masterlist-table";

type Option = { value: string; label: string };

type FilterOptions = {
  pipelineStatuses: Option[];
  deliveryStages: Option[];
  fundingSources: Option[];
  departments: Option[];
  barangays: Option[];
  projectTypes: Option[];
  riskLevels: Option[];
};

const COLUMN_LABELS: Record<ProjectTableColumn, string> = {
  project: "Project",
  scope: "Scope",
  department: "Implementing office",
  fiscalYear: "Fiscal year",
  funding: "Fund source",
  budget: "Budget",
  pipeline: "Pipeline status",
  stage: "Delivery stage",
  progress: "Progress",
  risk: "Risk",
  completion: "Target completion",
  actions: "Actions",
};

const LOCKED_COLUMNS = new Set<ProjectTableColumn>(["project", "actions"]);

function FilterSelect({
  ariaLabel,
  value,
  placeholder,
  options,
  onChange,
}: {
  ariaLabel: string;
  value: string;
  placeholder: string;
  options: Option[];
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={styles.filterSelect} aria-label={ariaLabel}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{placeholder}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ProjectMasterlistFilters({
  filters,
  options,
  moreFiltersOpen,
  activeFilterCount,
  visibleColumns,
  columns,
  onFilterChange,
  onToggleMoreFilters,
  onToggleColumn,
  onClear,
}: {
  filters: ProjectFilters;
  options: FilterOptions;
  moreFiltersOpen: boolean;
  activeFilterCount: number;
  visibleColumns: Set<ProjectTableColumn>;
  columns: readonly ProjectTableColumn[];
  onFilterChange: (key: keyof ProjectFilters, value: string) => void;
  onToggleMoreFilters: () => void;
  onToggleColumn: (column: ProjectTableColumn) => void;
  onClear: () => void;
}) {
  return (
    <div className={styles.filterRegion}>
      <div className={styles.toolbar}>
        <label className={styles.searchField}>
          <Search size={15} aria-hidden="true" />
          <span className={styles.srOnly}>Search projects</span>
          <input
            type="search"
            value={filters.search}
            placeholder="Search project code, title, office, barangay, contractor…"
            onChange={(event) => onFilterChange("search", event.target.value)}
          />
        </label>

        <button
          className={`${styles.secondaryButton} ${moreFiltersOpen ? styles.secondaryButtonActive : ""}`}
          type="button"
          aria-expanded={moreFiltersOpen}
          onClick={onToggleMoreFilters}
        >
          <Filter size={14} /> More filters
          {activeFilterCount > 0 ? <span className={styles.filterCount}>{activeFilterCount}</span> : null}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={styles.secondaryButton} type="button">
              <Columns3 size={14} /> Columns
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {columns.map((column) => (
              <DropdownMenuCheckboxItem
                key={column}
                checked={visibleColumns.has(column)}
                disabled={LOCKED_COLUMNS.has(column)}
                onCheckedChange={() => onToggleColumn(column)}
                onSelect={(event) => event.preventDefault()}
              >
                {COLUMN_LABELS[column]}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {activeFilterCount > 0 || filters.search ? (
          <button className={styles.clearButton} type="button" onClick={onClear}>
            <X size={14} /> Clear
          </button>
        ) : null}
      </div>

      <div className={styles.primaryFilters}>
        <SlidersHorizontal size={15} aria-hidden="true" />
        <FilterSelect
          ariaLabel="Pipeline status filter"
          value={filters.pipelineStatus}
          placeholder="All pipeline statuses"
          options={options.pipelineStatuses}
          onChange={(value) => onFilterChange("pipelineStatus", value)}
        />
        <FilterSelect
          ariaLabel="Delivery stage filter"
          value={filters.deliveryStage}
          placeholder="All delivery stages"
          options={options.deliveryStages}
          onChange={(value) => onFilterChange("deliveryStage", value)}
        />
        <FilterSelect
          ariaLabel="Funding source filter"
          value={filters.fundingSource}
          placeholder="All fund sources"
          options={options.fundingSources}
          onChange={(value) => onFilterChange("fundingSource", value)}
        />
      </div>

      {moreFiltersOpen ? (
        <div className={styles.advancedFilters}>
          <FilterSelect
            ariaLabel="Implementing office filter"
            value={filters.department}
            placeholder="All implementing offices"
            options={options.departments}
            onChange={(value) => onFilterChange("department", value)}
          />
          <FilterSelect
            ariaLabel="Barangay filter"
            value={filters.barangay}
            placeholder="All barangays"
            options={options.barangays}
            onChange={(value) => onFilterChange("barangay", value)}
          />
          <FilterSelect
            ariaLabel="Project type filter"
            value={filters.projectType}
            placeholder="All project types"
            options={options.projectTypes}
            onChange={(value) => onFilterChange("projectType", value)}
          />
          <FilterSelect
            ariaLabel="Risk level filter"
            value={filters.riskLevel}
            placeholder="All risk levels"
            options={options.riskLevels}
            onChange={(value) => onFilterChange("riskLevel", value)}
          />
        </div>
      ) : null}
    </div>
  );
}
