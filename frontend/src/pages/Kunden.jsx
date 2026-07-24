import {useState} from "react";
import DataTable from "../components/DataTable";
import Dialog from "../components/Dialog";
import TextField from "../components/form/TextField";
import Checkbox from "../components/form/Checkbox";
import Label from "../components/form/Label";

import {
    getKunden, addKunde, updateKunde, deleteKunde
} from "../services/customerService";


export default function Kunden() {

    const [kunden, setKunden] = useState(getKunden());

    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState("");
    const [kunde, setKunde] = useState({
        id: null, name: "", kontakt: "", email: "", telefon: "", aktiv: true
    });

    const columns = [{
        field: "id", title: "Nr."
    }, {
        field: "name", title: "Kunde"
    }, {
        field: "kontakt", title: "Kontakt"
    }, {
        field: "email", title: "E-Mail"
    }, {
        field: "telefon", title: "Telefon"
    }];

    const gefilterteKunden = kunden.filter(k => Object.values(k)
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()));

    function neu() {

        setEditMode(false);

        setKunde({
            id: null, name: "", kontakt: "", email: "", telefon: "", aktiv: true
        });

        setOpen(true);

    }


    function bearbeiten(k) {

        setEditMode(true);
        setKunde(k);
        setOpen(true);

    }


    function loeschen(k) {

        if (confirm("Kunde löschen?")) {

            deleteKunde(k.id);
            setKunden(getKunden());

        }

    }


    function speichern() {

        if (editMode) updateKunde(kunde); else addKunde(kunde);

        setKunden(getKunden());
        setOpen(false);

    }

    function anzeigen(kunde) {

        console.log(kunde);

    }

    return (<>

        <DataTable

            title="Kundenverwaltung"

            columns={columns}

            data={gefilterteKunden}

            searchable={true}

            pageSize={pageSize}

            onSearch={setSearch}

            onPageSizeChange={setPageSize}
            onRowClick={anzeigen}
            toolbarActions={[{
                name: "new", label: "Neuer Kunde", permission: "kunde.anlegen", onClick: neu
            }]}

            rowActions={[{
                name: "edit", label: "Bearbeiten", permission: "kunde.bearbeiten", onClick: bearbeiten
            }, {
                name: "delete", label: "Löschen", permission: "kunde.bearbeiten", onClick: loeschen
            }]}

            page={1}

        />


        <Dialog

            open={open}

            title={editMode ? "Kunde bearbeiten" : "Neuer Kunde"}

            onClose={() => setOpen(false)}

        >

            <Label required>
                Name
            </Label>

            <TextField
                value={kunde.name}
                onChange={v => setKunde({...kunde, name: v})}
            />


            <Label>
                Ansprechpartner
            </Label>

            <TextField
                value={kunde.kontakt}
                onChange={v => setKunde({...kunde, kontakt: v})}
            />


            <Label>
                E-Mail
            </Label>

            <TextField
                type="email"
                value={kunde.email}
                onChange={v => setKunde({...kunde, email: v})}
            />


            <Label>
                Telefon
            </Label>

            <TextField
                type="tel"
                value={kunde.telefon}
                onChange={v => setKunde({...kunde, telefon: v})}
            />


            <Checkbox
                checked={kunde.aktiv}
                onChange={v => setKunde({...kunde, aktiv: v})}
            >
                Aktiv
            </Checkbox>


            <button onClick={speichern}>
                Speichern
            </button>


        </Dialog>

    </>);

}