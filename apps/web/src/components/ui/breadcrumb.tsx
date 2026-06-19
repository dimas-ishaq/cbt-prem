"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Box, HStack, Text } from "@chakra-ui/react";
import { useTranslation } from 'react-i18next';

const segmentLabels: Record<string, string> = {
  dashboard: 'dashboard',
  exams: 'exams',
  create: 'create',
  edit: 'edit',
  'question-banks': 'questionBanks',
  'exam-groups': 'examGroups',
  'exam-cards': 'examCards',
  monitoring: 'monitoring',
  reports: 'reports',
  generate: 'generate',
  results: 'results',
  sessions: 'sessions',
  majors: 'majors',
  logs: 'logs',
  settings: 'settings',
  roles: 'roles',
  users: 'users',
  rombels: 'rombels',
  subjects: 'subjects',
  admin: 'admin',
};

const isDynamicSegment = (segment: string) => /^\[.+\]$/.test(segment) || /^[a-f0-9-]{6,}$/i.test(segment);

export function Breadcrumb() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const items = segments
    .filter((segment) => segment !== '(teacher)' && segment !== '(student)' && segment !== '(auth)')
    .map((segment, index, arr) => {
      const href = "/" + arr.slice(0, index + 1).join("/");
      const isLast = index === arr.length - 1;
      let label = segmentLabels[segment] ? t(segmentLabels[segment]) : decodeURIComponent(segment);
      if (isDynamicSegment(segment)) label = t('detail');
      return { href, label, isLast };
    });

  return (
    <HStack gap={2} wrap="wrap" color="gray.500" fontSize="sm" mt={2}>
      {items.map((item, index) => (
        <HStack key={`${item.href}-${index}`} gap={2}>
          {index > 0 && <ChevronRight size={14} />}
          {item.isLast ? (
            <Text color="gray.700" fontWeight="semibold" textTransform="capitalize">
              {item.label}
            </Text>
          ) : (
            <Link href={item.href}>
              <Box _hover={{ color: 'gray.700' }} transition="color 0.15s">
                {item.label}
              </Box>
            </Link>
          )}
        </HStack>
      ))}
    </HStack>
  );
}
