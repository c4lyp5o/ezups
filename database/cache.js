const cache = new Map();

function setCache(key, value) {
	cache.set(key, value);
}

function getCache(key) {
	return cache.get(key);
}

function hasCache(key) {
	return cache.has(key);
}

function deleteCache(key) {
	return cache.delete(key);
}

function clearCache() {
	cache.clear();
}

export { setCache, getCache, hasCache, deleteCache, clearCache };
