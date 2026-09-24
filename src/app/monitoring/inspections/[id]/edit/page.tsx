import { InspectionEditView } from "@/features/monitoring/views/inspection-edit-view";

export default async function EditInspectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InspectionEditView inspectionId={id} />;
}
