import { ProjectEditView } from "@/features/project-registry/views/project-edit-view";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectEditView projectId={id} />;
}
