"use client";

import { AlertTriangle, Banknote, Building2, CheckCircle2, Landmark, Plus, Search, WalletCards } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useShellStore } from "@/stores/shell-store";

import { type FiscalDraft, FiscalProfileForm } from "../components/fiscal-profile-form";
import { FundDetailPanel } from "../components/fund-detail-panel";
import { FundRegistryTable } from "../components/fund-registry-table";
import { FUND_CATEGORIES, type FundSourceDraft, FundSourceForm, REGISTRY_ACTORS } from "../components/fund-source-form";
import { useFundSourceStore } from "../stores/fund-source-store";
import type { FundRegistryFieldErrors } from "../types/fund-source";
import { formatFundCurrency, getAvailableBalance } from "../utils/fund-source-utils";
import styles from "./fund-source-registry.module.css";

const EMPTY_SOURCE: FundSourceDraft = {
  code: "",
  name: "",
  category: "General Fund",
  ownership: "Municipal",
  barangay: null,
  managingOffice: "",
  legalBasis: "",
  purpose: "",
  restrictions: "",
  active: true,
  actor: "Unassigned",
};
const EMPTY_FISCAL: FiscalDraft = {
  fiscalYear: "2026",
  appropriation: 0,
  commitments: 0,
  obligations: 0,
  disbursements: 0,
  actor: "Unassigned",
};

function unique(values: string[]) {
  return [...new Set(values)].toSorted((a, b) => a.localeCompare(b));
}

function FilterSelect({
  value,
  label,
  placeholder,
  options,
  onChange,
}: {
  value: string;
  label: string;
  placeholder: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={styles.filterSelect} aria-label={label}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{placeholder}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function FundSourceRegistryView() {
  const sources = useFundSourceStore((state) => state.sources);
  const profiles = useFundSourceStore((state) => state.profiles);
  const activities = useFundSourceStore((state) => state.activities);
  const addFundSource = useFundSourceStore((state) => state.addFundSource);
  const updateFundSource = useFundSourceStore((state) => state.updateFundSource);
  const setFundSourceActive = useFundSourceStore((state) => state.setFundSourceActive);
  const addFiscalProfile = useFundSourceStore((state) => state.addFiscalProfile);
  const updateFiscalProfile = useFundSourceStore((state) => state.updateFiscalProfile);
  const fiscalYear = useShellStore((state) => state.fiscalYear);
  const jurisdiction = useShellStore((state) => state.jurisdiction);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [office, setOffice] = useState("all");
  const [ownership, setOwnership] = useState("all");
  const [status, setStatus] = useState("all");
  const [selectedId, setSelectedId] = useState("");
  const [formMode, setFormMode] = useState<"closed" | "create" | "edit">("closed");
  const [sourceDraft, setSourceDraft] = useState<FundSourceDraft>(EMPTY_SOURCE);
  const [fiscalDraft, setFiscalDraft] = useState<FiscalDraft>({ ...EMPTY_FISCAL, fiscalYear });
  const [fiscalForm, setFiscalForm] = useState<"closed" | "create" | "edit">("closed");
  const [errors, setErrors] = useState<FundRegistryFieldErrors>({});
  const [feedback, setFeedback] = useState({ sourceId: "", text: "", success: false });
  const [statusConfirm, setStatusConfirm] = useState(false);
  const [statusActor, setStatusActor] = useState("Unassigned");
  const [statusNote, setStatusNote] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLocaleLowerCase());

  const profileMap = useMemo(
    () =>
      new Map(
        profiles
          .filter((profile) => profile.fiscalYear === fiscalYear)
          .map((profile) => [profile.fundSourceId, profile]),
      ),
    [profiles, fiscalYear],
  );
  const scopedSources = useMemo(
    () =>
      sources.filter((source) => {
        if (jurisdiction === "municipal") return true;
        if (jurisdiction === "all-barangays") return source.ownership === "Barangay";
        const target =
          jurisdiction === "poblacion" ? "Poblacion" : jurisdiction === "gadgaron" ? "Gadgaron" : "Sinalmacan";
        return source.ownership === "Municipal" || source.barangay === target;
      }),
    [sources, jurisdiction],
  );
  const options = useMemo(
    () => ({ offices: unique(scopedSources.map((source) => source.managingOffice)) }),
    [scopedSources],
  );
  const filteredSources = useMemo(
    () =>
      scopedSources
        .filter((source) => {
          if (
            deferredSearch &&
            ![source.code, source.name, source.category, source.managingOffice, source.barangay]
              .join(" ")
              .toLocaleLowerCase()
              .includes(deferredSearch)
          )
            return false;
          if (category !== "all" && source.category !== category) return false;
          if (office !== "all" && source.managingOffice !== office) return false;
          if (ownership !== "all" && source.ownership !== ownership) return false;
          if (status !== "all" && (source.active ? "Active" : "Inactive") !== status) return false;
          return true;
        })
        .toSorted((a, b) => Number(b.active) - Number(a.active) || a.code.localeCompare(b.code)),
    [scopedSources, deferredSearch, category, office, ownership, status],
  );
  const selectedSource = filteredSources.find((source) => source.id === selectedId) ?? filteredSources[0];
  const selectedProfile = selectedSource ? profileMap.get(selectedSource.id) : undefined;
  const selectedActivities = selectedSource ? activities.filter((item) => item.fundSourceId === selectedSource.id) : [];
  const filteredProfiles = filteredSources.flatMap((source) => profileMap.get(source.id) ?? []);
  const totalAppropriation = filteredProfiles.reduce((sum, profile) => sum + profile.appropriation, 0);
  const totalAvailable = filteredProfiles.reduce((sum, profile) => sum + getAvailableBalance(profile), 0);
  const totalObligations = filteredProfiles.reduce((sum, profile) => sum + profile.obligations, 0);
  const portfolioUtilization = totalAppropriation ? (totalObligations / totalAppropriation) * 100 : 0;
  const hasFilters = Boolean(
    search || category !== "all" || office !== "all" || ownership !== "all" || status !== "all",
  );

  const resetMessages = () => {
    setErrors({});
    setFeedback({ sourceId: "", text: "", success: false });
  };
  const openCreate = () => {
    resetMessages();
    setFiscalForm("closed");
    setSourceDraft({ ...EMPTY_SOURCE });
    setFormMode("create");
  };
  const openEdit = () => {
    if (!selectedSource) return;
    resetMessages();
    setFiscalForm("closed");
    setSourceDraft({ ...selectedSource, actor: "Unassigned" });
    setFormMode("edit");
  };
  const saveSource = () => {
    const result =
      formMode === "create"
        ? addFundSource(sourceDraft)
        : selectedSource
          ? updateFundSource(selectedSource.id, {
              name: sourceDraft.name,
              category: sourceDraft.category,
              ownership: sourceDraft.ownership,
              barangay: sourceDraft.barangay,
              managingOffice: sourceDraft.managingOffice,
              legalBasis: sourceDraft.legalBasis,
              purpose: sourceDraft.purpose,
              restrictions: sourceDraft.restrictions,
              actor: sourceDraft.actor,
            })
          : null;
    if (!result) return;
    if (!result.ok) {
      setErrors(result.fieldErrors ?? {});
      setFeedback({ sourceId: selectedSource?.id ?? "", text: result.message, success: false });
      return;
    }
    setSelectedId(result.value.id);
    setFormMode("closed");
    setErrors({});
    setFeedback({
      sourceId: result.value.id,
      text: formMode === "create" ? "Fund source added to the registry." : "Fund source details updated.",
      success: true,
    });
  };
  const openFiscal = (mode: "create" | "edit") => {
    if (!selectedSource) return;
    resetMessages();
    setFormMode("closed");
    setFiscalForm(mode);
    setFiscalDraft(
      selectedProfile
        ? {
            fiscalYear: selectedProfile.fiscalYear,
            appropriation: selectedProfile.appropriation,
            commitments: selectedProfile.commitments,
            obligations: selectedProfile.obligations,
            disbursements: selectedProfile.disbursements,
            actor: "Unassigned",
          }
        : { ...EMPTY_FISCAL, fiscalYear },
    );
  };
  const saveFiscal = () => {
    if (!selectedSource) return;
    const input = { ...fiscalDraft, fundSourceId: selectedSource.id };
    const result =
      fiscalForm === "edit" && selectedProfile
        ? updateFiscalProfile(selectedProfile.id, input)
        : addFiscalProfile(input);
    if (!result.ok) {
      setErrors(result.fieldErrors ?? {});
      setFeedback({ sourceId: selectedSource.id, text: result.message, success: false });
      return;
    }
    setFiscalForm("closed");
    setErrors({});
    setFeedback({ sourceId: selectedSource.id, text: "Fiscal profile saved to the registry.", success: true });
  };
  const confirmStatus = () => {
    if (!selectedSource) return;
    const result = setFundSourceActive(selectedSource.id, !selectedSource.active, statusActor, statusNote, fiscalYear);
    if (!result.ok) {
      setFeedback({ sourceId: selectedSource.id, text: result.message, success: false });
      return;
    }
    setStatusConfirm(false);
    setStatusActor("Unassigned");
    setStatusNote("");
    setFeedback({
      sourceId: selectedSource.id,
      text: `Fund source ${result.value.active ? "activated" : "deactivated"}.`,
      success: true,
    });
  };

  return (
    <main className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <div className={styles.contextLine}>
            <span>FY {fiscalYear}</span>
            <span>Planning & funding control</span>
          </div>
          <h2>Fund source registry</h2>
          <p>
            Maintain the legal authority, ownership, restrictions, and annual fiscal position of every funding source
            available to Matnog projects.
          </p>
        </div>
        <button className={styles.addButton} type="button" onClick={openCreate}>
          <Plus size={15} /> Add fund source
        </button>
      </header>
      <section className={styles.summaryStrip}>
        <div>
          <Landmark size={17} />
          <span>Active fund sources</span>
          <strong>{filteredSources.filter((source) => source.active).length}</strong>
        </div>
        <div>
          <Banknote size={17} />
          <span>Total appropriation</span>
          <strong>{formatFundCurrency(totalAppropriation)}</strong>
        </div>
        <div>
          <WalletCards size={17} />
          <span>Available balance</span>
          <strong>{formatFundCurrency(totalAvailable)}</strong>
        </div>
        <div>
          <CheckCircle2 size={17} />
          <span>Portfolio utilization</span>
          <strong>{portfolioUtilization.toFixed(1)}%</strong>
        </div>
      </section>
      <section className={styles.workspaceCard}>
        <div className={styles.filters}>
          <label className={styles.searchField}>
            <Search size={15} />
            <span className={styles.srOnly}>Search fund sources</span>
            <input
              type="search"
              value={search}
              placeholder="Search fund code, name, category, or office…"
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <FilterSelect
            value={category}
            label="Fund category filter"
            placeholder="All categories"
            options={FUND_CATEGORIES}
            onChange={setCategory}
          />
          <FilterSelect
            value={office}
            label="Managing office filter"
            placeholder="All offices"
            options={options.offices}
            onChange={setOffice}
          />
          <FilterSelect
            value={ownership}
            label="Ownership filter"
            placeholder="All ownership"
            options={["Municipal", "Barangay"]}
            onChange={setOwnership}
          />
          <FilterSelect
            value={status}
            label="Fund status filter"
            placeholder="All statuses"
            options={["Active", "Inactive"]}
            onChange={setStatus}
          />
          {hasFilters ? (
            <button
              className={styles.clearButton}
              type="button"
              onClick={() => {
                setSearch("");
                setCategory("all");
                setOffice("all");
                setOwnership("all");
                setStatus("all");
              }}
            >
              Clear
            </button>
          ) : null}
        </div>
        <div className={styles.workspaceGrid}>
          <div className={styles.registryPane}>
            <div className={styles.paneHeading}>
              <div>
                <h3>Registered funding sources</h3>
                <p>Governance record and FY {fiscalYear} fiscal position</p>
              </div>
              <strong>{filteredSources.length} records</strong>
            </div>
            <FundRegistryTable
              sources={filteredSources}
              profileMap={profileMap}
              selectedId={selectedSource?.id}
              onSelect={(source) => {
                setSelectedId(source.id);
                setFormMode("closed");
                setFiscalForm("closed");
                resetMessages();
              }}
            />
          </div>
          {formMode !== "closed" ? (
            <FundSourceForm
              draft={sourceDraft}
              errors={errors}
              editing={formMode === "edit"}
              onChange={(changes) => {
                setSourceDraft((current) => ({ ...current, ...changes }));
                setErrors({});
              }}
              onSave={saveSource}
              onCancel={() => setFormMode("closed")}
            />
          ) : fiscalForm !== "closed" ? (
            <aside className={styles.detailPanel}>
              <header className={styles.detailHeader}>
                <div>
                  <span>{selectedSource?.code}</span>
                  <h3>{selectedSource?.name}</h3>
                  <p>
                    <Building2 size={12} /> FY {fiscalDraft.fiscalYear} financial record
                  </p>
                </div>
              </header>
              {feedback.sourceId === selectedSource?.id && feedback.text ? (
                <div className={styles.errorMessage}>
                  <AlertTriangle size={14} />
                  {feedback.text}
                </div>
              ) : null}
              <FiscalProfileForm
                draft={fiscalDraft}
                errors={errors}
                creating={fiscalForm === "create"}
                onChange={(changes) => {
                  setFiscalDraft((current) => ({ ...current, ...changes }));
                  setErrors({});
                }}
                onSave={saveFiscal}
                onCancel={() => setFiscalForm("closed")}
              />
            </aside>
          ) : (
            <FundDetailPanel
              source={selectedSource}
              profile={selectedProfile}
              activities={selectedActivities}
              fiscalYear={fiscalYear}
              feedback={feedback.sourceId === selectedSource?.id ? feedback : { text: "", success: false }}
              onEdit={openEdit}
              onEditFiscal={() => openFiscal("edit")}
              onAddFiscal={() => openFiscal("create")}
              onStatusChange={() => {
                setStatusConfirm(true);
                setFeedback({ sourceId: "", text: "", success: false });
              }}
            />
          )}
        </div>
      </section>
      {statusConfirm && selectedSource ? (
        <div className={styles.modalBackdrop}>
          <section
            className={styles.confirmDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="status-dialog-title"
          >
            <div className={styles.dialogIcon}>
              {selectedSource.active ? <AlertTriangle size={19} /> : <CheckCircle2 size={19} />}
            </div>
            <h3 id="status-dialog-title">
              {selectedSource.active ? "Deactivate" : "Activate"} {selectedSource.code}?
            </h3>
            <p>
              {selectedSource.active
                ? "This source will no longer be available to future funding workflows. Open current-year balances must be cleared first."
                : "This source will become available to future funding workflows."}
            </p>
            <div>
              <span>Recorded by</span>
              <Select value={statusActor} onValueChange={setStatusActor}>
                <SelectTrigger className={styles.formSelect} aria-label="Status change recorded by">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REGISTRY_ACTORS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label>
              <span>Reason</span>
              <textarea rows={3} value={statusNote} onChange={(event) => setStatusNote(event.target.value)} />
            </label>
            {feedback.sourceId === selectedSource.id && feedback.text ? (
              <div className={styles.dialogError}>{feedback.text}</div>
            ) : null}
            <footer>
              <button
                type="button"
                onClick={() => {
                  setStatusConfirm(false);
                  setFeedback({ sourceId: "", text: "", success: false });
                }}
              >
                Cancel
              </button>
              <button type="button" onClick={confirmStatus}>
                Confirm {selectedSource.active ? "deactivation" : "activation"}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </main>
  );
}
