import { InspectionDetailView } from "@/features/monitoring/views/inspection-detail-view";

export default async function InspectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InspectionDetailView inspectionId={id} />;
}
