'use client';

import { FC, useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Portal,
  Stack,
  Text,
} from '@chakra-ui/react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
  description?: string;
}

interface ChakraComboBoxProps {
  label?: string;
  error?: string;
  isRequired?: boolean;
  options: SelectOption[];
  value: string | number | null;
  onChange: (value: string | number | null) => void;
  placeholder?: string;
  isDisabled?: boolean;
  isClearable?: boolean;
}

export const ChakraComboBox: FC<ChakraComboBoxProps> = ({
  label,
  error,
  isRequired,
  options,
  value,
  onChange,
  placeholder = 'Pilih atau ketik...',
  isDisabled = false,
  isClearable = true,
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

  const selectedOption = options.find((opt) => opt.value === value);
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <FormControl isInvalid={!!error}>
      {label && (
        <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
          {label} {isRequired && <span style={{ color: 'red' }}>*</span>}
        </FormLabel>
      )}

      <Box ref={containerRef} position="relative">
        <Button
          ref={buttonRef}
          w="full"
          onClick={() => setIsOpen(!isOpen)}
          isDisabled={isDisabled}
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
            {selectedOption ? (
              <Box>
                <Text fontSize="sm" fontWeight="medium" color="gray.900">
                  {selectedOption.label}
                </Text>
                {selectedOption.description && (
                  <Text fontSize="xs" color="gray.500">
                    {selectedOption.description}
                  </Text>
                )}
              </Box>
            ) : (
              <Text color="gray.500" fontSize="sm">
                {placeholder}
              </Text>
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
                  autoFocus
                />
              </Box>

              <Stack gap={0}>
                {isClearable && value && (
                  <Flex
                    align="center"
                    gap={3}
                    p={2.5}
                    cursor="pointer"
                    _hover={{ bg: 'red.50' }}
                    onClick={() => {
                      onChange(null);
                      setIsOpen(false);
                    }}
                    transition="background 0.15s"
                    borderBottom="1px solid"
                    borderColor="gray.100"
                  >
                    <Text fontSize="sm" color="red.600" fontWeight="medium">
                      ✕ Hapus pilihan
                    </Text>
                  </Flex>
                )}

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
                      onClick={() => {
                        onChange(option.value);
                        setIsOpen(false);
                        setSearchTerm('');
                      }}
                      transition="background 0.15s"
                    >
                      {value === option.value && (
                        <Check size={18} color="indigo.500" flexShrink={0} />
                      )}
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

      {error && <FormErrorMessage fontSize="xs" mt={1}>{error}</FormErrorMessage>}
    </FormControl>
  );
};
