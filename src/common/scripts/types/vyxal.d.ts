declare module 'https://vyxal.github.io/Vyxal/vyxal.js' {
    interface JSToken {
        tokenType: string,
        value: string,
        startOffset: number,
        endOffset: number,
    }
    interface Element {
        symbol: string,
        name: string,
        keywords: Array<string>,
        vectorises: boolean,
        overloads: Array<string>,
    }
    interface Modifier {
        symbol: string,
        name: string,
        description: string,
        keywords: Array<string>,
    }
    namespace Vyxal {
        function execute(
            code: string,
            inputs: string[],
            flags: string,
            printFunc: (line: string) => void,
            errorFunc: (line: string) => void
        ): void;
        function setShortDict(dict: string): void;
        function setLongDict(dict: string): void;
        function compress(text: string): string;
        function decompress(compressed: string): string;
        function getSBCSified(code: string): string;
        function getCodepage(): string;
        function getElements(): Element[];
        function getModifiers(): Modifier[];
        function getVersion(): string;
        function lexSBCS(code: string): JSToken[];
        function lexLiterate(code: string): JSToken[];
    }
}

declare module 'https://vyxal.github.io/Vyxal/helpText.js' {
    namespace HelpText {
        function getHelpText(): string;
    }
}

declare module 'https://vyxal.github.io/Vyxal/codepage.js' {
    const CODEPAGE: string;
    export = CODEPAGE;
}

declare module 'https://vyxal.github.io/Vyxal/modifiers.js' {
    const MODIFIERS: string[];
    export = MODIFIERS;
}