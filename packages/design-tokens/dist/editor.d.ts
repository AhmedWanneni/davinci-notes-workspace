export interface HeadingSpec {
    readonly size: string;
    readonly weight: string;
    readonly lineHeight: string;
    readonly spaceAbove?: string;
    readonly spaceBelow?: string;
}
export interface EditorTokens {
    readonly lineHeight: string;
    readonly contentPaddingX: string;
    readonly contentPaddingY: string;
    readonly contentPaddingBottom: string;
    readonly heading: {
        readonly h1: HeadingSpec;
        readonly h2: HeadingSpec;
        readonly h3: HeadingSpec;
        readonly h4: HeadingSpec;
        readonly h5: HeadingSpec;
        readonly h6: HeadingSpec;
    };
    readonly code: {
        readonly paddingX: string;
        readonly radius: string;
        readonly blockPaddingY: string;
    };
    readonly listIndent: string;
    readonly obsidian: {
        readonly bodyFontSize: string;
        readonly bodyLineHeight: string;
        readonly contentMaxWidth: string;
        readonly contentLinePaddingInline: string;
        readonly heading: {
            readonly h1: HeadingSpec;
            readonly h2: HeadingSpec;
            readonly h3: HeadingSpec;
            readonly h4: HeadingSpec;
            readonly h5: HeadingSpec;
            readonly h6: HeadingSpec;
        };
        readonly spacing: {
            readonly paragraphLivePreview: string;
            readonly paragraphSourceMode: string;
            readonly list: string;
        };
        readonly color: {
            readonly markdownMarker: string;
            readonly link: string;
            readonly tag: string;
            readonly tagBackground: string;
            readonly tagBackgroundMobile: string;
        };
    };
}
export declare const editorTokens: EditorTokens;
//# sourceMappingURL=editor.d.ts.map