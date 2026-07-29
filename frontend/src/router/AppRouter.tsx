import type { ReactElement } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import LoginLayout from "../layouts/LoginLayout";

import Login from "../pages/auth/Login";
import Dashboard from "../pages/start/Dashboard";
import Organisation from "../pages/start/Organisation";
import LehrkraftOverview from "../pages/lehrkraft/LehrkraftOverview";
import LehrkraftKundenkorrespondenz from "../pages/lehrkraft/LehrkraftKundenkorrespondenz";
import LehrkraftLieferantenkorrespondenz from "../pages/lehrkraft/LehrkraftLieferantenkorrespondenz";
import LehrkraftZahlungen from "../pages/lehrkraft/LehrkraftZahlungen";
import LehrkraftRechnungen from "../pages/lehrkraft/LehrkraftRechnungen";
import EinkaufOverview from "../pages/einkauf/EinkaufOverview";
import Lieferanten from "../pages/einkauf/Lieferanten";
import Lieferantenvergleich from "../pages/einkauf/Lieferantenvergleich";
import Bestellungen from "../pages/einkauf/Bestellungen";
import Einkaufsdokumente from "../pages/einkauf/Einkaufsdokumente";
import Wareneingaenge from "../pages/einkauf/Wareneingaenge";
import VerkaufOverview from "../pages/verkauf/VerkaufOverview";
import Kunden from "../pages/verkauf/Kunden";
import Kundenanfragen from "../pages/verkauf/Kundenanfragen";
import Angebote from "../pages/verkauf/Angebote";
import Auftraege from "../pages/verkauf/Auftraege";
import Services from "../pages/verkauf/Services";
import Vertriebsdokumente from "../pages/verkauf/Vertriebsdokumente";
import Reklamationen from "../pages/verkauf/Reklamationen";
import Marketing from "../pages/marketing/Marketing";
import Logistik from "../pages/logistik/Logistik";
import Artikel from "../pages/logistik/Artikel";
import Bestand from "../pages/logistik/Bestand";
import Kategorien from "../pages/logistik/Kategorien";
import Versand from "../pages/logistik/Versand";
import Retouren from "../pages/logistik/Retouren";
import Personalwesen from "../pages/personalwesen/Personalwesen";
import Bewerber from "../pages/personalwesen/Bewerber";
import Mitarbeiter from "../pages/personalwesen/Mitarbeiter";
import Personalakte from "../pages/personalwesen/Personalakte";
import Arbeitszeiten from "../pages/personalwesen/Arbeitszeiten";
import Urlaubsantraege from "../pages/personalwesen/Urlaubsantraege";
import Krankmeldungen from "../pages/personalwesen/Krankmeldungen";
import Schulungen from "../pages/personalwesen/Schulungen";
import Buchhaltung from "../pages/buchhaltung/Buchhaltung";
import Firmenkonto from "../pages/buchhaltung/Firmenkonto";
import Rechnungen from "../pages/buchhaltung/Rechnungen";
import Zahlungen from "../pages/buchhaltung/Zahlungen";
import Mahnungen from "../pages/buchhaltung/Mahnungen";
import Belege from "../pages/buchhaltung/Belege";
import ABCAnalyse from "../pages/buchhaltung/ABCAnalyse";
import Geschaeftsfuehrung from "../pages/gf/Geschaeftsfuehrung";
import Berichte from "../pages/gf/Berichte";
import Freigaben from "../pages/gf/Freigaben";
import VerwaltungOverview from "../pages/verwaltung/VerwaltungOverview";
import Benutzer from "../pages/verwaltung/Benutzer";
import Rollen from "../pages/verwaltung/Rollen";
import Rechte from "../pages/verwaltung/Rechte";
import SzenarienOverview from "../pages/szenarien/SzenarienOverview";
import RegionaleBestellung from "../pages/szenarien/RegionaleBestellung";
import Grossbestellung from "../pages/szenarien/Grossbestellung";
import Firmenauftrag from "../pages/szenarien/Firmenauftrag";
import Eventbestellung from "../pages/szenarien/Eventbestellung";
import ServiceSzenario from "../pages/szenarien/ServiceSzenario";
import Transportverzoegerung from "../pages/szenarien/Transportverzoegerung";
import Kooperation from "../pages/szenarien/Kooperation";


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
                <Route path="lehrkraft" element={protectedPage("gf", <LehrkraftOverview/> )}/>
                <Route path="lehrkraft/kundenkorrespondenz" element={protectedPage("gf", <LehrkraftKundenkorrespondenz/>)}/>
                <Route path="lehrkraft/lieferantenkorrespondenz" element={protectedPage("gf", <LehrkraftLieferantenkorrespondenz/>)}/>
                <Route path="lehrkraft/zahlungen" element={protectedPage("gf", <LehrkraftZahlungen/>)}/>
                <Route path="lehrkraft/rechnungen" element={protectedPage("gf", <LehrkraftRechnungen/>)}/>
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
                <Route path="bestand" element={protectedPage("lager", <Bestand/>)}/>
                <Route path="personalwesen" element={protectedPage("personalwesen", <Personalwesen/>)}/>
                <Route path="geschaeftsfuehrung" element={protectedPage("gf", <Geschaeftsfuehrung/>)}/>
                <Route
                    path="artikel"
                    element={protectedPage("artikel", <Artikel/>)}
                />
                <Route
                    path="kategorien"
                    element={protectedPage("artikel", <Kategorien/>)}
                />
                <Route
                    path="lager"
                    element={protectedPage("lager", <Bestand/>)}
                />
                <Route
                    path="rechnungen"
                    element={protectedPage("rechnung", <Rechnungen/>)}
                />
                <Route path="zahlungen" element={protectedPage("buchhaltung", <Zahlungen/>)}/>
                <Route path="mahnungen" element={protectedPage("buchhaltung", <Mahnungen/>)}/>
                <Route path="belege" element={protectedPage("buchhaltung", <Belege/>)}/>
                <Route path="firmenkonto" element={protectedPage("buchhaltung", <Firmenkonto/>)}/>
                <Route path="abc-analyse" element={protectedPage("buchhaltung", <ABCAnalyse/>)}/>
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
