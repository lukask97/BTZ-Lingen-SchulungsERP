import {Navigate} from "react-router-dom";
import useAuth from "./useAuth";
import AccessDenied from "../components/AccessDenied";


export default function ProtectedRoute({
    children,
    access
}){

    const {user,hasAccess}=useAuth();


    if(!user){
        return <Navigate to="/login"/>;
    }


    if(access && !hasAccess(access)){
        return <AccessDenied/>;
    }


    return children;

}
