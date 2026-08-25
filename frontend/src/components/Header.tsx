type HeaderProps = {
    isSidebarCollapsed: boolean;
    onToggleSidebar: () => void;
};

function Header({ isSidebarCollapsed, onToggleSidebar }: HeaderProps) {
    return (
        <header className="header">
            <button
                type="button"
                className="mobile-sidebar-button button is-light"
                onClick={onToggleSidebar}
                aria-label={isSidebarCollapsed ? "Navigation oeffnen" : "Navigation schliessen"}
            >
                {isSidebarCollapsed ? "Menue" : "Schliessen"}
            </button>
            <div className="header-copy">
                <p className="header-kicker">Schulungs-ERP</p>
                <h3>Willkommen im Lernsystem</h3>
            </div>
        </header>
    );
}

export default Header;
