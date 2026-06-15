import { Injectable } from '@nestjs/common';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  ShadingType,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from 'docx';

@Injectable()
export class QuestionsTemplateService {
  async generateTemplate(): Promise<Buffer> {
    const doc = new Document({
      styles: {
        paragraphStyles: [
          {
            id: 'QuestionMarker',
            name: 'Question Marker',
            basedOn: 'Normal',
            run: { bold: true, color: '1a56db', size: 22 },
            paragraph: {
              spacing: { before: 280, after: 80 },
            },
          },
        ],
      },
      sections: [
        {
          children: [
            // ── HEADER ────────────────────────────────────────────────────────
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: 'Template Import Soal — CBT Premium',
                  bold: true,
                  size: 32,
                  color: '1e3a8a',
                }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: 'Ikuti format di bawah ini dengan tepat. Hapus baris contoh dan isi dengan soal Anda.',
                  italics: true,
                  size: 20,
                  color: '6b7280',
                }),
              ],
              spacing: { after: 320 },
            }),

            // ── PETUNJUK ──────────────────────────────────────────────────────
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              children: [new TextRun({ text: 'Petunjuk Pengisian', bold: true, size: 24 })],
            }),
            ...this.createInstructionTable(),
            new Paragraph({ text: '', spacing: { after: 200 } }),

            // ── SEPARATOR ─────────────────────────────────────────────────────
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: '══════════════════════════════════════════════════════════',
                  color: '94a3b8',
                  size: 16,
                }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: 'MULAI SOAL DI BAWAH BARIS INI — HAPUS PETUNJUK DI ATAS',
                  bold: true,
                  color: 'dc2626',
                  size: 20,
                }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: '══════════════════════════════════════════════════════════',
                  color: '94a3b8',
                  size: 16,
                }),
              ],
              spacing: { after: 320 },
            }),

            // ══ SEPARATOR ─────────────────────────────────────────────────────
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: 'MULAI SOAL DI BAWAH BARIS INI — HAPUS PETUNJUK DI ATAS',
                  bold: true,
                  color: 'dc2626',
                  size: 20,
                }),
              ],
              spacing: { before: 200, after: 200 },
            }),

            // ══ BLOCK 1: MULTIPLE CHOICE ═══════════════════════════════════════
            new Paragraph({ children: [new TextRun({ text: 'MULTIPLE CHOICE', bold: true, color: '1e3a8a', size: 24 })] }),
            
            // Soal 1
            new Paragraph({ children: [new TextRun({ text: 'SQ', bold: true, color: '16a34a' })] }),
            new Paragraph({
              children: [new TextRun({ text: 'Perhatikan gambar di bawah ini! Jika panjang sisi sebuah persegi adalah 7 cm, berapakah luas persegi tersebut?' })],
            }),
            new Paragraph({
              children: [new TextRun({ text: '💡 Tips: Sisipkan gambar di sini menggunakan Insert → Pictures jika soal memiliki gambar.', italics: true, color: '6b7280', size: 18 })],
            }),
            new Paragraph({ children: [new TextRun({ text: 'A. 14 cm²' })] }),
            new Paragraph({ children: [new TextRun({ text: 'B. 28 cm²' })] }),
            new Paragraph({ children: [new TextRun({ text: 'C. 49 cm²' })] }),
            new Paragraph({ children: [new TextRun({ text: 'D. 56 cm²' })] }),
            new Paragraph({ children: [new TextRun({ text: 'JAWABAN: C', bold: true })] }),
            new Paragraph({ children: [new TextRun({ text: 'BOBOT: 10' })] }),
            new Paragraph({ children: [new TextRun({ text: 'TINGKAT: SEDANG' })] }),
            new Paragraph({ children: [new TextRun({ text: 'EQ', bold: true, color: '16a34a' })] }),

            // Soal 2
            new Paragraph({ children: [new TextRun({ text: 'SQ', bold: true, color: '16a34a' })] }),
            new Paragraph({
              children: [new TextRun({ text: 'Apakah nama ibukota dari negara Indonesia saat ini?' })],
            }),
            new Paragraph({ children: [new TextRun({ text: 'A. Surabaya' })] }),
            new Paragraph({ children: [new TextRun({ text: 'B. Jakarta' })] }),
            new Paragraph({ children: [new TextRun({ text: 'C. Bandung' })] }),
            new Paragraph({ children: [new TextRun({ text: 'D. Medan' })] }),
            new Paragraph({ children: [new TextRun({ text: 'JAWABAN: B', bold: true })] }),
            new Paragraph({ children: [new TextRun({ text: 'BOBOT: 5' })] }),
            new Paragraph({ children: [new TextRun({ text: 'TINGKAT: MUDAH' })] }),
            new Paragraph({ children: [new TextRun({ text: 'EQ', bold: true, color: '16a34a' })] }),

            // Soal 3
            new Paragraph({ children: [new TextRun({ text: 'SQ', bold: true, color: '16a34a' })] }),
            new Paragraph({
              children: [new TextRun({ text: 'Planet manakah yang memiliki jarak paling dekat dari Matahari di tata surya kita?' })],
            }),
            new Paragraph({ children: [new TextRun({ text: 'A. Venus' })] }),
            new Paragraph({ children: [new TextRun({ text: 'B. Mars' })] }),
            new Paragraph({ children: [new TextRun({ text: 'C. Merkurius' })] }),
            new Paragraph({ children: [new TextRun({ text: 'D. Yupiter' })] }),
            new Paragraph({ children: [new TextRun({ text: 'JAWABAN: C', bold: true })] }),
            new Paragraph({ children: [new TextRun({ text: 'BOBOT: 10' })] }),
            new Paragraph({ children: [new TextRun({ text: 'TINGKAT: SEDANG' })] }),
            new Paragraph({ children: [new TextRun({ text: 'EQ', bold: true, color: '16a34a' })] }),

            new Paragraph({ children: [new TextRun({ text: 'END MULTIPLE CHOICE', bold: true, color: '1e3a8a', size: 20 })] }),

            new Paragraph({ text: '', spacing: { after: 200 } }),

            // ══ BLOCK 2: BENAR SALAH ═══════════════════════════════════════════
            new Paragraph({ children: [new TextRun({ text: 'BENAR SALAH', bold: true, color: '1e3a8a', size: 24 })] }),
            
            // Soal 1
            new Paragraph({ children: [new TextRun({ text: 'SQ', bold: true, color: '16a34a' })] }),
            new Paragraph({
              children: [new TextRun({ text: 'Bumi mengelilingi matahari satu kali dalam 365 hari.' })],
            }),
            new Paragraph({ children: [new TextRun({ text: 'JAWABAN: BENAR', bold: true })] }),
            new Paragraph({ children: [new TextRun({ text: 'BOBOT: 5' })] }),
            new Paragraph({ children: [new TextRun({ text: 'TINGKAT: MUDAH' })] }),
            new Paragraph({ children: [new TextRun({ text: 'EQ', bold: true, color: '16a34a' })] }),

            // Soal 2
            new Paragraph({ children: [new TextRun({ text: 'SQ', bold: true, color: '16a34a' })] }),
            new Paragraph({
              children: [new TextRun({ text: 'Secara alami, manusia bernapas menggunakan insang.' })],
            }),
            new Paragraph({ children: [new TextRun({ text: 'JAWABAN: SALAH', bold: true })] }),
            new Paragraph({ children: [new TextRun({ text: 'BOBOT: 5' })] }),
            new Paragraph({ children: [new TextRun({ text: 'TINGKAT: MUDAH' })] }),
            new Paragraph({ children: [new TextRun({ text: 'EQ', bold: true, color: '16a34a' })] }),

            // Soal 3
            new Paragraph({ children: [new TextRun({ text: 'SQ', bold: true, color: '16a34a' })] }),
            new Paragraph({
              children: [new TextRun({ text: 'Air murni akan membeku menjadi es pada suhu 0 derajat Celcius pada tekanan normal.' })],
            }),
            new Paragraph({ children: [new TextRun({ text: 'JAWABAN: BENAR', bold: true })] }),
            new Paragraph({ children: [new TextRun({ text: 'BOBOT: 10' })] }),
            new Paragraph({ children: [new TextRun({ text: 'TINGKAT: SEDANG' })] }),
            new Paragraph({ children: [new TextRun({ text: 'EQ', bold: true, color: '16a34a' })] }),

            new Paragraph({ children: [new TextRun({ text: 'END BENAR SALAH', bold: true, color: '1e3a8a', size: 20 })] }),

            new Paragraph({ text: '', spacing: { after: 200 } }),

            // ══ BLOCK 3: MULTIPLE RESPONSE ═════════════════════════════════════
            new Paragraph({ children: [new TextRun({ text: 'MULTIPLE RESPONSE', bold: true, color: '1e3a8a', size: 24 })] }),
            
            // Soal 1
            new Paragraph({ children: [new TextRun({ text: 'SQ', bold: true, color: '16a34a' })] }),
            new Paragraph({
              children: [new TextRun({ text: 'Manakah pernyataan di bawah ini yang BENAR? (Pilih semua yang benar)' })],
            }),
            new Paragraph({ children: [new TextRun({ text: 'A. Air mendidih pada suhu 100°C di tekanan normal' })] }),
            new Paragraph({ children: [new TextRun({ text: 'B. Matahari terbit di sebelah barat' })] }),
            new Paragraph({ children: [new TextRun({ text: 'C. Oksigen diperlukan untuk pembakaran' })] }),
            new Paragraph({ children: [new TextRun({ text: 'D. Gravitasi bumi menarik benda ke atas' })] }),
            new Paragraph({ children: [new TextRun({ text: 'JAWABAN: A,C', bold: true })] }),
            new Paragraph({ children: [new TextRun({ text: 'BOBOT: 15' })] }),
            new Paragraph({ children: [new TextRun({ text: 'TINGKAT: SEDANG' })] }),
            new Paragraph({ children: [new TextRun({ text: 'EQ', bold: true, color: '16a34a' })] }),

            // Soal 2
            new Paragraph({ children: [new TextRun({ text: 'SQ', bold: true, color: '16a34a' })] }),
            new Paragraph({
              children: [new TextRun({ text: 'Manakah di antara hewan-hewan di bawah ini yang tergolong sebagai mamalia?' })],
            }),
            new Paragraph({ children: [new TextRun({ text: 'A. Paus' })] }),
            new Paragraph({ children: [new TextRun({ text: 'B. Kucing' })] }),
            new Paragraph({ children: [new TextRun({ text: 'C. Elang' })] }),
            new Paragraph({ children: [new TextRun({ text: 'D. Buaya' })] }),
            new Paragraph({ children: [new TextRun({ text: 'JAWABAN: A,B', bold: true })] }),
            new Paragraph({ children: [new TextRun({ text: 'BOBOT: 10' })] }),
            new Paragraph({ children: [new TextRun({ text: 'TINGKAT: SEDANG' })] }),
            new Paragraph({ children: [new TextRun({ text: 'EQ', bold: true, color: '16a34a' })] }),

            // Soal 3
            new Paragraph({ children: [new TextRun({ text: 'SQ', bold: true, color: '16a34a' })] }),
            new Paragraph({
              children: [new TextRun({ text: 'Manakah dari negara-negara berikut yang terletak di kawasan Asia Tenggara?' })],
            }),
            new Paragraph({ children: [new TextRun({ text: 'A. Thailand' })] }),
            new Paragraph({ children: [new TextRun({ text: 'B. Jepang' })] }),
            new Paragraph({ children: [new TextRun({ text: 'C. Vietnam' })] }),
            new Paragraph({ children: [new TextRun({ text: 'D. Arab Saudi' })] }),
            new Paragraph({ children: [new TextRun({ text: 'JAWABAN: A,C', bold: true })] }),
            new Paragraph({ children: [new TextRun({ text: 'BOBOT: 10' })] }),
            new Paragraph({ children: [new TextRun({ text: 'TINGKAT: SEDANG' })] }),
            new Paragraph({ children: [new TextRun({ text: 'EQ', bold: true, color: '16a34a' })] }),

            new Paragraph({ children: [new TextRun({ text: 'END MULTIPLE RESPONSE', bold: true, color: '1e3a8a', size: 20 })] }),

            new Paragraph({ text: '', spacing: { after: 200 } }),

            // ══ BLOCK 4: ESSAY ═════════════════════════════════════════════════
            new Paragraph({ children: [new TextRun({ text: 'ESSAY', bold: true, color: '1e3a8a', size: 24 })] }),
            
            // Soal 1
            new Paragraph({ children: [new TextRun({ text: 'SQ', bold: true, color: '16a34a' })] }),
            new Paragraph({
              children: [new TextRun({ text: 'Jelaskan secara singkat apa yang dimaksud dengan fotosintesis dan sebutkan faktor-faktor yang mempengaruhinya!' })],
            }),
            new Paragraph({ children: [new TextRun({ text: 'BOBOT: 20' })] }),
            new Paragraph({ children: [new TextRun({ text: 'TINGKAT: SULIT' })] }),
            new Paragraph({ children: [new TextRun({ text: 'EQ', bold: true, color: '16a34a' })] }),

            // Soal 2
            new Paragraph({ children: [new TextRun({ text: 'SQ', bold: true, color: '16a34a' })] }),
            new Paragraph({
              children: [new TextRun({ text: 'Gambarkan dan jelaskan tahapan-tahapan utama dalam siklus hidrologi (siklus air) di bumi!' })],
            }),
            new Paragraph({ children: [new TextRun({ text: 'BOBOT: 15' })] }),
            new Paragraph({ children: [new TextRun({ text: 'TINGKAT: SEDANG' })] }),
            new Paragraph({ children: [new TextRun({ text: 'EQ', bold: true, color: '16a34a' })] }),

            // Soal 3
            new Paragraph({ children: [new TextRun({ text: 'SQ', bold: true, color: '16a34a' })] }),
            new Paragraph({
              children: [new TextRun({ text: 'Sebutkan 3 dampak utama dari pemanasan global terhadap ekosistem kutub dan kehidupan manusia!' })],
            }),
            new Paragraph({ children: [new TextRun({ text: 'BOBOT: 20' })] }),
            new Paragraph({ children: [new TextRun({ text: 'TINGKAT: SULIT' })] }),
            new Paragraph({ children: [new TextRun({ text: 'EQ', bold: true, color: '16a34a' })] }),

            new Paragraph({ children: [new TextRun({ text: 'END ESSAY', bold: true, color: '1e3a8a', size: 20 })] }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    return Buffer.from(buffer);
  }

  private createInstructionTable(): Paragraph[] {
    return [
      new Paragraph({ children: [new TextRun({ text: '' })] }),
      new Paragraph({
        children: [
          new TextRun({ text: '1. ', bold: true }),
          new TextRun({ text: 'Gunakan blok pembungkus tipe soal seperti ' }),
          new TextRun({ text: 'MULTIPLE CHOICE', bold: true, color: '1e3a8a' }),
          new TextRun({ text: ' dan diakhiri dengan ' }),
          new TextRun({ text: 'END MULTIPLE CHOICE', bold: true, color: '1e3a8a' }),
          new TextRun({ text: ' (atau gunakan block ESSAY / END ESSAY, BENAR SALAH / END BENAR SALAH, MULTIPLE RESPONSE / END MULTIPLE RESPONSE).' }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '2. ', bold: true }),
          new TextRun({ text: 'Setiap soal di dalam blok harus dimulai dengan baris ' }),
          new TextRun({ text: 'SQ', bold: true, color: '16a34a' }),
          new TextRun({ text: ' dan diakhiri dengan ' }),
          new TextRun({ text: 'EQ', bold: true, color: '16a34a' }),
          new TextRun({ text: '.' }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '3. ', bold: true }),
          new TextRun({ text: 'Tuliskan teks pertanyaan tepat di bawah penanda SQ.' }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '4. ', bold: true }),
          new TextRun({ text: 'Untuk pilihan ganda/jawaban ganda, tulis pilihan jawaban dengan awalan ' }),
          new TextRun({ text: 'A. B. C. D. ', bold: true }),
          new TextRun({ text: 'dst.' }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '5. ', bold: true }),
          new TextRun({ text: 'Tuliskan metadata di bawah soal (dan pilihan jawaban jika ada):' }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '   - Kunci Jawaban: ', bold: true }),
          new TextRun({ text: 'JAWABAN: C', bold: true }),
          new TextRun({ text: ' (atau JAWABAN: BENAR | SALAH, atau JAWABAN: A,C untuk jawaban ganda)' }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '   - Bobot Nilai: ', bold: true }),
          new TextRun({ text: 'BOBOT: 10', bold: true }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '   - Kesulitan: ', bold: true }),
          new TextRun({ text: 'TINGKAT: MUDAH', bold: true }),
          new TextRun({ text: ' (pilihan: MUDAH | SEDANG | SULIT)' }),
        ],
      }),
    ];
  }
}
