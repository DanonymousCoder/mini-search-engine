import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
    cleanup();
    localStorage.clear();
});

// jsdom does not implement <dialog>; provide the parts the app uses.
if (typeof HTMLDialogElement !== 'undefined') {
    HTMLDialogElement.prototype.showModal ||= function showModal(this: HTMLDialogElement) {
        this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close ||= function close(this: HTMLDialogElement) {
        this.removeAttribute('open');
        this.dispatchEvent(new Event('close'));
    };
}
