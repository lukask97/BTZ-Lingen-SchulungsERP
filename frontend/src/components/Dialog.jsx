import {useEffect} from "react";

export default function Dialog({
    open,
    title,
    children,
    onClose,
    footer
}){

    useEffect(()=>{

        if(!open)
            return;


        function keyDown(e){

            if(e.key==="Escape")
                onClose();

        }


        document.addEventListener(
            "keydown",
            keyDown
        );


        return ()=>document.removeEventListener(
            "keydown",
            keyDown
        );


    },[open,onClose]);


    if(!open)
        return null;


    return(
        <div className="dialog-overlay">

            <div
                className="dialog"
                onClick={e=>e.stopPropagation()}
            >

                <div className="dialog-header">

                    <h2>{title}</h2>

                    <button
                        className="dialog-close"
                        onClick={onClose}
                    >
                        ✕
                    </button>

                </div>


                <div className="dialog-body">

                    {children}

                </div>


                {footer &&
                    <div className="dialog-footer">
                        {footer}
                    </div>
                }

            </div>

        </div>
    );

}