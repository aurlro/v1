
function renderIcons() {
    document.querySelectorAll('[data-icon]').forEach(el => {
        const iconKey = el.dataset.icon;
        const icon = createIconElement(iconKey, {
            class: 'nav-icon',
        });
        if (icon) {
            el.innerHTML = '';
            el.appendChild(icon);
        }
    });
}
