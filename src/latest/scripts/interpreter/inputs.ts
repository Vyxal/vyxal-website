export type Input = { id: string, input: string };
export type InputGroup = { name: string, inputs: Input[], succeeded: boolean };
export type Inputs = InputGroup[];
export type InputsReducerAction = {
    type: "add-group",
} | {
    type: "duplicate-group" | "delete-group" | "append-input",
    group: number,
} | {
    type: "rename-group",
    group: number,
    name: string,
} | {
    type: "reorder-input",
    group: number,
    input: number,
    moveTo: number,
} | {
    type: "delete-input",
    group: number,
    input: number,
} | {
    type: "set-input",
    group: number,
    input: number,
    content: string,
} | {
    type: "set-group-succeeded",
    group: number,
} | {
    type: "reset-successes",
};

export function inputsReducer(draft: Inputs, action: InputsReducerAction) {
    switch (action.type) {
        case "add-group": {
            draft.push({ name: `Group ${draft.length + 1}`, inputs: [{ id: crypto.randomUUID(), input: "" }], succeeded: false });
            break;
        }
        case "duplicate-group": {
            draft.push(draft[action.group]);
            break;
        }
        case "delete-group": {
            draft.splice(action.group, 1);
            break;
        }
        case "rename-group": {
            draft[action.group].name = action.name;
            break;
        }
        case "append-input": {
            draft[action.group].inputs.push({ id: crypto.randomUUID(), input: "" });
            break;
        }
        case "reorder-input": {
            draft[action.group].inputs.splice(action.moveTo, 0, draft[action.group].inputs.splice(action.input, 1)[0]);
            break;
        }
        case "delete-input": {
            draft[action.group].inputs.splice(action.input);
            break;
        }
        case "set-input": {
            draft[action.group].inputs[action.input].input = action.content;
            break;
        }
        case "set-group-succeeded": {
            draft[action.group].succeeded = true;
            break;
        }
        case "reset-successes": {
            draft.forEach((group) => group.succeeded = false);
            break;
        }
    }
}