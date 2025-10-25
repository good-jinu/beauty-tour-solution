import {
	getClientSafeConfig,
	getServerEventTrackingConfig,
} from "$lib/config/server";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async () => {
	// Get server configuration
	const serverConfig = getServerEventTrackingConfig();

	// Return client-safe configuration
	const clientConfig = getClientSafeConfig(serverConfig);

	return {
		eventTrackingConfig: clientConfig,
	};
};
