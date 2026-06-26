import { HStack, IconButton } from '@chakra-ui/react';
import { Pencil, Trash2 } from 'lucide-react';

interface SubjectActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

export function SubjectActions({ onEdit, onDelete }: SubjectActionsProps) {
  return (
    <HStack gap={2} justify="flex-end">
      <IconButton aria-label="Edit mata pelajaran" variant="ghost" color="indigo.600" _hover={{ bg: 'indigo.50' }} size="sm" borderRadius="lg" onClick={onEdit} cursor="pointer">
        <Pencil size={18} />
      </IconButton>
      <IconButton aria-label="Delete mata pelajaran" variant="ghost" color="red.600" _hover={{ bg: 'red.50' }} size="sm" borderRadius="lg" onClick={onDelete} cursor="pointer">
        <Trash2 size={18} />
      </IconButton>
    </HStack>
  );
}