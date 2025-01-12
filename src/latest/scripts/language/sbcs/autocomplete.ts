import type { CompletionContext, CompletionResult } from "@codemirror/autocomplete";
import type { ElementData } from "../../interpreter/element-data";
import { elementAutocomplete } from "../common";
import { vyxalLanguage } from "../../../../common/scripts/language/vyxal";

export function vyxalCompletion(elementData: ElementData) {
    return vyxalLanguage.data.of({
        autocomplete(context: CompletionContext): Promise<CompletionResult | null> {
            return elementAutocomplete(elementData, context, false);
        },
    });
}
