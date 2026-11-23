const ROLES = {
  CLIENT: "client",
  MANAGER: "manager",
  ADMIN: "admin",
};

const PERMISSIONS = {
  [ROLES.CLIENT]: ["products:read"],
  [ROLES.MANAGER]: ["products:read", "products:create", "products:update"],
  [ROLES.ADMIN]: ["products:read", "products:create", "products:update", "products:delete"],
};

function isValidRole(role) {
  return Object.values(ROLES).includes(role);
}

function hasPermission(role, permission) {
  const permissions = PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

function authorize(permission) {
  return (req, res, next) => {
    if (!req.user || !hasPermission(req.user.role, permission)) {
      return res.status(403).json({ error: "Accès refusé : permissions insuffisantes" });
    }
    next();
  };
}

function isCreatedByUser() {
  return (req, res, next) => {
    if (!req.user || !isCreatedByUser(req, req.product)) {
      return res.status(403).json({ error: "Accès refusé : vous n'êtes pas le créateur de ce produit" });
    }
    next();
  };
}

module.exports = { ROLES, PERMISSIONS, isValidRole, hasPermission, authorize, isCreatedByUser };
