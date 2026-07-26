import {
    Outlet
}
    from "react-router-dom";


import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Footer from "../components/Footer";


function MainLayout() {

    return (

        <div className="layout">
            <Sidebar/>
            <div className="content">
                <Header/>
                <main>
                    <Outlet/>
                </main>
                <Footer/>
            </div>
        </div>
    );

}


export default MainLayout;