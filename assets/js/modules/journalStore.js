function createJournalStore(storageKey, toast) {
    const fallback = [];

    function getAll() {
        try {
            const raw = localStorage.getItem(storageKey);
            if (!raw) return [...fallback];
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [...fallback];
            return parsed.sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            );
        } catch (error) {
            console.debug('Lecture du journal impossible :', error);
            return [...fallback];
        }
    }

    function saveAll(entries) {
        try {
            localStorage.setItem(storageKey, JSON.stringify(entries));
            return true;
        } catch (error) {
            console.debug('Écriture du journal impossible :', error);
            fallback.length = 0;
            fallback.push(...entries);
            toast?.warning?.('Stockage local indisponible, données conservées en mémoire.');
            return false;
        }
    }

    function saveEntry(entry) {
        const entries = getAll();
        entries.unshift(entry);
        const success = saveAll(entries);
        return success
            ? { success: true, entry }
            : { success: false, message: 'Impossible de persister cette analyse.' };
    }

    function deleteEntry(entryId) {
        const entries = getAll();
        const nextEntries = entries.filter((entry) => entry.id !== entryId);
        if (nextEntries.length === entries.length) {
            return { success: false, message: 'Entrée introuvable.' };
        }
        saveAll(nextEntries);
        return { success: true };
    }

    function clear() {
        saveAll([]);
    }

    function getById(entryId) {
        return getAll().find((entry) => entry.id === entryId) || null;
    }

    function importEntries(list) {
        const sanitized = list
            .filter((entry) => entry && entry.id && entry.createdAt)
            .map((entry) => ({
                ...entry,
                createdAt: entry.createdAt,
            }));
        const current = getAll();
        const merged = [...sanitized, ...current].reduce((map, entry) => {
            map.set(entry.id, entry);
            return map;
        }, new Map());
        const nextEntries = Array.from(merged.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        saveAll(nextEntries);
        return { success: true, count: sanitized.length };
    }

    return {
        getAll,
        saveEntry,
        deleteEntry,
        clear,
        getById,
        importEntries,
    };
}