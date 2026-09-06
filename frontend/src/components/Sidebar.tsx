import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import useAuth from "../auth/useAuth";
import { NAVIGATION_GROUPS, SCENARIO_MENU, SCENARIO_OVERVIEW } from "../constants/navigation";
import { getUserFullName } from "../utils/userDisplay";

type SidebarProps = {
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    isDarkMode: boolean;
    onToggleDarkMode: () => void;
};

export default function Sidebar({ isCollapsed, onToggleCollapse, isDarkMode, onToggleDarkMode }: SidebarProps) {
    const { user, logout, switchActiveClass, hasFullAccess, hasAccess } = useAuth();
    const isAdmin = hasFullAccess();
    const isVerkaufSenior = String(user.rolle || "").toLowerCase().includes("verkauf senior");
    const location = useLocation();
    const visibleGroups = useMemo(
        () => NAVIGATION_GROUPS
            .filter(group =>
                (isAdmin || group.key !== "verwaltung")
                && (!group.adminOnly || isAdmin)
                && !(isVerkaufSenior && group.key === "gf")
            )
            .map(group => {
                const visibleItems = group.items.filter(item => !item.access || hasAccess(item.access));
                const canOpenOverview = !group.access || hasAccess(group.access);

                return {
                    ...group,
                    canOpenOverview,
                    visibleItems
                };
            })
            .filter(group => group.canOpenOverview || group.visibleItems.length > 0),
        [hasAccess, isAdmin, isVerkaufSenior]
    );
    const [collapsedGroups, setCollapsedGroups] = useState(() => Object.fromEntries(
        NAVIGATION_GROUPS.map(group => {
            const matchesGroup = location.pathname === group.overviewPath || group.items.some(item => location.pathname === item.path);
            return [group.key, !matchesGroup];
        })
    ));
    const [scenariosCollapsed, setScenariosCollapsed] = useState(() => !location.pathname.startsWith("/szenarien") && location.pathname !== SCENARIO_OVERVIEW.path);
    const [isSwitchingClass, setIsSwitchingClass] = useState(false);
    const assignedClasses = Array.isArray(user.assignedClasses) ? user.assignedClasses : [];
    const activeClass = user.activeClass && typeof user.activeClass === "object" ? user.activeClass : null;

    const toggleGroup = (key) => {
        setCollapsedGroups(current => ({ ...current, [key]: !current[key] }));
    };

    const handleClassChange = (classId: string) => {
        if (classId === String((activeClass as any)?.id ?? "")) return;
        setIsSwitchingClass(true);
        void switchActiveClass(classId).catch(() => {
            setIsSwitchingClass(false);
        });
    };

    return (
        <>
        {isSwitchingClass && (
            <div className="class-switch-overlay" role="alert" aria-live="assertive">
                <div className="class-switch-dialog">
                    <strong>Bitte warten</strong>
                    <span>Klasse wird gewechselt</span>
                </div>
            </div>
        )}
        <nav className={`sidebar ${isCollapsed ? "sidebar-collapsed" : ""}`}>
            <div className="sidebar-topbar">
                <Link className="sidebar-brand" to="/">ERP</Link>
                <button
                    type="button"
                    className="sidebar-collapse-button button is-light"
                    onClick={onToggleCollapse}
                    aria-label={isCollapsed ? "Navigation ausklappen" : "Navigation einklappen"}
                    title={isCollapsed ? "Navigation ausklappen" : "Navigation einklappen"}
                >
                    {isCollapsed ? ">" : "<"}
                </button>
            </div>
            <div className="sidebar-menu">
                {visibleGroups.map(group => <div key={group.title} className="sidebar-group">
                    <div className="sidebar-section-row">
                        {group.canOpenOverview
                            ? <Link className="sidebar-section-title sidebar-section-link" to={group.overviewPath}>{group.title}</Link>
                            : <span className="sidebar-section-title">{group.title}</span>}
                        <button type="button" className="sidebar-toggle button is-white" onClick={() => toggleGroup(group.key)}>
                            {collapsedGroups[group.key] ? ">" : "v"}
                        </button>
                    </div>
                    <div className={`sidebar-group-links ${collapsedGroups[group.key] ? "is-collapsed" : ""}`}>
                        {group.visibleItems.map(item =>
                            <Link key={item.path} to={item.path}>
                                {location.pathname === item.path ? "* " : ""}
                                {item.title}
                            </Link>
                        )}
                    </div>
                </div>)}
                {isAdmin && (
                    <div className="sidebar-group">
                        <div className="sidebar-section-row">
                            <Link className="sidebar-section-title sidebar-section-link" to={SCENARIO_OVERVIEW.path}>{SCENARIO_OVERVIEW.title}</Link>
                            <button type="button" className="sidebar-toggle button is-white" onClick={() => setScenariosCollapsed(current => !current)}>
                                {scenariosCollapsed ? ">" : "v"}
                            </button>
                        </div>
                        <div className={`sidebar-group-links sidebar-group-links-scenarios ${scenariosCollapsed ? "is-collapsed" : ""}`}>
                            {SCENARIO_MENU.filter(item => !item.access || hasAccess(item.access)).map(item =>
                                <Link key={item.path} className="sidebar-scenario-link" to={item.path}>
                                    {item.title}
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="sidebar-footer">
                <button className="sidebar-theme-button button is-link is-light" onClick={onToggleDarkMode}>
                    {isDarkMode ? "Light Mode" : "Dark Mode"}
                </button>
                <div className="sidebar-user">
                    angemeldet als:
                    <strong>{getUserFullName(user)}</strong>
                </div>
                <div className="sidebar-user">
                    Klasse:
                    {assignedClasses.length > 1 ? (
                        <select
                            name="active-class"
                            value={String((activeClass as any)?.id ?? "")}
                            disabled={isSwitchingClass}
                            onChange={event => handleClassChange(event.target.value)}
                        >
                            {assignedClasses.map((item: any) => (
                                <option key={item.id} value={item.id}>{item.name}</option>
                            ))}
                        </select>
                    ) : (
                        <strong>{(activeClass as any)?.name || "-"}</strong>
                    )}
                </div>
                <div className="sidebar-user">
                    Rolle:
                    <strong>{user.rolle || "-"}</strong>
                </div>
                <button className="sidebar-logout-button button is-danger is-light" onClick={() => void logout()}>
                    Logout
                </button>
            </div>
        </nav>
        </>
    );
}
