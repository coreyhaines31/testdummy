// Tests for EmailGenerator class

const { EmailGenerator } = require('../utils/email-generator.js');

describe('EmailGenerator', () => {
    let store;
    let generator;

    beforeEach(() => {
        store = {};
        global.chrome = {
            storage: {
                local: {
                    get: jest.fn(async (keys) => {
                        const result = {};
                        keys.forEach((key) => {
                            if (key in store) result[key] = store[key];
                        });
                        return result;
                    }),
                    set: jest.fn(async (data) => {
                        Object.assign(store, data);
                    })
                }
            }
        };

        generator = new EmailGenerator({
            id: 'test-profile',
            name: 'Test Profile',
            emailPrefix: 'test',
            emailDomain: 'example.com'
        });
    });

    it('starts the counter at 1', async () => {
        expect(await generator.generateEmail()).toBe('test+1@example.com');
    });

    it('increments the counter on each call', async () => {
        await generator.generateEmail();
        await generator.generateEmail();

        expect(await generator.generateEmail()).toBe('test+3@example.com');
    });

    it('resets the counter', async () => {
        await generator.generateEmail();
        await generator.generateEmail();
        await generator.resetCounter();

        expect(await generator.generateEmail()).toBe('test+1@example.com');
    });
});
