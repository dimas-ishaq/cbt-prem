import { ExamContainer } from '@/components/exam/exam-container';

export default async function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ExamContainer examId={id} />;
}
