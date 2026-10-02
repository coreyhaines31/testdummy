// Basic tests to ensure testing setup works

describe('Basic Test Suite', () => {
    it('should pass a basic test', () => {
        expect(1 + 1).toBe(2);
    });

    it('should have Chrome API mocked', () => {
        expect(global.chrome).toBeDefined();
        expect(global.chrome.storage).toBeDefined();
        expect(global.chrome.storage.local).toBeDefined();
    });

    it('should be able to load EmailGenerator module', () => {
        const { EmailGenerator } = require('../utils/email-generator.js');
        expect(EmailGenerator).toBeDefined();
    });

    it('should be able to load FieldDetector module', () => {
        const { FieldDetector } = require('../utils/field-detection.js');
        expect(FieldDetector).toBeDefined();
    });

    it('should be able to load InputSimulator module', () => {
        const { InputSimulator } = require('../utils/input-simulation.js');
        expect(InputSimulator).toBeDefined();
    });
});