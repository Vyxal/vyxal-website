import compatRaw from "../../data/compat.json?raw";
import { gunzipString, gzipString } from "gzip-utils";

const compat = JSON.parse(compatRaw);

type OldPermalinks = {
    format: 2,
    flags: string[],
    header: string,
    code: string,
    footer: string,
    inputs: string[],
    version: string,
};

const latestPermalink = 3;
export type Permalink = {
    format: typeof latestPermalink,
    flags: string[],
    header: string,
    code: string,
    footer: string,
    inputs: [string, string[]][],
    version: string,
};

function incompatible(permalinkVersion: string) {
    return compat[permalinkVersion] ?? false;
}

export function encodeHash(permalink: Omit<Permalink, "format">): Promise<string> {
    return gzipString(JSON.stringify({ format: latestPermalink, ...permalink } as Permalink), "base64url") as Promise<string>;
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
            console.warn("Failed to decode permalink!", decompressError, decodeError);
            return null;
        }
        if (permalink instanceof Array) {
            // legacy permalink, we have never used those
            return { compatible: false, version: permalink[5] };
        }
    }
    try {
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
                        inputs: [["Default", permalink.inputs]],
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
