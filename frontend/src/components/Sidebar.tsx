import { useState } from "react";
import {Link, useLocation} from "react-router-dom";
import Can from "../auth/Can";
import useAuth from "../auth/useAuth";
import { NAVIGATION_GROUPS, SCENARIO_MENU, SCENARIO_OVERVIEW } from "../constants/navigation";


export default function Sidebar() {

    const {user, logout, hasPermission} = useAuth();
    const isAdmin = hasPermission("*");
    const location = useLocation();
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


    return (

        <nav className="sidebar">

            <Link className="sidebar-brand" to="/">ERP</Link>
            {NAVIGATION_GROUPS
                .filter(group => (isAdmin || group.key !== "verwaltung") && (!group.adminOnly || isAdmin))
                .map(group => <div key={group.title} className="sidebar-group">
                <div className="sidebar-section-row">
                    <Can access={group.access}>
                        <Link className="sidebar-section-title sidebar-section-link" to={group.overviewPath}>{group.title}</Link>
                    </Can>
                    <button type="button" className="sidebar-toggle" onClick={() => toggleGroup(group.key)}>
                        {collapsedGroups[group.key] ? "▸" : "▾"}
                    </button>
                </div>
                <div className={`sidebar-group-links ${collapsedGroups[group.key] ? "is-collapsed" : ""}`}>
                    {group.items.map(item =>
                        <Can
                            key={item.path}
                            access={item.access}
                        >
                            <Link to={item.path}>
                                {item.title}
                            </Link>
                        </Can>
                    )}
                </div>
            </div>)}
            {isAdmin && <div className="sidebar-group">
                <div className="sidebar-section-row">
                    <Link className="sidebar-section-title sidebar-section-link" to={SCENARIO_OVERVIEW.path}>{SCENARIO_OVERVIEW.title}</Link>
                    <button type="button" className="sidebar-toggle" onClick={() => setScenariosCollapsed(current => !current)}>
                        {scenariosCollapsed ? "▸" : "▾"}
                    </button>
                </div>
                <div className={`sidebar-group-links sidebar-group-links-scenarios ${scenariosCollapsed ? "is-collapsed" : ""}`}>
                    {SCENARIO_MENU.map(item =>
                        <Can key={item.path} access={item.access}>
                            <Link className="sidebar-scenario-link" to={item.path}>
                                {item.title}
                            </Link>
                        </Can>
                    )}
                </div>
            </div>}

            <div className="sidebar-user">
                Angemeldet als:
                <strong>{user?.username}</strong>
            </div>
            <button onClick={logout}>
                Logout
            </button>

        </nav>

    );
}
