import { enableMapSet } from "immer";
import { createRoot } from "react-dom/client";
import { decodeHash, Permalink } from "./interpreter/permalink";
import { ElementData, ElementDataContext, parseElementData } from "./interpreter/element-data";
import { Theseus } from "./ui/Theseus";
import { ErrorBoundary } from "react-error-boundary";
import { CatastrophicFailure } from "./ui/CatastrophicFailure";

function Root({ elementData, permalink }: { elementData: ElementData, permalink: Permalink | null }) {
    return <ElementDataContext.Provider value={elementData}>
        <ErrorBoundary fallbackRender={CatastrophicFailure}>
            <Theseus permalink={permalink} />
        </ErrorBoundary>
    </ElementDataContext.Provider>;
}

enableMapSet();
const root = createRoot(document.getElementById("react-container")!);
const fallback = document.getElementById("fallback-ui")!;
fallback.hidden = true;
const permalink = window.location.hash.length ? await decodeHash(window.location.hash.slice(1)) : null;
if (permalink != null && !permalink.compatible) {
    window.location.replace(`https://vyxal.github.io/versions/v${permalink.version}#${location.hash.substring(1)}`);
} else {
    // @ts-expect-error DATA_URI gets replaced by Webpack
    const elementData = parseElementData(await fetch(`${DATA_URI}/theseus.json`).then((r) => r.json()));
    root.render(<Root elementData={elementData} permalink={permalink?.permalink ?? null} />);
    import.meta.webpackHot?.accept("./ui/Theseus", () => {
        root.unmount();
        root.render(<Root elementData={elementData} permalink={permalink?.permalink ?? null} />);
    });
}