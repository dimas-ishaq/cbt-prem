import type { UserData } from '../user-types';
import { ROLE_BADGE } from '../user-utils';

export function UserRoleBadge({ role }: { role: UserData['role'] }) {
  const cfg = ROLE_BADGE[role] ?? { label: role, color: 'text-gray-700', bg: 'bg-gray-100' };
  return (
    <span
      style={{
        padding: '2px 10px',
        borderRadius: '999px',
        fontSize: '0.72rem',
        fontWeight: 600,
        letterSpacing: '0.02em',
        background: cfg.bg.replace('bg-', '#').replace('-100', ''),
        color: cfg.color.replace('text-', '#').replace('-700', ''),
      }}
      className={`${cfg.bg} ${cfg.color}`}
    >
      {cfg.label}
    </span>
  );
}
