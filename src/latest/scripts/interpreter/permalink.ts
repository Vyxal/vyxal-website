import compatRaw from "../../data/compat.json?raw";
import datesRaw from "../../data/releaseDates.json?raw";
import { gunzipString, gzipString } from "gzip-utils";

const compat = JSON.parse(compatRaw);
const releaseDates = JSON.parse(datesRaw);
const LATEST_VYXAL_VERSION_CONSTANT_RETURNED_FROM_DETERMINE_VERSION = "hacky ahh solution"

type OldPermalinks = {
    format: 2,
    flags: string[],
    header: string,
    code: string,
    footer: string,
    inputs: string[],
    version: string,
};

const latestPermalink = 4;
export type Permalink = {
    format: typeof latestPermalink,
    flags: string[],
    header: string,
    code: string,
    footer: string,
    inputs: [string, string[]][],
    version: string,
};

function decodeVersion(version: string): string {
    // This is what happens when you let lyxal write a hack
    // solution to something that probably required a bigger
    // refactoring. (Comment written by, surprisingly, lyxal)

    // Version will either be `x.y.z` or `dd/mm/yyyy`. So
    // determine which one it is. If `x.y.z`, simply return
    // it.

    if (version.includes(".")) {
        return version;
    }

    // It's a date, which means fun because that's the whole
    // point of this function. The version can be determined
    // by finding the first release on a date after the given
    // date.

    // But first, convert the string to a date object.
    const date = new Date(version);

    // Now, iterate through the release dates and find the
    // first release after the given date.

    const candidates = Object.entries(releaseDates).filter(([_, d]) => new Date(d.toString()) > date);
    if (candidates.length === 0) {
        return LATEST_VYXAL_VERSION_CONSTANT_RETURNED_FROM_DETERMINE_VERSION;
    }
    return candidates[0][1].toString();
}

function incompatible(permalinkVersion: string) {
    if (permalinkVersion === LATEST_VYXAL_VERSION_CONSTANT_RETURNED_FROM_DETERMINE_VERSION) { return true; }
    return compat[permalinkVersion] ?? false;
}

export function encodeHash(permalink: Omit<Permalink, "format">): Promise<string> {
    return gzipString(JSON.stringify({ format: latestPermalink, ...permalink } as Permalink), "base64url") as Promise<string>;
}

// escape() polyfill for legacy permalinks
// https://262.ecma-international.org/5.1/#sec-B.2.1
const ESCAPE_ALLOWED = new Set([..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@*_+-./"].map((i) => i.charCodeAt(0)));
function escape(input: string) {
    let r = "";
    if (input.length == 0) {
        return "";
    }
    for (let k = 0; k < input.length; k++) {
        const code = input.charCodeAt(k);
        if (ESCAPE_ALLOWED.has(code)) {
            r += input[k];
        } else if (code < 256) {
            r += `%${code.toString(16)}`;
        } else {
            r += `%u${code.toString(16).padStart(4, "0")}`;
        }
    }
    return r;
}

type DecodeResult = {
    compatible: true,
    permalink: Permalink,
} | {
    compatible: false,
    version: string,
};

export async function decodeHash(hash: string): Promise<DecodeResult | null> {
    let permalink: OldPermalinks | Permalink;
    try {
        permalink = JSON.parse(await gunzipString(hash, "base64url", "utf8") as string);
    } catch (decompressError) {
        // Try to decode it as a non-compressed permalink
        try {
            permalink = JSON.parse(decodeURIComponent(atob(hash)));
        } catch (decodeError) {
            // It might be a legacy permalink, try again with the polyfill
            try {
                permalink = JSON.parse(decodeURIComponent(escape(atob(hash))));
            } catch (legacyDecodeError) {
                console.warn("Failed to decode permalink!", decompressError, decodeError, legacyDecodeError);
                return null;
            }
        }
        if (permalink instanceof Array) {
            // legacy permalink, we have never used those
            return { compatible: false, version: permalink[5] };
        }
    }
    try {
        let realVersion = decodeVersion(permalink.version);
        if (incompatible(permalink.version)) {
            return { compatible: false, version: permalink.version };
        }
        switch (permalink.format) {
            case 2: {
                return {
                    compatible: true,
                    permalink: {
                        ...permalink,
                        format: latestPermalink,
                        inputs: permalink.inputs.length > 0 ? [["Default", permalink.inputs]] : [],
                    },
                };
            }
            case 3: {
                return {
                    compatible: true,
                    permalink,
                };
            }
            default: {
                console.warn("Incompatible permalink version!", permalink);
                return null;
            }
        }
    } catch (e) {
        console.warn("Permalink is structured incorrectly!", permalink, e);
        return null;
    }
}
