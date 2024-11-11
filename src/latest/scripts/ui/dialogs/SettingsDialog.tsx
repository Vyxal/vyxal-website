import { ChangeEvent, Dispatch, ReactNode, SetStateAction, createContext, memo, useCallback, useContext, useEffect, useRef } from "react";
import { Button, FormCheck, FormLabel, FormText, Modal, ToggleButton, ToggleButtonGroup } from "react-bootstrap";
import { ElementsSide, Settings, ThemeSetting, isTheSeason } from "../settings";
import type { Updater } from "use-immer";
import type { Draft } from "immer";
import FormRange from "react-bootstrap/esm/FormRange";

const SettingsContext = createContext<{ settings: Settings, setSettings: Updater<Settings> } | null>(null);

type SettingsValuesOfType<T> = { [K in keyof Settings]: Settings[K] extends T ? K : never }[keyof Settings];

type SettingsSwitchChangeHandler = (checked: boolean, draft: Draft<Settings>) => unknown;
type SettingsSwitchProps = {
    name: string,
    checked: boolean,
    disabled?: boolean,
    onChange: SettingsSwitchChangeHandler,
    children: ReactNode,
};

function SettingsSwitch({ name, checked, onChange, disabled, children }: SettingsSwitchProps) {
    const { setSettings } = useContext(SettingsContext)!;
    const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setSettings((settings) => {
            onChange(event.target.checked, settings);
        });
    }, [onChange, setSettings]);
    return <div>
        <FormCheck
            type="switch"
            name={name}
            checked={checked}
            disabled={disabled}
            onChange={handleChange}
            label={children}
        />
    </div>;
}

type BooleanSettingsSwitchProps = {
    property: SettingsValuesOfType<boolean>,
    children: ReactNode,
};

function BooleanSettingsSwitch({ property, children }: BooleanSettingsSwitchProps) {
    const { settings } = useContext(SettingsContext)!;
    const handleChange = useCallback<SettingsSwitchChangeHandler>((checked, draft) => {
        draft[property] = checked;
    }, [property]);
    return <SettingsSwitch name={property} checked={settings[property]} onChange={handleChange}>
        {children}
    </SettingsSwitch>;
}

type SettingsToggleButtonGroupProps<E extends Record<string, string>> = {
    name: string,
    enumType: E,
    property: SettingsValuesOfType<keyof E>,
    children: ReactNode,
};

function SettingsToggleButtonGroup<E extends Record<string, string>>({ name, enumType, property, children }: SettingsToggleButtonGroupProps<E>) {
    const { settings, setSettings } = useContext(SettingsContext)!;
    return <div>
        <FormLabel htmlFor={name}>{children}</FormLabel>
        <ToggleButtonGroup
            className="d-block"
            name={name}
            type="radio"
            value={settings[property]}
            onChange={(key) => setSettings((draft) => {
                draft[property] = key;
            })}
        >
            {Object.keys(enumType).map((key, index) => (
                <ToggleButton id={`${name}-${index}`} key={index} value={key}>{key}</ToggleButton>
            ))}
        </ToggleButtonGroup>
    </div>;
}

type SettingsDialogProps = {
    settings: Settings,
    setSettings: Updater<Settings>,
    timeout: number | null,
    setTimeout: Dispatch<SetStateAction<number | null>>,
    show: boolean,
    setShow: Dispatch<SetStateAction<boolean>>,
};

export const SettingsDialog = memo(function({ settings, setSettings, timeout, setTimeout, show, setShow }: SettingsDialogProps) {
    const eggProgress = useRef(0);
    useEffect(() => {
        const listener = (event: KeyboardEvent) => {
            if ("snow"[eggProgress.current] == event.key.toLowerCase() && settings.snowing != "always") {
                eggProgress.current++;
                if (eggProgress.current == 4) {
                    eggProgress.current = 0;
                    setSettings((settings) => {
                        settings.snowing = "always";
                    });
                }
            } else {
                eggProgress.current = 0;
            }
        };
        document.addEventListener("keydown", listener);
        return () => document.removeEventListener("keydown", listener);
    }, [eggProgress, setSettings, settings]);

    return <Modal show={show} onHide={() => setShow(false)}>
        <Modal.Header closeButton>
            <Modal.Title>Settings</Modal.Title>
        </Modal.Header>
        <Modal.Body className="settings-body">
            <SettingsContext.Provider value={{ settings, setSettings }}>
                <SettingsToggleButtonGroup
                    name="theme"
                    enumType={ThemeSetting}
                    property="theme"
                >
                    Theme
                </SettingsToggleButtonGroup>
                <SettingsToggleButtonGroup
                    name={"elements-side"}
                    enumType={ElementsSide}
                    property="elementsSide"
                >
                    Element list side
                </SettingsToggleButtonGroup>
                <BooleanSettingsSwitch property="literateByDefault">
                    Default to literate mode in a new editor
                </BooleanSettingsSwitch>
                <SettingsSwitch
                    name="bracket-matching"
                    checked={settings.highlightBrackets != "no"}
                    onChange={(checked, draft) => draft.highlightBrackets = checked ? "yes" : "no"}
                >
                    Highlight matching brackets
                </SettingsSwitch>
                <SettingsSwitch
                    name="bracket-matching-eof"
                    disabled={settings.highlightBrackets == "no"}
                    checked={settings.highlightBrackets == "yes-eof"}
                    onChange={(checked, draft) => draft.highlightBrackets = checked ? "yes-eof" : "yes"}
                >
                    Show indicator when brackets are closed by EOF
                </SettingsSwitch>
                <FormLabel htmlFor="timeout">
                    <i className="bi bi-link-45deg"></i> Timeout
                    <FormCheck type="switch"  className="d-inline-block ms-2" name="timeout-enabled" checked={timeout != null} onChange={(event) => setTimeout(event.target.checked ? 10 : null)} />
                </FormLabel>
                <FormRange name="timeout" step="5" max="60" min="10" disabled={timeout == null} value={timeout != null ? timeout : 10} onChange={(event) => setTimeout(Number.parseInt(event.target.value))} />
                <FormText>{timeout != null ? `${timeout} seconds` : "infinite"}</FormText>
                {(isTheSeason() || settings.snowing == "always") && (
                    <SettingsSwitch
                        name="seasonal-mode"
                        checked={settings.snowing != "no"}
                        onChange={(checked, draft) => draft.snowing = (checked || settings.snowing == "always") ? "yes" : "no"}
                    >
                        <i className="bi bi-snow"></i> Seasonal decorations
                    </SettingsSwitch>
                )}
                <hr />
                <FormText>settings with <i className="bi bi-link-45deg"></i> are saved in the permalink</FormText>
            </SettingsContext.Provider>
        </Modal.Body>
        <Modal.Footer>
            {/* @ts-expect-error VERSION gets replaced by Webpack */}
            <span className="me-auto form-text font-monospace">{VERSION}</span>
            <Button variant="primary" onClick={() => setShow(false)}>
                Close
            </Button>
        </Modal.Footer>
    </Modal>;
});