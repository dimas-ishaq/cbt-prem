# Chakra UI Form Components Guide

Semua form components sudah menggunakan **Chakra UI** sesuai dengan design system project.

## Komponen yang Tersedia

### 1. ChakraInput
Input text field standar dengan validasi error.

```tsx
import { ChakraInput } from '@/components/form';

<ChakraInput
  label="Nama Lengkap"
  placeholder="Masukkan nama..."
  value={name}
  onChange={(e) => setName(e.target.value)}
  error={errors.name}
  isRequired
/>
```

**Props:**
- `label?: string` - Label field
- `error?: string` - Error message
- `isRequired?: boolean` - Tampilkan asterisk
- `helperText?: string` - Helper text
- `...inputProps` - Semua props dari Chakra Input component

---

### 2. ChakraTextarea
Textarea field untuk input panjang.

```tsx
import { ChakraTextarea } from '@/components/form';

<ChakraTextarea
  label="Deskripsi"
  placeholder="Tulis deskripsi..."
  value={description}
  onChange={(e) => setDescription(e.target.value)}
  rows={4}
  error={errors.description}
/>
```

**Props:**
- Sama seperti ChakraInput
- `rows?: number` - Jumlah baris

---

### 3. ChakraSelect
Dropdown/Select biasa untuk pilihan tetap.

```tsx
import { ChakraSelect } from '@/components/form';

<ChakraSelect
  label="Tingkat Kesulitan"
  value={difficulty}
  onChange={(e) => setDifficulty(e.target.value)}
  options={[
    { value: 'MUDAH', label: 'Mudah' },
    { value: 'SEDANG', label: 'Sedang' },
    { value: 'SULIT', label: 'Sulit' },
  ]}
  error={errors.difficulty}
  isRequired
/>
```

**Props:**
- `label?: string` - Label
- `error?: string` - Error message
- `isRequired?: boolean` - Wajib diisi
- `options: Array<{ value: string | number; label: string }>` - Daftar opsi
- `placeholder?: string` - Placeholder text
- `...selectProps` - Semua props dari Chakra Select

---

### 4. ChakraMultiSelect
Select dengan multiple choice dan search/filter.

```tsx
import { ChakraMultiSelect } from '@/components/form';

const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

<ChakraMultiSelect
  label="Pilih Mata Pelajaran"
  options={[
    { value: 'MTH', label: 'Matematika', description: 'Ilmu tentang angka' },
    { value: 'IPA', label: 'IPA', description: 'Ilmu Pengetahuan Alam' },
    { value: 'IPS', label: 'IPS', description: 'Ilmu Pengetahuan Sosial' },
  ]}
  value={selectedSubjects}
  onChange={setSelectedSubjects}
  placeholder="Cari dan pilih mata pelajaran..."
  error={errors.subjects}
  isRequired
/>
```

**Props:**
- `label?: string` - Label
- `error?: string` - Error message
- `isRequired?: boolean` - Wajib diisi
- `options: Array<{ value: string | number; label: string; description?: string }>` - Opsi dengan deskripsi opsional
- `value: (string | number)[]` - Array nilai terpilih
- `onChange: (values: (string | number)[]) => void` - Callback saat berubah
- `placeholder?: string` - Placeholder
- `isDisabled?: boolean` - Disable component

**Fitur:**
- ✅ Searchable
- ✅ Multiple selection
- ✅ Tag display
- ✅ Custom descriptions
- ✅ Click outside to close

---

### 5. ChakraComboBox
Dropdown searchable untuk single selection (autocomplete-like).

```tsx
import { ChakraComboBox } from '@/components/form';

const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);

<ChakraComboBox
  label="Pilih Guru Pengampu"
  options={[
    { value: 'T001', label: 'Ibu Siti Nurhaliza' },
    { value: 'T002', label: 'Bapak Ahmad Dani' },
    { value: 'T003', label: 'Ibu Rini Handayani' },
  ]}
  value={selectedTeacher}
  onChange={setSelectedTeacher}
  isClearable
  error={errors.teacher}
  isRequired
/>
```

**Props:**
- `label?: string` - Label
- `error?: string` - Error message
- `isRequired?: boolean` - Wajib diisi
- `options: Array<{ value: string | number; label: string; description?: string }>` - Opsi
- `value: string | number | null` - Nilai terpilih
- `onChange: (value: string | number | null) => void` - Callback saat berubah
- `placeholder?: string` - Placeholder
- `isDisabled?: boolean` - Disable
- `isClearable?: boolean` - Bisa dikosongkan

**Fitur:**
- ✅ Searchable
- ✅ Single selection
- ✅ Clear button
- ✅ Description support
- ✅ Arrow key navigation (ketik lalu Enter/Arrow)

---

### 6. ChakraFileInput
File input dengan drag & drop support.

```tsx
import { ChakraFileInput } from '@/components/form';

const [files, setFiles] = useState<File[]>([]);

<ChakraFileInput
  label="Upload Gambar"
  accept="image/*"
  multiple={false}
  maxSize={5}
  value={files}
  onChange={setFiles}
  onRemove={(idx) => setFiles(files.filter((_, i) => i !== idx))}
  helperText="Format: JPG, PNG, WebP. Maksimal 5MB"
  error={errors.image}
  isRequired
/>
```

**Props:**
- `label?: string` - Label
- `error?: string` - Error message
- `isRequired?: boolean` - Wajib diisi
- `accept?: string` - File MIME types (default: `image/*`)
- `multiple?: boolean` - Multiple file selection
- `maxSize?: number` - Ukuran max dalam MB (default: 5)
- `value?: File[]` - Array file terpilih
- `onChange?: (files: File[]) => void` - Callback
- `onRemove?: (index: number) => void` - Callback saat remove
- `disabled?: boolean` - Disable
- `helperText?: string` - Helper text

**Fitur:**
- ✅ Click to upload
- ✅ Drag & drop
- ✅ File size validation
- ✅ File list display
- ✅ Remove button
- ✅ File size formatting

---

## Contoh Lengkap Form

Lihat implementasi di: `apps/web/app/(teacher)/admin/subjects/page.tsx`

Struktur form:
```tsx
import {
  ChakraInput,
  ChakraTextarea,
  ChakraComboBox,
  ChakraMultiSelect,
  ChakraSelect,
  ChakraFileInput,
} from '@/components/form';

export default function MyForm() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: null,
    tags: [],
    difficulty: '',
    image: [],
  });
  const [errors, setErrors] = useState({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate & submit
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap={5}>
        <ChakraInput
          label="Nama"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={errors.name}
          isRequired
        />

        <ChakraTextarea
          label="Deskripsi"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />

        <ChakraComboBox
          label="Kategori"
          options={[
            { value: 'A', label: 'Kategori A' },
            { value: 'B', label: 'Kategori B' },
          ]}
          value={formData.category}
          onChange={(v) => setFormData({ ...formData, category: v })}
          isRequired
        />

        <ChakraMultiSelect
          label="Tags"
          options={[
            { value: '1', label: 'Tag 1' },
            { value: '2', label: 'Tag 2' },
          ]}
          value={formData.tags}
          onChange={(v) => setFormData({ ...formData, tags: v })}
        />

        <ChakraSelect
          label="Tingkat Kesulitan"
          options={[
            { value: 'easy', label: 'Mudah' },
            { value: 'medium', label: 'Sedang' },
            { value: 'hard', label: 'Sulit' },
          ]}
          value={formData.difficulty}
          onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
          isRequired
        />

        <ChakraFileInput
          label="Upload Gambar"
          accept="image/*"
          value={formData.image}
          onChange={(files) => setFormData({ ...formData, image: files })}
          error={errors.image}
        />

        <HStack>
          <Button variant="outline" onClick={() => router.back()}>
            Batal
          </Button>
          <Button type="submit" colorScheme="indigo">
            Simpan
          </Button>
        </HStack>
      </Stack>
    </form>
  );
}
```

---

## Styling & Konsistensi

Semua komponen sudah mengikuti:
- **Color scheme**: Indigo untuk primary, gray untuk secondary
- **Border radius**: lg (8px) untuk konsistensi
- **Focus state**: Indigo border + shadow
- **Hover state**: Subtle background/border changes
- **Typography**: Consistent dengan project

---

## Migrasi dari HTML Native

**Sebelum:**
```tsx
<input type="text" className="w-full p-2" />
<select className="w-full p-2">
  <option>Pilih...</option>
</select>
<textarea className="w-full p-2" />
```

**Sesudah:**
```tsx
import { ChakraInput, ChakraSelect, ChakraTextarea } from '@/components/form';

<ChakraInput label="Nama" />
<ChakraSelect label="Pilih Opsi" options={[...]} />
<ChakraTextarea label="Deskripsi" />
```

---

## Notes

- Semua components support Chakra UI styling props (`p`, `m`, `color`, dll)
- Error handling built-in dengan FormErrorMessage
- Loading states sudah integrated di Button component
- Responsive design otomatis via Chakra UI
