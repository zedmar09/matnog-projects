import {
  AlertCircle,
  Banknote,
  Building2,
  CalendarDays,
  Check,
  CircleDot,
  ClipboardCheck,
  FileCheck2,
  FileText,
  Flag,
  Image,
  Landmark,
  MapPin,
  ShieldCheck,
  TestTube2,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";

import type { Project } from "../types/project";
import { getProjectDetailSnapshot } from "../utils/project-detail-utils";
import { formatCompactCurrency, formatNumber, formatShortDate } from "../utils/project-utils";
import styles from "../views/project-detail.module.css";
import { StatusBadge } from "./status-badge";

const money = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.field}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Panel({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className={styles.panel}>
      <header>
        <h3>{title}</h3>
        {description ? <p>{description}</p> : null}
      </header>
      {children}
    </section>
  );
}

function SummaryTab({ project }: { project: Project }) {
  return (
    <div className={styles.twoColumnLayout}>
      <div className={styles.mainColumn}>
        <Panel title="Project brief">
          <p className={styles.description}>{project.description}</p>
          <div className={styles.fieldGrid}>
            <Field label="Project type" value={project.projectType} />
            <Field label="Proposal source" value={project.proposalSource} />
            <Field label="Implementing office" value={project.implementingDepartment} />
            <Field label="Requesting office" value={project.requestingOffice} />
          </div>
        </Panel>
        <Panel title="Funding composition" description="Approved or proposed funding assigned to this project.">
          <div className={styles.listRows}>
            {project.funding.map((item) => (
              <div className={styles.listRow} key={item.source}>
                <span className={styles.rowIcon}>
                  <Landmark size={15} />
                </span>
                <div>
                  <strong>{item.source}</strong>
                  <small>
                    {item.eligibility} · {item.share}% share
                  </small>
                </div>
                <b>{money.format(item.amount)}</b>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Milestones">
          <div className={styles.timeline}>
            {project.milestones.map((milestone) => (
              <div key={milestone.id}>
                <span className={styles.timelineDot} />
                <div>
                  <strong>{milestone.label}</strong>
                  <small>{formatShortDate(milestone.date)}</small>
                </div>
                <StatusBadge value={milestone.status} />
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <aside className={styles.sideColumn}>
        <Panel title="Ownership">
          <div className={styles.iconFields}>
            <div>
              <UserRound size={15} />
              <span>
                Project lead<strong>{project.leadOfficer}</strong>
              </span>
            </div>
            <div>
              <Building2 size={15} />
              <span>
                Responsible office<strong>{project.implementingDepartment}</strong>
              </span>
            </div>
            <div>
              <MapPin size={15} />
              <span>
                Project location<strong>{project.location}</strong>
              </span>
            </div>
          </div>
        </Panel>
        <Panel title="Beneficiaries">
          <div className={styles.beneficiaryCount}>
            <UsersRound size={20} />
            <strong>{formatNumber(project.beneficiaries)}</strong>
            <span>estimated beneficiaries</span>
          </div>
          <div className={styles.tags}>
            {project.beneficiarySectors.map((sector) => (
              <span key={sector}>{sector}</span>
            ))}
          </div>
        </Panel>
        <Panel title="Risk watch">
          {project.riskReasons.length ? (
            <ul className={styles.riskList}>
              {project.riskReasons.map((risk) => (
                <li key={risk}>
                  <AlertCircle size={13} />
                  {risk}
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.positiveState}>
              <ShieldCheck size={15} /> No active risk issues recorded.
            </p>
          )}
        </Panel>
      </aside>
    </div>
  );
}

function PlanningTab({ project }: { project: Project }) {
  return (
    <div className={styles.tabGrid}>
      <Panel title="Proposal and prioritization">
        <div className={styles.fieldGrid}>
          <Field label="Proposal source" value={project.proposalSource} />
          <Field label="Priority rank" value={`#${project.priorityRank} municipal portfolio`} />
          <Field label="Fiscal year" value={`FY ${project.fiscalYear}`} />
          <Field label="Project duration" value={project.multiYear ? "Multi-year" : "Single-year"} />
        </div>
      </Panel>
      <Panel
        title="Plan hierarchy linkage"
        description="References connect the proposal to approved local development plans."
      >
        <div className={styles.referenceList}>
          {project.planReferences.map((reference, index) => (
            <div key={reference}>
              <FileCheck2 size={15} />
              <span>
                <strong>{index === 0 ? "Annual Investment Program" : "Local Development Investment Program"}</strong>
                <small>{reference}</small>
              </span>
              <Check size={14} />
            </div>
          ))}
          <div>
            <FileText size={15} />
            <span>
              <strong>Comprehensive Development Plan</strong>
              <small>CDP-MATNOG-2023-2028</small>
            </span>
            <Check size={14} />
          </div>
        </div>
      </Panel>
      <Panel title="Thematic classification">
        <div className={styles.tags}>
          {project.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function FundingTab({ project }: { project: Project }) {
  const utilization = project.appropriation ? Math.round((project.disbursement / project.appropriation) * 100) : 0;
  return (
    <div className={styles.tabGrid}>
      <Panel title="Funding allocations">
        <div className={styles.listRows}>
          {project.funding.map((item) => (
            <div className={styles.listRow} key={item.source}>
              <span className={styles.rowIcon}>
                <Banknote size={15} />
              </span>
              <div>
                <strong>{item.source}</strong>
                <small>
                  {item.eligibility} · {item.share}% of total
                </small>
              </div>
              <b>{money.format(item.amount)}</b>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Budget execution" description={`${utilization}% of appropriation has been disbursed.`}>
        <div className={styles.financeSteps}>
          <div>
            <span>Project budget</span>
            <strong>{money.format(project.budget)}</strong>
            <i>
              <b style={{ width: "100%" }} />
            </i>
          </div>
          <div>
            <span>Appropriation</span>
            <strong>{money.format(project.appropriation)}</strong>
            <i>
              <b style={{ width: `${project.budget ? (project.appropriation / project.budget) * 100 : 0}%` }} />
            </i>
          </div>
          <div>
            <span>Obligation</span>
            <strong>{money.format(project.obligation)}</strong>
            <i>
              <b style={{ width: `${project.budget ? (project.obligation / project.budget) * 100 : 0}%` }} />
            </i>
          </div>
          <div>
            <span>Disbursement</span>
            <strong>{money.format(project.disbursement)}</strong>
            <i>
              <b style={{ width: `${project.budget ? (project.disbursement / project.budget) * 100 : 0}%` }} />
            </i>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function ReadinessTab({ project }: { project: Project }) {
  const snapshot = getProjectDetailSnapshot(project);
  return (
    <div className={styles.tabGrid}>
      <Panel
        title="Procurement readiness gate"
        description="All blocking requirements must be evidenced before procurement can proceed."
      >
        <div className={styles.readinessHeader}>
          <div>
            <strong>{project.readinessPercent}%</strong>
            <span>complete</span>
          </div>
          <div className={styles.largeProgress}>
            <i style={{ width: `${project.readinessPercent}%` }} />
          </div>
          <span className={project.readinessBlockers ? styles.blockerCount : styles.readyCount}>
            {project.readinessBlockers ? `${project.readinessBlockers} blockers` : "Gate clear"}
          </span>
        </div>
        <div className={styles.checklist}>
          {snapshot.readinessItems.map((item) => (
            <div key={item.label}>
              <span className={item.complete ? styles.checkComplete : styles.checkPending}>
                {item.complete ? <Check size={13} /> : <X size={13} />}
              </span>
              <strong>{item.label}</strong>
              <small>{item.complete ? "Evidence verified" : "Evidence required"}</small>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function ProcurementTab({ project }: { project: Project }) {
  return (
    <div className={styles.tabGrid}>
      <Panel title="Procurement summary">
        <div className={styles.fieldGrid}>
          <Field label="Procurement mode" value={project.procurementMode} />
          <Field label="Current status" value={project.procurementStatus} />
          <Field label="Contractor / supplier" value={project.contractor ?? "Not yet awarded"} />
          <Field
            label="External posting reference"
            value={project.contractor ? `PHILGEPS-${project.code.replaceAll("MAT-", "")}` : "Not available"}
          />
        </div>
      </Panel>
      <Panel title="Award chain">
        <div className={styles.processTrack}>
          {["PPMP", "Posting", "Bid evaluation", "Notice of award", "Contract", "Notice to proceed"].map(
            (label, index) => {
              const completed = project.contractor
                ? index <= 5
                : project.procurementStatus === "Not started"
                  ? false
                  : index <= 1;
              return (
                <div key={label} className={completed ? styles.processComplete : ""}>
                  <span>{completed ? <Check size={12} /> : <CircleDot size={12} />}</span>
                  <strong>{label}</strong>
                </div>
              );
            },
          )}
        </div>
      </Panel>
    </div>
  );
}

function ImplementationTab({ project }: { project: Project }) {
  const snapshot = getProjectDetailSnapshot(project);
  return (
    <div className={styles.tabGrid}>
      <Panel title="Delivery performance">
        <div className={styles.deliveryComparison}>
          <div>
            <span>Physical accomplishment</span>
            <strong>{project.physicalProgress}%</strong>
            <i>
              <b style={{ width: `${project.physicalProgress}%` }} />
            </i>
          </div>
          <div>
            <span>Financial accomplishment</span>
            <strong>{project.financialProgress}%</strong>
            <i>
              <b style={{ width: `${project.financialProgress}%` }} />
            </i>
          </div>
        </div>
        <div className={styles.fieldGrid}>
          <Field label="Contract value" value={formatCompactCurrency(snapshot.contractValue)} />
          <Field label="Progress billings" value={`${snapshot.billingCount} recorded`} />
          <Field label="Retention held" value={formatCompactCurrency(snapshot.retention)} />
          <Field
            label="Schedule variance"
            value={project.slippageDays ? `${project.slippageDays} days behind` : "On schedule"}
          />
        </div>
      </Panel>
      <Panel title="Current delivery note">
        <p className={styles.description}>
          {project.physicalProgress
            ? `The latest verified accomplishment is ${project.physicalProgress}%. ${project.slippageDays ? "Corrective action is required against the approved baseline schedule." : "Delivery remains within the current approved schedule."}`
            : "Physical implementation has not started. The project remains in its pre-delivery stage."}
        </p>
      </Panel>
    </div>
  );
}

function InspectionsTab({ project }: { project: Project }) {
  const snapshot = getProjectDetailSnapshot(project);
  return (
    <div className={styles.statPanelGrid}>
      <Panel title="Site evidence">
        <div className={styles.miniStats}>
          <div>
            <ClipboardCheck size={18} />
            <strong>{snapshot.inspectionCount}</strong>
            <span>inspections</span>
          </div>
          <div>
            <Image size={18} />
            <strong>{snapshot.photoCount}</strong>
            <span>verified photos</span>
          </div>
          <div>
            <TestTube2 size={18} />
            <strong>{snapshot.testCount}</strong>
            <span>material tests</span>
          </div>
        </div>
      </Panel>
      <Panel title="Issue and punch list">
        <div className={styles.miniStats}>
          <div>
            <AlertCircle size={18} />
            <strong>{snapshot.issueCount}</strong>
            <span>issues raised</span>
          </div>
          <div>
            <Check size={18} />
            <strong>{snapshot.resolvedIssues}</strong>
            <span>issues resolved</span>
          </div>
          <div>
            <Flag size={18} />
            <strong>{Math.max(0, snapshot.issueCount - snapshot.resolvedIssues)}</strong>
            <span>open actions</span>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function DocumentsTab({ project }: { project: Project }) {
  const snapshot = getProjectDetailSnapshot(project);
  return (
    <div className={styles.tabGrid}>
      <Panel
        title="Document register"
        description={`${project.documentCount} documents · ${project.documentCompleteness}% complete`}
      >
        <div className={styles.largeProgress}>
          <i style={{ width: `${project.documentCompleteness}%` }} />
        </div>
        <div className={styles.documentGrid}>
          {snapshot.documentGroups.map((group) => (
            <div key={group.label}>
              <FileText size={17} />
              <span>
                <strong>{group.label}</strong>
                <small>
                  {group.complete} of {group.count} verified
                </small>
              </span>
              <b>{group.count}</b>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function HistoryTab({ project }: { project: Project }) {
  return (
    <div className={styles.tabGrid}>
      <Panel title="Project history" description="Activity records are displayed newest first.">
        <div className={styles.historyList}>
          {project.activities.map((activity) => (
            <div key={activity.id}>
              <span>
                <CalendarDays size={14} />
              </span>
              <div>
                <strong>{activity.action}</strong>
                <p>{activity.note}</p>
                <small>
                  {activity.actor} · {formatShortDate(activity.date)}
                </small>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

export function ProjectDetailTabs({ project }: { project: Project }) {
  return (
    <Tabs className={styles.workspace} defaultValue="summary">
      <div className={styles.tabBar}>
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="planning">Planning</TabsTrigger>
          <TabsTrigger value="funding">Funding</TabsTrigger>
          <TabsTrigger value="readiness">Readiness</TabsTrigger>
          <TabsTrigger value="procurement">Procurement</TabsTrigger>
          <TabsTrigger value="implementation">Implementation</TabsTrigger>
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="summary">
        <SummaryTab project={project} />
      </TabsContent>
      <TabsContent value="planning">
        <PlanningTab project={project} />
      </TabsContent>
      <TabsContent value="funding">
        <FundingTab project={project} />
      </TabsContent>
      <TabsContent value="readiness">
        <ReadinessTab project={project} />
      </TabsContent>
      <TabsContent value="procurement">
        <ProcurementTab project={project} />
      </TabsContent>
      <TabsContent value="implementation">
        <ImplementationTab project={project} />
      </TabsContent>
      <TabsContent value="inspections">
        <InspectionsTab project={project} />
      </TabsContent>
      <TabsContent value="documents">
        <DocumentsTab project={project} />
      </TabsContent>
      <TabsContent value="history">
        <HistoryTab project={project} />
      </TabsContent>
    </Tabs>
  );
}
