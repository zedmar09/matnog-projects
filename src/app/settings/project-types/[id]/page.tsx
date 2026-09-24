import { ProjectTypeDetailView } from "@/features/settings/views/project-type-detail-view";

export default async function ProjectTypeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectTypeDetailView typeId={id} />;
}
