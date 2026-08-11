import {
    Outlet,
    useLocation
}
    from "react-router-dom";
import { useState } from "react";


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

    return (

        <div className="layout">
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={() => setIsSidebarCollapsed(current => !current)}
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
