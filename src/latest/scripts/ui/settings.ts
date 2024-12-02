import { useEffect, useMemo, useState } from "react";
import { Updater, useImmer } from "use-immer";

export const Theme = {
    Dark: "Dark",
    Light: "Light",
} as const;

export const ElementsSide = {
    Left: "start",
    Right: "end",
} as const;

export type SettingsState = {
    theme: keyof typeof Theme,
    literateByDefault: boolean,
    snowing: "yes" | "no" | "always",
    highlightBrackets: "yes" | "yes-eof" | "no",
    elementsSide: keyof typeof ElementsSide,
};

export const ThemeSetting = {
    ...Theme,
    System: "System",
} as const;

export type Settings = Omit<SettingsState, "theme"> & {
    theme: keyof typeof ThemeSetting,
};

const defaultSettings: Settings = {
    theme: "System",
    literateByDefault: false,
    snowing: "no",
    highlightBrackets: "yes",
    elementsSide: "Right",
};


export function isTheSeason() {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    start.setMonth(11, 1);
    end.setFullYear(now.getFullYear() + 1, 1, 1);
    if (now.getTime() > start.getTime() && now.getTime() < end.getTime()) {
        return true;
    }
    return false;
}

function loadSettings(): Settings {
    let localSettings: Settings;
    try {
        localSettings = {
            ...defaultSettings,
            ...JSON.parse(localStorage.getItem("settings") ?? "{}"),
        };
    } catch (e) {
        console.warn("Failed to parse settings!", e);
        localSettings = defaultSettings;
    }
    return localSettings;
}

function saveSettings(settings: Settings) {
    localStorage.setItem("settings", JSON.stringify(settings));
}

export function useSettings(): [SettingsState, Settings, Updater<Settings>] {
    const prefersLightModeQuery = useMemo(() => window.matchMedia("(prefers-color-scheme: light)"), []);
    const [settings, setSettings] = useImmer(() => loadSettings());
    const [prefersLightMode, setPrefersLightMode] = useState(prefersLightModeQuery.matches);

    useEffect(() => {
        const listener = (event: MediaQueryListEvent) => {
            setPrefersLightMode(event.matches);
        };
        prefersLightModeQuery.addEventListener("change", listener);
        return () => {
            prefersLightModeQuery.removeEventListener("change", listener);  
        };
    }, [prefersLightModeQuery]);

    useEffect(() => {
        saveSettings(settings);
    }, [settings]);

    const settingsState: SettingsState = {
        ...settings,
        theme: settings.theme == "System" ? (prefersLightMode ? "Light" : "Dark") : settings.theme,
    };

    return [settingsState, settings, setSettings];
}