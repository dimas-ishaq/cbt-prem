'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { Box, Flex, Text, Button, Heading } from '@chakra-ui/react';

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
}

interface ConfirmationContextType {
  confirmDialog: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmationContext = createContext<ConfirmationContextType | null>(null);

export const useConfirm = () => {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmationProvider');
  }
  return context.confirmDialog;
};

export const ConfirmationProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ title: '' });
  const [resolver, setResolver] = useState<(value: boolean) => void>();

  const confirmDialog = (opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise((resolve) => {
      setResolver(() => resolve);
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolver) resolver(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolver) resolver(false);
  };

  return (
    <ConfirmationContext.Provider value={{ confirmDialog }}>
      {children}

      {isOpen && (
        <Box
          position="fixed"
          inset={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={9999}
          p={4}
          bg="blackAlpha.600"
          backdropFilter="blur(4px)"
        >
          <Box bg="bg.surface" borderRadius="xl" shadow="2xl" w="full" maxW="md" overflow="hidden" borderWidth="1px" borderColor="border.default">
            <Flex px={6} py={4} borderBottomWidth="1px" borderColor="border.default" justify="space-between" align="center">
              <Heading size="md" fontWeight="bold" color="text.primary">
                {options.title}
              </Heading>
            </Flex>
            <Box p={6}>
              <Text color="text.secondary">
                {options.description || 'Apakah Anda yakin?'}
              </Text>
            </Box>
            <Flex px={6} py={4} bg="bg.elevated" justify="flex-end" gap={3}>
              <Button onClick={handleCancel} variant="outline" color="text.primary" bg="bg.surface" borderRadius="lg" borderColor="border.default" cursor="pointer">
                {options.cancelText || 'Batal'}
              </Button>
              <Button onClick={handleConfirm} bg="status.danger.text" color="text.inverted" borderRadius="lg" _hover={{ bg: 'status.danger.text' }} cursor="pointer">
                {options.confirmText || 'Ya, Lanjutkan'}
              </Button>
            </Flex>
          </Box>
        </Box>
      )}
    </ConfirmationContext.Provider>
  );
};
