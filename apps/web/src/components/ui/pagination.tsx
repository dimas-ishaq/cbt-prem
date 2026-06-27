'use client';

import * as React from 'react';
import { Button, Flex, HStack, IconButton, Pagination as ChakraPagination, Text, createListCollection, Select } from '@chakra-ui/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationRootProps extends ChakraPagination.RootProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'outline' | 'solid' | 'subtle' | 'ghost';
}

export const PaginationRoot = React.forwardRef<HTMLDivElement, PaginationRootProps>(function PaginationRoot(props, ref) {
  const { children, ...rest } = props;
  return <ChakraPagination.Root ref={ref} {...rest}>{children}</ChakraPagination.Root>;
});

export const PaginationEllipsis = React.forwardRef<HTMLDivElement, ChakraPagination.EllipsisProps>(function PaginationEllipsis(props, ref) {
  return (
    <ChakraPagination.Ellipsis ref={ref} {...props} asChild>
      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '32px', height: '32px', color: 'var(--chakra-colors-text-muted)' }}>...</span>
    </ChakraPagination.Ellipsis>
  );
});

export const PaginationItem = React.forwardRef<HTMLButtonElement, ChakraPagination.ItemProps & { variant?: 'outline' | 'solid' }>(function PaginationItem(props, ref) {
  const { variant = 'outline', ...rest } = props;
  const isSolid = variant === 'solid';

  return (
    <ChakraPagination.Item ref={ref} {...rest} asChild>
      <Button
        size="sm"
        cursor="pointer"
        minW="32px"
        h="32px"
        px={3}
        borderRadius="lg"
        variant="outline"
        bg={isSolid ? 'primary' : 'bg.elevated'}
        color={isSolid ? 'on-primary' : 'text.primary'}
        borderColor={isSolid ? 'primary' : 'border.default'}
        _hover={{ bg: isSolid ? 'primary-hover' : 'bg.surface' }}
        _active={{ transform: 'translateY(0)' }}
      >
        {props.value}
      </Button>
    </ChakraPagination.Item>
  );
});

export const PaginationPrevTrigger = React.forwardRef<HTMLButtonElement, ChakraPagination.PrevTriggerProps>(function PaginationPrevTrigger(props, ref) {
  return (
    <ChakraPagination.PrevTrigger ref={ref} {...props} asChild>
      <IconButton
        variant="outline"
        size="sm"
        cursor="pointer"
        aria-label="Previous page"
        bg="bg.elevated"
        color="text.primary"
        borderColor="border.default"
        _hover={{ bg: 'bg.surface', borderColor: 'border.brand' }}
      >
        <ChevronLeft size={16} />
      </IconButton>
    </ChakraPagination.PrevTrigger>
  );
});

export const PaginationNextTrigger = React.forwardRef<HTMLButtonElement, ChakraPagination.NextTriggerProps>(function PaginationNextTrigger(props, ref) {
  return (
    <ChakraPagination.NextTrigger ref={ref} {...props} asChild>
      <IconButton
        variant="outline"
        size="sm"
        cursor="pointer"
        aria-label="Next page"
        bg="bg.elevated"
        color="text.primary"
        borderColor="border.default"
        _hover={{ bg: 'bg.surface', borderColor: 'border.brand' }}
      >
        <ChevronRight size={16} />
      </IconButton>
    </ChakraPagination.NextTrigger>
  );
});

export const PaginationPageText = React.forwardRef<HTMLParagraphElement, ChakraPagination.PageTextProps>(function PaginationPageText(props, ref) {
  return <ChakraPagination.PageText ref={ref} {...props} />;
});

export const Pagination = { Root: PaginationRoot, Ellipsis: PaginationEllipsis, Item: PaginationItem, PrevTrigger: PaginationPrevTrigger, NextTrigger: PaginationNextTrigger, PageText: PaginationPageText };

interface TablePaginationProps {
  currentPage: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export function TablePagination({ currentPage, totalCount, pageSize, onPageChange, onPageSizeChange }: TablePaginationProps) {
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const sizeCollection = React.useMemo(() => createListCollection({ items: [{ label: '10', value: '10' }, { label: '25', value: '25' }, { label: '50', value: '50' }, { label: '100', value: '100' }] }), []);

  const fromIndex = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const toIndex = Math.min(currentPage * pageSize, totalCount);

  return (
    <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align="center" p={4} gap={4} borderTop="1px solid" borderColor="border.default" bg="bg.surface" width="full">
      <HStack gap={2}>
        <Text fontSize="xs" color="text.secondary" fontWeight="medium">
          Menampilkan <Text as="span" fontWeight="bold" color="text.primary">{fromIndex}-{toIndex}</Text> dari <Text as="span" fontWeight="bold" color="text.primary">{totalCount}</Text> data
        </Text>

        {onPageSizeChange && (
          <Select.Root collection={sizeCollection} value={[pageSize.toString()]} onValueChange={(details) => { const val = details.value[0]; if (val) onPageSizeChange(parseInt(val, 10)); }} size="xs" width="120px">
            <Select.HiddenSelect />
            <Select.Control>
              <Select.Trigger>
                <Select.ValueText placeholder="10" />
              </Select.Trigger>
            </Select.Control>
            <Select.Positioner>
              <Select.Content zIndex={1500}>
                {sizeCollection.items.map((item) => (
                  <Select.Item key={item.value} item={item}>{item.label}</Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Select.Root>
        )}
      </HStack>

      <PaginationRoot count={totalCount} pageSize={pageSize} page={currentPage} onPageChange={(details) => onPageChange(details.page)}>
        <HStack gap="1.5">
          <PaginationPrevTrigger />
          <ChakraPagination.Context>
            {({ pages }) =>
              pages.map((page, index) =>
                page.type === 'page' ? (
                  <PaginationItem key={index} type="page" value={page.value} variant={currentPage === page.value ? 'solid' : 'outline'} />
                ) : (
                  <PaginationEllipsis key={index} index={index} />
                )
              )
            }
          </ChakraPagination.Context>
          <PaginationNextTrigger />
        </HStack>
      </PaginationRoot>
    </Flex>
  );
}
