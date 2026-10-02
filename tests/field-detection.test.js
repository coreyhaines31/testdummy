// Tests for FieldDetector class

const { FieldDetector } = require('../utils/field-detection.js');

describe('FieldDetector', () => {
    let detector;

    beforeAll(() => {
        // jsdom has no layout, so give every element a visible size
        Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get: () => 100 });
        Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get: () => 20 });
    });

    beforeEach(() => {
        document.body.innerHTML = '';
        detector = new FieldDetector();
    });

    describe('findFields', () => {
        it('detects a standard signup form', () => {
            document.body.innerHTML = `
                <form>
                    <input name="first_name">
                    <input name="last_name">
                    <input type="email" name="email">
                    <input type="password" name="password">
                    <input type="password" name="password_confirm">
                </form>`;

            const fields = detector.findFields();

            expect(fields.firstName.name).toBe('first_name');
            expect(fields.lastName.name).toBe('last_name');
            expect(fields.email.name).toBe('email');
            expect(fields.password.name).toBe('password');
            expect(fields.confirmPassword.name).toBe('password_confirm');
        });

        it('detects a single full name field', () => {
            document.body.innerHTML = `
                <input type="email" name="email">
                <input type="text" name="full_name">`;

            const fields = detector.findFields();

            expect(fields.fullName.name).toBe('full_name');
            expect(fields.firstName).toBeUndefined();
        });

        it('uses custom selectors when provided', () => {
            document.body.innerHTML = `
                <input type="email" name="email">
                <input id="work-address" name="work">`;

            const fields = detector.findFields({ email: '#work-address' });

            expect(fields.email.id).toBe('work-address');
        });

        it('returns an empty object when there are no fields', () => {
            expect(detector.findFields()).toEqual({});
        });
    });

    describe('isValidField', () => {
        it('rejects disabled, hidden, and non-input elements', () => {
            document.body.innerHTML = `
                <input id="disabled" disabled>
                <input id="hidden" style="display: none">
                <textarea id="textarea"></textarea>
                <input id="ok">`;

            expect(detector.isValidField(document.getElementById('disabled'))).toBe(false);
            expect(detector.isValidField(document.getElementById('hidden'))).toBe(false);
            expect(detector.isValidField(document.getElementById('textarea'))).toBe(false);
            expect(detector.isValidField(document.getElementById('ok'))).toBe(true);
        });
    });
});
