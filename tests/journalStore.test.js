describe('JournalStore', () => {
    it('should add an entry', () => {
        const journalStore = createJournalStore('test-journal', {
            success: () => {},
            error: () => {},
        });
        journalStore.saveEntry({
            id: '1',
            title: 'Test Entry',
            content: 'This is a test entry.',
        });
        const entries = journalStore.getAll();
        expect(entries.length).toBe(1);
        expect(entries[0].title).toBe('Test Entry');
    });

    it('should delete an entry', () => {
        const journalStore = createJournalStore('test-journal', {
            success: () => {},
            error: () => {},
        });
        journalStore.saveEntry({
            id: '1',
            title: 'Test Entry',
            content: 'This is a test entry.',
        });
        journalStore.deleteEntry('1');
        const entries = journalStore.getAll();
        expect(entries.length).toBe(0);
    });
});