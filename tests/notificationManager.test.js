describe('NotificationManager', () => {
    it('should add a notification', () => {
        const notificationManager = createNotificationManager();
        notificationManager.add({
            type: 'success',
            title: 'Test',
            message: 'This is a test',
        });
        const notifications = notificationManager.getAll();
        expect(notifications.length).toBe(1);
        expect(notifications[0].title).toBe('Test');
    });

    it('should get unread notifications', () => {
        const notificationManager = createNotificationManager();
        notificationManager.add({
            type: 'success',
            title: 'Test',
            message: 'This is a test',
        });
        const unread = notificationManager.getUnread();
        expect(unread.length).toBe(1);
    });

    it('should mark a notification as read', () => {
        const notificationManager = createNotificationManager();
        const notification = notificationManager.add({
            type: 'success',
            title: 'Test',
            message: 'This is a test',
        });
        notificationManager.markAsRead(notification.id);
        const unread = notificationManager.getUnread();
        expect(unread.length).toBe(0);
    });
});