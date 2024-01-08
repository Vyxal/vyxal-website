/*
The incompatible version matrix determines if a permalink needs to redirect
to a versioned permalink.

A true value means that all permalinks referencing that version need to redirect
to their respective archived version.
*/

const incompatMatrix = {
    "3.0.0": true,
    "3.1.0": false
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function incompatible(target, current) {
    return incompatMatrix[target];
}
