/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_NETWORK_CHAIN_ID: string;
	readonly VITE_NETWORK_CHAIN_NAME: string;
	readonly VITE_NETWORK_LCD_REST: string;
	readonly VITE_NETWORK_LCD_RPC: string;
	readonly VITE_PERMIT_NAME: string;
	readonly VITE_CONTRACT_GAME_ADDR: string;
	readonly VITE_CONTRACT_GAME_CODE_HASH: string;
	readonly VITE_CONTRACT_MINTER_ADDR: string;
	readonly VITE_CONTRACT_MINTER_CODE_HASH: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
