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

