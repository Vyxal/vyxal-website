import { LanguageSupport } from "@codemirror/language";
import fizzbuzz from "./fizzbuzz.vyl?raw";
import { EditorView } from "codemirror";
import { vyxalLitLanguage } from "../../common/scripts/language/vyxal-lit";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";

new EditorView({
    doc: fizzbuzz,
    extensions: [EditorView.editable.of(false), new LanguageSupport(vyxalLitLanguage), vscodeDark],
    parent: document.getElementById("cm-parent")!,
});