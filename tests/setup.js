// Setup file for Jest tests

// Mock Chrome API if not available
if (typeof global.chrome === 'undefined') {
    global.chrome = {
        runtime: {
            sendMessage: jest.fn(),
            onMessage: {
                addListener: jest.fn()
            },
            lastError: null
        },
        storage: {
            local: {
                get: jest.fn(),
                set: jest.fn(),
                remove: jest.fn(),
                clear: jest.fn()
            },
            sync: {
                get: jest.fn(),
                set: jest.fn(),
                remove: jest.fn(),
                clear: jest.fn()
            }
        },
        tabs: {
            query: jest.fn(),
            sendMessage: jest.fn()
        }
    };
}

// Mock console methods to avoid noise in tests
global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
};