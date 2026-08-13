import type { ReactElement } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import LoginLayout from "../layouts/LoginLayout";

import Login from "../pages/auth/Login";
import Dashboard from "../pages/start/Dashboard";
import Organisation from "../pages/start/Organisation";
import Glossar from "../pages/start/Glossar";
import Suche from "../pages/start/Suche";
import PartnerHistorie from "../pages/start/PartnerHistorie";
import LehrkraftOverview from "../pages/lehrkraft/LehrkraftOverview";
import LehrkraftKundenkorrespondenz from "../pages/lehrkraft/LehrkraftKundenkorrespondenz";
import LehrkraftLieferantenkorrespondenz from "../pages/lehrkraft/LehrkraftLieferantenkorrespondenz";
import LehrkraftZahlungen from "../pages/lehrkraft/LehrkraftZahlungen";
import LehrkraftRechnungen from "../pages/lehrkraft/LehrkraftRechnungen";
import LehrkraftOptionen from "../pages/lehrkraft/LehrkraftOptionen";
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
import Bankauszug from "../pages/buchhaltung/Bankauszug";
import Eingangsrechnungen from "../pages/buchhaltung/Eingangsrechnungen";
import Ausgangsrechnungen from "../pages/buchhaltung/Ausgangsrechnungen";
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
import Exporte from "../pages/verwaltung/Exporte";
import Nummernkreise from "../pages/verwaltung/Nummernkreise";
import Optionen from "../pages/verwaltung/Optionen";
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
import { ACCESS } from "../constants/permissions";


import ProtectedRoute from "../auth/ProtectedRoute";

function AppRouter() {

    const protectedPage = (access: string, element: ReactElement) => (
        <ProtectedRoute access={access}>{element}</ProtectedRoute>
    );

    const protectedAnyPage = (access: string[], element: ReactElement) => (
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
                <Route path="lehrkraft" element={protectedPage(ACCESS.GESCHAEFTSFUEHRUNG, <LehrkraftOverview/> )}/>
                <Route path="lehrkraft/kundenkorrespondenz" element={protectedPage(ACCESS.GESCHAEFTSFUEHRUNG, <LehrkraftKundenkorrespondenz/>)}/>
                <Route path="lehrkraft/lieferantenkorrespondenz" element={protectedPage(ACCESS.GESCHAEFTSFUEHRUNG, <LehrkraftLieferantenkorrespondenz/>)}/>
                <Route path="lehrkraft/zahlungen" element={protectedPage(ACCESS.GESCHAEFTSFUEHRUNG, <LehrkraftZahlungen/>)}/>
                <Route path="lehrkraft/rechnungen" element={protectedPage(ACCESS.GESCHAEFTSFUEHRUNG, <LehrkraftRechnungen/>)}/>
                <Route path="lehrkraft/optionen" element={protectedPage(ACCESS.GESCHAEFTSFUEHRUNG, <LehrkraftOptionen/>)}/>
                <Route
                    path="kunden"
                    element={protectedPage(ACCESS.KUNDE, <Kunden/>)}
                />
                <Route path="themen/einkauf" element={protectedPage(ACCESS.EINKAUF, <EinkaufOverview/>)}/>
                <Route path="themen/verkauf" element={protectedPage(ACCESS.VERKAUF, <VerkaufOverview/>)}/>
                <Route path="themen/verwaltung" element={protectedPage(ACCESS.BENUTZER, <VerwaltungOverview/>)}/>
                <Route path="themen/szenarien" element={<SzenarienOverview/>}/>
                <Route path="lieferanten" element={protectedPage(ACCESS.EINKAUF, <Lieferanten/>)}/>
                <Route path="lieferantenvergleich" element={protectedPage(ACCESS.EINKAUF, <Lieferantenvergleich/>)}/>
                <Route path="bestellungen" element={protectedPage(ACCESS.EINKAUF, <Bestellungen/>)}/>
                <Route path="einkaufsdokumente" element={protectedPage(ACCESS.EINKAUF, <Einkaufsdokumente/>)}/>
                <Route path="wareneingaenge" element={protectedPage(ACCESS.LAGER, <Wareneingaenge/>)}/>
                <Route path="versand" element={protectedPage(ACCESS.LOGISTIK, <Versand/>)}/>
                <Route path="retouren" element={protectedPage(ACCESS.LOGISTIK, <Retouren/>)}/>
                <Route path="kundenanfragen" element={protectedPage(ACCESS.VERKAUF, <Kundenanfragen/>)}/>
                <Route path="angebote" element={protectedPage(ACCESS.VERKAUF, <Angebote/>)}/>
                <Route path="auftraege" element={protectedPage(ACCESS.VERKAUF, <Auftraege/>)}/>
                <Route path="services" element={protectedPage(ACCESS.SERVICE, <Services/>)}/>
                <Route path="vertriebsdokumente" element={protectedPage(ACCESS.VERKAUF, <Vertriebsdokumente/>)}/>
                <Route path="vertriebsdokumente/auftrag/:auftragId" element={protectedPage(ACCESS.VERKAUF, <Vertriebsdokumente/>)}/>
                <Route path="reklamationen" element={protectedPage(ACCESS.SERVICE, <Reklamationen/>)}/>
                <Route path="organisation" element={protectedPage(ACCESS.ORGANISATION, <Organisation/>)}/>
                <Route path="glossar" element={<Glossar/>}/>
                <Route path="suche" element={<Suche/>}/>
                <Route path="partnerhistorie" element={protectedAnyPage([ACCESS.KUNDE, ACCESS.EINKAUF, ACCESS.VERKAUF, ACCESS.RECHNUNG, ACCESS.BUCHHALTUNG, ACCESS.GESCHAEFTSFUEHRUNG], <PartnerHistorie/>)}/>
                <Route path="buchhaltung" element={protectedPage(ACCESS.BUCHHALTUNG, <Buchhaltung/>)}/>
                <Route path="marketing" element={protectedPage(ACCESS.MARKETING, <Marketing/>)}/>
                <Route path="logistik" element={protectedPage(ACCESS.LOGISTIK, <Logistik/>)}/>
                <Route path="bestand" element={protectedPage(ACCESS.LAGER, <Bestand/>)}/>
                <Route path="personalwesen" element={protectedPage(ACCESS.PERSONALWESEN, <Personalwesen/>)}/>
                <Route path="geschaeftsfuehrung" element={protectedPage(ACCESS.GESCHAEFTSFUEHRUNG, <Geschaeftsfuehrung/>)}/>
                <Route
                    path="artikel"
                    element={protectedPage(ACCESS.ARTIKEL, <Artikel/>)}
                />
                <Route
                    path="kategorien"
                    element={protectedPage(ACCESS.ARTIKEL, <Kategorien/>)}
                />
                <Route
                    path="lager"
                    element={protectedPage(ACCESS.LAGER, <Bestand/>)}
                />
                <Route
                    path="rechnungen"
                    element={protectedPage(ACCESS.RECHNUNG, <Rechnungen/>)}
                />
                <Route path="eingangsrechnungen" element={protectedPage(ACCESS.RECHNUNG, <Eingangsrechnungen/>)}/>
                <Route path="ausgangsrechnungen" element={protectedPage(ACCESS.RECHNUNG, <Ausgangsrechnungen/>)}/>
                <Route path="zahlungen" element={protectedPage(ACCESS.BUCHHALTUNG, <Zahlungen/>)}/>
                <Route path="mahnungen" element={protectedPage(ACCESS.BUCHHALTUNG, <Mahnungen/>)}/>
                <Route path="belege" element={protectedPage(ACCESS.BUCHHALTUNG, <Belege/>)}/>
                <Route path="bankauszug" element={protectedAnyPage([ACCESS.BUCHHALTUNG, ACCESS.VERKAUF, ACCESS.EINKAUF, ACCESS.GESCHAEFTSFUEHRUNG], <Bankauszug/>)}/>
                <Route path="firmenkonto" element={protectedAnyPage([ACCESS.BUCHHALTUNG, ACCESS.VERKAUF, ACCESS.EINKAUF, ACCESS.GESCHAEFTSFUEHRUNG], <Firmenkonto/>)}/>
                <Route path="abc-analyse" element={protectedPage(ACCESS.BUCHHALTUNG, <ABCAnalyse/>)}/>
                <Route path="freigaben" element={protectedPage(ACCESS.GESCHAEFTSFUEHRUNG, <Freigaben/>)}/>
                <Route path="berichte" element={protectedPage(ACCESS.GESCHAEFTSFUEHRUNG, <Berichte/>)}/>
                <Route path="bewerber" element={protectedPage(ACCESS.PERSONALWESEN, <Bewerber/>)}/>
                <Route path="mitarbeiter" element={protectedPage(ACCESS.PERSONALWESEN, <Mitarbeiter/>)}/>
                <Route path="personalakte" element={protectedPage(ACCESS.PERSONALWESEN, <Personalakte/>)}/>
                <Route path="arbeitszeiten" element={protectedPage(ACCESS.PERSONALWESEN, <Arbeitszeiten/>)}/>
                <Route path="urlaubsantraege" element={protectedPage(ACCESS.PERSONALWESEN, <Urlaubsantraege/>)}/>
                <Route path="krankmeldungen" element={protectedPage(ACCESS.PERSONALWESEN, <Krankmeldungen/>)}/>
                <Route path="schulungen" element={protectedPage(ACCESS.PERSONALWESEN, <Schulungen/>)}/>
                <Route
                    path="benutzer"
                    element={protectedPage(ACCESS.BENUTZER, <Benutzer/>)}
                />
                <Route
                    path="nummernkreise"
                    element={protectedPage(ACCESS.BENUTZER, <Nummernkreise/>)}
                />
                <Route
                    path="optionen"
                    element={protectedPage(ACCESS.BENUTZER, <Optionen/>)}
                />
                <Route
                    path="exporte"
                    element={protectedPage(ACCESS.BENUTZER, <Exporte/>)}
                />
                <Route
                    path="rollen"
                    element={protectedPage(ACCESS.ROLLEN, <Rollen/>)}
                />
                <Route
                    path="rechte"
                    element={protectedPage(ACCESS.ROLLEN, <Rechte/>)}
                />
                <Route path="szenarien/regionale-bestellung" element={protectedPage(ACCESS.VERKAUF, <RegionaleBestellung/>)}/>
                <Route path="szenarien/grossbestellung" element={protectedPage(ACCESS.VERKAUF, <Grossbestellung/>)}/>
                <Route path="szenarien/firmenauftrag" element={protectedPage(ACCESS.VERKAUF, <Firmenauftrag/>)}/>
                <Route path="szenarien/eventbestellung" element={protectedPage(ACCESS.VERKAUF, <Eventbestellung/>)}/>
                <Route path="szenarien/service" element={protectedPage(ACCESS.SERVICE, <ServiceSzenario/>)}/>
                <Route path="szenarien/transportverzoegerung" element={protectedPage(ACCESS.VERKAUF, <Transportverzoegerung/>)}/>
                <Route path="szenarien/kooperation" element={protectedPage(ACCESS.MARKETING, <Kooperation/>)}/>
            </Route>
        </Routes>
    </BrowserRouter>);
}


export default AppRouter;
