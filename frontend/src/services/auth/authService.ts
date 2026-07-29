import {users} from "../mockup/mockData.js";


export function login(username,password){

    const user = users.find(
        u =>
            u.username === username &&
            u.password === password
    );


    if(!user)
        return null;


    return user;

}