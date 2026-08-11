import HelpHint from "../HelpHint";
import { getGlossaryText } from "../../utils/glossary";

export default function Label({
    children,
    required = false,
    glossaryKey = ""
}) {
    const hintText = getGlossaryText(glossaryKey);

    return (
        <label className="form-label">

            {children}

            {hintText && <HelpHint text={hintText} delay={300} />}

            {required && (
                <span className="required">
                    *
                </span>
            )}

        </label>
    );

}
