import { Building2, FileSearch, MapPin } from "lucide-react";

import type { FundFiscalProfile, FundSource } from "../types/fund-source";
import { formatFundCurrency, getAvailableBalance, getFundUtilization } from "../utils/fund-source-utils";
import styles from "../views/fund-source-registry.module.css";

export function FundStatusBadge({ active }: { active: boolean }) {
  return <span className={active ? styles.activeBadge : styles.inactiveBadge}>{active ? "Active" : "Inactive"}</span>;
}

export function FundRegistryTable({
  sources,
  profileMap,
  selectedId,
  onSelect,
}: {
  sources: FundSource[];
  profileMap: Map<string, FundFiscalProfile>;
  selectedId?: string;
  onSelect: (source: FundSource) => void;
}) {
  if (!sources.length) {
    return (
      <div className={styles.emptyState}>
        <FileSearch size={24} />
        <h3>No fund sources found</h3>
        <p>Adjust the registry filters or add a new funding source.</p>
      </div>
    );
  }
  return (
    <div className={styles.tableScroller}>
      <table className={styles.registryTable}>
        <thead>
          <tr>
            <th>Fund source</th>
            <th>Ownership</th>
            <th>Managing office</th>
            <th>Appropriation</th>
            <th>Available</th>
            <th>Utilization</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {sources.map((source) => {
            const profile = profileMap.get(source.id);
            const utilization = getFundUtilization(profile);
            return (
              <tr key={source.id} className={source.id === selectedId ? styles.selectedRow : ""}>
                <td className={styles.sourceCell}>
                  <button type="button" onClick={() => onSelect(source)}>
                    <strong>{source.name}</strong>
                    <span>
                      {source.code} · {source.category}
                    </span>
                  </button>
                </td>
                <td>
                  <span className={styles.ownerCell}>
                    {source.ownership === "Barangay" ? <MapPin size={11} /> : <Building2 size={11} />}
                    {source.barangay ?? "Municipal"}
                  </span>
                </td>
                <td className={styles.officeCell}>{source.managingOffice}</td>
                <td className={styles.moneyCell}>
                  {profile ? formatFundCurrency(profile.appropriation) : "No profile"}
                </td>
                <td className={styles.moneyCell}>{profile ? formatFundCurrency(getAvailableBalance(profile)) : "—"}</td>
                <td>
                  <div className={styles.utilizationCell}>
                    <div>
                      <i style={{ width: `${Math.min(100, utilization)}%` }} />
                    </div>
                    <span>{utilization.toFixed(1)}%</span>
                  </div>
                </td>
                <td>
                  <FundStatusBadge active={source.active} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
