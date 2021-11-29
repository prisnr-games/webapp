/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_NETWORK_CHAIN_ID: string;
	readonly VITE_NETWORK_CHAIN_NAME: string;
	readonly VITE_NETWORK_LCD_REST: string;
	readonly VITE_NETWORK_LCD_RPC: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
