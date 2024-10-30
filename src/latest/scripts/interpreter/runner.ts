import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { RunRequest, RunnerMessage } from "../workers/runner-types";
import { Inputs } from "./inputs";
import { TypedEventTarget } from "typescript-event-target";

const MAX_BUFFER_SIZE = 20000;

export enum TerminateReason {
    Terminated, TimedOut,
}

export type VyRunnerEvents = {
    ready: Event,
    runningGroupChanged: CustomEvent<{ group: number | null }>,
};

export class VyRunner extends TypedEventTarget<VyRunnerEvents> {
    private terminal: Terminal | null;
    private fit: FitAddon | null;
    private worker: Promise<Worker>;
    private workerCounter = 0;
    private outputBuffer: string[] = [];
    private _state: "idle" | "booting" | "running" = "booting";
    private splashes: string[];
    private version: string;
    private timeoutHandle: number | null;
    private inputs: Inputs;
    private code: string;
    private flags: string[];
    private currentGroup: number = 0;
    private runAllGroups: boolean = true;
    private groupStartedAt: number;
    private executionStartedAt: number;

    constructor(splashes: string[], version: string) {
        super();
        this.splashes = splashes;
        this.version = version;
        this.worker = this.spawnWorker();
    }

    attach(element: HTMLElement) {
        if (this.terminal != null) {
            throw new Error("Already attached");
        }
        this.terminal = new Terminal({
            scrollback: 1000,
            convertEol: true,
        });
        this.fit = new FitAddon();
        this.terminal.loadAddon(this.fit);
        this.terminal.open(element);
        this.fit.fit();
        new ResizeObserver(() => requestAnimationFrame(() => this.onResize())).observe(element);
        this.terminal!.writeln(`\x1b[?25lWelcome to \x1b[1;95mVyxal\x1b[0m ${this.version}`);
        this.terminal!.writeln(`\x1b[2;3m${this.splashes[Math.floor(Math.random() * this.splashes.length)]}\x1b[0m`);
        console.log("Terminal attached");
    }

    private onResize() {
        this.fit?.fit();
    }

    detach() {
        if (this.terminal == null) {
            throw new Error("Not attached");
        }
        this.terminal!.dispose();
        this.terminal = null;
        this.fit = null;
        console.log("Terminal detached");
    }

    get state() {
        return this._state;
    }

    private spawnWorker() {
        console.log("Spawning new worker");
        this.workerCounter += 1;
        return new Promise<Worker>((resolve) => {
            const worker = new Worker(
                /* webpackChunkName: "worker" */
                new URL("../workers/runner.ts", import.meta.url),
            );
            const listener = (event: MessageEvent<RunnerMessage>) => {
                if (event.data.type == "ready") {
                    resolve(worker);
                    worker.addEventListener("message", this.onWorkerMessage.bind(this));
                    worker.removeEventListener("message", listener);
                    console.log("Worker is ready");
                    this._state = "idle";
                    this.dispatchTypedEvent("ready", new Event("ready"));
                }
            };
            // possible race condition? won't appear in practice
            // but if they ever develop internet that's faster than the speed of light it could be an issue
            worker.addEventListener("message", listener);
        });
    }

    private runningGroupChanged(group: number | null) {
        this.dispatchTypedEvent("runningGroupChanged", new CustomEvent(
            "runningGroupChanged", { detail: { group } },
        ));
    }

    private onWorkerMessage(message: MessageEvent<RunnerMessage>) {
        const data = message.data;
        if (data.workerNumber != this.workerCounter) {
            console.warn("Discarding old worker message");
            return;
        }
        if (this.terminal != null) {
            switch (data.type) {
                case "started":{
                    this._state = "running";
                    this.runningGroupChanged(this.currentGroup);
                    break;
                }
                case "stdout":{
                    this.terminal.write(data.text);
                    this.outputBuffer.push(data.text);
                    this.outputBuffer.length = Math.min(this.outputBuffer.length, MAX_BUFFER_SIZE);
                    break;
                }
                case "stderr":{
                    this.terminal.write(`\x1b[31m${data.text}\x1b[0m`);
                    break;
                }
                case "worker-notice":{
                    this.terminal.writeln(`\x1b[2m${data.text}\x1b[0m`);
                    break;
                }
                case "done":{
                    const now = performance.now();
                    this.terminal?.writeln(`\n\x1b[0G\x1b[0;2mFinished in ${Math.round((now - this.groupStartedAt)) / 1000} seconds\x1b[0m`);
                    if (this.runAllGroups && this.inputs.length > 0 && ++this.currentGroup != this.inputs.length && this._state == "running") {
                        this.runNextGroup(this.code, this.flags);
                    } else {
                        this.terminal?.writeln(`\x1b[1;92mExecution completed\x1b[0m in ${Math.round((now - this.executionStartedAt)) / 1000} seconds`);
                        this._state = "idle";
                        this.runningGroupChanged(null);
                        if (this.timeoutHandle != null) {
                            window.clearTimeout(this.timeoutHandle);
                        }
                    }
                    break;
                }
            }
        }
    }

    private runNextGroup(code: string, flags: string[]) {
        const group = this.inputs[this.currentGroup];
        const inputs = group?.inputs ?? [];
        if (group != undefined) {
            this.terminal?.writeln(`\x1b[92mRunning group: ${group.name}\x1b[0m`);
        }
        return this.worker.then((worker) => {
            this.groupStartedAt = performance.now();
            worker.postMessage({ code, flags, inputs: inputs.map(({ input }) => input), workerNumber: this.workerCounter } as RunRequest);
        });
    }

    async start(code: string, flags: string[], inputs: Inputs, group: number | null, timeout: number | null) {
        if (code == "lyxal") {
            window.location.assign("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
            return;
        }
        if (this._state == "running") {
            throw new Error("Attempted to start while running");
        }
        await this.worker;
        this.terminal?.clear();
        this.terminal?.reset();
        this.outputBuffer.length = 0;
        this.inputs = [...inputs];
        this.currentGroup = group != null ? group : 0;
        this.runAllGroups = group == null;
        this.code = code;
        this.flags = flags;
        this.runNextGroup(code, flags).then(() => {
            this.executionStartedAt = this.groupStartedAt;
            if (timeout != null) {
                this.timeoutHandle = window.setTimeout(() => {
                    this.terminate(TerminateReason.TimedOut);
                }, timeout * 1000);
            } else {
                this.timeoutHandle = null;
            }
        });
    }

    async terminate(reason: TerminateReason = TerminateReason.Terminated) {
        if (this._state != "running") {
            throw new Error("Attempted to terminate worker while not running");
        }
        console.log("Terminating worker");
        await this.worker.then((worker) => {
            this._state = "booting";
            this.worker = this.spawnWorker();
            worker.terminate();
            this.terminal?.writeln("\n\x1b[0G-------");
            switch (reason) {
                case TerminateReason.Terminated:
                    this.terminal?.writeln("\x1b[1;31mExecution terminated\x1b[0m");
                    break;
                case TerminateReason.TimedOut:
                    this.terminal?.writeln("\x1b[1;31mExecution timed out\x1b[0m");
                    break;
            }
            this.runningGroupChanged(null);
            if (this.timeoutHandle != null) {
                window.clearTimeout(this.timeoutHandle);
            }
        });
    }

    getOutput() {
        return this.outputBuffer.join("");
    }

    showMessage(message: string) {
        if (this._state == "idle") {
            this.terminal?.clear();
            this.terminal?.reset();
            this.terminal?.write(message);
        }
    }
}
