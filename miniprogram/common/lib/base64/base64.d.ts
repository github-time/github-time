export namespace Base64 {
    const VERSION: string;

    function encode(s: string, uriSafe?: boolean): string;

    function encodeURI(s: string): string;

    function decode(base64: string): string;

    function atob(base64: string): string;

    function btoa(s: string): string;

    function fromBase64(base64: string): string;

    function toBase64(s: string, uriSafe?: boolean): string;

    function btou(s: string): string;

    function utob(s: string): string;

    function noConflict(): typeof Base64;

    function extendString(): void;
}

// Helper to allow referencing Base64 from inside the global declaration without creating a self reference
export type Base64_ = typeof Base64;

declare global {
    interface String {
        fromBase64(): string;
        toBase64(uriSafe?: boolean): string;
        toBase64URI(): string;
    }

    const Base64: Base64_;
}
