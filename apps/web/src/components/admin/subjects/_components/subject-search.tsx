import { Box, Input } from '@chakra-ui/react';
import { Search } from 'lucide-react';

interface SubjectSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function SubjectSearch({ value, onChange }: SubjectSearchProps) {
  return (
    <Box bg="bg.surface" p={4} borderRadius="card" borderWidth="1px" borderColor="border.default" shadow="card-light">
      <Box position="relative">
        <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color="text.muted" pointerEvents="none">
          <Search size={18} />
        </Box>
        <Input
          placeholder="Cari mata pelajaran berdasarkan nama, kode, atau deskripsi..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          pl={10}
          borderRadius="lg"
          borderColor="border.default"
          bg="bg.elevated"
          color="text.primary"
          _placeholder={{ color: 'text.muted' }}
          _focusVisible={{ borderColor: 'brand.solid', boxShadow: '0 0 0 1px var(--chakra-colors-brand-solid)' }}
        />
      </Box>
    </Box>
  );
}