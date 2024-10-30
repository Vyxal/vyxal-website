import { ForwardedRef, forwardRef, useCallback, useContext, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { VyRunner, TerminateReason, VyRunnerEvents } from "../interpreter/runner";
import { ElementDataContext } from "../interpreter/element-data";
import splashes from "../../data/splash.txt?raw";
import type { Inputs } from "../interpreter/inputs";
import { Flags, serializeFlags } from "../interpreter/flags";

export interface VyTerminalRef {
    start(code: string, flags: Flags, inputs: Inputs, group: number | null, timeout: number | null): void,
    stop(): void,
    getOutput(): string,
    showMessage(message: string): void,
}

type VyTerminalProps = {
    onRunningGroupChanged: (group: number | null) => unknown,
};

const VyTerminal = forwardRef(function VyTerminal({ onRunningGroupChanged }: VyTerminalProps, ref: ForwardedRef<VyTerminalRef>) {
    const wrapperRef = useRef(null);
    const elementData = useContext(ElementDataContext)!;
    const runner = useMemo(() => new VyRunner(splashes.trim().split("\n"), elementData!.version), []);

    const runningGroupChangedCallback = useCallback((e: VyRunnerEvents["runningGroupChanged"]) => {
        console.log(e.detail.group);
        onRunningGroupChanged(e.detail.group);
    }, [onRunningGroupChanged]);

    useImperativeHandle(ref, () => {
        return {
            start(code, flags, inputs, group, timeout) {
                runner.start(code, [...serializeFlags(elementData.flagDefs, flags)], inputs, group, timeout);
            },
            stop() {
                return runner.terminate(TerminateReason.Terminated);
            },
            getOutput() {
                return runner.getOutput();
            },
            showMessage(message: string) {
                return runner.showMessage(message);
            },
        };
    });

    useEffect(() => {
        runner.attach(wrapperRef.current!);
        runner.addEventListener("runningGroupChanged", runningGroupChangedCallback);
        return () => {
            runner.detach();
            runner.removeEventListener("runningGroupChanged", runningGroupChangedCallback);
        };
    }, []);

    return <div ref={wrapperRef} className="terminal-wrapper"></div>;
});
export default VyTerminal;