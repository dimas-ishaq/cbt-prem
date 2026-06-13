'use client';

import { useState } from 'react';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { RichTextEditor } from './rich-text-editor';

interface Option {
  content: string;
  isCorrect: boolean;
}

interface QuestionFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function QuestionForm({ onSubmit, onCancel, isSubmitting }: QuestionFormProps) {
  const [content, setContent] = useState('');
  const [type, setType] = useState('PILIHAN_GANDA');
  const [difficulty, setDifficulty] = useState('SEDANG');
  const [points, setPoints] = useState(1);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState('image');
  const [options, setOptions] = useState<Option[]>([
    { content: '', isCorrect: true },
    { content: '', isCorrect: false },
  ]);

  const addOption = () => {
    setOptions([...options, { content: '', isCorrect: false }]);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, field: keyof Option, value: any) => {
    setOptions((prev) => {
      return prev.map((opt, i) => {
        if (i !== index) {
          // If setting one to correct in single choice, others must be false
          if (field === 'isCorrect' && value === true && (type === 'PILIHAN_GANDA' || type === 'BENAR_SALAH')) {
            return { ...opt, isCorrect: false };
          }
          return opt;
        }
        return { ...opt, [field]: value };
      });
    });
  };

  const handleTypeChange = (newType: string) => {
    setType(newType);
    if (newType === 'BENAR_SALAH') {
      setOptions([
        { content: 'Benar', isCorrect: true },
        { content: 'Salah', isCorrect: false },
      ]);
    } else if (newType === 'ESSAY') {
      setOptions([]);
    } else if (options.length === 0 || (options.length === 2 && options[0].content === 'Benar')) {
      // Re-initialize for choice types if it was essay or true/false
      setOptions([
        { content: '', isCorrect: true },
        { content: '', isCorrect: false },
      ]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      content,
      type,
      difficulty,
      points,
      mediaUrl: mediaUrl || undefined,
      mediaType: mediaUrl ? mediaType : undefined,
      options: type === 'ESSAY' ? [] : options,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Question Content</label>
          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder="Type your question here..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Media URL (Optional)</label>
            <input
              type="url"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Media Type</label>
            <select
              value={mediaType}
              onChange={(e) => setMediaType(e.target.value)}
              disabled={!mediaUrl}
              className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50"
            >
              <option value="image">Image</option>
              <option value="audio">Audio</option>
              <option value="video">Video</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="PILIHAN_GANDA">Pilihan Ganda</option>
              <option value="MULTIPLE_RESPONSE">Multiple Response</option>
              <option value="ESSAY">Essay</option>
              <option value="BENAR_SALAH">Benar / Salah</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="MUDAH">Mudah</option>
              <option value="SEDANG">Sedang</option>
              <option value="SULIT">Sulit</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
            <input
              type="number"
              value={points}
              onChange={(e) => setPoints(parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {type !== 'ESSAY' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Options</h3>
            {type !== 'BENAR_SALAH' && (
              <button
                type="button"
                onClick={addOption}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center"
              >
                <Plus size={16} className="mr-1" /> Add Option
              </button>
            )}
          </div>
          
          <div className="space-y-3">
            {options.map((option, idx) => (
              <div key={idx} className="flex items-start space-x-3">
                <button
                  type="button"
                  onClick={() => updateOption(idx, 'isCorrect', !option.isCorrect)}
                  className={`mt-2 p-1 rounded-full transition-colors ${
                    option.isCorrect ? 'text-green-600 bg-green-50' : 'text-gray-300 hover:text-gray-400'
                  }`}
                >
                  <CheckCircle2 size={24} />
                </button>
                <div className="flex-1">
                  {type === 'BENAR_SALAH' ? (
                    <input
                      type="text"
                      readOnly
                      value={option.content}
                      className="w-full px-3 py-2 border rounded-lg bg-gray-50 outline-none"
                    />
                  ) : (
                    <RichTextEditor
                      value={option.content}
                      onChange={(val) => updateOption(idx, 'content', val)}
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      className="min-h-[100px]"
                    />
                  )}
                </div>
                {options.length > 2 && type !== 'BENAR_SALAH' && (
                  <button
                    type="button"
                    onClick={() => removeOption(idx)}
                    className="mt-2 p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex space-x-3 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 border rounded-lg hover:bg-gray-50 font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Question'}
        </button>
      </div>
    </form>
  );
}
