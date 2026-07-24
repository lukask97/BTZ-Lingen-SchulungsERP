import Dialog from "./Dialog";
import Label from "./form/Label";

export default function DetailDialog({
                                         open, title, data, onClose
                                     }) {

    if (!data) return null;


    return (

        <Dialog
            open={open}
            title={title}
            onClose={onClose}
        >

            {Object.entries(data).map(([key, value]) =>

                <div
                    key={key}
                    className="detail-field"
                >

                    <Label>
                        {key}
                    </Label>

                    <div>
                        {String(value)}
                    </div>

                </div>)}

        </Dialog>

    );

}