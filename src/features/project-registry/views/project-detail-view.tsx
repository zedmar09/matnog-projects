"use client";

import { FileQuestion } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ProjectDetailHeader } from "../components/project-detail-header";
import { ProjectDetailTabs } from "../components/project-detail-tabs";
import { useProjectRegistryStore } from "../stores/project-registry-store";
import type { ProjectPipelineStatus } from "../types/project";
import styles from "./project-detail.module.css";

export function ProjectDetailView({ projectId }: { projectId: string }) {
  const project = useProjectRegistryStore((state) => state.projects.find((item) => item.id === projectId));
  const transitionProject = useProjectRegistryStore((state) => state.transitionProject);
  const [message, setMessage] = useState("");

  if (!project) {
    return (
      <main className={styles.notFound}>
        <FileQuestion size={28} />
        <h2>Project record not found</h2>
        <p>The project may have been removed from this session or the link is incorrect.</p>
        <Link href="/pipeline/all-projects">Return to all projects</Link>
      </main>
    );
  }

  const changeStatus = (status: ProjectPipelineStatus) => {
    const updated = transitionProject(project.id, status, `Pipeline status updated from the project workspace.`);
    setMessage(updated ? `Status updated to ${status}.` : "The status could not be updated.");
  };

  return (
    <main className={styles.page}>
      <ProjectDetailHeader project={project} message={message} onStatusChange={changeStatus} />
      <ProjectDetailTabs project={project} />
    </main>
  );
}
