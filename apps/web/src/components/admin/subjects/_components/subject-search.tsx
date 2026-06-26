import { Box, Input } from '@chakra-ui/react';
import { Search } from 'lucide-react';

interface SubjectSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function SubjectSearch({ value, onChange }: SubjectSearchProps) {
  return (
    <Box bg="white" p={4} borderRadius="xl" borderWidth="1px" borderColor="gray.100" shadow="sm">
      <Box position="relative">
        <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color="gray.400" pointerEvents="none">
          <Search size={18} />
        </Box>
        <Input
          placeholder="Cari mata pelajaran berdasarkan nama, kode, atau deskripsi..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          pl={10}
          borderRadius="lg"
          borderColor="gray.200"
          _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }}
        />
      </Box>
    </Box>
  );
}