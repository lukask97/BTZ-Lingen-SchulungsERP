import {useState} from "react";
import {useNavigate} from "react-router-dom";

import useAuth from "../../hooks/useAuth";
import {login as loginService} from "../../services/auth/authService";


export default function Login(){

    const [username,setUsername]=useState("");
    const [password,setPassword]=useState("");

    const [error,setError]=useState("");


    const {login}=useAuth();
    const navigate=useNavigate();


    function anmelden(e){

        e.preventDefault();

        setError("");


        const user=loginService(
            username,
            password
        );


        if(user){

            login(user);

            navigate("/");

        }
        else{

            setError(
                "Benutzername oder Passwort falsch"
            );

            setPassword("");

        }

    }


    return (

        <div className="login">


            <h1>Anmeldung</h1>


            <form onSubmit={anmelden}>


                <input

                    value={username}

                    onChange={
                        e=>setUsername(e.target.value)
                    }

                    placeholder="Benutzername"

                    autoFocus

                />


                <br/><br/>


                <input

                    type="password"

                    value={password}

                    onChange={
                        e=>setPassword(e.target.value)
                    }

                    placeholder="Passwort"

                />


                <br/>


                {
                    error &&

                    <div className="login-error">

                        {error}

                    </div>
                }


                <br/>


                <button type="submit">

                    Anmelden

                </button>


            </form>


        </div>

    );

}
