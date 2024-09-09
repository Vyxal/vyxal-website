import { LRLanguage } from "@codemirror/language";
import { styleTags, tags } from "@lezer/highlight";
import parser from "./vyxal.grammar";

export const vyxalLanguage = LRLanguage.define({
    parser: parser.configure({
        props: [
            styleTags({
                Digraph: tags.function(tags.propertyName),
                SugarTrigraph: tags.macroName,
                SyntaxTrigraph: tags.operator,
                StructureOpen: tags.bracket,
                StructureClose: tags.bracket,
                Modifier: tags.modifier,
                VariableThing: tags.variableName,
                String: tags.string,
                SingleCharString: tags.special(tags.string),
                TwoCharString: tags.special(tags.string),
                "Number!": tags.number,
                TwoCharNumber: tags.special(tags.number),
                Branch: tags.punctuation,
                ContextIndex: tags.controlKeyword,
                Comment: tags.comment,
                Element: tags.keyword,
            }),
        ],
    }),
});