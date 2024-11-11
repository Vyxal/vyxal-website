import { syntaxTree } from "@codemirror/language";
import { Compartment, Facet, Prec, Range } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, PluginSpec, ViewPlugin, ViewUpdate, WidgetType } from "@codemirror/view";
import { UtilWorker } from "../../workers/util-api";

class CompressButtonWidget extends WidgetType {
    toDOM(): HTMLElement {
        const container = document.createElement("span");
        container.classList.add("cm-placeholder");
        const spinner = container.appendChild(document.createElement("div"));
        spinner.classList.add("spinner-border", "spinner-border-sm");
        spinner.hidden = true;
        const icon = container.appendChild(document.createElement("i"));
        icon.ariaHidden = "true";
        icon.classList.add("cm-compress-button", "bi", "bi-file-zip");
        icon.style.cursor = "pointer";
        return container;
    }

    updateDOM(dom: HTMLElement, view: EditorView): boolean {
        const compressing = view.state.facet(CompressButtonPlugin.compressing);
        dom.querySelector<HTMLElement>(".spinner-border")!.hidden = !compressing;
        dom.querySelector<HTMLElement>(".cm-compress-button")!.hidden = compressing;
        return true;
    }

    ignoreEvent(): boolean {
        return false;
    }
}

function insertButtons(view: EditorView) {
    const widgets: Range<Decoration>[] = [];
    for (const { from, to } of view.visibleRanges) {
        syntaxTree(view.state).iterate({
            from, to,
            enter(node) {
                const text = view.state.sliceDoc(node.from, node.to);
                if (node.name == "String" && /[^“„]$/.test(text)) {
                    widgets.push(Decoration.widget({
                        widget: new CompressButtonWidget(),
                        side: 1,
                    }).range(/["”]$/.test(text) && text.length > 1 ? node.to - 1 : node.to));
                }
            },
        });
    }
    return Decoration.set(widgets);
}

class CompressButtonPlugin {
    private static lock = new Compartment;
    static compressing = Facet.define<boolean, boolean>({ combine: values => values.length ? values[0] : false });
    static spec: PluginSpec<CompressButtonPlugin> = {
        decorations: (v) => v.decorations,
        eventHandlers: {
            click: function(event, view) {
                const target = event.target as HTMLElement;
                if (target.classList.contains("cm-compress-button")) {
                    return this.toggleCompression(view, view.posAtDOM(target));
                }
                return false;
            },
        },
        provide: () => CompressButtonPlugin.lock.of([]),
    };
    decorations: DecorationSet;

    constructor(view: EditorView, private readonly util: UtilWorker) {
        this.decorations = insertButtons(view);
    }

    update(update: ViewUpdate) {
        this.decorations = insertButtons(update.view);
    }

    private toggleCompression(view: EditorView, position: number) {
        if (view.state.facet(CompressButtonPlugin.compressing)) {
            return false;
        }
        const node = syntaxTree(view.state).resolveInner(position, -1);
        if (node.name == "String") {
            let text = view.state.sliceDoc(node.from, node.to);
            const isCompressed = text.endsWith("”");
            if (!(isCompressed || text.endsWith(`"`))) {
                text += `"`;
            }
            const trimmed = text.slice(1, -1);
            view.dispatch({
                effects: CompressButtonPlugin.lock.reconfigure(Prec.highest([
                    EditorView.editable.of(false), CompressButtonPlugin.compressing.of(true),
                ])),
            });
            (isCompressed ? this.util.decompress(trimmed) : this.util.compress(trimmed)).then((result) => {
                view.dispatch({
                    changes: {
                        from: node.from,
                        to: node.to,
                        insert: isCompressed ? `"${result}"` : `"${result}”`,
                    },
                    effects: CompressButtonPlugin.lock.reconfigure([]),
                });
            });
            return true;
        }
        return false;
    }
}

export function compressButtonPlugin(util: UtilWorker) {
    return ViewPlugin.define((view) => new CompressButtonPlugin(view, util), CompressButtonPlugin.spec);
}