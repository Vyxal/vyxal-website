import { Dispatch, SetStateAction } from "react";
import { Button, ButtonGroup, Container, Dropdown, InputGroup, Nav, Navbar, Spinner } from "react-bootstrap";
import type { VyRunnerState } from "./Theseus";
import logo from "../../../common/assets/logo-64.png";

type ShowDialogButtonProps = {
    setOpen: (arg: boolean) => unknown,
    title: string,
    icon: string,
    margin?: boolean,
};

function ShowDialogButton({ setOpen, title, icon, margin = true }: ShowDialogButtonProps) {
    return (
        <Button variant="secondary" className={margin ? "me-md-3 me-2" : ""} onClick={() => setOpen(true)} title={title}>
            <i className={`bi ${icon}`}></i>
        </Button>
    );
}

type HeaderProps = {
    state: VyRunnerState,
    onRunClicked: () => unknown,
    flags: Set<string>,
    setShowFlagsDialog: Dispatch<SetStateAction<boolean>>,
    setShowSettingsDialog: Dispatch<SetStateAction<boolean>>,
    setShowShareDialog: Dispatch<SetStateAction<boolean>>,
    setShowElementOffcanvas: Dispatch<SetStateAction<boolean>>,
};

export default function Header({ state, onRunClicked, flags, setShowFlagsDialog, setShowSettingsDialog, setShowShareDialog, setShowElementOffcanvas }: HeaderProps) {
    return (
        <Navbar className="bg-body-tertiary flex-wrap">
            <Container fluid className="justify-content-start">
                <Navbar.Brand href="/">
                    <img src={logo} width="32" height="32" className="rounded me-2" alt="Vyxal woogle" />
                    <span className="d-none d-sm-inline">Vyxal 3</span>
                </Navbar.Brand>
                <Nav className="d-none d-sm-flex">
                    <InputGroup className="me-md-3 me-2">
                        {
                            flags.size > 0 ? (
                                <span className="form-control font-monospace">-{[...flags].join("")}</span>
                            ) : null
                        }
                        <ShowDialogButton setOpen={setShowFlagsDialog} icon="bi-flag-fill" title="Flags" margin={false} />
                    </InputGroup>
                    <ShowDialogButton setOpen={setShowShareDialog} icon="bi-share" title="Share code" />
                    <ShowDialogButton setOpen={setShowElementOffcanvas} icon="bi-journal-code" title="Elements" />
                </Nav>
                <div className="d-sm-none me-3">
                    <InputGroup>
                        {
                            flags.size > 0 ? (
                                <span className="form-control font-monospace">-{[...flags].join("")}</span>
                            ) : null
                        }
                        <Dropdown as={ButtonGroup}>
                            <Button variant="outline-secondary" onClick={() => setShowFlagsDialog(true)} title="Flags">
                                <i className="bi bi-flag-fill"></i>
                            </Button>
                            <Dropdown.Toggle split id="toggle-mober-menu" variant="outline-secondary" />
                            <Dropdown.Menu>
                                <Dropdown.Item as="button" onClick={() => setShowShareDialog(true)}>
                                    Share code
                                </Dropdown.Item>
                                <Dropdown.Item as="button" onClick={() => setShowElementOffcanvas(true)}>
                                    Elements
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </InputGroup>
                </div>
                <Nav className="me-md-auto me-0 justify-self-end">
                    <Button
                        variant={{ "idle": "primary", "starting": "warning", "running": "danger" }[state]}
                        onClick={onRunClicked}
                        className="d-flex align-items-center"
                        disabled={state == "starting"}
                    >
                        {
                            state != "idle" ? (
                                <Spinner as="span" animation="border" role="status" className="spinner-border-sm me-2">
                                    <span className="visually-hidden">Running program</span>
                                </Spinner>
                            ) : (
                                <i className="bi bi-play-fill"></i>
                            )
                        }
                        {{ "idle": "Run", "starting": "Starting", "running": "Stop" }[state]}
                    </Button>
                </Nav>
                <Nav className="ms-auto justify-self-end">
                    <ShowDialogButton setOpen={setShowSettingsDialog} icon="bi-gear" title="Settings" margin={false} />
                </Nav>
            </Container>
        </Navbar>
    );
}
