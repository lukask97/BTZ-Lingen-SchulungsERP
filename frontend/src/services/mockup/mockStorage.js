export function loadData(key, defaultData){

    const saved =
        sessionStorage.getItem(key);


    if(saved){
        return JSON.parse(saved);
    }


    sessionStorage.setItem(
        key,
        JSON.stringify(defaultData)
    );


    return defaultData;

}



export function saveData(key, data){

    sessionStorage.setItem(
        key,
        JSON.stringify(data)
    );

}

