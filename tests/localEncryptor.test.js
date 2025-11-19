describe('LocalEncryptor', () => {
    it('should encrypt and decrypt a message', async () => {
        const encryptor = createLocalEncryptor();
        const message = 'This is a secret message.';
        const encrypted = await encryptor.encrypt(message);
        const decrypted = await encryptor.decrypt(encrypted);
        expect(decrypted).toBe(message);
    });
});