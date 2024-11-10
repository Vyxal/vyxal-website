import { FallbackProps } from "react-error-boundary";

export function CatastrophicFailure({ resetErrorBoundary }: FallbackProps) {
    return <>
        <header >
            <nav className="navbar navbar-expand bg-body-tertiary">
                <div className="container">
                    <span className="navbar-brand">
                        &nbsp;
                    </span>
                </div>
            </nav>
        </header>
        <main className="container-sm my-auto">
            <div className="border border-danger bg-danger-subtle rounded p-4 mx-auto" style={{ maxWidth: "768px" }}>
                <h3><i className="bi bi-exclamation-circle-fill me-2 text-danger"></i>Catastrophic failure</h3>
                <p>
                    The interpreter has crashed. Sorry about that! Don't worry, your code has  been preserved.
                    If you can reproduce this crash, please open an issue
                    on <a href="https://github.com/vyxal/vyxal.github.io/issues/">the GitHub repository</a>.
                </p>
                <button className="btn btn-danger" onClick={resetErrorBoundary}>Restart</button>
            </div>
        </main>
    </>;
}