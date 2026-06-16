'use client';

import { FC, ReactNode } from 'react';
import {
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Textarea,
  Select,
  Box,
} from '@chakra-ui/react';

interface FormFieldProps {
  label?: string;
  error?: string;
  isRequired?: boolean;
  children: ReactNode;
}

export const FormField: FC<FormFieldProps> = ({ label, error, isRequired, children }) => (
  <FormControl isInvalid={!!error}>
    {label && <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">{label} {isRequired && <span style={{ color: 'red' }}>*</span>}</FormLabel>}
    {children}
    {error && <FormErrorMessage fontSize="xs" mt={1}>{error}</FormErrorMessage>}
  </FormControl>
);

interface ChakraInputProps extends React.ComponentProps<typeof Input> {
  label?: string;
  error?: string;
  isRequired?: boolean;
  helperText?: string;
}

export const ChakraInput: FC<ChakraInputProps> = ({ label, error, isRequired, helperText, ...props }) => (
  <FormField label={label} error={error} isRequired={isRequired}>
    <Input
      borderRadius="lg"
      borderColor="gray.200"
      _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }}
      {...props}
    />
  </FormField>
);

interface ChakraTextareaProps extends React.ComponentProps<typeof Textarea> {
  label?: string;
  error?: string;
  isRequired?: boolean;
}

export const ChakraTextarea: FC<ChakraTextareaProps> = ({ label, error, isRequired, ...props }) => (
  <FormField label={label} error={error} isRequired={isRequired}>
    <Textarea
      borderRadius="lg"
      borderColor="gray.200"
      _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }}
      {...props}
    />
  </FormField>
);

interface ChakraSelectProps extends React.ComponentProps<typeof Select> {
  label?: string;
  error?: string;
  isRequired?: boolean;
  options: Array<{ value: string | number; label: string }>;
  placeholder?: string;
}

export const ChakraSelect: FC<ChakraSelectProps> = ({
  label,
  error,
  isRequired,
  options,
  placeholder = 'Pilih opsi',
  ...props
}) => (
  <FormField label={label} error={error} isRequired={isRequired}>
    <Select
      borderRadius="lg"
      borderColor="gray.200"
      _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }}
      placeholder={placeholder}
      {...props}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </Select>
  </FormField>
);
