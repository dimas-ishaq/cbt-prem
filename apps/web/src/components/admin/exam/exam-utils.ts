type SessionAnswer = {
  questionId: string;
  essayAnswer?: string | null;
  selectedOptionId?: string | null;
  selectedOption?: string | null;
};

type SessionData = {
  answers?: SessionAnswer[];
};

type ExamConfigSource = {
  id: string;
  sebBrowserKey?: string | null;
  sebConfigKey?: string | null;
};

type PendingExamAnswer = {
  answer: string;
  type?: string;
  questionObjId?: string;
  revision: number;
  updatedAt: number;
};

export type PendingExamAnswerMap = Record<string, PendingExamAnswer>;

export type ExamMutationErrorKind = 'already-completed' | 'not-found' | 'locked' | 'server-error' | 'bad-request' | 'unknown';

export function parseSessionAnswers(data: SessionData | null | undefined): Record<string, string> {
  const existingAnswers: Record<string, string> = {};

  data?.answers?.forEach((ans) => {
    if (ans.essayAnswer) {
      existingAnswers[ans.questionId] = ans.essayAnswer;
    } else if (ans.selectedOptionId) {
      existingAnswers[ans.questionId] = ans.selectedOptionId;
    } else if (ans.selectedOption) {
      existingAnswers[ans.questionId] = ans.selectedOption;
    }
  });

  return existingAnswers;
}

export function parsePendingExamAnswers(data: unknown): PendingExamAnswerMap {
  if (!data || typeof data !== 'object') return {};

  const entries = Object.entries(data as Record<string, unknown>);
  const result: PendingExamAnswerMap = {};

  entries.forEach(([questionId, value]) => {
    if (!value || typeof value !== 'object') return;
    const item = value as Partial<PendingExamAnswer>;
    if (typeof item.answer !== 'string') return;

    result[questionId] = {
      answer: item.answer,
      type: typeof item.type === 'string' ? item.type : undefined,
      questionObjId: typeof item.questionObjId === 'string' ? item.questionObjId : undefined,
      revision: Number.isFinite(item.revision) ? Number(item.revision) : 0,
      updatedAt: Number.isFinite(item.updatedAt) ? Number(item.updatedAt) : 0,
    };
  });

  return result;
}

export function mergeRestoredAnswers(currentAnswers: Record<string, string>, backup: Record<string, string>, validQuestionIds: Set<string>) {
  const merged = { ...currentAnswers };
  let restoredCount = 0;
  let skippedCount = 0;

  Object.entries(backup).forEach(([questionId, answer]) => {
    if (!validQuestionIds.has(questionId)) {
      skippedCount += 1;
      return;
    }

    if (merged[questionId]?.trim()) {
      return;
    }

    if (typeof answer === 'string' && answer.trim()) {
      merged[questionId] = answer;
      restoredCount += 1;
    }
  });

  return { answers: merged, restoredCount, skippedCount };
}

export function classifyExamMutationError(error: unknown): { status: number | null; kind: ExamMutationErrorKind; message: string } {
  const response = error && typeof error === 'object' && 'response' in error ? (error as { response?: { status?: number; data?: { message?: unknown; error?: unknown } } }).response : undefined;
  const status = response?.status ?? null;
  const message = String(response?.data?.message ?? response?.data?.error ?? (error instanceof Error ? error.message : ''));
  const normalized = message.toLowerCase();

  if (status === 400) {
    if (normalized.includes('already submitted') || normalized.includes('not in progress') || normalized.includes('locked')) {
      return { status, kind: 'already-completed', message };
    }
    return { status, kind: 'bad-request', message };
  }

  if (status === 404) {
    return { status, kind: 'not-found', message };
  }

  if (status && status >= 500) {
    return { status, kind: 'server-error', message };
  }

  return { status, kind: 'unknown', message };
}

export function generateSEBConfig(exam: ExamConfigSource): string {
  const config = {
    general: {
      startURL: typeof window !== 'undefined' ? `${window.location.origin}/exams/${exam.id}` : '',
      sebServerURL: '',
      browserExamKeys: exam.sebBrowserKey ? [exam.sebBrowserKey] : [],
      sebConfigKey: exam.sebConfigKey || '',
      allowQuit: true,
      quitURL: typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : '',
      quitURLConfirm: true,
    },
    browser: {
      allowBrowsingBackForward: false,
      allowNavigationToDataURL: false,
      allowNavigationToNewBrowserWindow: false,
      allowSpellCheck: false,
      userAgent: 'SEB_CBT_Enterprise',
    },
    downUploads: {
      allowUploads: false,
      downloadPDFFiles: false,
      downloadDirectory: '',
      openSaveDialogAs: false,
    },
    examSession: {
      allowReconfiguring: true,
      clearBrowserSession: 1,
      browserSessionToken: exam.id,
      examKeySalt: exam.sebConfigKey || 'cbt-enterprise',
    },
    keys: {
      escKeyQuit: 1,
      insertKeyQuit: 0,
    },
    printing: {
      allowPrint: false,
    },
    security: {
      enableAppSwitcherBlacklist: true,
      enableCopy: false,
      enableCut: false,
      enablePaste: false,
      enableRightClick: false,
      showKeyboardButton: false,
    },
    window: {
      allowFullScreen: true,
      enableCursorLocation: true,
      mainBrowserWindowPosition: [0, 0],
      mainBrowserWindowSize: [0, 0],
      allowChangingWindowPosition: false,
      enableAltEnterFullScreen: false,
      forceQuitInTimeInSeconds: 0,
    },
  };

  return JSON.stringify(config, null, 2);
}

