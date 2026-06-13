'use client';

interface Props {
  questions: any[];
  currentIndex: number;
  onSelect: (index: number) => void;
  answeredQuestions: string[]; // questionIds
}

export function ExamNav({ questions, currentIndex, onSelect, answeredQuestions }: Props) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {questions.map((eq, idx) => {
        const isAnswered = answeredQuestions.includes(eq.question.id);
        const isCurrent = currentIndex === idx;

        return (
          <button
            key={idx}
            onClick={() => onSelect(idx)}
            className={`w-10 h-10 flex items-center justify-center rounded text-sm font-medium transition-colors ${
              isCurrent
                ? 'bg-blue-600 text-white shadow-md'
                : isAnswered
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-400'
            }`}
          >
            {idx + 1}
          </button>
        );
      })}
    </div>
  );
}
