import { createToaster } from '@chakra-ui/react';

export type ToasterOptions = {
  title: string;
  description?: string;
  type?: 'success' | 'info' | 'warning' | 'error' | 'loading';
  duration?: number;
  closable?: boolean;
  action?: { label: string; onClick: () => void };
};

export const toaster = createToaster({
  placement: 'top-end',
  overlap: true,
  gap: 16,
});

const createToast = (options: ToasterOptions | string, type: ToasterOptions['type']) => {
  const normalized = typeof options === 'string' ? { title: options } : options;
  toaster.create({
    ...normalized,
    type,
  });
};

export const toast = {
  success: (options: ToasterOptions | string) => createToast(options, 'success'),
  error: (options: ToasterOptions | string) => createToast(options, 'error'),
  info: (options: ToasterOptions | string) => createToast(options, 'info'),
  warning: (options: ToasterOptions | string) => createToast(options, 'warning'),
  closeAll: () => {
    toaster.dismiss();
  },
};

