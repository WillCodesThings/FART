// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface Platform {}

		export interface printers {
			flash?: {
				cardHovered: boolean;
				name: string;
				image: string;
				apiKey: string;
				selected: boolean;
			}
		}

	}
}

export { };
