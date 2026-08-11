type HeaderProps = {
    isSidebarCollapsed: boolean;
    onToggleSidebar: () => void;
};

function Header({ isSidebarCollapsed, onToggleSidebar }: HeaderProps) {

    return (

        <header className="header">
            <button
                type="button"
                className="mobile-sidebar-button"
                onClick={onToggleSidebar}
                aria-label={isSidebarCollapsed ? "Navigation oeffnen" : "Navigation schliessen"}
            >
                {isSidebarCollapsed ? "Menue" : "Schliessen"}
            </button>
            <h3>
                Willkommen
            </h3>
        </header>
    );

}

export default Header;
