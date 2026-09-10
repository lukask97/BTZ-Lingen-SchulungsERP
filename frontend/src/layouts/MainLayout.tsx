import {
    Outlet,
    useLocation
}
    from "react-router-dom";
import { useEffect, useRef, useState } from "react";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Footer from "../components/Footer";
import TeacherNotesPanel from "../components/TeacherNotesPanel";
import { useDataSyncRefresh } from "../hooks/useDataSyncRefresh";
import { SYNC_DATA_KEYS } from "../services/seed/dataSync";

function MainLayout() {
    useDataSyncRefresh(SYNC_DATA_KEYS);
    const location = useLocation();
    const isTeacherView = location.pathname.startsWith("/lehrkraft");
    const contentRef = useRef<HTMLDivElement | null>(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        if (typeof window === "undefined") return false;
        return window.innerWidth <= 1180;
    });
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window === "undefined") return false;
        return window.localStorage.getItem("erp-dark-mode") === "true";
    });

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", isDarkMode ? "dark" : "light");
        window.localStorage.setItem("erp-dark-mode", String(isDarkMode));
    }, [isDarkMode]);

    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTo({ top: 0, left: 0, behavior: "auto" });
        }
        if (window.innerWidth <= 1180) {
            setIsSidebarCollapsed(true);
        }
    }, [location.pathname]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const collapseSidebarForViewport = () => {
            if (window.innerWidth <= 1180) {
                setIsSidebarCollapsed(true);
            }
        };

        collapseSidebarForViewport();
        window.addEventListener("resize", collapseSidebarForViewport);
        return () => window.removeEventListener("resize", collapseSidebarForViewport);
    }, []);

    return (
        <div className="layout erp-shell">
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={() => setIsSidebarCollapsed(current => !current)}
                isDarkMode={isDarkMode}
                onToggleDarkMode={() => setIsDarkMode(current => !current)}
            />
            <div ref={contentRef} className="content erp-shell-content">
                <Header
                    isSidebarCollapsed={isSidebarCollapsed}
                    onToggleSidebar={() => setIsSidebarCollapsed(current => !current)}
                />
                <div className={isTeacherView ? "content-shell content-shell-teacher" : "content-shell"}>
                    <main className="erp-page-stack">
                        <Outlet />
                    </main>
                    {isTeacherView && <TeacherNotesPanel />}
                </div>
                <Footer />
            </div>
        </div>
    );
}

export default MainLayout;
