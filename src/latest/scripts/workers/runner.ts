import { Vyxal } from "https://vyxal.github.io/Vyxal/vyxal.js";
import type { RunRequest } from "./runner-types";

// @ts-expect-error DATA_URI gets replaced by Webpack
const dataUri = DATA_URI;
const dictPromise = Promise.all([
    fetch(`${dataUri}/ShortDictionary.txt`, { cache: "force-cache" }).then((response) => response.text()),
    fetch(`${dataUri}/LongDictionary.txt`, { cache: "force-cache" }).then((response) => response.text()),
]).then((responses) => {
    Vyxal.setShortDict(responses[0]);
    Vyxal.setLongDict(responses[0]);
});

self.addEventListener("message", function(message: MessageEvent<RunRequest>) {
    const request = message.data;
    console.log(`Received run request (workerNumber ${request.workerNumber})`);
    dictPromise.then(() => {
        this.postMessage({
            type: "started",
            workerNumber: request.workerNumber,
        });
        Vyxal.execute(
            request.code,
            request.inputs,
            request.flags.join(""),
            (line: string) => {
                this.postMessage({
                    type: "stdout",
                    text: line,
                    workerNumber: request.workerNumber,
                });
            },
            (line: string) => {
                this.postMessage({
                    type: "stderr",
                    text: line,
                    workerNumber: request.workerNumber,
                });
            },
        );
        console.log(`Execution complete! (workerNumber ${request.workerNumber})`);
        this.postMessage({
            type: "done",
            workerNumber: request.workerNumber,
        });
    });
});

self.postMessage({
    type: "ready",
});