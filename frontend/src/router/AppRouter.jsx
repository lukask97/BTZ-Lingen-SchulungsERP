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


import ProtectedRoute from "../auth/ProtectedRoute";

function AppRouter() {

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
                    element={<Kunden/>}
                />
                <Route
                    path="artikel"
                    element={<Artikel/>}
                />
                <Route
                    path="lager"
                    element={<Lager/>}
                />
                <Route
                    path="rechnungen"
                    element={<Rechnungen/>}
                />
                <Route
                    path="benutzer"
                    element={<Benutzer/>}
                />
                <Route
                    path="rollen"
                    element={<ProtectedRoute access="rolle.verwalten">
                        <Rollen/>
                    </ProtectedRoute>}
                />
                <Route
                    path="rechte"
                    element={<Rechte/>}
                />
            </Route>
        </Routes>
    </BrowserRouter>);
}


export default AppRouter;