import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd";
import { Dispatch, useCallback, useEffect, useRef } from "react";
import { InputGroup as BsInputGroup, Button, FormControl, Spinner } from "react-bootstrap";
import { Input, InputGroup, Inputs, InputsReducerAction } from "../interpreter/inputs";
import TextareaAutosize from 'react-textarea-autosize';
import type { RunState } from "./Theseus";
import { flushSync } from "react-dom";

type InputProps = {
    group: number,
    input: Input,
    index: number,
    onInputChange(input: string): unknown,
    onInputDelete(): unknown,
};

function InputElement({ group, input, index, onInputChange, onInputDelete }: InputProps) {
    return <Draggable draggableId={`group-${group}/${input.id}`}  index={index}>
        {(provided) => {
            return <BsInputGroup className="mb-2 px-2" ref={provided.innerRef} {...provided.draggableProps}>
                <BsInputGroup.Text {...provided.dragHandleProps}><i className="bi bi-grip-vertical"></i></BsInputGroup.Text>
                <TextareaAutosize
                    className="form-control font-monospace"
                    placeholder="Input"
                    value={input.input}
                    onChange={(e) => onInputChange(e.currentTarget.value)}
                />
                <Button
                    variant="outline-danger"
                    title="Delete input"
                    className="bg-body"
                    onClick={onInputDelete}
                >
                    <i className="bi bi-trash2"></i>
                </Button>
            </BsInputGroup>;
        }}
    </Draggable>;
}

type InputGroupElementProps = {
    groupIndex: number,
    group: InputGroup,
    dispatchInputs: Dispatch<InputsReducerAction>,
    state: RunState,
    run(): unknown,
    scrollTo(group: number): unknown,
};

function InputGroupElement({ groupIndex, group: { name, inputs, succeeded }, dispatchInputs, state, run, scrollTo }: InputGroupElementProps) {
    return <div className="d-flex flex-column border rounded mb-2 mx-2">
        <div className="hstack bg-body-secondary p-2 border-bottom rounded-top">
            <div className="position-relative">
                <BsInputGroup className="w-auto">
                    <Button
                        variant={state.name == "running" && state.group == groupIndex ? "danger" : "success"}
                        onClick={() => run()}
                        disabled={(state.name == "running" && state.group != groupIndex) || state.name == "starting"}
                    >
                        {
                            (state.name == "running" && state.group == groupIndex) ? (
                                <Spinner as="span" animation="border" role="status" className="spinner-border-sm">
                                    <span className="visually-hidden">Running program</span>
                                </Spinner>
                            ) : (
                                <i className="bi bi-play-fill"></i>
                            )
                        }
                    </Button>
                    <FormControl
                        type="text"
                        value={name}
                        onInput={(e) => dispatchInputs({ type: "rename-group", group: groupIndex, name: e.currentTarget.value })}
                        style={{ maxWidth: "200px" }}
                    />
                </BsInputGroup>
                {succeeded && <i className="bi bi-check-square text-success position-absolute top-50 end-0 translate-middle-y me-2 bg-body"></i>}
            </div>
            <Button variant="secondary-bg" className="ms-auto me-2" onClick={() => dispatchInputs({ type: "delete-group", group: groupIndex })}>
                <i className="bi bi-trash2"></i>
            </Button>
            <Button
                variant="secondary-bg"
                className="me-2"
                onClick={() => {
                    flushSync(() => {
                        dispatchInputs({ type: "duplicate-group", group: groupIndex });
                    });
                    scrollTo(groupIndex + 1);
                }}
            >
                <i className="bi bi-copy"></i>
            </Button>
            <Button variant="primary" onClick={() => dispatchInputs({ type: "append-input", group: groupIndex })}>
                <i className="bi bi-plus-circle"></i>
            </Button>
        </div>
        {inputs.length == 0 ? (
            <div className="m-2 text-center fs-6 info-text">
                <small>No inputs. Click <i className="bi bi-plus-circle"></i> to add one.</small>
            </div>
        ) : <Droppable droppableId={groupIndex.toString()} type={`group-${groupIndex}`}>
            {(provided) => {
                return <div ref={provided.innerRef} className="vstack mt-2" {...provided.droppableProps}>
                    {inputs.map((input, index) => (
                        <InputElement
                            key={input.id}
                            group={groupIndex}
                            input={input}
                            index={index}
                            onInputChange={(input) => dispatchInputs({ type: "set-input", group: groupIndex, input: index, content: input })}
                            onInputDelete={() => dispatchInputs({ type: "delete-input", group: groupIndex, input: index })}
                        />
                    ))}
                    {provided.placeholder}
                </div>;
            }}
        </Droppable>}
    </div>;
}

type InputListProps = {
    inputs: Inputs,
    dispatchInputs: Dispatch<InputsReducerAction>,
    state: RunState,
    run(group: number): unknown,
};

export function InputList({ inputs, dispatchInputs, state, run }: InputListProps) {
    const inputListRef = useRef<HTMLDivElement | null>(null);

    const onDragEnd = useCallback((result: DropResult) => {
        if (result.destination != null) {
            dispatchInputs({ type: "reorder-input", group: Number.parseInt(result.destination.droppableId), input: result.source.index, moveTo: result.destination.index });
        }
    }, [dispatchInputs]);
    const scrollTo = useCallback((group: number) => {
        inputListRef.current!.children.item(group)!.scrollIntoView({
            behavior: "smooth",
        });
    }, [inputListRef]);


    useEffect(() => {
        if (state.name == "running") {
            scrollTo(state.group);
        }
    }, [state, scrollTo]);

    return <DragDropContext onDragEnd={onDragEnd}>
        <div ref={inputListRef}>
            {inputs.length > 0 ? inputs.map((inputs, index) => (
                <InputGroupElement
                    key={index}
                    groupIndex={index}
                    group={inputs}
                    dispatchInputs={dispatchInputs}
                    run={() => run(index)}
                    scrollTo={scrollTo}
                    state={state}
                />
            )) : (
                <div className="position-absolute top-50 start-50 translate-middle info-text">
                    No input groups. Click <i className="bi bi-plus-circle"></i> to add one.
                </div>
            )}
        </div>
        <div className="sticky-bottom align-self-end mt-auto">
            <Button
                variant="primary"
                size="lg"
                className="m-3 shadow"
                onClick={() => {
                    flushSync(() => {
                        dispatchInputs({ type: "add-group" });
                    });
                    inputListRef.current!.lastElementChild!.scrollIntoView({
                        behavior: "smooth",
                    });
                }}
            >
                <i className="bi bi-plus-circle"></i>
            </Button>
        </div>
    </DragDropContext>;
}