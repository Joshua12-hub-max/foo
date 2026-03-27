
/* eslint-disable-next-line @typescript-eslint/naming-convention */
import NodeCache from 'node-cache';

// TTL of 5 minutes by default
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

/**
 * Simple wrapper for node-cache
 */
export const serverCache = {
    get: <T>(key: string): T | undefined => {
        return cache.get<T>(key);
    },
    set: (key: string, value: unknown, ttl?: number) => {
        if (ttl) {
            cache.set(key, value, ttl);
        } else {
            cache.set(key, value);
        }
    },
    del: (key: string | string[]) => {
        cache.del(key);
    },
    flush: () => {
        cache.flushAll();
    }
};

export default serverCache;
