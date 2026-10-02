// Tests for InputSimulator class

const { InputSimulator } = require('../utils/input-simulation.js');

describe('InputSimulator', () => {
    let simulator;
    let input;

    beforeAll(() => {
        Element.prototype.scrollIntoView = jest.fn();
    });

    beforeEach(() => {
        document.body.innerHTML = '<input id="field" type="text">';
        input = document.getElementById('field');
        simulator = new InputSimulator();
        simulator.delay = () => Promise.resolve();
    });

    describe('simulateInput', () => {
        it('fills a text input', async () => {
            const result = await simulator.simulateInput(input, 'test value');

            expect(result).toBe(true);
            expect(input.value).toBe('test value');
        });

        it('replaces an existing value', async () => {
            input.value = 'old value';

            await simulator.simulateInput(input, 'new value');

            expect(input.value).toBe('new value');
        });

        it('dispatches input and change events', async () => {
            const onInput = jest.fn();
            const onChange = jest.fn();
            input.addEventListener('input', onInput);
            input.addEventListener('change', onChange);

            await simulator.simulateInput(input, 'hello');

            expect(onInput).toHaveBeenCalled();
            expect(onChange).toHaveBeenCalled();
        });

        it('returns false for a missing element', async () => {
            expect(await simulator.simulateInput(null, 'value')).toBe(false);
        });
    });

    describe('fillFields', () => {
        it('fills detected fields from a profile', async () => {
            document.body.innerHTML = '<input id="first"><input id="email">';
            const fields = {
                firstName: document.getElementById('first'),
                email: document.getElementById('email')
            };

            await simulator.fillFields(fields, { firstName: 'Test', email: 'test+1@example.com' });

            expect(fields.firstName.value).toBe('Test');
            expect(fields.email.value).toBe('test+1@example.com');
        });
    });
});
