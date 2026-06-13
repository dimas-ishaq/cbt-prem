'use client';

import { useState, useEffect } from 'react';

interface Option {
  id: string;
  content: string;
}

interface Question {
  id: string;
  content: string;
  type: string;
  options: Option[];
  mediaUrl?: string;
  mediaType?: string;
}

interface Props {
  question: Question;
  index: number;
  onAnswer: (answer: string) => void;
  selectedAnswer?: string; // This can be a single ID, comma-separated IDs, or essay text
}

export function QuestionCard({ question, index, onAnswer, selectedAnswer }: Props) {
  const [essayText, setEssayText] = useState(selectedAnswer || '');

  // Update local essay state when selectedAnswer changes (e.g., navigating back to an essay question)
  useEffect(() => {
    if (question.type === 'ESSAY') {
      setEssayText(selectedAnswer || '');
    }
  }, [selectedAnswer, question.id, question.type]);

  const handleMultipleResponseChange = (optionId: string) => {
    const currentAnswers = selectedAnswer ? selectedAnswer.split(',') : [];
    let newAnswers: string[];
    
    if (currentAnswers.includes(optionId)) {
      newAnswers = currentAnswers.filter(id => id !== optionId);
    } else {
      newAnswers = [...currentAnswers, optionId];
    }
    
    onAnswer(newAnswers.join(','));
  };

  const renderMedia = () => {
    if (!question.mediaUrl) return null;

    switch (question.mediaType) {
      case 'image':
        return (
          <div className="mb-6 rounded-lg overflow-hidden border border-gray-100 max-w-2xl">
            <img 
              src={question.mediaUrl} 
              alt="Question media" 
              className="w-full h-auto object-contain"
            />
          </div>
        );
      case 'audio':
        return (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Audio attachment:</p>
            <audio controls className="w-full">
              <source src={question.mediaUrl} />
              Your browser does not support the audio element.
            </audio>
          </div>
        );
      case 'video':
        return (
          <div className="mb-6 rounded-lg overflow-hidden border border-gray-100 bg-black aspect-video max-w-2xl">
            <video controls className="w-full h-full">
              <source src={question.mediaUrl} />
              Your browser does not support the video element.
            </video>
          </div>
        );
      default:
        return null;
    }
  };

  const renderOptions = () => {
    switch (question.type) {
      case 'PILIHAN_GANDA':
      case 'BENAR_SALAH':
        return (
          <div className="space-y-3">
            {question.options.map((option, idx) => {
              const label = String.fromCharCode(65 + idx);
              const isSelected = selectedAnswer === option.id;
              return (
                <label
                  key={option.id}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    className="hidden"
                    checked={isSelected}
                    onChange={() => onAnswer(option.id)}
                  />
                  <span className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full border mr-4 font-semibold ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-300 text-gray-600'
                  }`}>
                    {label}
                  </span>
                  <div 
                    className="text-gray-700"
                    dangerouslySetInnerHTML={{ __html: option.content }}
                  />
                </label>
              );
            })}
          </div>
        );

      case 'MULTIPLE_RESPONSE':
        return (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 mb-2 font-medium uppercase">Pilih satu atau lebih jawaban:</p>
            {question.options.map((option, idx) => {
              const label = String.fromCharCode(65 + idx);
              const isSelected = selectedAnswer?.split(',').includes(option.id);
              return (
                <label
                  key={option.id}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={isSelected}
                    onChange={() => handleMultipleResponseChange(option.id)}
                  />
                  <span className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border mr-4 font-semibold ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-300 text-gray-600'
                  }`}>
                    {label}
                  </span>
                  <div 
                    className="text-gray-700"
                    dangerouslySetInnerHTML={{ __html: option.content }}
                  />
                </label>
              );
            })}
          </div>
        );

      case 'ESSAY':
        return (
          <div className="space-y-4">
            <textarea
              className="w-full h-64 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-gray-700 leading-relaxed"
              placeholder="Tuliskan jawaban Anda di sini..."
              value={essayText}
              onChange={(e) => setEssayText(e.target.value)}
              onBlur={() => onAnswer(essayText)}
            />
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Jawaban akan disimpan otomatis saat Anda pindah soal atau klik di luar area teks.</span>
              <span>{essayText.length} karakter</span>
            </div>
          </div>
        );

      default:
        return <p className="text-red-500">Tipe soal tidak didukung: {question.type}</p>;
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">
            Soal No. {index + 1}
          </span>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded uppercase">
            {question.type.replace('_', ' ')}
          </span>
        </div>
        {renderMedia()}
        <div 
          className="mt-2 text-lg text-gray-800 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: question.content }}
        />
      </div>

      {renderOptions()}
    </div>
  );
}
