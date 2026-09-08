import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import TextField from "../../components/form/TextField";
import TextArea from "../../components/form/TextArea";
import Label from "../../components/form/Label";
import LookupField from "../../components/form/LookupField";
import NumberField from "../../components/form/NumberField";
import SaveButton from "../../components/SaveButton";

import useAuth from "../../auth/useAuth";
import { useCRUDPage } from "../../hooks/useCRUDPage";
import artikelService from "../../services/logistik/artikelService";
import kategorienService from "../../services/logistik/kategorienService";
import { getAllTableColumns, getVisibleTableColumns, INITIAL_DATA, PAGE_CONFIG } from "../../constants/schemas";
import { useState, useMemo, useRef, useEffect } from "react";
import { useDataSyncRefresh } from "../../hooks/useDataSyncRefresh";
import { naechsteStammdatennummer } from "../../services/core/documentNumbering";
import artikelBilderService from "../../services/logistik/artikelBilderService";

const MAX_IMAGE_WIDTH = 1920;
const MAX_IMAGE_HEIGHT = 1080;
const CREATE_CATEGORY_OPTION_VALUE = "__create_category__";

function createBaugruppenDraft() {
    return {
        typ: "fest",
        artikelId: "",
        menge: 1,
        preisaenderung: 0,
        standard: false
    };
}

function createKategorieDraft() {
    return {
        name: "",
        parentId: "",
        beschreibung: ""
    };
}

function getCanvasOutputType(fileType = "") {
    return String(fileType).toLowerCase() === "image/png" ? "image/png" : "image/jpeg";
}

function loadImageFromFile(file) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const imageUrl = URL.createObjectURL(file);
        const image = new Image();
        image.onload = () => {
            URL.revokeObjectURL(imageUrl);
            resolve(image);
        };
        image.onerror = () => {
            URL.revokeObjectURL(imageUrl);
            reject(new Error("Bild konnte nicht geladen werden."));
        };
        image.src = imageUrl;
    });
}

async function resizeImageFile(file) {
    const type = String(file.type || "").toLowerCase();
    if (!["image/jpeg", "image/png"].includes(type)) return null;

    const image = await loadImageFromFile(file);
    const ratio = Math.min(MAX_IMAGE_WIDTH / image.width, MAX_IMAGE_HEIGHT / image.height, 1);
    const width = Math.max(1, Math.round(image.width * ratio));
    const height = Math.max(1, Math.round(image.height * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");

    if (!context) {
        throw new Error("Canvas-Kontext konnte nicht erstellt werden.");
    }

    context.drawImage(image, 0, 0, width, height);

    const outputType = getCanvasOutputType(type);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, outputType, outputType === "image/jpeg" ? 0.92 : undefined));
    if (!blob) {
        throw new Error("Bild konnte nicht verarbeitet werden.");
    }

    const extension = outputType === "image/png" ? "png" : "jpg";
    const baseName = String(file.name || "bild").replace(/\.[^.]+$/, "");
    return new File([blob], `${baseName}.${extension}`, { type: outputType });
}

async function createPreviewItems(files = []) {
    const resizeResults = await Promise.all(files.map(file => resizeImageFile(file).catch(() => null)));
    return resizeResults
        .filter(Boolean)
        .map((file, index) => ({
            id: `${file.name}-${file.size}-${index}-${Date.now()}`,
            name: file.name,
            url: URL.createObjectURL(file),
            source: "upload",
            file
        }));
}

export default function Artikel() {
    const syncTick = useDataSyncRefresh(["artikel", "artikelStueckliste", "artikelIndividualisierung", "kategorien"]);
    const { user } = useAuth();
    const config = PAGE_CONFIG.artikel;

    const {
        allData,
        open,
        editMode,
        pageSize,
        search,
        currentItem,
        setPageSize,
        setSearch,
        setCurrentItem,
        neu,
        bearbeiten,
        loeschen,
        handleClose,
        error
    } = useCRUDPage(config.tableName, INITIAL_DATA.artikel, artikelService, {
        createNewItem: () => ({
            ...INITIAL_DATA.artikel,
            artikelNr: naechsteStammdatennummer(artikelService.list().map(item => item.artikelNr), "artikel")
        }),
        requiredFields: [
            { field: "artikelNr", label: "Artikelnummer" },
            { field: "name", label: "Name" }
        ]
    });

    const columns = getVisibleTableColumns(config.tableName);
    const allColumns = getAllTableColumns(config.tableName);
    const [kategorieRefreshKey, setKategorieRefreshKey] = useState(0);
    const kategorien = useMemo(() => kategorienService.list(), [syncTick, kategorieRefreshKey]);

    const [categoryFilter, setCategoryFilter] = useState("");
    const [baugruppenDraft, setBaugruppenDraft] = useState(createBaugruppenDraft);
    const [ausgewaehlteOptionenJeKategorie, setAusgewaehlteOptionenJeKategorie] = useState<Record<string, any>>({});
    const [bildVorschauen, setBildVorschauen] = useState([]);
    const [isImageDragActive, setIsImageDragActive] = useState(false);
    const [bildFehler, setBildFehler] = useState("");
    const [grossesBild, setGrossesBild] = useState<any>(null);
    const [isBildSpeichern, setIsBildSpeichern] = useState(false);
    const [kategorieDialogOpen, setKategorieDialogOpen] = useState(false);
    const [kategorieDraft, setKategorieDraft] = useState(createKategorieDraft);
    const [kategorieFehler, setKategorieFehler] = useState("");
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleFieldChange = (field, value) => {
        setCurrentItem({ ...currentItem, [field]: value });
    };

    const resetBildVorschauen = () => {
        setBildFehler("");
        setGrossesBild(null);
        setBildVorschauen(current => {
            current.forEach(item => {
                if (item.source === "upload") {
                    URL.revokeObjectURL(item.url);
                }
            });
            return [];
        });
    };

    const uebernehmeBilddateien = async (files) => {
        const neueVorschauen = await createPreviewItems(Array.from(files || []));
        if (neueVorschauen.length === 0) {
            setBildFehler("Es konnten nur JPG- oder PNG-Bilder übernommen werden.");
            return;
        }
        setBildFehler("");

        setBildVorschauen(current => {
            const belegteSlots = new Set(current.map(item => Number(item.slot)));
            const freieSlots = Array.from({ length: 10 }, (_, index) => index).filter(slot => !belegteSlots.has(slot));
            const uebernahme = neueVorschauen.slice(0, freieSlots.length).map((item, index) => ({
                ...item,
                slot: freieSlots[index]
            }));
            const naechsteListe = [...current, ...uebernahme];
            setCurrentItem(item => ({
                ...item,
                anzahlBilder: naechsteListe.length
            }));
            return naechsteListe;
        });
    };

    const ausZwischenablageEinfuegen = async () => {
        if (!navigator.clipboard.read) {
            setBildFehler("Dieser Browser unterstützt das Einfügen aus der Zwischenablage hier nicht.");
            return;
        }

        try {
            const clipboardItems = await navigator.clipboard.read();
            const bildDateien = [];

            for (const item of clipboardItems) {
                const bildTyp = item.types.find(type => ["image/png", "image/jpeg"].includes(String(type).toLowerCase()));
                if (!bildTyp) continue;
                const blob = await item.getType(bildTyp);
                const endung = bildTyp === "image/png" ? "png" : "jpg";
                bildDateien.push(new File([blob], `zwischenablage-${Date.now()}.${endung}`, { type: bildTyp }));
            }

            if (bildDateien.length === 0) {
                setBildFehler("In der Zwischenablage wurde kein JPG- oder PNG-Bild gefunden.");
                return;
            }

            uebernehmeBilddateien(bildDateien);
        } catch {
            setBildFehler("Das Bild konnte nicht aus der Zwischenablage gelesen werden.");
        }
    };

    const bildEntfernen = (bildId) => {
        setBildVorschauen(current => {
            const gefunden = current.find(item => item.id === bildId);
            if (gefunden?.source === "upload") {
                URL.revokeObjectURL(gefunden.url);
            }
            const naechsteListe = current.filter(item => item.id !== bildId);
            if (grossesBild?.id === bildId) {
                setGrossesBild(null);
            }
            setCurrentItem(item => ({
                ...item,
                anzahlBilder: naechsteListe.length
            }));
            return naechsteListe;
        });
    };

    useEffect(() => {
        let isMounted = true;

        const ladeBilder = async () => {
            if (!open) return;
            if (!editMode || !currentItem.id) {
                resetBildVorschauen();
                return;
            }

            try {
                const bilder = await artikelBilderService.list(currentItem.id);
                if (!isMounted) return;
                setBildFehler("");
                setBildVorschauen(bilder.map((bild) => ({
                    id: `backend-${bild.slot}-${bild.filename}`,
                    name: bild.filename,
                    url: bild.url,
                    slot: Number(bild.slot),
                    source: "backend"
                })));
                setCurrentItem(item => ({
                    ...item,
                    anzahlBilder: bilder.length
                }));
            } catch (ladeFehler) {
                if (!isMounted) return;
                setBildFehler(ladeFehler instanceof Error ? ladeFehler.message : "Bilder konnten nicht geladen werden.");
            }
        };

        ladeBilder();
        return () => {
            isMounted = false;
        };
    }, [open, editMode, currentItem.id]);

    const komponentenOptionen = useMemo(() => allData
        .filter(item => item.id !== currentItem.id)
        .map(item => ({
            value: String(item.id),
            label: `${item.artikelNr} - ${item.name} (${item.artikelTyp || "Einzelartikel"})`
        })), [allData, currentItem.id]);
    const kategorienOptionen = useMemo(() => [
        {
            value: CREATE_CATEGORY_OPTION_VALUE,
            label: "Neue Kategorie anlegen...",
            action: true
        },
        ...kategorien.map(item => ({
            value: String(item.id),
            label: item.pfad
        }))
    ], [kategorien]);
    const kategorieParentOptionen = useMemo(() => kategorien.map(item => ({
        value: String(item.id),
        label: item.pfad
    })), [kategorien]);
    const kategorienNachId = useMemo(() => kategorien.reduce((map, item) => {
        map[String(item.id)] = item.pfad;
        return map;
    }, {}), [kategorien]);

    const festeKomponenten = useMemo(() => (currentItem.komponenten || []).map(position => {
        const artikelDetails = allData.find(item => String(item.id) === String(position.artikelId));
        return {
            ...position,
            artikelNr: artikelDetails?.artikelNr || "",
            artikel: artikelDetails?.name || position.artikel || "",
            verkaufspreis: Number(artikelDetails?.verkaufspreis || 0)
        };
    }), [allData, currentItem.komponenten]);

    const individualisierungenNachKategorie = useMemo(() => {
        return (currentItem.individualisierungen || []).reduce((gruppen, eintrag) => {
            const key = String(eintrag.kategorieId || "ohne-kategorie");
            if (!gruppen[key]) {
                gruppen[key] = [];
            }
            const artikelDetails = allData.find(item => String(item.id) === String(eintrag.individualArtikelId));
            gruppen[key].push({
                ...eintrag,
                artikelNr: artikelDetails?.artikelNr || "",
                artikel: artikelDetails?.name || eintrag.artikel || ""
            });
            return gruppen;
        }, {});
    }, [allData, currentItem.individualisierungen]);

    useEffect(() => {
        setAusgewaehlteOptionenJeKategorie(current => {
            const next: Record<string, any> = {};
            Object.entries(individualisierungenNachKategorie).forEach(([kategorieId, optionen]) => {
                const sortierteOptionen = [...(optionen as any[])].sort((a, b) => {
                    if (a.standard && !b.standard) return -1;
                    if (!a.standard && b.standard) return 1;
                    return String(a.artikel || "").localeCompare(String(b.artikel || ""));
                });
                const bisherigeAuswahl = current[kategorieId];
                const vorhandeneAuswahl = sortierteOptionen.find(option => String(option.individualArtikelId) === String(bisherigeAuswahl));
                next[kategorieId] = vorhandeneAuswahl?.individualArtikelId || sortierteOptionen[0]?.individualArtikelId || "";
            });
            return next;
        });
    }, [individualisierungenNachKategorie]);

    const baugruppenteilHinzufuegen = () => {
        const auswahl = allData.find(item => String(item.id) === String(baugruppenDraft.artikelId));
        if (!auswahl || Number(baugruppenDraft.menge) <= 0) return;

        if (baugruppenDraft.typ === "fest") {
            setCurrentItem(item => {
                const vorhandene = Array.isArray(item.komponenten) ? item.komponenten : [];
                const vorhanden = vorhandene.find(eintrag => String(eintrag.artikelId) === String(auswahl.id));
                if (vorhanden) {
                    return {
                        ...item,
                        komponenten: vorhandene.map(eintrag => String(eintrag.artikelId) === String(auswahl.id)
                            ? { ...eintrag, menge: Number(eintrag.menge || 0) + Number(baugruppenDraft.menge) }
                            : eintrag)
                    };
                }
                return {
                    ...item,
                    komponenten: [...vorhandene, {
                        artikelId: auswahl.id,
                        artikel: auswahl.name,
                        menge: Number(baugruppenDraft.menge)
                    }]
                };
            });
        } else {
            setCurrentItem(item => {
                const vorhandene = Array.isArray(item.individualisierungen) ? item.individualisierungen : [];
                const standardAktiv = Boolean(baugruppenDraft.standard);
                const bereinigteOptionen = vorhandene.map(eintrag => standardAktiv && String(eintrag.kategorieId) === String(auswahl.kategorieId)
                    ? { ...eintrag, standard: false }
                    : eintrag
                );
                const vorhanden = bereinigteOptionen.find(eintrag => String(eintrag.individualArtikelId) === String(auswahl.id));

                if (vorhanden) {
                    return {
                        ...item,
                        individualisierungen: bereinigteOptionen.map(eintrag => String(eintrag.individualArtikelId) === String(auswahl.id)
                            ? {
                                ...eintrag,
                                anzahl: Number(eintrag.anzahl || 0) + Number(baugruppenDraft.menge),
                                preisaenderung: Number(baugruppenDraft.preisaenderung),
                                standard: standardAktiv
                            }
                            : eintrag)
                    };
                }

                return {
                    ...item,
                    individualisierungen: [...bereinigteOptionen, {
                        individualArtikelId: auswahl.id,
                        artikel: auswahl.name,
                        anzahl: Number(baugruppenDraft.menge),
                        preisaenderung: Number(baugruppenDraft.preisaenderung),
                        standard: standardAktiv,
                        kategorieId: auswahl.kategorieId
                    }]
                };
            });
        }

        setBaugruppenDraft(createBaugruppenDraft());
    };

    const komponenteEntfernen = (artikelId) => {
        setCurrentItem(item => ({
            ...item,
            komponenten: (item.komponenten || []).filter(eintrag => String(eintrag.artikelId) !== String(artikelId))
        }));
    };

    const individualisierungEntfernen = (individualArtikelId) => {
        setCurrentItem(item => ({
            ...item,
            individualisierungen: (item.individualisierungen || []).filter(eintrag => String(eintrag.individualArtikelId) !== String(individualArtikelId))
        }));
    };

    const individualisierungAktualisieren = (individualArtikelId, feld, wert) => {
        setCurrentItem(item => ({
            ...item,
            individualisierungen: (item.individualisierungen || []).map(eintrag => String(eintrag.individualArtikelId) === String(individualArtikelId)
                ? { ...eintrag, [feld]: wert }
                : eintrag)
        }));
    };

    const handleFilterChange = (filters) => {
        setCategoryFilter(filters.kategorie || "");
    };

    const neueKategorieOeffnen = () => {
        setKategorieDraft(createKategorieDraft());
        setKategorieFehler("");
        setKategorieDialogOpen(true);
    };

    const kategorieSpeichern = () => {
        const name = kategorieDraft.name.trim();
        if (!name) {
            setKategorieFehler("Bitte das Pflichtfeld Name ausfüllen.");
            return false;
        }

        const neueKategorie = kategorienService.create({
            ...kategorieDraft,
            name,
            parentId: kategorieDraft.parentId || "",
            beschreibung: kategorieDraft.beschreibung || ""
        });
        const normalisierteKategorie = kategorienService.getById(neueKategorie.id) || neueKategorie;

        setCurrentItem(item => ({
            ...item,
            kategorieId: String(normalisierteKategorie.id),
            kategorie: normalisierteKategorie.pfad?.split(" > ")[0] || normalisierteKategorie.name || "",
            kategoriePfad: normalisierteKategorie.pfad || normalisierteKategorie.name || ""
        }));
        setKategorieFehler("");
        setKategorieRefreshKey(value => value + 1);
        return true;
    };

    const dialogSchliessen = () => {
        resetBildVorschauen();
        handleClose();
    };

    const speichernMitBildern = async () => {
        const fehlendeFelder = [
            { field: "artikelNr", label: "Artikelnummer" },
            { field: "name", label: "Name" }
        ].filter(({ field }) => {
            const value = currentItem[field];
            return value === null || value === undefined || String(value).trim() === "";
        });

        if (fehlendeFelder.length > 0) {
            setBildFehler(`Bitte folgende Pflichtfelder ausfüllen: ${fehlendeFelder.map(item => item.label).join(", ")}.`);
            return;
        }

        setIsBildSpeichern(true);
        setBildFehler("");

        try {
            const gespeicherterArtikel = editMode
                ? artikelService.update(currentItem)
                : artikelService.create(currentItem);

            const backendBilder = editMode && gespeicherterArtikel.id
                ? await artikelBilderService.list(gespeicherterArtikel.id)
                : [];
            const backendSlots = new Set<number>(backendBilder.map(item => Number(item.slot)));
            const aktuelleSlots = new Set<number>(bildVorschauen.map(item => Number(item.slot)));

            for (const slot of backendSlots) {
                if (!aktuelleSlots.has(slot)) {
                    await artikelBilderService.remove(gespeicherterArtikel.id, slot);
                }
            }

            for (const bild of bildVorschauen) {
                if (bild.source === "upload" && bild.file) {
                    await artikelBilderService.upload(gespeicherterArtikel.id, Number(bild.slot), bild.file);
                }
            }

            resetBildVorschauen();
            handleClose();
        } catch (speicherFehler) {
            setBildFehler(speicherFehler instanceof Error ? speicherFehler.message : "Bilder konnten nicht gespeichert werden.");
        } finally {
            setIsBildSpeichern(false);
        }
    };

    const filteredDisplayData = useMemo(() => {
        let filtered = allData;
        if (categoryFilter) {
            filtered = filtered.filter(item => String(item.kategorieId) === String(categoryFilter));
        }
        if (search) {
            filtered = filtered.filter(item =>
                Object.values(item)
                    .join(" ")
                    .toLowerCase()
                    .includes(search.toLowerCase())
            );
        }
        return filtered;
    }, [allData, categoryFilter, search]);

    const artikelFilters = useMemo(() => [
        {
            name: "kategorie",
            label: "Kategorie",
            options: kategorien.map(item => ({ value: String(item.id), label: item.pfad }))
        }
    ], [kategorien]);

    return (
        <>
            <DataTable
                title={config.title}
                tableName={config.tableName}
                username={user.username || ""}
                columns={columns}
                allColumns={allColumns}
                data={filteredDisplayData}
                filters={artikelFilters}
                onFilter={handleFilterChange}
                searchable={true}
                pageSize={pageSize}
                onSearch={setSearch}
                onPageSizeChange={setPageSize}
                toolbarActions={[
                    { name: "new", label: "Neuer Artikel", permission: config.permissionCreate, onClick: neu }
                ]}
                rowActions={[
                    { name: "edit", label: "Bearbeiten", permission: config.permissionEdit, onClick: bearbeiten },
                    { name: "delete", label: "Löschen", permission: config.permissionEdit, onClick: loeschen }
                ]}
                page={1}
            />

            <Dialog
                open={open}
                title={editMode ? "Artikel bearbeiten" : "Neuer Artikel"}
                onClose={kategorieDialogOpen ? () => setKategorieDialogOpen(false) : dialogSchliessen}
            >
                <Label required glossaryKey="artikelnummer">Artikelnummer</Label>
                <TextField value={currentItem.artikelNr} onChange={v => handleFieldChange("artikelNr", v)} disabled />

                <Label required>Name</Label>
                <TextField value={currentItem.name} onChange={v => handleFieldChange("name", v)} />

                <Label glossaryKey="kategorie">Kategorie</Label>
                <LookupField value={currentItem.kategorieId || ""} options={kategorienOptionen} onChange={value => {
                    if (value === CREATE_CATEGORY_OPTION_VALUE) {
                        neueKategorieOeffnen();
                        return;
                    }
                    const kategorie = kategorien.find(item => String(item.id) === String(value));
                    setCurrentItem(item => ({
                        ...item,
                        kategorieId: value,
                        kategorie: kategorie?.pfad?.split(" > ")[0] || "",
                        kategoriePfad: kategorie?.pfad || ""
                    }));
                }} placeholder="Kategorie wählen..." />

                <Label>Typ</Label>
                <select value={currentItem.artikelTyp || "Einzelartikel"} onChange={event => handleFieldChange("artikelTyp", event.target.value)}>
                    <option value="Einzelartikel">Einzelartikel</option>
                    <option value="Komponente">Komponente</option>
                    <option value="Baugruppe">Baugruppe</option>
                </select>

                <Label glossaryKey="einkaufspreis">Einkaufspreis</Label>
                <NumberField value={currentItem.einkaufspreis} min="0" step="0.01" format="currency" onChange={v => handleFieldChange("einkaufspreis", Number(v || 0))} />

                <Label glossaryKey="verkaufspreis">Verkaufspreis</Label>
                <NumberField value={currentItem.verkaufspreis} min="0" step="0.01" format="currency" onChange={v => handleFieldChange("verkaufspreis", Number(v || 0))} />

                <div className="form-row">
                    <p>Ohne EK-Preis gilt der Artikel als selbst hergestellt. Ohne VK-Preis ist er nicht verkaufbar. Komponenten und Baugruppen können verkauft werden, sobald ein VK-Preis hinterlegt ist.</p>
                </div>

                <Label>Lager-Bestand</Label>
                <NumberField value={currentItem.bestand} min="0" step="1" onChange={v => handleFieldChange("bestand", Number(v || 0))} />

                <div className="form-row">
                    <div>
                        <Label>Eiserner Bestand</Label>
                        <NumberField value={currentItem.mindestmenge || 0} min="0" step="1" onChange={v => handleFieldChange("mindestmenge", Number(v || 0))} />
                    </div>
                    <div>
                        <Label>Nachbestellen ab</Label>
                        <NumberField value={currentItem.bedarfsmeldungBei || 0} min="0" step="1" onChange={v => handleFieldChange("bedarfsmeldungBei", Number(v || 0))} />
                    </div>
                </div>

                <div className="form-row">
                    <p>Der Eiserne Bestand steuert die Freigabepflicht im Verkauf. Die Bedarfsmeldung taucht im Einkauf auf, sobald der Bestand diesen Wert erreicht oder unterschreitet.</p>
                </div>

                {currentItem.artikelTyp === "Baugruppe" && <>
                    <div className="form-row">
                        <Label glossaryKey="stueckliste">Bestandteil hinzufügen</Label>
                        <p style={{ fontSize: "0.85em", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                            Füge feste Bestandteile der Stückliste oder wählbare Optionen für die Individualisierung hinzu.
                        </p>
                        <div className="form-row bestellposition-hinzufuegen" style={{ alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                            <div style={{ flex: "1 1 220px" }}>
                                <Label>Artikel</Label>
                                <LookupField
                                    value={baugruppenDraft.artikelId}
                                    options={komponentenOptionen}
                                    onChange={value => setBaugruppenDraft(item => ({ ...item, artikelId: value }))}
                                    placeholder="Artikel suchen..."
                                />
                            </div>
                            <div style={{ width: "90px" }}>
                                <Label>Menge</Label>
                                <NumberField value={baugruppenDraft.menge} min="1" step="1" onChange={v => setBaugruppenDraft(item => ({ ...item, menge: Number(v || 1) }))} />
                            </div>
                            <div style={{ flex: "1 1 160px" }}>
                                <Label>Typ</Label>
                                <select value={baugruppenDraft.typ} onChange={event => setBaugruppenDraft(item => ({ ...item, typ: event.target.value }))}>
                                    <option value="fest">Feste Stückliste</option>
                                    <option value="option">Wählbare Option</option>
                                </select>
                            </div>

                            {baugruppenDraft.typ === "option" && (
                                <>
                                    <div style={{ width: "130px" }}>
                                        <Label>Aufpreis</Label>
                                        <NumberField value={baugruppenDraft.preisaenderung} step="0.01" format="currency" onChange={v => setBaugruppenDraft(item => ({ ...item, preisaenderung: Number(v || 0) }))} />
                                    </div>
                                    <div style={{ paddingTop: "1.8rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <input
                                            type="checkbox"
                                            id="baugruppe-standard"
                                            checked={baugruppenDraft.standard}
                                            onChange={event => setBaugruppenDraft(item => ({ ...item, standard: event.target.checked }))}
                                        />
                                        <label htmlFor="baugruppe-standard">Standard</label>
                                    </div>
                                </>
                            )}

                            <div style={{ paddingTop: "1.8rem" }}>
                                <button type="button" onClick={baugruppenteilHinzufuegen}>Hinzufügen</button>
                            </div>
                        </div>
                    </div>

                    <div className="form-row">
                        <Label glossaryKey="stueckliste">Feste Stückliste</Label>
                        <div className="position-table-wrapper" style={{ marginTop: "0.5rem" }}>
                            <table className="position-table">
                                <thead>
                                    <tr>
                                        <th>Artikel-Nr.</th>
                                        <th>Name</th>
                                        <th>Menge</th>
                                        <th>Einzelpreis</th>
                                        <th>Gesamtpreis</th>
                                        <th>Aktion</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {festeKomponenten.length > 0 ? festeKomponenten.map(position => (
                                        <tr key={`fest-${position.artikelId}`}>
                                            <td>{position.artikelNr}</td>
                                            <td>{position.artikel}</td>
                                            <td>{position.menge}</td>
                                            <td>{position.verkaufspreis.toFixed(2)} EUR</td>
                                            <td>{(position.verkaufspreis * Number(position.menge)).toFixed(2)} EUR</td>
                                            <td>
                                                <button type="button" className="link-button" onClick={() => komponenteEntfernen(position.artikelId)}>
                                                    Entfernen
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={6} style={{ textAlign: "center", padding: "1rem" }}>
                                                Noch keine festen Komponenten hinterlegt.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="form-row">
                        <Label>Wählbare Optionen</Label>
                        {Object.entries(individualisierungenNachKategorie).length === 0 ? <p>Noch keine Individualisierungen hinterlegt.</p> : (
                            <div className="position-table-wrapper" style={{ marginTop: "0.75rem" }}>
                                <table className="position-table">
                                    <thead>
                                        <tr>
                                            <th>Kategorie</th>
                                            <th>Artikel</th>
                                            <th>Anzahl</th>
                                            <th>Aufpreis</th>
                                            <th>Aktion</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(individualisierungenNachKategorie).map(([kategorieId, optionen]) => {
                                            const sortierteOptionen = [...(optionen as any[])].sort((a, b) => {
                                                if (a.standard && !b.standard) return -1;
                                                if (!a.standard && b.standard) return 1;
                                                return String(a.artikel || "").localeCompare(String(b.artikel || ""));
                                            });
                                            const ausgewaehlt = sortierteOptionen.find(option => String(option.individualArtikelId) === String(ausgewaehlteOptionenJeKategorie[kategorieId])) || sortierteOptionen[0];

                                            return (
                                                <tr key={kategorieId}>
                                                    <td style={{ fontWeight: 600 }}>{kategorienNachId[kategorieId] || `Kategorie ${kategorieId}`}</td>
                                                    <td>
                                                        <select
                                                            value={ausgewaehlt?.individualArtikelId || ""}
                                                            onChange={event => setAusgewaehlteOptionenJeKategorie(current => ({
                                                                ...current,
                                                                [kategorieId]: event.target.value
                                                            }))}
                                                            style={{ fontWeight: ausgewaehlt?.standard ? 700 : 400 }}
                                                        >
                                                            {sortierteOptionen.map(option => (
                                                                <option key={`option-${option.individualArtikelId}`} value={option.individualArtikelId} style={{ fontWeight: option.standard ? 700 : 400 }}>
                                                                    {option.artikelNr} - {option.artikel}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td style={{ width: "110px" }}>
                                                        <NumberField
                                                            value={ausgewaehlt?.anzahl || 0}
                                                            min="0"
                                                            step="1"
                                                            onChange={value => ausgewaehlt && individualisierungAktualisieren(ausgewaehlt.individualArtikelId, "anzahl", Number(value || 0))}
                                                        />
                                                    </td>
                                                    <td style={{ width: "140px" }}>
                                                        <NumberField
                                                            value={ausgewaehlt?.preisaenderung || 0}
                                                            step="0.01"
                                                            format="currency"
                                                            onChange={value => ausgewaehlt && individualisierungAktualisieren(ausgewaehlt.individualArtikelId, "preisaenderung", Number(value || 0))}
                                                        />
                                                    </td>
                                                    <td style={{ width: "100px" }}>
                                                        <button
                                                            type="button"
                                                            className="link-button"
                                                            onClick={() => ausgewaehlt && individualisierungEntfernen(ausgewaehlt.individualArtikelId)}
                                                        >
                                                            Entfernen
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>}

                <div className="form-row">
                    <Label>Beschreibung</Label>
                    <TextArea
                        rows={2}
                        placeholder="Beschreibung des Artikels..."
                        value={currentItem.beschreibung}
                        onChange={v => handleFieldChange("beschreibung", v)}
                    />
                </div>

                <div className="form-row">
                    <Label>Bilder</Label>
                    <div
                        className={`artikelbild-overlay${isImageDragActive ? " is-drag-active" : ""}`}
                        onDragEnter={event => {
                            event.preventDefault();
                            setIsImageDragActive(true);
                        }}
                        onDragOver={event => {
                            event.preventDefault();
                            setIsImageDragActive(true);
                        }}
                        onDragLeave={event => {
                            event.preventDefault();
                            const nextTarget = event.relatedTarget;
                            if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return;
                            setIsImageDragActive(false);
                        }}
                        onDrop={event => {
                            event.preventDefault();
                            setIsImageDragActive(false);
                            uebernehmeBilddateien(event.dataTransfer.files);
                        }}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                            multiple
                            hidden
                            onChange={event => {
                                uebernehmeBilddateien(event.target.files);
                                event.target.value = "";
                            }}
                        />
                        <div className="artikelbild-overlay-header">
                            <strong>Bis zu 10 Bilder per Drag and Drop</strong>
                            <span>Erlaubt sind JPG und PNG.</span>
                        </div>
                        <div className="artikelbild-overlay-actions">
                            <div className="thread-document-links">
                                <button type="button" className="button-secondary" onClick={() => fileInputRef.current?.click()}>
                                    Bilder auswählen
                                </button>
                                <button type="button" className="button-secondary" onClick={ausZwischenablageEinfuegen}>
                                    Aus Zwischenablage einfügen
                                </button>
                            </div>
                            <small>{bildVorschauen.length}/10 ausgewählt</small>
                        </div>
                        {bildFehler && <p className="form-error">{bildFehler}</p>}
                        {bildVorschauen.length === 0
                            ? <p className="artikelbild-overlay-empty">Ziehe Bilder hier hinein oder wähle sie manuell aus.</p>
                            : <div className="artikelbild-vorschau-grid">
                                {bildVorschauen.map((bild) => <article key={bild.id} className="artikelbild-vorschau-card">
                                    <button type="button" className="artikelbild-vorschau-button" onClick={() => setGrossesBild(bild)}>
                                        <img src={bild.url} alt={bild.name} className="artikelbild-vorschau" />
                                    </button>
                                    <div className="artikelbild-vorschau-meta">
                                        <strong>Slot {bild.slot}</strong>
                                        <span>{bild.name}</span>
                                    </div>
                                    <button type="button" className="link-button" onClick={() => bildEntfernen(bild.id)}>Löschen</button>
                                </article>)}
                            </div>}
                    </div>
                </div>

                <div className="form-row">
                    {(error || bildFehler) && <p className="form-error">{error || bildFehler}</p>}
                    <button type="button" onClick={speichernMitBildern} disabled={isBildSpeichern}>
                        {isBildSpeichern ? "Speichert..." : "Speichern"}
                    </button>
                </div>
            </Dialog>

            <Dialog open={Boolean(grossesBild)} title={grossesBild?.name || "Bildvorschau"} onClose={() => setGrossesBild(null)}>
                {grossesBild && <div className="form-row artikelbild-dialog-content">
                    <img src={grossesBild.url} alt={grossesBild.name} className="artikelbild-dialog-preview" />
                </div>}
            </Dialog>

            <Dialog
                open={kategorieDialogOpen}
                title="Neue Kategorie"
                onClose={() => {
                    setKategorieFehler("");
                    setKategorieDialogOpen(false);
                }}
                footer={<SaveButton onSave={kategorieSpeichern} onSuccess={() => setKategorieDialogOpen(false)}>Kategorie speichern</SaveButton>}
            >
                <div>
                    <Label required>Name</Label>
                    <TextField value={kategorieDraft.name} onChange={value => {
                        setKategorieFehler("");
                        setKategorieDraft(item => ({ ...item, name: value }));
                    }} />
                </div>
                <div>
                    <Label>Oberkategorie</Label>
                    <LookupField value={kategorieDraft.parentId} options={kategorieParentOptionen} onChange={value => {
                        setKategorieFehler("");
                        setKategorieDraft(item => ({ ...item, parentId: value }));
                    }} placeholder="Optional Oberkategorie waehlen..." />
                </div>
                <div className="form-row">
                    <Label>Beschreibung</Label>
                    <TextArea rows={3} value={kategorieDraft.beschreibung} onChange={value => {
                        setKategorieFehler("");
                        setKategorieDraft(item => ({ ...item, beschreibung: value }));
                    }} />
                </div>
                <div className="form-row">
                    {kategorieFehler && <p className="form-error">{kategorieFehler}</p>}
                </div>
            </Dialog>
        </>
    );
}
