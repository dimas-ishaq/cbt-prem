'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useRef, useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { toast } from '@/lib/toaster';
import { compressImage } from '@/utils/imageUtils';
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Link2,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Undo,
  Redo,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { IconButton, Tooltip, Flex, Box } from '@chakra-ui/react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  compact?: boolean;
}

export function RichTextEditor({ value, onChange, placeholder, className, compact = false }: Props) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2],
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'editor-image rounded-xl max-w-full h-auto my-3 border border-gray-100 shadow-sm transition-transform duration-300 hover:scale-[1.01]',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-indigo-600 font-medium underline decoration-indigo-300 underline-offset-4 hover:text-indigo-850 transition-colors',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || (compact ? 'Ketik opsi...' : 'Mulai ketik soal di sini...'),
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `tiptap focus:outline-none p-4 text-gray-800 bg-white outline-none w-full`,
        style: `min-height: ${compact ? '80px' : '180px'}; font-size: 0.975rem; line-height: 1.6;`,
      },
    },
  });

  // Sync external changes
  useEffect(() => {
    if (!editor) return;
    const currentHTML = editor.getHTML();
    if (value !== currentHTML) {
      const isBothEmpty =
        (value === '' || value === '<p></p>') &&
        (currentHTML === '' || currentHTML === '<p></p>');
      if (!isBothEmpty) {
        editor.commands.setContent(value);
      }
    }
  }, [value, editor]);

  const toggleFullscreen = () => {
    if (compact) return;
    const container = document.querySelector('.tiptap-editor-wrapper');
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    } else {
      (container as HTMLElement).requestFullscreen?.().then(() => {
        setIsFullscreen(true);
      }).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const uploadImageFile = useCallback(async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 5MB');
      return;
    }
    try {
      const compressedFile = await compressImage(file, {
        maxWidth: 1280,
        maxHeight: 720,
        quality: 0.8,
        maxSizeMB: 2,
      });
      const formData = new FormData();
      formData.append('file', compressedFile);
      const { data } = await api.post('/questions/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (editor) {
        editor.chain().focus().setImage({ src: data.url }).run();
      }
      return true;
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal upload gambar');
      return false;
    }
  }, [editor]);

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            toast.success('Memproses gambar dari clipboard...');
            uploadImageFile(file);
          }
        }
      }
    },
    [uploadImageFile]
  );

  useEffect(() => {
    if (!editor) return;
    const view = editor.view;
    const root = view.dom;
    root.addEventListener('paste', handlePaste);
    return () => root.removeEventListener('paste', handlePaste);
  }, [editor, handlePaste]);

  const triggerImageSelect = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadImageFile(file);
    }
    e.target.value = '';
  };

  const addLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Masukkan URL:', previousUrl);
    
    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  if (!editor) {
    return null;
  }

  return (
    <div className={`tiptap-editor-wrapper ${compact ? 'tiptap-compact' : 'tiptap-full'} bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${isFullscreen ? 'p-6' : ''} ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 border-b border-gray-200 px-3 py-2 rounded-t-xl">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Headings group */}
          {!compact && (
            <>
              <div className="flex items-center bg-gray-200/50 p-0.5 rounded-lg gap-0.5 border border-gray-200/30">
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                  className={`w-8 h-8 flex items-center justify-center rounded-md transition-all duration-200 ${
                    editor.isActive('heading', { level: 1 })
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'hover:bg-white/60 text-gray-550 hover:text-gray-800'
                  }`}
                  title="Heading 1"
                >
                  <Heading1 size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                  className={`w-8 h-8 flex items-center justify-center rounded-md transition-all duration-200 ${
                    editor.isActive('heading', { level: 2 })
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'hover:bg-white/60 text-gray-550 hover:text-gray-800'
                  }`}
                  title="Heading 2"
                >
                  <Heading2 size={15} />
                </button>
              </div>
              <div className="w-px h-5 bg-gray-300/80 mx-0.5" />
            </>
          )}

          {/* Formatting group */}
          <div className="flex items-center bg-gray-200/50 p-0.5 rounded-lg gap-0.5 border border-gray-200/30">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`w-8 h-8 flex items-center justify-center rounded-md transition-all duration-200 ${
                editor.isActive('bold')
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'hover:bg-white/60 text-gray-550 hover:text-gray-800'
              }`}
              title="Tebal (Ctrl+B)"
            >
              <Bold size={15} />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`w-8 h-8 flex items-center justify-center rounded-md transition-all duration-200 ${
                editor.isActive('italic')
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'hover:bg-white/60 text-gray-550 hover:text-gray-800'
              }`}
              title="Miring (Ctrl+I)"
            >
              <Italic size={15} />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`w-8 h-8 flex items-center justify-center rounded-md transition-all duration-200 ${
                editor.isActive('strike')
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'hover:bg-white/60 text-gray-550 hover:text-gray-800'
              }`}
              title="Coret"
            >
              <Strikethrough size={15} />
            </button>
          </div>

          {/* Lists group */}
          {!compact && (
            <>
              <div className="w-px h-5 bg-gray-300/80 mx-0.5" />
              <div className="flex items-center bg-gray-200/50 p-0.5 rounded-lg gap-0.5 border border-gray-200/30">
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  className={`w-8 h-8 flex items-center justify-center rounded-md transition-all duration-200 ${
                    editor.isActive('bulletList')
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'hover:bg-white/60 text-gray-550 hover:text-gray-800'
                  }`}
                  title="Daftar Bullet"
                >
                  <List size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  className={`w-8 h-8 flex items-center justify-center rounded-md transition-all duration-200 ${
                    editor.isActive('orderedList')
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'hover:bg-white/60 text-gray-550 hover:text-gray-800'
                  }`}
                  title="Daftar Angka"
                >
                  <ListOrdered size={15} />
                </button>
              </div>
            </>
          )}

          <div className="w-px h-5 bg-gray-300/80 mx-0.5" />

          {/* Links & Images */}
          <div className="flex items-center bg-gray-200/50 p-0.5 rounded-lg gap-0.5 border border-gray-200/30">
            <button
              type="button"
              onClick={addLink}
              className={`w-8 h-8 flex items-center justify-center rounded-md transition-all duration-200 ${
                editor.isActive('link')
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'hover:bg-white/60 text-gray-550 hover:text-gray-850'
              }`}
              title="Tambah Link"
            >
              <Link2 size={15} />
            </button>
            <button
              type="button"
              onClick={triggerImageSelect}
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/60 text-gray-550 hover:text-gray-850 transition-all duration-200"
              title="Tambah Gambar"
            >
              <ImageIcon size={15} />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />

          {/* History group */}
          {!compact && (
            <>
              <div className="w-px h-5 bg-gray-300/80 mx-0.5" />
              <div className="flex items-center bg-gray-200/50 p-0.5 rounded-lg gap-0.5 border border-gray-200/30">
                <button
                  type="button"
                  onClick={() => editor.chain().focus().undo().run()}
                  disabled={!editor.can().undo()}
                  className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/60 text-gray-550 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200"
                  title="Undo"
                >
                  <Undo size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().redo().run()}
                  disabled={!editor.can().redo()}
                  className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/60 text-gray-550 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200"
                  title="Redo"
                >
                  <Redo size={15} />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Action Right - Fullscreen Toggle */}
        {!compact && (
          <button
            type="button"
            onClick={toggleFullscreen}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:text-indigo-600 shadow-sm text-gray-500 transition-all duration-200 transform active:scale-95"
            title={isFullscreen ? 'Keluar Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        )}
      </div>

      {/* Editor Content Area */}
      <EditorContent editor={editor} />

      {/* Global styles */}
      <style jsx global>{`
        .tiptap-editor-wrapper:focus-within {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15), 0 4px 12px -2px rgba(0, 0, 0, 0.05);
        }

        .tiptap-editor-wrapper.tiptap-full .tiptap {
          outline: none;
          padding: 1.25rem 1.5rem !important;
        }

        .tiptap-editor-wrapper.tiptap-compact .tiptap {
          outline: none;
          padding: 0.75rem 1rem !important;
        }

        /* TipTap style standards */
        .tiptap-editor-wrapper .tiptap p {
          margin-top: 0;
          margin-bottom: 0.75rem;
        }

        .tiptap-editor-wrapper .tiptap h1,
        .tiptap-editor-wrapper .tiptap h2 {
          color: #1e293b;
          line-height: 1.25;
          text-wrap: pretty;
        }

        .tiptap-editor-wrapper .tiptap h1 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }

        .tiptap-editor-wrapper .tiptap h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1.25rem;
          margin-bottom: 0.6rem;
        }

        /* List styles */
        .tiptap-editor-wrapper .tiptap ul,
        .tiptap-editor-wrapper .tiptap ol {
          padding-left: 1.5rem;
          margin-top: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .tiptap-editor-wrapper .tiptap ul {
          list-style-type: disc;
        }

        .tiptap-editor-wrapper .tiptap ol {
          list-style-type: decimal;
        }

        .tiptap-editor-wrapper .tiptap li p {
          margin-top: 0.25rem;
          margin-bottom: 0.25rem;
        }

        /* Code and preformatted text */
        .tiptap-editor-wrapper .tiptap code {
          background-color: #f1f5f9;
          color: #6366f1;
          border-radius: 0.375rem;
          font-size: 0.85em;
          padding: 0.2rem 0.4rem;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-weight: 500;
        }

        .tiptap-editor-wrapper .tiptap pre {
          background: #0f172a;
          color: #f8fafc;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          margin: 1rem 0;
          overflow-x: auto;
        }

        .tiptap-editor-wrapper .tiptap pre code {
          color: inherit;
          padding: 0;
          background: none;
          font-size: 0.825rem;
        }

        /* Blockquotes */
        .tiptap-editor-wrapper .tiptap blockquote {
          border-left: 4px solid #cbd5e1;
          margin: 1.25rem 0;
          padding-left: 1rem;
          color: #475569;
          font-style: italic;
        }

        /* Horizontal rule */
        .tiptap-editor-wrapper .tiptap hr {
          border: none;
          border-top: 1.5px solid #e2e8f0;
          margin: 1.5rem 0;
        }

        /* Placeholder style */
        .tiptap-editor-wrapper .tiptap p.is-editor-empty:first-child::before {
          color: #94a3b8;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
          font-style: italic;
        }

        /* Fullscreen overrides */
        .tiptap-editor-wrapper:fullscreen {
          display: flex;
          flex-direction: column;
          background: #f8fafc;
          padding: 2rem;
          border-radius: 0 !important;
          border: none !important;
        }

        .tiptap-editor-wrapper:fullscreen .tiptap {
          flex: 1;
          min-height: 60vh;
          background: white;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
      `}</style>
    </div>
  );
}
