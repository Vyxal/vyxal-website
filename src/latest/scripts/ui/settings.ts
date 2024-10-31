export const Theme = {
    Dark: "Dark",
    Light: "Light",
} as const;

export const ElementsSide = {
    Left: "start",
    Right: "end",
} as const;

export type Settings = {
    theme: keyof typeof Theme,
    literateByDefault: boolean,
    snowing: "yes" | "no" | "always",
    highlightBrackets: "yes" | "yes-eof" | "no",
    elementsSide: keyof typeof ElementsSide,
};

const defaultSettings: Settings = {
    theme: "Dark",
    literateByDefault: false,
    snowing: "yes",
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

export function loadSettings(): Settings {
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

export function saveSettings(settings: Settings) {
    localStorage.setItem("settings", JSON.stringify(settings));
}