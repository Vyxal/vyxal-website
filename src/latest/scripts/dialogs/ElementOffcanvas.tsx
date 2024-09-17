import { Dispatch, SetStateAction, useContext, useState } from "react";
import { ElementDataContext, elementFuse, modifierFuse, syntaxFuse, SyntaxThing } from "../util/element-data";
import { Card, Col, Nav, Offcanvas, Row, Tab } from "react-bootstrap";
import { Form } from "react-bootstrap";
import type Fuse from "fuse.js";
import { ThingCard } from "../ThingCard";

type ElementOffcanvasProps = {
    show: boolean,
    setShow: Dispatch<SetStateAction<boolean>>,
    insertCharacter: (char: string) => void,
};

const fuses: Fuse<SyntaxThing>[] = [elementFuse, modifierFuse, syntaxFuse];

export function ElementOffcanvas({ show, setShow, insertCharacter }: ElementOffcanvasProps) {
    const elementData = useContext(ElementDataContext)!;
    const [tab, setTab] = useState("search");
    const [query, setQuery] = useState("");
    const results = query != "" ? (
        fuses.flatMap((fuse) => fuse.search(query)).sort((a, b) => a.score! - b.score!).map(({ item }) => item)
    ) : [...elementData.elements.values(), ...elementData.modifiers.values(), ...elementData.syntax.values()];
    const codepage = elementData.codepageRaw;

    return <Offcanvas show={show} onHide={() => setShow(false)} style={{ width: "600px" }}>
        <Tab.Container activeKey={tab} onSelect={(tab) => setTab(tab!)}>
            <Offcanvas.Header closeButton>
                <Nav variant="pills" className="flex-nowrap me-3 overflow-x-auto">
                    <Nav.Item>
                        <Nav.Link eventKey="search">Elements</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="codepage">Codepage</Nav.Link>
                    </Nav.Item>
                </Nav>
            </Offcanvas.Header>
            <Tab.Content className="offcanvas-body overflow-y-hidden">
                <Tab.Pane eventKey="search" className="element-offcanvas-tab-pane">
                    <Form.Control type="search" placeholder="Search..." value={query} onChange={(event) => setQuery(event.currentTarget.value)} className="" />
                    <Row xs={1} md={2} className="g-4 mt-0 overflow-y-scroll align-items-stretch">
                        {results.length ? (
                            results.map((item, i) => {
                                return <Col key={i}>
                                    <ThingCard thing={item} onClick={() => insertCharacter(item.symbol)} />
                                </Col>;
                            })
                        ) : (
                            <Col>
                                <Card body>No results</Card>
                            </Col>
                        )}
                    </Row>
                </Tab.Pane>
                <Tab.Pane eventKey="codepage" className="element-offcanvas-tab-pane overflow-scroll">
                    <table className="table">
                        <tbody>
                            {
                            // https://stackoverflow.com/a/37826698/14743122
                                codepage.reduce<string[][]>((resultArray, item, index) => {
                                    const chunkIndex = Math.floor(index / 16);

                                    if (!resultArray[chunkIndex]) {
                                        resultArray[chunkIndex] = []; // start a new chunk
                                    }

                                    resultArray[chunkIndex].push(item);

                                    return resultArray;
                                }, []).map((row, index) => (
                                    <tr key={index}>
                                        {
                                            row.map((glyph) => <td key={glyph} style={{cursor: "pointer"}} onClick={() => insertCharacter(glyph)}>{glyph}</td>)
                                        }
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                </Tab.Pane>
            </Tab.Content>
        </Tab.Container>
    </Offcanvas>;
}