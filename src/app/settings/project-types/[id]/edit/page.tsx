import { ProjectTypeEditView } from "@/features/settings/views/project-type-edit-view";

export default async function EditProjectTypePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectTypeEditView typeId={id} />;
}
