let rollen=[
        {
        id:0,
        name:"Programmierer",
        rechte:["Erschafft und zerstört"]
    },
    {
        id:1,
        name:"Administrator",
        rechte:["*"]
    },
    {
        id:2,
        name:"Lager",
        rechte:[
            "artikel.lesen",
            "lager.buchen"
        ]
    },
    {
        id:3,
        name:"Buchhaltung",
        rechte:[
            "kunde.lesen",
            "kunde.anlegen",
            "rechnung.lesen",
            "rechnung.erstellen"
        ]
    }
];

export function getRollen(){
    return rollen;
}

export function addRolle(rolle){
    rolle.id=Date.now();
    rollen.push(rolle);
}

export function updateRolle(rolle){

    const index=rollen.findIndex(r=>r.id===rolle.id);

    if(index>=0)
        rollen[index]=rolle;

}

export function deleteRolle(id){

    rollen=rollen.filter(r=>r.id!==id);

}