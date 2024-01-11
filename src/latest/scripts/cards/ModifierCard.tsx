import { Modifier } from "./util/element-data";
import { Card, ListGroup } from "react-bootstrap";

type ModifierCardParams = {
    item: Modifier,
    shadow?: boolean,
};

export function ModifierCard({ item, shadow = undefined }: ModifierCardParams) {
    return <Card border="primary" className={`h-100 ${(shadow ?? false) ? "shadow" : ""}`}>
        <Card.Body>
            <Card.Title>{item.symbol}</Card.Title>
            <Card.Subtitle className="mb-2 text-muted">{item.name}</Card.Subtitle>
            <Card.Text>
                {item.keywords.map((keyword, i) => <code key={i} className="code-pill">{keyword}</code>)}
            </Card.Text>
            <Card.Text>{item.description}</Card.Text>
        </Card.Body>
        <ListGroup variant="flush">
            {item.overloads.map((overload, i) => {
                return <ListGroup.Item className="font-monospace" key={i}>{overload}</ListGroup.Item>;
            })}
        </ListGroup>
    </Card>;
}
