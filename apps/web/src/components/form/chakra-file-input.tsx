'use client';

import { FC, useRef, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  FormErrorMessage,
  HStack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Upload, File, Trash2 } from 'lucide-react';

interface ChakraFileInputProps {
  label?: string;
  error?: string;
  isRequired?: boolean;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  value?: File[];
  onChange?: (files: File[]) => void;
  onRemove?: (index: number) => void;
  disabled?: boolean;
  helperText?: string;
}

export const ChakraFileInput: FC<ChakraFileInputProps> = ({
  label,
  error,
  isRequired,
  accept = 'image/*',
  multiple = false,
  maxSize = 5,
  value = [],
  onChange,
  onRemove,
  disabled = false,
  helperText,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter((file) => {
      if (file.size > maxSize * 1024 * 1024) {
        console.warn(`File ${file.name} terlalu besar. Maksimal ${maxSize}MB.`);
        return false;
      }
      return true;
    });

    if (!multiple && validFiles.length > 0) {
      onChange?.([validFiles[0]]);
    } else if (multiple) {
      onChange?.([...value, ...validFiles]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileChange(e.dataTransfer.files);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes, k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <FormControl isInvalid={!!error}>
      {label && (
        <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
          {label} {isRequired && <span style={{ color: 'red' }}>*</span>}
        </FormLabel>
      )}

      {/* File Input (Hidden) */}
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        onChange={(e) => handleFileChange(e.target.files)}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      {/* Drag & Drop Area */}
      <Box
        p={6}
        borderWidth="2px"
        borderStyle="dashed"
        borderColor={dragOver ? 'indigo.500' : 'gray.200'}
        borderRadius="lg"
        bg={dragOver ? 'indigo.50' : 'gray.50'}
        transition="all 0.2s"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        cursor={disabled ? 'not-allowed' : 'pointer'}
        opacity={disabled ? 0.5 : 1}
      >
        <VStack gap={3} onClick={() => !disabled && inputRef.current?.click()}>
          <Box p={2} bg="indigo.100" borderRadius="lg" color="indigo.600">
            <Upload size={24} />
          </Box>
          <VStack gap={1} textAlign="center">
            <Text fontWeight="semibold" color="gray.900" fontSize="sm">
              Klik untuk upload atau drag & drop
            </Text>
            <Text fontSize="xs" color="gray.500">
              Format: {accept} | Maksimal: {maxSize}MB
            </Text>
          </VStack>
        </VStack>
      </Box>

      {helperText && (
        <Text fontSize="xs" color="gray.500" mt={2}>
          {helperText}
        </Text>
      )}

      {/* File List */}
      {value.length > 0 && (
        <VStack gap={2} mt={4} align="stretch">
          {value.map((file, idx) => (
            <HStack
              key={idx}
              p={3}
              bg="gray.50"
              borderRadius="lg"
              borderWidth="1px"
              borderColor="gray.200"
              justify="space-between"
            >
              <HStack gap={2}>
                <File size={16} color="gray.500" />
                <VStack gap={0} align="start">
                  <Text fontSize="sm" fontWeight="medium" color="gray.900">
                    {file.name}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {formatFileSize(file.size)}
                  </Text>
                </VStack>
              </HStack>
              {onRemove && (
                <Button
                  size="sm"
                  variant="ghost"
                  colorScheme="red"
                  onClick={() => onRemove(idx)}
                  icon={<Trash2 size={14} />}
                  aria-label="Remove file"
                />
              )}
            </HStack>
          ))}
        </VStack>
      )}

      {error && <FormErrorMessage fontSize="xs" mt={1}>{error}</FormErrorMessage>}
    </FormControl>
  );
};
