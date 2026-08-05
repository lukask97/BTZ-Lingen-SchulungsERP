import { useEffect, useMemo, useState } from "react";
import {Link, useLocation} from "react-router-dom";
import useAuth from "../auth/useAuth";
import { NAVIGATION_GROUPS, SCENARIO_MENU, SCENARIO_OVERVIEW } from "../constants/navigation";
import { getDataProvider } from "../services/core/api";
import { subscribeToServerSystemEvents } from "../services/core/serverEvents";

function getProviderLabel(provider: string) {
    if (provider === "backend-postgres") return "Datenbank";
    if (provider === "backend-preview-memory") return "Backend-Memory";
    if (provider === "mock-local-storage") return "Mockup";
    return provider;
}

function getBackendModeLabel(mode: string) {
    if (mode === "postgres") return "Datenbank";
    if (mode === "memory") return "Backend-Memory";
    return mode;
}


export default function Sidebar() {

    const {user, logout, hasFullAccess, hasAccess} = useAuth();
    const isAdmin = hasFullAccess();
    const isVerkaufSenior = String(user?.rolle || "").toLowerCase().includes("verkauf senior");
    const location = useLocation();
    const [providerLabel, setProviderLabel] = useState(() => getProviderLabel(getDataProvider()));
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

    const toggleGroup = (key) => {
        setCollapsedGroups(current => ({ ...current, [key]: !current[key] }));
    };

    useEffect(() => {
        setProviderLabel(getProviderLabel(getDataProvider()));
        return subscribeToServerSystemEvents(payload => {
            if (!payload.mode) return;
            setProviderLabel(getBackendModeLabel(String(payload.mode)));
        });
    }, []);


    return (

        <nav className="sidebar">
            <Link className="sidebar-brand" to="/">ERP</Link>
            <div className="sidebar-menu">
                {visibleGroups.map(group => <div key={group.title} className="sidebar-group">
                    <div className="sidebar-section-row">
                        {group.canOpenOverview
                            ? <Link className="sidebar-section-title sidebar-section-link" to={group.overviewPath}>{group.title}</Link>
                            : <span className="sidebar-section-title">{group.title}</span>}
                        <button type="button" className="sidebar-toggle" onClick={() => toggleGroup(group.key)}>
                            {collapsedGroups[group.key] ? "▸" : "▾"}
                        </button>
                    </div>
                    <div className={`sidebar-group-links ${collapsedGroups[group.key] ? "is-collapsed" : ""}`}>
                        {group.visibleItems.map(item =>
                                <Link key={item.path} to={item.path}>
                                    {location.pathname === item.path ? "• " : ""}
                                    {item.title}
                                </Link>
                        )}
                    </div>
                </div>
                )}
                {isAdmin && (
                    <div className="sidebar-group">
                        <div className="sidebar-section-row">
                            <Link className="sidebar-section-title sidebar-section-link" to={SCENARIO_OVERVIEW.path}>{SCENARIO_OVERVIEW.title}</Link>
                            <button type="button" className="sidebar-toggle" onClick={() => setScenariosCollapsed(current => !current)}>
                                {scenariosCollapsed ? "▸" : "▾"}
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
                <div className="sidebar-user">
                    Angemeldet als:
                    <strong>{user?.username}</strong>
                </div>
                <div className="sidebar-user">
                    Modus:
                    <strong>{providerLabel}</strong>
                </div>
                <button className="sidebar-logout-button" onClick={() => void logout()}>
                    Logout
                </button>
            </div>
        </nav>

    );
}
