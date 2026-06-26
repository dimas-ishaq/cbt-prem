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
    <Box border="1px solid" borderColor="gray.200" borderRadius="xl" overflow="hidden">
      <Flex bg="gray.50" px={4} py={3} justify="space-between" align="center" borderBottom="1px solid" borderColor="gray.200">
        <Heading size="sm" color="gray.700">Matriks Hak Akses (Permission Matrix)</Heading>
        <Input maxW="xs" size="xs" bg="white" placeholder="Cari permission..." value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} borderRadius="md" />
      </Flex>
      <Stack p={4} gap={6} maxH="40vh" overflowY="auto">
        {matrix.map((menu) => {
          const filteredSubmenus = menu.subMenus.filter((sm) => sm.name.toLowerCase().includes(searchTerm.toLowerCase()) || sm.permissions.some((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))));
          if (filteredSubmenus.length === 0) return null;
          const allMenuPermIds = menu.subMenus.flatMap((sm) => sm.permissions.map((p) => p.id));
          const isMenuAllChecked = allMenuPermIds.every((id) => selectedPermissionIds.includes(id));

          return (
            <Box key={menu.id} borderWidth="1px" borderColor="gray.100" borderRadius="lg" p={4} bg="gray.50/30">
              <Flex justify="space-between" align="center" mb={3} borderBottom="1px dashed" borderColor="gray.200" pb={2}>
                <HStack gap={2}><ChevronRight size={18} color="indigo" /><Text fontWeight="bold" color="indigo.700" fontSize="sm">{menu.name}</Text></HStack>
                <Button size="xs" variant="outline" colorPalette="indigo" onClick={() => onSelectMenuAll(menu, !isMenuAllChecked)} cursor="pointer">{isMenuAllChecked ? 'Batalkan Semua' : 'Pilih Semua Modul'}</Button>
              </Flex>
              <Stack gap={4}>
                {filteredSubmenus.map((subMenu) => {
                  const allSubPermIds = subMenu.permissions.map((p) => p.id);
                  const isSubAllChecked = allSubPermIds.every((id) => selectedPermissionIds.includes(id));
                  return (
                    <Box key={subMenu.id} bg="white" p={3} borderRadius="md" border="1px solid" borderColor="gray.100">
                      <Flex justify="space-between" align="center" mb={2}>
                        <Text fontSize="xs" fontWeight="semibold" color="gray.600">{subMenu.name}</Text>
                        <Button size="2xs" variant="ghost" colorPalette="gray" onClick={() => onSelectSubMenuAll(subMenu, !isSubAllChecked)} cursor="pointer">{isSubAllChecked ? 'Clear' : 'Check All'}</Button>
                      </Flex>
                      <Flex wrap="wrap" gap={3}>
                        {subMenu.permissions.map((p) => {
                          const isChecked = selectedPermissionIds.includes(p.id);
                          const isCritical = p.securityRiskLevel === 'CRITICAL' || p.securityRiskLevel === 'HIGH';
                          return (
                            <Button key={p.id} variant="ghost" onClick={() => onPermissionToggle(p.id)} px={3} py={2} minH="auto" h="auto" bg={isChecked ? (isCritical ? 'red.50' : 'indigo.50') : 'gray.50'} border="1px solid" borderColor={isChecked ? (isCritical ? 'red.300' : 'indigo.300') : 'gray.200'} borderRadius="md" cursor="pointer" _hover={{ borderColor: isCritical ? 'red.400' : 'indigo.400', bg: isChecked ? (isCritical ? 'red.50' : 'indigo.50') : 'gray.100' }} transition="all 0.15s" display="flex" alignItems="center" gap={2}>
                              <Checkbox.Root checked={isChecked} pointerEvents="none"><Checkbox.HiddenInput /><Checkbox.Control cursor="pointer" /></Checkbox.Root>
                              <Box textAlign="left"><HStack gap={1}><Text fontSize="xs" fontWeight="medium" color={isChecked ? (isCritical ? 'red.900' : 'indigo.900') : 'gray.700'}>{p.action.toUpperCase()}</Text>{isCritical && <Badge colorPalette="red" variant="solid" scale="xs" borderRadius="full" fontSize="3xs">RISK</Badge>}</HStack><Text fontSize="2xs" color="gray.400" maxW="200px" truncate>{p.description || p.name}</Text></Box>
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
