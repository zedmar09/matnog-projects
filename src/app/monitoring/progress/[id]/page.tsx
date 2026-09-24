import { ProgressDetailView } from "@/features/monitoring/views/progress-detail-view";

export default async function ProgressDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProgressDetailView updateId={id} />;
}
