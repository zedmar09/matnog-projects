"use client";

import { ChevronLeft, ChevronRight, ChevronsUpDown, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";

import type { FundUtilizationRow, FundUtilizationSortKey, UtilizationCondition } from "../types/fund-utilization";
import { compactMoney, sortFundRows } from "../utils/fund-utilization-utils";

import styles from "../views/fund-utilization-report.module.css";

function conditionClass(condition: UtilizationCondition) {
  if (condition === "Low") return styles.conditionLow;
  if (condition === "Healthy") return styles.conditionHealthy;
  if (condition === "High" || condition === "Fully utilized") return styles.conditionHigh;
  return styles.conditionNeutral;
}

export function FundUtilizationTable({ rows }: { rows: FundUtilizationRow[] }) {
  const [sortKey, setSortKey] = useState<FundUtilizationSortKey>("appropriation");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const sorted = useMemo(() => sortFundRows(rows, sortKey, direction), [rows, sortKey, direction]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  function sort(nextKey: FundUtilizationSortKey) {
    if (sortKey === nextKey) setDirection((current) => (current === "asc" ? "desc" : "asc"));
    else {
      setSortKey(nextKey);
      setDirection("asc");
    }
    setPage(1);
  }

  function heading(label: string, key: FundUtilizationSortKey) {
    return (
      <button type="button" className={styles.sortButton} onClick={() => sort(key)}>
        {label}
        <ChevronsUpDown size={12} />
      </button>
    );
  }

  return (
    <section className={styles.tableCard}>
      <header>
        <div>
          <h2>Project utilization detail</h2>
          <p>Audit-level allocation rows behind the graphical report.</p>
        </div>
        <span>{rows.length} allocation records</span>
      </header>
      {rows.length > 0 ? (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{heading("Project", "project")}</th>
                  <th>{heading("Barangay", "barangay")}</th>
                  <th>{heading("Fund source", "fundSource")}</th>
                  <th>Stage</th>
                  <th>{heading("Appropriation", "appropriation")}</th>
                  <th>{heading("Obligation", "obligation")}</th>
                  <th>{heading("Disbursement", "disbursement")}</th>
                  <th>{heading("Available", "availableBalance")}</th>
                  <th>{heading("Obligation %", "obligationRate")}</th>
                  <th>{heading("Disbursement %", "disbursementRate")}</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.projectTitle}</strong>
                      <span>
                        {row.projectCode} · {row.projectType}
                      </span>
                    </td>
                    <td>{row.barangay ?? "Municipality-wide"}</td>
                    <td>
                      <span className={styles.fundName}>{row.fundSource}</span>
                    </td>
                    <td>{row.deliveryStage}</td>
                    <td>{compactMoney(row.appropriation)}</td>
                    <td>{compactMoney(row.obligation)}</td>
                    <td>{compactMoney(row.disbursement)}</td>
                    <td>{compactMoney(row.availableBalance)}</td>
                    <td>
                      <span className={styles.rateCell}>
                        {row.obligationRate ?? 0}%
                        <i>
                          <b style={{ width: `${row.obligationRate ?? 0}%` }} />
                        </i>
                      </span>
                    </td>
                    <td>
                      <span className={styles.rateCell}>
                        {row.disbursementRate ?? 0}%
                        <i>
                          <b style={{ width: `${row.disbursementRate ?? 0}%` }} />
                        </i>
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.conditionBadge} ${conditionClass(row.condition)}`}>
                        {row.condition}
                      </span>
                    </td>
                    <td>
                      <Link
                        className={styles.openLink}
                        href={`/projects/${row.projectId}`}
                        aria-label={`Open ${row.projectTitle}`}
                      >
                        <ExternalLink size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.pagination}>
            <span>Rows per page</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setPage(1);
              }}
            >
              <SelectTrigger className={styles.pageSizeSelect} aria-label="Rows per page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[15, 30, 50].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>
              {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, sorted.length)} of {sorted.length}
            </span>
            <span>
              Page {safePage} of {totalPages}
            </span>
            <button
              type="button"
              aria-label="Previous page"
              disabled={safePage === 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              aria-label="Next page"
              disabled={safePage === totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </>
      ) : (
        <div className={styles.tableEmpty}>No project allocations match the active filters.</div>
      )}
    </section>
  );
}
