import React, { ForwardedRef, forwardRef, useContext, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { VyRunner, TerminateReason } from "./runner";
import { ElementDataContext } from "./util/element-data";
import splashes from "../data/splash.txt?raw";

type VyTerminalParams = {
    code: string,
    flags: string[],
    inputs: string[],
    timeout: number,
    onStart: () => unknown,
    onFinish: () => unknown,
};

export interface VyTerminalRef {
    start(): void,
    stop(): void,
    getOutput(): string,
}

const VyTerminal = forwardRef(function VyTerminal({ code, flags, inputs, timeout, onStart, onFinish }: VyTerminalParams, ref: ForwardedRef<VyTerminalRef>) {
    const wrapperRef = useRef(null);
    const elementData = useContext(ElementDataContext);
    const runner = useMemo(() => new VyRunner(splashes.split("\n"), elementData!.version), []);

    useImperativeHandle(ref, () => {
        return {
            start() {
                runner.start(code, flags, inputs, timeout);
            },
            stop() {
                return runner.terminate(TerminateReason.Terminated);
            },
            getOutput() {
                return runner.getOutput();
            },
        };
    });

    useEffect(() => {
        runner.attach(wrapperRef.current!);
        runner.addEventListener("started", onStart);
        runner.addEventListener("finished", onFinish);
        if (code.length > 0) {
            runner.start(code, flags, inputs, timeout);
        }
        return () => {
            runner.detach();
            runner.removeEventListener("started", onStart);
            runner.removeEventListener("finished", onFinish);
        };
    }, []);

    return <div ref={wrapperRef} className="terminal-wrapper"></div>;
});
export default VyTerminal;