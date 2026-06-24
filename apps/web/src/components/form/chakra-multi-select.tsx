'use client';

import { FC, useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Field,
  Input,
  Portal,
  Stack,
  Text,
} from '@chakra-ui/react';
import { ChevronDown, Check, X } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
  description?: string;
}

interface ChakraMultiSelectProps {
  label?: string;
  error?: string;
  isRequired?: boolean;
  options: SelectOption[];
  value: (string | number)[];
  onChange: (values: (string | number)[]) => void;
  placeholder?: string;
  isDisabled?: boolean;
}

export const ChakraMultiSelect: FC<ChakraMultiSelectProps> = ({
  label,
  error,
  isRequired,
  options,
  value,
  onChange,
  placeholder = 'Pilih opsi',
  isDisabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setMenuPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left,
          width: rect.width,
        });
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedLabels = options
    .filter((opt) => value.includes(opt.value))
    .map((opt) => opt.label);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOption = (optValue: string | number) => {
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  };

  return (
    <Field.Root invalid={!!error}>
      {label && (
        <Field.Label fontSize="sm" fontWeight="medium" color="gray.700">
          {label} {isRequired && <span style={{ color: 'red' }}>*</span>}
        </Field.Label>
      )}

      <Box ref={containerRef} position="relative">
        <Button
          ref={buttonRef}
          w="full"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isDisabled}
          borderRadius="lg"
          borderColor="gray.200"
          borderWidth="1px"
          bg={isOpen ? 'gray.50' : 'white'}
          textAlign="left"
          justifyContent="space-between"
          height="auto"
          minH="40px"
          p={2.5}
          _hover={{ borderColor: 'gray.300' }}
          _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }}
        >
          <Box flex={1}>
            {selectedLabels.length === 0 ? (
              <Text color="gray.500" fontSize="sm">
                {placeholder}
              </Text>
            ) : (
              <Flex gap={2} wrap="wrap">
                {selectedLabels.map((label, idx) => (
                  <Box
                    key={idx}
                    bg="indigo.50"
                    color="indigo.700"
                    px={2.5}
                    py={1}
                    borderRadius="md"
                    fontSize="xs"
                    fontWeight="medium"
                  >
                    {label}
                  </Box>
                ))}
              </Flex>
            )}
          </Box>
          <ChevronDown
            size={18}
            color="gray.400"
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          />
        </Button>

        {isOpen && (
          <Portal>
            <Box
              position="fixed"
              top={`${menuPosition.top}px`}
              left={`${menuPosition.left}px`}
              width={`${menuPosition.width}px`}
              bg="white"
              borderRadius="lg"
              borderWidth="1px"
              borderColor="gray.200"
              shadow="lg"
              zIndex={1000}
              maxH="300px"
              overflowY="auto"
            >
              <Box p={2}>
                <Input
                  placeholder="Cari..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  borderRadius="md"
                  size="sm"
                  mb={2}
                />
              </Box>

              <Stack gap={0}>
                {filteredOptions.length === 0 ? (
                  <Text p={3} fontSize="sm" color="gray.500" textAlign="center">
                    Tidak ada opsi
                  </Text>
                ) : (
                  filteredOptions.map((option) => (
                    <Flex
                      key={option.value}
                      align="center"
                      gap={3}
                      p={2.5}
                      cursor="pointer"
                      _hover={{ bg: 'gray.50' }}
                      onClick={() => toggleOption(option.value)}
                      transition="background 0.15s"
                    >
                      <Box
                        w={5}
                        h={5}
                        borderWidth="1px"
                        borderColor="gray.300"
                        borderRadius="md"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        bg={value.includes(option.value) ? 'indigo.500' : 'white'}
                        flexShrink={0}
                      >
                        {value.includes(option.value) && (
                          <Check size={14} color="white" />
                        )}
                      </Box>
                      <Box flex={1}>
                        <Text fontSize="sm" fontWeight="medium" color="gray.900">
                          {option.label}
                        </Text>
                        {option.description && (
                          <Text fontSize="xs" color="gray.500">
                            {option.description}
                          </Text>
                        )}
                      </Box>
                    </Flex>
                  ))
                )}
              </Stack>
            </Box>
          </Portal>
        )}
      </Box>

      {error && <Field.ErrorText fontSize="xs" mt={1}>{error}</Field.ErrorText>}
    </Field.Root>
  );
};
