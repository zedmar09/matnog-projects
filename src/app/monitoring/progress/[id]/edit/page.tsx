import { ProgressEditView } from "@/features/monitoring/views/progress-edit-view";

export default async function EditProgressReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProgressEditView updateId={id} />;
}
