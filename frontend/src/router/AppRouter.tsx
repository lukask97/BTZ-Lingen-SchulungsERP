import type { ReactElement } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

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
import Services from "../pages/Services";
import Reklamationen from "../pages/Reklamationen";
import Organisation from "../pages/Organisation";
import Buchhaltung from "../pages/Buchhaltung";
import Marketing from "../pages/Marketing";
import Kundenanfragen from "../pages/Kundenanfragen";
import Zahlungen from "../pages/Zahlungen";
import Mahnungen from "../pages/Mahnungen";
import Belege from "../pages/Belege";
import Freigaben from "../pages/Freigaben";
import Berichte from "../pages/Berichte";
import Logistik from "../pages/Logistik";
import Personalwesen from "../pages/Personalwesen";
import Geschaeftsfuehrung from "../pages/Geschaeftsfuehrung";
import EinkaufOverview from "../pages/EinkaufOverview";
import Einkaufsdokumente from "../pages/Einkaufsdokumente";
import Lieferantenvergleich from "../pages/Lieferantenvergleich";
import RegionaleBestellung from "../pages/scenarios/RegionaleBestellung";
import Grossbestellung from "../pages/scenarios/Grossbestellung";
import Firmenauftrag from "../pages/scenarios/Firmenauftrag";
import Eventbestellung from "../pages/scenarios/Eventbestellung";
import ServiceSzenario from "../pages/scenarios/ServiceSzenario";
import Transportverzoegerung from "../pages/scenarios/Transportverzoegerung";
import Kooperation from "../pages/scenarios/Kooperation";
import VerkaufOverview from "../pages/VerkaufOverview";
import Vertriebsdokumente from "../pages/Vertriebsdokumente";
import VerwaltungOverview from "../pages/VerwaltungOverview";
import SzenarienOverview from "../pages/SzenarienOverview";
import Versand from "../pages/Versand";
import Retouren from "../pages/Retouren";
import Bewerber from "../pages/Bewerber";
import Mitarbeiter from "../pages/Mitarbeiter";
import Personalakte from "../pages/Personalakte";
import Arbeitszeiten from "../pages/Arbeitszeiten";
import Urlaubsantraege from "../pages/Urlaubsantraege";
import Krankmeldungen from "../pages/Krankmeldungen";
import Schulungen from "../pages/Schulungen";
import Firmenkonto from "../pages/Firmenkonto";


import ProtectedRoute from "../auth/ProtectedRoute";

function AppRouter() {

    const protectedPage = (access: string, element: ReactElement) => (
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
                <Route path="themen/einkauf" element={protectedPage("einkauf", <EinkaufOverview/>)}/>
                <Route path="themen/verkauf" element={protectedPage("verkauf", <VerkaufOverview/>)}/>
                <Route path="themen/verwaltung" element={protectedPage("benutzer", <VerwaltungOverview/>)}/>
                <Route path="themen/szenarien" element={<SzenarienOverview/>}/>
                <Route path="lieferanten" element={protectedPage("einkauf", <Lieferanten/>)}/>
                <Route path="lieferantenvergleich" element={protectedPage("einkauf", <Lieferantenvergleich/>)}/>
                <Route path="bestellungen" element={protectedPage("einkauf", <Bestellungen/>)}/>
                <Route path="einkaufsdokumente" element={protectedPage("einkauf", <Einkaufsdokumente/>)}/>
                <Route path="wareneingaenge" element={protectedPage("lager", <Wareneingaenge/>)}/>
                <Route path="versand" element={protectedPage("logistik", <Versand/>)}/>
                <Route path="retouren" element={protectedPage("logistik", <Retouren/>)}/>
                <Route path="kundenanfragen" element={protectedPage("verkauf", <Kundenanfragen/>)}/>
                <Route path="angebote" element={protectedPage("verkauf", <Angebote/>)}/>
                <Route path="auftraege" element={protectedPage("verkauf", <Auftraege/>)}/>
                <Route path="services" element={protectedPage("service", <Services/>)}/>
                <Route path="vertriebsdokumente" element={protectedPage("verkauf", <Vertriebsdokumente/>)}/>
                <Route path="reklamationen" element={protectedPage("service", <Reklamationen/>)}/>
                <Route path="organisation" element={protectedPage("organisation", <Organisation/>)}/>
                <Route path="buchhaltung" element={protectedPage("buchhaltung", <Buchhaltung/>)}/>
                <Route path="marketing" element={protectedPage("marketing", <Marketing/>)}/>
                <Route path="logistik" element={protectedPage("logistik", <Logistik/>)}/>
                <Route path="personalwesen" element={protectedPage("personalwesen", <Personalwesen/>)}/>
                <Route path="geschaeftsfuehrung" element={protectedPage("gf", <Geschaeftsfuehrung/>)}/>
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
                <Route path="zahlungen" element={protectedPage("buchhaltung", <Zahlungen/>)}/>
                <Route path="mahnungen" element={protectedPage("buchhaltung", <Mahnungen/>)}/>
                <Route path="belege" element={protectedPage("buchhaltung", <Belege/>)}/>
                <Route path="firmenkonto" element={protectedPage("buchhaltung", <Firmenkonto/>)}/>
                <Route path="freigaben" element={protectedPage("gf", <Freigaben/>)}/>
                <Route path="berichte" element={protectedPage("gf", <Berichte/>)}/>
                <Route path="bewerber" element={protectedPage("personalwesen", <Bewerber/>)}/>
                <Route path="mitarbeiter" element={protectedPage("personalwesen", <Mitarbeiter/>)}/>
                <Route path="personalakte" element={protectedPage("personalwesen", <Personalakte/>)}/>
                <Route path="arbeitszeiten" element={protectedPage("personalwesen", <Arbeitszeiten/>)}/>
                <Route path="urlaubsantraege" element={protectedPage("personalwesen", <Urlaubsantraege/>)}/>
                <Route path="krankmeldungen" element={protectedPage("personalwesen", <Krankmeldungen/>)}/>
                <Route path="schulungen" element={protectedPage("personalwesen", <Schulungen/>)}/>
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
                <Route path="szenarien/regionale-bestellung" element={protectedPage("verkauf", <RegionaleBestellung/>)}/>
                <Route path="szenarien/grossbestellung" element={protectedPage("verkauf", <Grossbestellung/>)}/>
                <Route path="szenarien/firmenauftrag" element={protectedPage("verkauf", <Firmenauftrag/>)}/>
                <Route path="szenarien/eventbestellung" element={protectedPage("verkauf", <Eventbestellung/>)}/>
                <Route path="szenarien/service" element={protectedPage("service", <ServiceSzenario/>)}/>
                <Route path="szenarien/transportverzoegerung" element={protectedPage("verkauf", <Transportverzoegerung/>)}/>
                <Route path="szenarien/kooperation" element={protectedPage("marketing", <Kooperation/>)}/>
            </Route>
        </Routes>
    </BrowserRouter>);
}


export default AppRouter;
