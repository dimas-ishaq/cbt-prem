import { Badge, Box, Button, Checkbox, Flex, Heading, HStack, Input, Stack, Text } from '@chakra-ui/react';
import { ChevronRight } from 'lucide-react';
import type { Menu, SubMenu } from '../role-types';

interface PermissionMatrixProps {
  matrix: Menu[];
  searchTerm: string;
  selectedPermissionIds: string[];
  onSearchChange: (value: string) => void;
  onPermissionToggle: (permissionId: string) => void;
  onSelectMenuAll: (menu: Menu, isSelected: boolean) => void;
  onSelectSubMenuAll: (subMenu: SubMenu, isSelected: boolean) => void;
}

export function PermissionMatrix({ matrix, searchTerm, selectedPermissionIds, onSearchChange, onPermissionToggle, onSelectMenuAll, onSelectSubMenuAll }: PermissionMatrixProps) {
  return (
    <Box border="1px solid" borderColor="border.default" borderRadius="card" overflow="hidden" bg="bg.surface" shadow="card-dark">
      <Flex bg="bg.subtle" px={4} py={3} justify="space-between" align="center" borderBottom="1px solid" borderColor="border.default">
        <Heading size="sm" color="text.primary">Matriks Hak Akses (Permission Matrix)</Heading>
        <Input maxW="xs" size="xs" bg="bg.elevated" placeholder="Cari permission..." value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} borderRadius="md" borderColor="border.default" />
      </Flex>
      <Stack p={4} gap={6} maxH="40vh" overflowY="auto">
        {matrix.map((menu) => {
          const filteredSubmenus = menu.subMenus.filter((sm) => sm.name.toLowerCase().includes(searchTerm.toLowerCase()) || sm.permissions.some((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))));
          if (filteredSubmenus.length === 0) return null;
          const allMenuPermIds = menu.subMenus.flatMap((sm) => sm.permissions.map((p) => p.id));
          const isMenuAllChecked = allMenuPermIds.every((id) => selectedPermissionIds.includes(id));

          return (
            <Box key={menu.id} borderWidth="1px" borderColor="border.default" borderRadius="lg" p={4} bg="bg.elevated">
              <Flex justify="space-between" align="center" mb={3} borderBottom="1px dashed" borderColor="border.default" pb={2}>
                <HStack gap={2}><ChevronRight size={18} color="var(--chakra-colors-brand-text)" /><Text fontWeight="bold" color="text.primary" fontSize="sm">{menu.name}</Text></HStack>
                <Button size="xs" variant="outline" colorPalette="brand" onClick={() => onSelectMenuAll(menu, !isMenuAllChecked)} cursor="pointer">{isMenuAllChecked ? 'Batalkan Semua' : 'Pilih Semua Modul'}</Button>
              </Flex>
              <Stack gap={4}>
                {filteredSubmenus.map((subMenu) => {
                  const allSubPermIds = subMenu.permissions.map((p) => p.id);
                  const isSubAllChecked = allSubPermIds.every((id) => selectedPermissionIds.includes(id));
                  return (
                    <Box key={subMenu.id} bg="bg.surface" p={3} borderRadius="md" border="1px solid" borderColor="border.default">
                      <Flex justify="space-between" align="center" mb={2}>
                        <Text fontSize="xs" fontWeight="semibold" color="text.secondary">{subMenu.name}</Text>
                        <Button size="2xs" variant="ghost" colorPalette="brand" onClick={() => onSelectSubMenuAll(subMenu, !isSubAllChecked)} cursor="pointer">{isSubAllChecked ? 'Clear' : 'Check All'}</Button>
                      </Flex>
                      <Flex wrap="wrap" gap={3}>
                        {subMenu.permissions.map((p) => {
                          const isChecked = selectedPermissionIds.includes(p.id);
                          const isCritical = p.securityRiskLevel === 'CRITICAL' || p.securityRiskLevel === 'HIGH';
                          return (
                            <Button key={p.id} variant="ghost" onClick={() => onPermissionToggle(p.id)} px={3} py={2} minH="auto" h="auto" bg={isChecked ? 'brand.subtle' : 'bg.subtle'} border="1px solid" borderColor={isChecked ? (isCritical ? 'status.danger.text' : 'brand.text') : 'border.default'} borderRadius="md" cursor="pointer" _hover={{ borderColor: isCritical ? 'status.danger.text' : 'brand.text', bg: isChecked ? 'brand.subtle' : 'bg.elevated' }} transition="all 0.15s" display="flex" alignItems="center" gap={2}>
                              <Checkbox.Root checked={isChecked} pointerEvents="none"><Checkbox.HiddenInput /><Checkbox.Control cursor="pointer" /></Checkbox.Root>
                              <Box textAlign="left"><HStack gap={1}><Text fontSize="xs" fontWeight="medium" color={isChecked ? 'text.primary' : 'text.secondary'}>{p.action.toUpperCase()}</Text>{isCritical && <Badge bg="status.danger.bg" color="status.danger.text" borderRadius="full" fontSize="3xs">RISK</Badge>}</HStack><Text fontSize="2xs" color="text.muted" maxW="200px" truncate>{p.description || p.name}</Text></Box>
                            </Button>
                          );
                        })}
                      </Flex>
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
