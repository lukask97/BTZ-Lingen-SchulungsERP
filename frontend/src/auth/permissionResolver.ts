type RoleLike = {
    id: number | string | null;
    name: string;
    permissions: string[];
};

type RolePermissionLike = {
    rolleId?: number | string | null;
    rollenId?: number | string | null;
    rolleName: string;
    rechtName: string;
    permission?: string;
};

type UserLike = {
    rolle: string;
    rolleId: number | string | null;
    permissions: string[];
};

function normalizePermissionList(values: unknown[]) {
    return Array.from(new Set(
        values
            .map(value => String(value ?? "").trim())
            .filter(Boolean)
    ));
}

export function resolveRolePermissions(
    role: RoleLike | undefined,
    rolePermissions: RolePermissionLike[] = []
) {
    if (!role) return [];

    const byRoleAssignments = rolePermissions
        .filter(item =>
            String(item.rolleId ?? item.rollenId ?? "") === String(role.id ?? "")
            || String(item.rolleName ?? "").toLowerCase() === String(role.name ?? "").toLowerCase()
        )
        .map(item => item.rechtName || item.permission || "");

    return normalizePermissionList([
        ...(role.permissions || []),
        ...byRoleAssignments
    ]);
}

export function resolveUserPermissions(
    user: UserLike | null | undefined,
    roles: RoleLike[] = [],
    rolePermissions: RolePermissionLike[] = []
) {
    if (!user) return [];

    const matchingRole = roles.find(role =>
        String(role.id ?? "") === String(user.rolleId ?? "")
        || String(role.name ?? "").toLowerCase() === String(user.rolle ?? "").toLowerCase()
    );

    return normalizePermissionList([
        ...(user.permissions || []),
        ...resolveRolePermissions(matchingRole, rolePermissions)
    ]);
}
