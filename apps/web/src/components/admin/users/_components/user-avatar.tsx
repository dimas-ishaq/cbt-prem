import { Flex } from '@chakra-ui/react';
import type { UserData } from '../user-types';
import { AVATAR_COLORS } from '../user-utils';

export function UserAvatar({ name, role }: { name: string; role: UserData['role'] }) {
  const initials = name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
  return (
    <Flex w={9} h={9} borderRadius="full" align="center" justify="center" fontWeight="bold" fontSize="xs" color="white" flexShrink={0} style={{ background: AVATAR_COLORS[role] ?? '#6b7280' }}>
      {initials}
    </Flex>
  );
}
