import os from 'os';

/**
 * Get the local network IP address (IPv4)
 * Returns 'localhost' if no external network IP is found
 */
export function getNetworkIp(): string {
    const nets = os.networkInterfaces();
    let localIp = 'localhost';

    for (const name of Object.keys(nets)) {
        for (const net of nets[name] || []) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1)
            if (net.family === 'IPv4' && !net.internal) {
                localIp = net.address;
                break;
            }
        }
    }

    return localIp;
}
