/**
 * Shortens an Ethereum address or ENS name for display
 * @param {string} address - Ethereum address or ENS name
 * @param {number} [chars=4] - Number of characters to show at start and end
 * @returns {string} Formatted address (e.g. "0xabcd...1234" or "vitalik.eth")
 */
export function shortenAddress(address, chars = 4) {
    if (!address) return "";

    // Check if it's an ENS name (ends with .eth or contains .)
    if (address.endsWith(".eth") || address.includes(".")) {
        return address;
    }

    // Check if it's a valid Ethereum address
    if (address.startsWith("0x") && address.length === 42) {
        return `${address.substring(0, chars + 2)}...${address.substring(42 - chars)}`;
    }

    // Return as-is if it doesn't match expected formats
    return address;
}

