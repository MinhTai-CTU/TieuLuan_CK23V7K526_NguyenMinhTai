import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Get all permissions for a user (through their roles)
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    return [];
  }

  // Collect all unique permissions from all user's roles
  const permissions = new Set<string>();
  user.userRoles.forEach((userRole) => {
    userRole.role.rolePermissions.forEach((rolePermission) => {
      permissions.add(rolePermission.permission.name);
    });
  });

  return Array.from(permissions);
}

/**
 * Get all role names for a user
 */
export async function getUserRoles(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!user) {
    return [];
  }

  return user.userRoles.map((ur) => ur.role.name);
}

/**
 * Check if user has a specific permission
 */
export async function hasPermission(
  userId: string,
  permissionName: string
): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissions.includes(permissionName);
}

/**
 * Check if user has any of the specified permissions
 */
export async function hasAnyPermission(
  userId: string,
  permissionNames: string[]
): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissionNames.some((perm) => permissions.includes(perm));
}

/**
 * Check if user has all of the specified permissions
 */
export async function hasAllPermissions(
  userId: string,
  permissionNames: string[]
): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissionNames.every((perm) => permissions.includes(perm));
}

/**
 * Check if user has a specific role
 */
export async function hasRole(
  userId: string,
  roleName: string
): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.includes(roleName);
}

/**
 * Check if user has any of the specified roles
 */
export async function hasAnyRole(
  userId: string,
  roleNames: string[]
): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roleNames.some((role) => roles.includes(role));
}

/**
 * Permission constants for easy reference
 */
export const PERMISSIONS = {
  // Customer
  PRODUCTS_VIEW: "products.view",
  PRODUCTS_SEARCH: "products.search",
  ORDERS_CREATE: "orders.create",
  ORDERS_VIEW_OWN: "orders.view.own",
  WISHLIST_MANAGE: "wishlist.manage",
  REVIEWS_CREATE: "reviews.create",
  PROFILE_MANAGE: "profile.manage",

  // Admin permissions (products, categories, orders, etc.)
  PRODUCTS_CREATE: "products.create",
  PRODUCTS_UPDATE: "products.update",
  PRODUCTS_DELETE: "products.delete",
  CATEGORIES_MANAGE: "categories.manage",
  ORDERS_VIEW_ALL: "orders.view.all",
  ORDERS_UPDATE: "orders.update",
  TESTIMONIALS_MANAGE: "testimonials.manage",
  REPORTS_VIEW: "reports.view",

  // Admin
  USERS_MANAGE: "users.manage",
  ROLES_MANAGE: "roles.manage",
  PERMISSIONS_MANAGE: "permissions.manage",
  SYSTEM_SETTINGS: "system.settings",
  BLOGS_MANAGE: "blogs.manage",
  REPORTS_VIEW_ALL: "reports.view.all",
} as const;

/**
 * Role constants for easy reference
 */
export const ROLES = {
  CUSTOMER: "CUSTOMER",
  ADMIN: "ADMIN",
} as const;
