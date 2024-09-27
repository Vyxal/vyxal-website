import { Updater } from "use-immer";
import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd";
import { useCallback } from "react";
import { InputGroup, Form, Button } from "react-bootstrap";

type InputListProps = {
    id: string,
    inputs: string[],
    updateInputs: Updater<string[]>,
};

export function InputList({ id, inputs, updateInputs }: InputListProps) {
    const onDragEnd = useCallback((result: DropResult) => {
        updateInputs((inputs) => {
            if (result.destination == null) {
                return;
            }
            inputs.splice(result.destination.index, 0, inputs.splice(result.source.index, 1)[0]);
        });
    }, []);

    return <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId={id}>
            {(provided) => {
                return <div ref={provided.innerRef} {...provided.droppableProps} className={`d-flex flex-column input-list`}>
                    {inputs.map((input, index) => {
                        return <Draggable key={index} draggableId={`${id}-${index}`} index={index}>
                            {(provided) => {
                                return <InputGroup className="mb-2 p-1" ref={provided.innerRef} {...provided.draggableProps}>
                                    <InputGroup.Text  {...provided.dragHandleProps}><i className="bi bi-grip-vertical"></i></InputGroup.Text>
                                    <Form.Control
                                        as="textarea"
                                        placeholder="Input"
                                        value={input}
                                        onChange={(e) => updateInputs((inputs) => {
                                            inputs[index] = e.target.value;
                                        })}
                                    />
                                    <Button
                                        variant="outline-danger"
                                        title="Delete input"
                                        onClick={() => updateInputs((inputs) => {
                                            inputs.splice(index, 1);
                                        })}
                                    >
                                        <i className="bi bi-trash2"></i>
                                    </Button>
                                </InputGroup>;
                            }}
                        </Draggable>;
                    })}
                    {provided.placeholder}
                    <Button variant="outline-primary" onClick={() => updateInputs([...inputs, ""])} className="m-1">
                        <i className="bi bi-plus-circle"></i> Add input
                    </Button>
                </div>;
            }}
        </Droppable>
    </DragDropContext>;
}