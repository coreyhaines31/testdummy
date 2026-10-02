// Background service worker for TestDummy Chrome Extension
// Handles hotkey commands and communication with content scripts

// Install event
chrome.runtime.onInstalled.addListener((details) => {
    console.log('TestDummy extension installed:', details);
    
    // Initialize storage with defaults
    chrome.storage.local.set({
        settings: {
            defaultProfile: null,
            emailStrategy: 'counter',
            autoSubmit: false,
            debugMode: false
        },
        profiles: [
            {
                id: 'test-user',
                name: 'Test User',
                firstName: 'Test',
                lastName: 'User',
                emailPrefix: 'test',
                emailDomain: 'example.com',
                password: 'TestPass123!',
                fieldMappings: {}
            }
        ],
        counters: {}
    });
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
    console.log('Command received:', command);
    
    if (command === 'autofill-now') {
        triggerAutofill();
    }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
    console.log('Extension icon clicked on tab:', tab.url);
    triggerAutofill();
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background received message:', request, 'from:', sender.tab?.url);
    
    try {
        switch (request.action) {
            case 'ping':
                console.log('Ping received');
                sendResponse({ success: true, message: 'Background script is running' });
                break;
                
            case 'autofill':
                handleAutofillRequest(sender.tab, sendResponse);
                return true;
                
            case 'checkDomain':
                handleCheckDomain(request.data.url, sendResponse);
                return true; // Keep message channel open for async response
                
            case 'getSettings':
                handleGetSettings(sendResponse);
                return true;
                
            case 'logActivity':
                handleLogActivity(request.data, sender.tab);
                break;

            case 'smartFill':
                handleSmartFillRequest(request.options || {}, sender.tab, sendResponse);
                return true;

            default:
                console.log('Unknown action:', request.action);
                sendResponse({ success: false, error: 'Unknown action' });
        }
    } catch (error) {
        console.error('Error in background message handler:', error);
        sendResponse({ success: false, error: error.message });
    }
});

// Inject content scripts into tab
async function injectContentScripts(tabId) {
    try {
        // Check if content script is already injected
        try {
            await chrome.tabs.sendMessage(tabId, { action: 'ping' });
            console.log('Content scripts already injected');
            return;
        } catch (error) {
            // Content script not loaded, proceed with injection
        }

        // Inject utility scripts first
        await chrome.scripting.executeScript({
            target: { tabId },
            files: ['utils/storage-manager.js']
        });

        await chrome.scripting.executeScript({
            target: { tabId },
            files: ['utils/email-generator.js']
        });

        await chrome.scripting.executeScript({
            target: { tabId },
            files: ['utils/field-detection.js']
        });

        await chrome.scripting.executeScript({
            target: { tabId },
            files: ['utils/input-simulation.js']
        });

        await chrome.scripting.executeScript({
            target: { tabId },
            files: ['utils/smart-field-detector.js']
        });

        await chrome.scripting.executeScript({
            target: { tabId },
            files: ['utils/value-generator.js']
        });

        // Inject main content script last
        await chrome.scripting.executeScript({
            target: { tabId },
            files: ['content.js']
        });

        console.log('Content scripts injected successfully');
    } catch (error) {
        console.error('Error injecting content scripts:', error);
        throw error;
    }
}

// Trigger autofill on active tab
async function triggerAutofill() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab || !tab.url) {
            console.log('No active tab found');
            return;
        }

        // Inject content scripts
        await injectContentScripts(tab.id);

        // Send autofill message to content script
        const response = await chrome.tabs.sendMessage(tab.id, {
            action: 'autofill'
        });

        if (response && response.success) {
            console.log('Autofill completed successfully');
        } else {
            console.log('Autofill failed:', response?.error);
        }
    } catch (error) {
        console.error('Error triggering autofill:', error);
    }
}

// Handle autofill request from popup
async function handleAutofillRequest(tab, sendResponse) {
    try {
        console.log('handleAutofillRequest called with tab:', tab);
        
        // If no tab provided, get the active tab
        if (!tab || !tab.url) {
            console.log('No tab provided, getting active tab...');
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            tab = activeTab;
            console.log('Active tab:', tab);
        }
        
        if (!tab || !tab.url) {
            console.log('Still no active tab found');
            sendResponse({ success: false, error: 'No active tab found' });
            return;
        }
        
        console.log('Injecting scripts and sending message to content script for:', tab.url);

        // Inject content scripts
        await injectContentScripts(tab.id);

        // Send autofill message to content script
        const response = await chrome.tabs.sendMessage(tab.id, {
            action: 'autofill'
        });
        
        console.log('Content script response:', response);
        sendResponse(response);
    } catch (error) {
        console.error('Error handling autofill request:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Get settings for content script
async function handleGetSettings(sendResponse) {
    try {
        const result = await chrome.storage.local.get(['settings', 'profiles']);
        const settings = result.settings || {};
        const profiles = result.profiles || [];
        
        // Find default profile
        const defaultProfile = profiles.find(p => p.id === settings.defaultProfile) || profiles[0];
        
        sendResponse({ 
            success: true, 
            data: { 
                settings, 
                defaultProfile 
            } 
        });
    } catch (error) {
        console.error('Error getting settings:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Check if domain is allowed
async function isDomainAllowed(url) {
    try {
        const result = await chrome.storage.local.get(['settings']);
        const settings = result.settings || {};
        const allowedDomains = settings.allowedDomains || [];
        
        const hostname = new URL(url).hostname;
        
        return allowedDomains.some(domain => {
            if (domain.includes('*')) {
                const pattern = domain.replace(/\*/g, '.*');
                const regex = new RegExp(`^${pattern}$`);
                return regex.test(hostname);
            }
            return hostname === domain || hostname.endsWith('.' + domain);
        });
    } catch (error) {
        console.error('Error checking domain:', error);
        return false;
    }
}

// Log user activity
function handleLogActivity(data, tab) {
    const activity = {
        action: data.action,
        timestamp: new Date().toISOString(),
        url: tab.url,
        title: tab.title
    };
    
    // Store activity log
    chrome.storage.local.get(['activityLog'], (result) => {
        const log = result.activityLog || [];
        log.push(activity);
        
        // Keep only last 100 activities
        if (log.length > 100) {
            log.splice(0, log.length - 100);
        }
        
        chrome.storage.local.set({ activityLog: log });
    });
}

// Handle check domain request
async function handleCheckDomain(url, sendResponse) {
    try {
        const isAllowed = await isDomainAllowed(url);
        sendResponse({
            success: true,
            data: { allowed: isAllowed }
        });
    } catch (error) {
        console.error('Error checking domain:', error);
        sendResponse({
            success: false,
            error: error.message
        });
    }
}

// Handle smart fill request from popup
async function handleSmartFillRequest(options, tab, sendResponse) {
    try {
        console.log('handleSmartFillRequest called with options:', options);

        // If no tab provided, get the active tab
        if (!tab || !tab.url) {
            console.log('No tab provided, getting active tab...');
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            tab = activeTab;
            console.log('Active tab:', tab);
        }

        if (!tab || !tab.url) {
            console.log('Still no active tab found');
            sendResponse({ success: false, error: 'No active tab found' });
            return;
        }

        console.log('Checking domain for Smart Fill:', tab.url);

        // Check if domain is allowed
        const isAllowed = await isDomainAllowed(tab.url);
        if (!isAllowed) {
            console.log('Domain not allowed:', tab.url);
            sendResponse({ success: false, error: 'Domain not allowed' });
            return;
        }

        console.log('Domain allowed, sending Smart Fill message to content script');

        // Send smart fill message to content script
        const response = await chrome.tabs.sendMessage(tab.id, {
            action: 'smartFill',
            options: options
        });

        console.log('Content script Smart Fill response:', response);
        sendResponse(response);
    } catch (error) {
        console.error('Error handling Smart Fill request:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Handle tab updates for auto-submit (if enabled)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        try {
            const result = await chrome.storage.local.get(['settings']);
            const settings = result.settings || {};
            
            if (settings.autoSubmit) {
                // Check if domain is allowed
                const isAllowed = await isDomainAllowed(tab.url);
                if (isAllowed) {
                    // Send auto-submit message to content script
                    chrome.tabs.sendMessage(tabId, { action: 'autoSubmit' });
                }
            }
        } catch (error) {
            console.error('Error handling tab update:', error);
        }
    }
});
