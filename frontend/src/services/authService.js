const users = [

    {
        username: "admin", password: "admin", permissions: ["*"]
    },

    {
        username: "lager", password: "lager", permissions: ["artikel.lesen", "lager.buchen"]
    },

    {
        username: "buchhaltung",
        password: "buchhaltung",
        permissions: ["kunde.lesen", "kunde.anlegen", "rechnung.lesen", "rechnung.erstellen"]
    }

];


export function login(u, p) {

    let user = users.find(x => x.username === u && x.password === p);


    if (!user) return null;

    return user;

}