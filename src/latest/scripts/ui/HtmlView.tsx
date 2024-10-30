import { useState } from "react";
import { Button } from "react-bootstrap";

type HtmlViewProps = {
    getOutput: (() => string) | undefined, // may be undefined if the terminal hasn't mounted yet
};

export default function HtmlView({ getOutput }: HtmlViewProps) {
    const [agreedToWarning, setAgreedToWarning] = useState(false);
    const [document, setDocument] = useState("");

    if (agreedToWarning) {
        return <div className="vstack position-relative h-100 overflow-y-scroll">
            <div className="position-absolute bottom-0 end-0 p-2">
                <Button variant="primary" size="lg" className="m-3 shadow" onClick={() => getOutput ? setDocument(getOutput()) : setDocument("")}>
                    <i className="bi bi-arrow-clockwise"></i>
                </Button>
            </div>
            <iframe srcDoc={document} className="h-100" />
        </div>;
    } else {
        return (
            <div className="vstack align-items-center">
                <i className="bi bi-exclamation-diamond-fill h1 text-warning"></i>
                <span className="form-text p-2 text-center">
                    {/* probably unnecessary to warn the user, but whatever */}
                    This tool renders the output of a program as HTML.
                    Very large or malicious output may have detrimental effects on your browser or the interpreter.
                    Please only proceed if you are sure the output of this program is in fact HTML.
                </span>
                <Button
                    variant="warning"
                    onClick={() => {
                        setAgreedToWarning(true);
                        if (getOutput) {
                            setDocument(getOutput());
                        }
                    }}
                >
                    Proceed
                </Button>
            </div>
        );
    }
}