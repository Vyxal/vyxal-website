import { Card, ListGroup } from "react-bootstrap";
import type { SyntaxThing } from "./util/element-data";
import { Variant } from "react-bootstrap/esm/types";

export type ThingCardParams = {
    thing: SyntaxThing,
    shadow?: boolean,
};

const variants: { [key in SyntaxThing["type"]]: string } = {
    element: "",
    modifier: "primary",
    syntax: "ourple",
};

export function ThingCard({ thing, shadow }: ThingCardParams) {
    return <Card border={variants[thing.type]} className={`h-100 ${(shadow ?? false) ? "shadow" : ""}`}>
        <Card.Body>
            <Card.Title>{thing.symbol}</Card.Title>
            <Card.Subtitle className="mb-2 text-muted">{thing.name}</Card.Subtitle>
            {thing.type != "syntax" ? (
                <Card.Text>
                    {thing.keywords.map((keyword, i) => <code key={i} className="code-pill">{keyword}</code>)}
                </Card.Text>
            ) : null}
            {thing.type != "element" ? (
                <Card.Text>{thing.description}</Card.Text>
            ) : null}
        </Card.Body>
        <ListGroup variant="flush">
            {thing.type != "syntax" ? (
                thing.overloads.map((overload, i) => {
                    return <ListGroup.Item className="font-monospace" key={i}>{overload}</ListGroup.Item>;
                })
            ) : <ListGroup.Item className="font-monospace">{thing.usage}</ListGroup.Item>}
        </ListGroup>
    </Card>;
}