import {BrowserRouter, Routes, Route} from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import LoginLayout from "../layouts/LoginLayout";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Kunden from "../pages/Kunden";
import Artikel from "../pages/Artikel";
import Lager from "../pages/Lager";
import Rechnungen from "../pages/Rechnungen";
import Benutzer from "../pages/Benutzer";
import Rollen from "../pages/Rollen";
import Rechte from "../pages/Rechte";
import Lieferanten from "../pages/Lieferanten";
import Bestellungen from "../pages/Bestellungen";
import Wareneingaenge from "../pages/Wareneingaenge";
import Angebote from "../pages/Angebote";
import Auftraege from "../pages/Auftraege";
import Reklamationen from "../pages/Reklamationen";
import Organisation from "../pages/Organisation";
import Buchhaltung from "../pages/Buchhaltung";
import Marketing from "../pages/Marketing";


import ProtectedRoute from "../auth/ProtectedRoute";

function AppRouter() {

    const protectedPage = (access, element) => (
        <ProtectedRoute access={access}>{element}</ProtectedRoute>
    );

    return (<BrowserRouter>
        <Routes>
            {/* öffentlich */}
            <Route
                path="/login"
                element={<LoginLayout>
                    <Login/>
                </LoginLayout>}
            />

            {/* geschützt */}
            <Route
                path="/"

                element={<ProtectedRoute>
                    <MainLayout/>
                </ProtectedRoute>}
            >
                <Route
                    index
                    element={<Dashboard/>}
                />
                <Route
                    path="kunden"
                    element={protectedPage("kunde", <Kunden/>)}
                />
                <Route path="lieferanten" element={protectedPage("einkauf", <Lieferanten/>)}/>
                <Route path="bestellungen" element={protectedPage("einkauf", <Bestellungen/>)}/>
                <Route path="wareneingaenge" element={protectedPage("lager", <Wareneingaenge/>)}/>
                <Route path="angebote" element={protectedPage("verkauf", <Angebote/>)}/>
                <Route path="auftraege" element={protectedPage("verkauf", <Auftraege/>)}/>
                <Route path="reklamationen" element={protectedPage("service", <Reklamationen/>)}/>
                <Route path="organisation" element={protectedPage("organisation", <Organisation/>)}/>
                <Route path="buchhaltung" element={protectedPage("buchhaltung", <Buchhaltung/>)}/>
                <Route path="marketing" element={protectedPage("marketing", <Marketing/>)}/>
                <Route
                    path="artikel"
                    element={protectedPage("artikel", <Artikel/>)}
                />
                <Route
                    path="lager"
                    element={protectedPage("lager", <Lager/>)}
                />
                <Route
                    path="rechnungen"
                    element={protectedPage("rechnung", <Rechnungen/>)}
                />
                <Route
                    path="benutzer"
                    element={protectedPage("benutzer", <Benutzer/>)}
                />
                <Route
                    path="rollen"
                    element={protectedPage("rollen", <Rollen/>)}
                />
                <Route
                    path="rechte"
                    element={protectedPage("rollen", <Rechte/>)}
                />
            </Route>
        </Routes>
    </BrowserRouter>);
}


export default AppRouter;
