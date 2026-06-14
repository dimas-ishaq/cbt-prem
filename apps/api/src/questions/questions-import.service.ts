import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as mammoth from 'mammoth';
import { QuestionType } from '@prisma/client';

@Injectable()
export class QuestionsImportService {
  constructor(private prisma: PrismaService) {}

  async importFromDocx(bankId: string, file: Express.Multer.File) {
    const { value: html } = await mammoth.convertToHtml({ buffer: file.buffer });
    
    // Simple parsing logic based on moodle-converter
    const questions = this.parseQuestions(html);
    
    if (questions.length === 0) {
      throw new BadRequestException('No questions found in the document. Ensure you use SQ and EQ markers.');
    }

    return this.prisma.$transaction(async (tx) => {
      const createdQuestions: any[] = [];
      for (const q of questions) {
        const created = await tx.question.create({
          data: {
            questionBankId: bankId,
            content: q.content,
            type: q.type,
            options: {
              create: q.options,
            },
          },
        });
        createdQuestions.push(created);
      }
      return createdQuestions;
    });
  }

  private parseQuestions(html: string) {
    // Basic regex-based parsing similar to convert.py
    // Look for <p>SQ</p>...<p>EQ</p>
    const sqEqPattern = /<p[^>]*>\s*SQ\s*<\/p>(.*?)<p[^>]*>\s*EQ\s*<\/p>/gsi;
    const matches = [...html.matchAll(sqEqPattern)];
    
    const parsed: any[] = [];
    for (const match of matches) {
      const content = match[1];
      
      // Detect correct answer ANS: X
      const ansMatch = content.match(/(?:ANS|ANSWER)\s*:\s*([A-Z])/i);
      const correctLetter = ansMatch ? ansMatch[1].toUpperCase() : null;
      
      // Remove answer line from content
      let questionHtml = content.replace(/<p[^>]*>\s*(?:ANS|ANSWER)\s*:\s*[A-Z]\s*<\/p>/gi, '').trim();
      
      // Extract options (A., B., C., D.)
      const options: any[] = [];
      const pBlocks = questionHtml.match(/<p[^>]*>.*?<\/p>/gi) || [];
      const questionTextParts: string[] = [];
      
      for (const p of pBlocks) {
        const plainText = p.replace(/<[^>]*>/g, '').trim();
        const optMatch = plainText.match(/^([A-Z])\s*\.\s*(.*)/i);
        
        if (optMatch) {
          const letter = optMatch[1].toUpperCase();
          const optContent = p.replace(/<p[^>]*>\s*[A-Z]\s*\.\s*/i, '').replace(/<\/p>/, '').trim();
          options.push({
            content: optContent,
            isCorrect: letter === correctLetter,
            order: letter.charCodeAt(0) - 65,
          });
        } else {
          questionTextParts.push(p);
        }
      }
      
      // Final question text is the paragraphs that aren't options
      const finalQuestionHtml = questionTextParts.join('\n');
      
      parsed.push({
        content: finalQuestionHtml,
        type: options.length > 0 ? QuestionType.PILIHAN_GANDA : QuestionType.ESSAY,
        options,
      });
    }
    
    return parsed;
  }
}
