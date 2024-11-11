import compatRaw from "../../data/compat.json?raw";
import { gunzipString, gzipUint8Array } from "gzip-utils";
import { pack, unpack } from "msgpackr";

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
    // probably not great for performance but whatever
    const buf = new Uint8Array([0xff, ...pack({ format: latestPermalink, ...permalink } as Permalink)]);
    return gzipUint8Array(buf, "base64url") as Promise<string>;
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
        // First try compressed permalinks
        const decompressed = await gunzipString(hash, "base64url", "raw") as Uint8Array;
        if (decompressed[0] == 0xff) {
            // msgpack
            permalink = unpack(decompressed.slice(1));
        } else {
            // JSON
            permalink = JSON.parse(new TextDecoder().decode(decompressed));
        }
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
