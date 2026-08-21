import {
    Outlet,
    useLocation
}
    from "react-router-dom";
import { useEffect, useState } from "react";


import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Footer from "../components/Footer";
import TeacherNotesPanel from "../components/TeacherNotesPanel";
import { useStorageSyncRefresh } from "../hooks/useStorageSyncRefresh";
import { SYNC_DATA_KEYS } from "../services/mockup/mockStorage";


function MainLayout() {
    useStorageSyncRefresh(SYNC_DATA_KEYS);
    const location = useLocation();
    const isTeacherView = location.pathname.startsWith("/lehrkraft");
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window === "undefined") return false;
        return window.localStorage.getItem("erp-dark-mode") === "true";
    });

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", isDarkMode ? "dark" : "light");
        window.localStorage.setItem("erp-dark-mode", String(isDarkMode));
    }, [isDarkMode]);

    return (

        <div className="layout">
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={() => setIsSidebarCollapsed(current => !current)}
                isDarkMode={isDarkMode}
                onToggleDarkMode={() => setIsDarkMode(current => !current)}
            />
            <div className="content">
                <Header
                    isSidebarCollapsed={isSidebarCollapsed}
                    onToggleSidebar={() => setIsSidebarCollapsed(current => !current)}
                />
                <div className={isTeacherView ? "content-shell content-shell-teacher" : "content-shell"}>
                    <main>
                        <Outlet/>
                    </main>
                    {isTeacherView && <TeacherNotesPanel/>}
                </div>
                <Footer/>
            </div>
        </div>
    );

}


export default MainLayout;
