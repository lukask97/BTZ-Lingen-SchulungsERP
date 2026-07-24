import {useState} from "react";
import DataTable from "../components/DataTable";
import Dialog from "../components/Dialog";
import {permissions} from "../services/permissionService";
import PermissionButton from "../components/PermissionButton";


import Checkbox from "../components/form/Checkbox";
import Label from "../components/form/Label";
import TextField from "../components/form/TextField";

import {
    getRollen, addRolle, updateRolle, deleteRolle
} from "../services/roleService";

export default function Rollen() {

    const [rollen, setRollen] = useState(getRollen());
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [aktuelleRolle, setAktuelleRolle] = useState(null);

    const [name, setName] = useState("");
    const [rechte, setRechte] = useState([]);
    const [selectedPermissions, setSelectedPermissions] = useState([]);


    const columns = [{field: "id", title: "Nr."}, {field: "name", title: "Rolle"}, {
        field: "rechte", title: "Rechte", render: r => r.rechte.join(", ")
    }];


    const permissionGroups = permissions.reduce((groups, permission) => {

        if (!groups[permission.group]) {
            groups[permission.group] = [];
        }

        groups[permission.group].push(permission);

        return groups;

    }, {});

    function toggleGroup(rights) {

        const codes = rights.map(r => r.code);


        const allSelected = codes.every(code => selectedPermissions.includes(code));


        if (allSelected) {

            setSelectedPermissions(selectedPermissions.filter(p => !codes.includes(p)));

        } else {

            setSelectedPermissions([...new Set([...selectedPermissions, ...codes])]);

        }
    }

    function togglePermission(code) {

        if (selectedPermissions.includes(code)) {
            setSelectedPermissions(selectedPermissions.filter(p => p !== code));
        } else {
            setSelectedPermissions([...selectedPermissions, code]);
        }

    }

    function loeschen(r) {

        if (window.confirm("Rolle " + r.name + " löschen?")) {
            deleteRolle(r.id);
            setRollen(getRollen());

        }

    }

    function rechteAendern(code) {

        if (rechte.includes(code)) {
            setRechte(rechte.filter(r => r !== code));
        } else {
            setRechte([...rechte, code]);
        }
    }


    function speichern() {

        const rolle = {
            id: Date.now(),
            name: name,
            rechte: selectedPermissions

        };
        console.log(rolle);
        setOpen(false);

    }

    function neueRolle() {
        setEditMode(false);
        setAktuelleRolle(null);
        setName("");
        setRechte([]);
        setOpen(true);
    }


    function bearbeiten(r) {
        setEditMode(true);
        setAktuelleRolle(r);
        setName(r.name);
        setRechte(r.rechte);
        setOpen(true);
    }

    return (<>
        <DataTable
            title="Rollenverwaltung"
            columns={columns}
            data={rollen}
            toolbarActions={[{
                name: "new", label: "Neue Rolle", permission: "rolle.verwalten", onClick: () => setOpen(true)
            }]}

            rowActions={[{
                name: "edit", label: "Bearbeiten", permission: "rolle.verwalten", onClick: bearbeiten
            }, {
                name: "delete", label: "Löschen", permission: "rolle.verwalten", onClick: loeschen
            }]}

            page={1}

        />

        <Dialog

            open={open}

            title="Neue Rolle"

            onClose={() => setOpen(false)}

            footer={

                <>

                    <button
                        onClick={() => setOpen(false)}
                    >
                        Abbrechen
                    </button>


                    <button
                        onClick={speichern}
                    >
                        Speichern
                    </button>

                </>

            }

        >


            <div>

                <Label required>Rollenname</Label>

                <TextField
                    value={name}
                    onChange={setName}
                />

            </div>


            <h3>
                Berechtigungen
            </h3>


            {Object.entries(permissionGroups).map(([group, rights]) => (
                <div key={group} className="permission-group">

                    <Checkbox
                        checked={rights.every(r => selectedPermissions.includes(r.code))}
                        onChange={() => toggleGroup(rights)}
                    >
                        <strong>{group}</strong>
                    </Checkbox>

                    <div className="permission-list">
                        {rights.map(permission => (
                            <Checkbox
                                key={permission.code}
                                checked={selectedPermissions.includes(permission.code)}
                                onChange={() => togglePermission(permission.code)}
                            >
                                {permission.text}
                            </Checkbox>
                        ))}
                    </div>

                </div>
            ))}
        </Dialog>
    </>);
}