let kunden = [
    {
        id: 1,
        name: "Muster GmbH",
        kontakt: "Max Mustermann",
        email: "info@muster.de",
        telefon: "0123456789",
        aktiv: true
    },
    {
        id: 2,
        name: "Beispiel AG",
        kontakt: "Anna Beispiel",
        email: "kontakt@beispiel.de",
        telefon: "0987654321",
        aktiv: true
    }
];

export function getKunden(){
    return kunden;
}

export function addKunde(kunde){
    kunde.id = Date.now();
    kunden.push(kunde);
}

export function updateKunde(kunde){

    const index = kunden.findIndex(k => k.id === kunde.id);

    if(index >= 0)
        kunden[index] = kunde;

}

export function deleteKunde(id){

    kunden = kunden.filter(k => k.id !== id);

}