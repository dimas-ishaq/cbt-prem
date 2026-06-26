export interface Permission {
  id: string;
  subMenuId: string;
  name: string;
  description: string | null;
  action: string;
  securityRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface SubMenu {
  id: string;
  menuId: string;
  name: string;
  url: string;
  permissions: Permission[];
}

export interface Menu {
  id: string;
  name: string;
  icon: string | null;
  subMenus: SubMenu[];
}

export interface RoleDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  permissionIds: string[];
}

export interface AuditLog {
  id: string;
  actionType: string;
  actorId: string;
  createdAt: string;
  payloadBefore: any;
  payloadAfter: any;
}

export interface RoleFormData {
  name: string;
  description: string;
  isActive: boolean;
}
