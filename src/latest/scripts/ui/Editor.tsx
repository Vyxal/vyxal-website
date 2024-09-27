import { Dispatch, ReactNode, SetStateAction, useCallback, useContext, useMemo, useRef, useState } from "react";
import ReactCodeMirror, { keymap, Prec, ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { minimalSetup } from "codemirror";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { vyxalCompletion } from "../language/sbcs/autocomplete";
import { autocompletion } from "@codemirror/autocomplete";
import { EditorView, highlightActiveLine, highlightActiveLineGutter, lineNumbers, showPanel } from "@codemirror/view";
import { Settings, Theme } from "./settings";
import { githubLight } from "@uiw/codemirror-theme-github";
import { ElementDataContext } from "../interpreter/element-data";
import { createPortal } from "react-dom";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";
import { Button, Stack } from "react-bootstrap";
import { vyxalBracketMatching } from "../language/sbcs/bracket-matching";
import { UtilWorker } from "../workers/util-api";
import { elementTooltip, vyxal, vyxalLiterate } from "../language/common";
import { compressButtonPlugin } from "../language/sbcs/compression";
import { vyxalHover } from "../language/sbcs/tooltips";
import { vyxalLitCompletion } from "../language/literate/autocomplete";

const commonExtensions = [
    Prec.high(keymap.of([
        {
            key: "Ctrl-Enter",
            run(view) {
                if (view.state.doc.length <= 0) {
                    return false;
                }
                window.dispatchEvent(new Event("run-vyxal")); // dubious
                return true;
            },
            preventDefault: true,
        },
    ])),
    minimalSetup,
    autocompletion(),
    lineNumbers(),
    highlightActiveLine(),
    highlightActiveLineGutter(),
    EditorView.theme({
        "&": { height: "100cqh" },
        "&.cm-focused": { outline: "none" },
        ".cm-scroller": {overflow: "auto"},
        ".cm-tooltip": {"z-index": "400 !important"},
    }),
];

const THEMES = {
    [Theme.Dark]: vscodeDark,
    [Theme.Light]: githubLight,
};

type EditorProps = {
    utilWorker: UtilWorker,
    code: string,
    setCode: Dispatch<SetStateAction<string>>,
    settings: Settings,
    literate: boolean,
    claimFocus: (state: ReactCodeMirrorRef) => unknown,
    autoFocus?: boolean,
    children: ReactNode,
};

function EditorError({ error, resetErrorBoundary }: FallbackProps) {
    return <Stack direction="vertical" className="bg-danger-subtle p-2 position-absolute">
        <h3 className="text-danger"><i className="bi bi-x-circle"></i> An error occured</h3>
        <Button variant="danger" onClick={resetErrorBoundary}>Reset editor</Button>
        {error.toString()}
        <div>
            {error.stack}
        </div>
    </Stack>;
}

export default function Editor({ utilWorker, code, children, setCode, settings, literate, claimFocus, autoFocus }: EditorProps) {
    const elementData = useContext(ElementDataContext)!;
    const editorRef = useRef<ReactCodeMirrorRef | null>(null);
    const onChange = useCallback((code: string) => {
        setCode(code);
    }, []);
    const [headerDom, setHeaderDom] = useState<HTMLElement | null>(null);
    const header = useMemo(() => showPanel.of(() => {
        const dom = document.createElement("div");
        dom.classList.add("p-1");
        setHeaderDom(dom);
        return { dom, top: true };
    }), []);
    const focusChangeHandler = useMemo(() => EditorView.focusChangeEffect.of((state, focusing) => {
        if (focusing && editorRef.current) {
            claimFocus(editorRef.current);
        }
        return null;
    }), []);

    const languageExtensions = useMemo(() => literate ? [
        vyxalLiterate, vyxalLitCompletion(elementData), elementTooltip(elementData, true),
    ] : [
        vyxal, vyxalCompletion(elementData), vyxalHover(utilWorker), elementTooltip(elementData, false), compressButtonPlugin(utilWorker),
    ], [literate, utilWorker]);

    const extensions = [
        commonExtensions, header, focusChangeHandler,
        languageExtensions,
        useMemo(() => settings.highlightBrackets != "no" ? vyxalBracketMatching({ showEof: settings.highlightBrackets == "yes-eof" }) : [], [settings]),
    ];

    return <>
        <ErrorBoundary FallbackComponent={EditorError}>
            <ReactCodeMirror
                basicSetup={false}
                theme={THEMES[settings.theme]}
                value={code}
                onChange={onChange}
                extensions={extensions}
                ref={editorRef}
                autoFocus={autoFocus}
            />
            {headerDom !== null && createPortal(children, headerDom)}
        </ErrorBoundary>
    </>;
};