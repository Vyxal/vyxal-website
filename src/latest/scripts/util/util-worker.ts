import { ELEMENT_DATA } from "./element-data";


type UtilWorkerResponse<T> = {
    rqid: number,
    data: T,
};

type MessageListener = (event: MessageEvent<never>) => unknown;
type ThingThatLooksLikeAWorker = {
    addEventListener: (type: "message", listener: MessageListener) => void,
    removeEventListener: (type: "message", listener: MessageListener) => void,
    postMessage: (message: unknown) => void,
};

export class UtilWorker {
    private worker: Promise<ThingThatLooksLikeAWorker>;
    private rqid: number = 0;
    constructor() {
        this.worker = new Promise((resolve) => {
            if (window.SharedWorker) {
                const worker = new SharedWorker(
                    /* webpackChunkName: "util-worker" */
                    new URL("../workers/util", import.meta.url),
                    { name: "util-worker" },
                );
                const readyListener = (event: MessageEvent<unknown>) => {
                    if (event.data != "ready") {
                        throw Error("Unexpected initial message");
                    }
                    resolve(worker.port);
                    worker.port.removeEventListener("message", readyListener);
                };
                worker.port.start();
                worker.port.addEventListener("message", readyListener);
            } else {
                console.warn("Shared Workers are unavailable, starting fallback worker instead");
                console.warn("Use Firefox for Android instead of Chrome, dammit");
                const worker = new Worker(
                    /* webpackChunkName: "util-fallback" */
                    new URL("../workers/util-fallback", import.meta.url),
                    { name: "util-worker" },
                );
                const readyListener = (event: MessageEvent<unknown>) => {
                    if (event.data != "ready") {
                        throw Error("Unexpected initial message");
                    }
                    resolve(worker);
                    worker.removeEventListener("message", readyListener);
                };
                worker.addEventListener("message", readyListener);
            }
        });
    }

    private send<T>(message: object): Promise<T> {
        return new Promise((resolve) => {
            this.worker.then((worker) => {
                const rqid = this.rqid++;
                const listener = (event: MessageEvent<UtilWorkerResponse<T>>) => {
                    if (event.data.rqid == rqid) {
                        resolve(event.data.data);
                        worker.removeEventListener("message", listener);
                    }
                };
                worker.addEventListener("message", listener);
                worker.postMessage({ ...message, rqid: rqid });
            });
        });
    }

    async sbcsify(code: string) {
        return (await this.send<string>({
            type: "sbcsify",
            code: code,
        }));
    }

    async decompress(compressed: string) {
        return (await this.send<string>({
            type: "decompress",
            text: compressed,
        }));
    }

    async formatBytecount(code: string, literate: boolean) {
        let bytecount: number;
        let processedCode: string;
        const modifiers: string[] = [];
        const codepage = (await ELEMENT_DATA).codepage;
        if (literate) {
            processedCode = await this.sbcsify(code);
        } else {
            processedCode = code;
        }
        if (literate) {
            modifiers.push("literate");
        }
        if (![...processedCode].every((char) => codepage.has(char))) {
            bytecount = new Blob([processedCode]).size; // ick
            modifiers.push("UTF-8");
        } else {
            bytecount = processedCode.length;
        }
        return (
            bytecount.toString()
            + (modifiers.length ? ` (${modifiers.join(", ")})` : "")
            + ` byte${bytecount == 1 ? "" : "s"}`
        );
    }

}
