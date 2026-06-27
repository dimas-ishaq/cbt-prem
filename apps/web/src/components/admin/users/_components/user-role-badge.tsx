import { Badge } from '@chakra-ui/react';
import type { UserData } from '../user-types';
import { ROLE_BADGE } from '../user-utils';

export function UserRoleBadge({ role }: { role: UserData['role'] }) {
  const cfg = ROLE_BADGE[role] ?? { label: role, color: 'text.primary', bg: 'bg.subtle' };
  return (
    <Badge
      px={2.5}
      py={1}
      borderRadius="badge"
      fontSize="xs"
      fontWeight="semibold"
      bg={cfg.bg}
      color={cfg.color}
      borderWidth="1px"
      borderColor="border.default"
    >
      {cfg.label}
    </Badge>
  );
}