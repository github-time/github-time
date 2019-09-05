declare namespace HTMLParser {
	export namespace Handler {
		type Attr = {
			name: string,
			value: string,
			escaped: string
		}
	}

	export type Handler = {
		comment?: (text: string) => void
		start?: (tagName: string, attrs: Handler.Attr[], unary?: boolean) => void
		end?: (tagName: string) => void
		chars?: (text: string) => void
	}
}

declare function HTMLParser(segment: string, handler: HTMLParser.Handler): void

export = HTMLParser;
