import {Link} from "react-router-dom";
import Can from "../auth/Can";
import useAuth from "../auth/AuthContext";


const menu = [
    {
        title: "Dashboard",
        path: "/"
    },
    {
        title: "Organisation",
        path: "/organisation",
        access: "organisation"
    },
    {
        title: "Buchhaltung",
        path: "/buchhaltung",
        access: "buchhaltung"
    },
    {
        title: "Lieferanten",
        path: "/lieferanten",
        access: "einkauf"
    },
    {
        title: "Bestellungen",
        path: "/bestellungen",
        access: "einkauf"
    },
    {
        title: "Wareneingänge",
        path: "/wareneingaenge",
        access: "lager"
    },
    {
        title: "Angebote",
        path: "/angebote",
        access: "verkauf"
    },
    {
        title: "Aufträge",
        path: "/auftraege",
        access: "verkauf"
    },
    {
        title: "Reklamationen",
        path: "/reklamationen",
        access: "service"
    },
    {
        title: "Marketing",
        path: "/marketing",
        access: "marketing"
    },
    {
        title: "Kunden",
        path: "/kunden",
        access: "kunde"
    },
    {
        title: "Artikel",
        path: "/artikel",
        access: "artikel"
    },
    {
        title: "Lager",
        path: "/lager",
        access: "lager"
    },
    {
        title: "Rechnungen",
        path: "/rechnungen",
        access: "rechnung"
    },
    {
        title: "Benutzer",
        path: "/benutzer",
        access: "benutzer"
    },
    {
        title: "Rollen",
        path: "/rollen",
        access: "rollen"
    }
];


export default function Sidebar() {

    const {user, logout} = useAuth();


    return (

        <nav className="sidebar">

            <Link className="sidebar-brand" to="/">ERP</Link>
            {
                menu.map(item =>

                    <Can
                        key={item.path}
                        access={item.access}
                    >
                        <Link to={item.path}>
                            {item.title}
                        </Link>
                    </Can>
                )
            }

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
