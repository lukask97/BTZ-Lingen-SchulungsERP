import {Link} from "react-router-dom";
import Can from "../auth/Can";
import useAuth from "../auth/AuthContext";


const menu = [
    {
        title: "Kunden",
        path: "/kunden",
        permission: "kunde"
    },
    {
        title: "Artikel",
        path: "/artikel",
        permission: "artikel"
    },
    {
        title: "Lager",
        path: "/lager",
        permission: "lager"
    },
    {
        title: "Rechnungen",
        path: "/rechnungen",
        permission: "rechnung"
    },
    {
        title: "Benutzer",
        path: "/benutzer",
        permission: "benutzer"
    },
    {
        title: "Rollen",
        path: "/rollen",
        permission: "rolle"
    }
];


export default function Sidebar() {

    const {user, logout} = useAuth();


    return (

        <nav className="sidebar">

            <h2>ERP</h2>
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