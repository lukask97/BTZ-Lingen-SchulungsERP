import DataTable from "../../components/DataTable";
import Dialog from "../../components/Dialog";
import TextField from "../../components/form/TextField";
import TextArea from "../../components/form/TextArea";
import Label from "../../components/form/Label";
import LookupField from "../../components/form/LookupField";
import NumberField from "../../components/form/NumberField";

import useAuth from "../../auth/useAuth";
import { useCRUDPage } from "../../hooks/useCRUDPage";
import artikelService from "../../services/logistik/artikelService";
import kategorienService from "../../services/logistik/kategorienService";
import { getAllTableColumns, getVisibleTableColumns, INITIAL_DATA, PAGE_CONFIG } from "../../constants/schemas";
import { useState, useMemo, useRef, useEffect } from "react";
import { useStorageSyncRefresh } from "../../hooks/useStorageSyncRefresh";
import { naechsteStammdatennummer } from "../../services/core/documentNumbering";
import artikelBilderService from "../../services/logistik/artikelBilderService";

const MAX_IMAGE_WIDTH = 1920;
const MAX_IMAGE_HEIGHT = 1080;

function createKomponentenDraft() {
    return {
        komponenteId: "",
        komponentenMenge: 1
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
    const syncTick = useStorageSyncRefresh(["artikel", "artikelStueckliste", "kategorien"]);
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
        speichern,
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
    const kategorien = useMemo(() => kategorienService.list(), [syncTick]);

    const [categoryFilter, setCategoryFilter] = useState("");
    const [komponentenDraft, setKomponentenDraft] = useState(createKomponentenDraft);
    const [bildVorschauen, setBildVorschauen] = useState([]);
    const [isImageDragActive, setIsImageDragActive] = useState(false);
    const [bildFehler, setBildFehler] = useState("");
    const [grossesBild, setGrossesBild] = useState<any>(null);
    const [isBildSpeichern, setIsBildSpeichern] = useState(false);
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
            setBildFehler("Es konnten nur JPG- oder PNG-Bilder uebernommen werden.");
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
        if (!navigator.clipboard?.read) {
            setBildFehler("Dieser Browser unterstuetzt das Einfuegen aus der Zwischenablage hier nicht.");
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
        } catch (error) {
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
            } catch (error) {
                if (!isMounted) return;
                setBildFehler(error instanceof Error ? error.message : "Bilder konnten nicht geladen werden.");
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
    const kategorienOptionen = useMemo(() => kategorien.map(item => ({
        value: String(item.id),
        label: item.pfad
    })), [kategorien]);

    const komponenteHinzufuegen = () => {
        const auswahl = allData.find(item => String(item.id) === String(komponentenDraft.komponenteId));
        if (!auswahl || Number(komponentenDraft.komponentenMenge) <= 0) return;

        setCurrentItem(item => {
            const vorhandeneKomponenten = Array.isArray(item.komponenten) ? item.komponenten : [];
            const vorhanden = vorhandeneKomponenten.find(eintrag => eintrag.artikelId === auswahl.id);
            if (vorhanden) {
                return {
                    ...item,
                    komponenten: vorhandeneKomponenten.map(eintrag => eintrag.artikelId === auswahl.id
                        ? { ...eintrag, menge: eintrag.menge + Number(komponentenDraft.komponentenMenge) }
                        : eintrag)
                };
            }
            return {
                ...item,
                komponenten: [...vorhandeneKomponenten, {
                    artikelId: auswahl.id,
                    artikel: auswahl.name,
                    menge: Number(komponentenDraft.komponentenMenge)
                }]
            };
        });
        setKomponentenDraft(createKomponentenDraft());
    };

    const komponenteEntfernen = (artikelId) => {
        setCurrentItem(item => ({
            ...item,
            komponenten: (item.komponenten || []).filter(eintrag => eintrag.artikelId !== artikelId)
        }));
    };

    const handleFilterChange = (filters) => {
        setCategoryFilter(filters.kategorie || "");
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
            const value = currentItem?.[field];
            return value === null || value === undefined || String(value).trim() === "";
        });

        if (fehlendeFelder.length > 0) {
            setBildFehler(`Bitte folgende Pflichtfelder ausfuellen: ${fehlendeFelder.map(item => item.label).join(", ")}.`);
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
            const backendSlots = new Set(backendBilder.map(item => Number(item.slot)));
            const aktuelleSlots = new Set(bildVorschauen.map(item => Number(item.slot)));

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
        } catch (error) {
            setBildFehler(error instanceof Error ? error.message : "Bilder konnten nicht gespeichert werden.");
        } finally {
            setIsBildSpeichern(false);
        }
    };

    const filteredDisplayData = useMemo(() => {
        // Filter auf ungefilterte Daten anwenden
        let filtered = allData;
        if (categoryFilter) {
            filtered = filtered.filter(item => String(item.kategorieId) === String(categoryFilter));
        }
        // Dann Suche anwenden
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
                username={user?.username || ""}
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
                onClose={dialogSchliessen}
            >
                <Label required glossaryKey="artikelnummer">Artikelnummer</Label>
                <TextField value={currentItem.artikelNr} onChange={v => handleFieldChange("artikelNr", v)} disabled />

                <Label required>Name</Label>
                <TextField value={currentItem.name} onChange={v => handleFieldChange("name", v)} />

                <Label glossaryKey="kategorie">Kategorie</Label>
                <LookupField value={currentItem.kategorieId || ""} options={kategorienOptionen} onChange={value => {
                    const kategorie = kategorien.find(item => String(item.id) === String(value));
                    setCurrentItem(item => ({
                        ...item,
                        kategorieId: value,
                        kategorie: kategorie?.pfad.split(" > ")[0] || "",
                        kategoriePfad: kategorie?.pfad || ""
                    }));
                }} placeholder="Kategorie waehlen..." />

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

                <Label>Bestand</Label>
                <NumberField value={currentItem.bestand} min="0" step="1" onChange={v => handleFieldChange("bestand", Number(v || 0))} />

                <div className="form-row">
                    <div>
                        <Label>Sicherheitsbestand</Label>
                        <NumberField value={currentItem.mindestmenge || 0} min="0" step="1" onChange={v => handleFieldChange("mindestmenge", Number(v || 0))} />
                    </div>
                    <div>
                        <Label>Bedarfsmeldung bei</Label>
                        <NumberField value={currentItem.bedarfsmeldungBei || 0} min="0" step="1" onChange={v => handleFieldChange("bedarfsmeldungBei", Number(v || 0))} />
                    </div>
                </div>

                <div className="form-row">
                    <p>Der Sicherheitsbestand steuert die Freigabepflicht im Verkauf. Die Bedarfsmeldung taucht im Einkauf auf, sobald der Bestand diesen Wert erreicht oder unterschreitet.</p>
                </div>

                {currentItem.artikelTyp === "Baugruppe" && <>
                    <div className="form-row bestellposition-hinzufuegen">
                        <div>
                            <Label glossaryKey="stueckliste">Komponente</Label>
                            <LookupField
                                value={komponentenDraft.komponenteId}
                                options={komponentenOptionen}
                                onChange={value => setKomponentenDraft(item => ({ ...item, komponenteId: value }))}
                                placeholder="Komponente suchen..."
                            />
                        </div>
                        <div>
                            <Label>Menge</Label>
                            <NumberField value={komponentenDraft.komponentenMenge} min="1" step="1" onChange={v => setKomponentenDraft(item => ({ ...item, komponentenMenge: Number(v || 1) }))} />
                        </div>
                        <button type="button" onClick={komponenteHinzufuegen}>Komponente hinzufügen</button>
                    </div>
                    <div className="form-row">
                        <Label glossaryKey="stueckliste">Stückliste</Label>
                        {currentItem.komponenten?.length
                            ? <ul className="positionsliste">
                                {currentItem.komponenten.map(position => <li key={position.artikelId}>
                                    {position.artikel}: {position.menge}
                                    <button type="button" className="link-button" onClick={() => komponenteEntfernen(position.artikelId)}>Entfernen</button>
                                </li>)}
                            </ul>
                            : <p>Noch keine Komponenten hinterlegt.</p>}
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
                            if (event.currentTarget.contains(event.relatedTarget as Node)) return;
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
                                    Bilder auswaehlen
                                </button>
                                <button type="button" className="button-secondary" onClick={ausZwischenablageEinfuegen}>
                                    Aus Zwischenablage einfuegen
                                </button>
                            </div>
                            <small>{bildVorschauen.length}/10 ausgewaehlt</small>
                        </div>
                        {bildFehler && <p className="form-error">{bildFehler}</p>}
                        {bildVorschauen.length === 0
                            ? <p className="artikelbild-overlay-empty">Ziehe Bilder hier hinein oder waehle sie manuell aus.</p>
                            : <div className="artikelbild-vorschau-grid">
                                {bildVorschauen.map((bild, index) => <article key={bild.id} className="artikelbild-vorschau-card">
                                    <button type="button" className="artikelbild-vorschau-button" onClick={() => setGrossesBild(bild)}>
                                        <img src={bild.url} alt={bild.name} className="artikelbild-vorschau"/>
                                    </button>
                                    <div className="artikelbild-vorschau-meta">
                                        <strong>Slot {bild.slot}</strong>
                                        <span>{bild.name}</span>
                                    </div>
                                    <button type="button" className="link-button" onClick={() => bildEntfernen(bild.id)}>Loeschen</button>
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
                    <img src={grossesBild.url} alt={grossesBild.name} className="artikelbild-dialog-preview"/>
                </div>}
            </Dialog>
        </>
    );
}
