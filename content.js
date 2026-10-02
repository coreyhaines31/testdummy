// Content script for TestDummy Chrome Extension
// Handles form field detection and autofill functionality

console.log('TestDummy content script loaded on:', window.location.href);

// Initialize components
let fieldDetector, inputSimulator, emailGenerator;
let currentProfile = null;
let settings = {};

// Listen for messages from popup and background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Content script received message:', request);
    
    switch (request.action) {
        case 'ping':
            sendResponse({ success: true, message: 'Content script ready' });
            break;
            
        case 'autofill':
            handleAutofillWithUrlCheck(sendResponse);
            return true; // Keep message channel open for async response
            
        case 'getSettings':
            handleGetSettings(sendResponse);
            return true;
            
        case 'autoSubmit':
            handleAutoSubmit();
            break;
            
        case 'getFieldCount':
            handleGetFieldCount(sendResponse);
            return true;

        case 'smartFill':
            handleSmartFillWithUrlCheck(request.options || {}, sendResponse);
            return true;

        default:
            console.log('Unknown action:', request.action);
            sendResponse({ success: false, error: 'Unknown action' });
    }
});

// Check if current URL is allowed (whitelist or default domains)
async function isCurrentUrlAllowed() {
    try {
        const currentUrl = window.location.href;
        const normalizedUrl = normalizeUrl(currentUrl);

        // Check built-in allowed patterns (localhost, dev, staging)
        const builtInPatterns = [
            'localhost',
            'localhost:',
            '127.0.0.1',
            'dev.',
            'staging.',
            '.dev.',
            '.staging.',
            '-dev.',
            '-staging.'
        ];

        for (const pattern of builtInPatterns) {
            if (normalizedUrl.includes(pattern)) {
                console.log('TestDummy: URL allowed by built-in pattern:', pattern);
                return true;
            }
        }

        // Check whitelist
        const result = await chrome.storage.local.get(['whitelistedUrls']);
        const whitelisted = result.whitelistedUrls || [];

        // Check exact matches
        if (whitelisted.includes(normalizedUrl)) {
            console.log('TestDummy: URL allowed by exact whitelist match');
            return true;
        }

        // Check pattern matches
        for (const whitelistedUrl of whitelisted) {
            if (urlMatches(normalizedUrl, whitelistedUrl)) {
                console.log('TestDummy: URL allowed by whitelist pattern:', whitelistedUrl);
                return true;
            }
        }

        console.log('TestDummy: URL not allowed:', normalizedUrl);
        return false;
    } catch (error) {
        console.error('TestDummy: Error checking URL allowlist:', error);
        return false;
    }
}

function normalizeUrl(url) {
    // Remove protocol and trailing slash
    return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function urlMatches(currentUrl, pattern) {
    // Convert pattern to regex
    const regexPattern = pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*');

    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(currentUrl);
}

// Initialize the content script
async function init() {
    try {
        console.log('TestDummy content script initializing...');

        // Check if current URL is allowed
        const isAllowed = await isCurrentUrlAllowed();
        if (!isAllowed) {
            console.log('TestDummy: Current URL not allowed, skipping initialization');
            return;
        }

        // Load settings and profile
        await loadSettings();
        
        // Load popup settings if available
        await loadPopupSettings();
        
        // Initialize components
        if (typeof FieldDetector !== 'undefined') {
            fieldDetector = new FieldDetector();
        } else {
            console.error('FieldDetector not available');
            return;
        }
        
        if (typeof InputSimulator !== 'undefined') {
            inputSimulator = new InputSimulator();
            inputSimulator.setDebugMode(settings.debugMode || false);
        } else {
            console.error('InputSimulator not available');
            return;
        }
        
        if (currentProfile && typeof EmailGenerator !== 'undefined') {
            emailGenerator = new EmailGenerator(currentProfile);
        } else {
            console.error('EmailGenerator not available or no profile');
        }
        
        console.log('TestDummy content script initialized successfully');
        
        // Show visual indicator
        showIndicator();
        
    } catch (error) {
        console.error('Error initializing content script:', error);
    }
}

// Load settings and current profile
async function loadSettings() {
    try {
        const response = await sendMessageToBackground({ action: 'getSettings' });
        if (response.success) {
            settings = response.data.settings || {};
            currentProfile = response.data.defaultProfile;
            console.log('Settings loaded:', settings);
            console.log('Current profile:', currentProfile);
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Load popup settings and update profile
async function loadPopupSettings() {
    try {
        const result = await chrome.storage.local.get(['settings']);
        const popupSettings = result.settings || {};
        
        if (popupSettings.firstName || popupSettings.lastName || popupSettings.emailPrefix || popupSettings.emailDomain) {
            // Update current profile with popup settings
            if (popupSettings.firstName) {
                currentProfile.firstName = popupSettings.firstName;
            }
            if (popupSettings.lastName) {
                currentProfile.lastName = popupSettings.lastName;
            }
            if (popupSettings.emailPrefix) {
                currentProfile.emailPrefix = popupSettings.emailPrefix;
            }
            if (popupSettings.emailDomain) {
                currentProfile.emailDomain = popupSettings.emailDomain;
            }
            if (popupSettings.emailStrategy) {
                settings.emailStrategy = popupSettings.emailStrategy;
            }
            if (popupSettings.autoSubmit !== undefined) {
                settings.autoSubmit = popupSettings.autoSubmit;
            }
            if (popupSettings.debugMode !== undefined) {
                settings.debugMode = popupSettings.debugMode;
            }
            
            console.log('Popup settings applied:', popupSettings);
            console.log('Updated profile:', currentProfile);
        }
    } catch (error) {
        console.error('Error loading popup settings:', error);
    }
}

// Refresh counter from storage
async function refreshCounter() {
    try {
        const result = await chrome.storage.local.get(['counters']);
        const counters = result.counters || {};
        const currentCounterValue = counters['default'] || 1;
        
        console.log('Content script: Refreshed counter from storage:', currentCounterValue);
        console.log('Content script: Email generator will read this value directly from storage');
    } catch (error) {
        console.error('Error refreshing counter:', error);
    }
}

// Wrapper function to check URL before autofill
async function handleAutofillWithUrlCheck(sendResponse) {
    try {
        const isAllowed = await isCurrentUrlAllowed();
        if (!isAllowed) {
            sendResponse({
                success: false,
                error: 'Current URL is not whitelisted. Please add it to the whitelist in the extension popup.'
            });
            return;
        }

        await handleAutofill(sendResponse);
    } catch (error) {
        console.error('Error in URL check:', error);
        sendResponse({ success: false, error: 'Failed to check URL whitelist' });
    }
}

// Handle autofill request
async function handleAutofill(sendResponse) {
    try {
        console.log('Starting autofill process...');
        
        // Reload settings in case they changed
        await loadSettings();
        
        // Also reload popup settings
        await loadPopupSettings();

        // Re-initialize email generator with updated profile
        if (currentProfile && typeof EmailGenerator !== 'undefined') {
            emailGenerator = new EmailGenerator(currentProfile);
            console.log('Email generator re-initialized with updated profile');
        }

        // Refresh counter from storage to get the latest value
        await refreshCounter();
        
        if (!currentProfile) {
            sendResponse({ success: false, error: 'No profile configured' });
            return;
        }
        
        if (!fieldDetector || !inputSimulator) {
            sendResponse({ success: false, error: 'Extension components not initialized' });
            return;
        }
        
        // Use wait-and-retry pattern (inspired by friend's script)
        const result = await waitAndFillForm();
        
        if (result.success) {
            sendResponse({ 
                success: true, 
                data: result.data
            });
        } else {
            sendResponse({ 
                success: false, 
                error: result.error 
            });
        }
        
    } catch (error) {
        console.error('Error during autofill:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Wait and retry pattern for form filling (inspired by friend's approach)
async function waitAndFillForm(retryCount = 0, maxRetries = 10) {
    try {
        // Find form fields
        const fields = fieldDetector.findFields(currentProfile.fieldMappings || {});
        console.log(`Attempt ${retryCount + 1}: Found fields:`, Object.keys(fields));
        
        // If we have at least one field, try to fill
        if (Object.keys(fields).length > 0) {
            console.log('Form fields found, attempting to fill...');
            
            // Generate email if needed
            if (fields.email && currentProfile) {
                const email = await emailGenerator.generateEmail();
                currentProfile.email = email;
                console.log('Generated email:', email);
            }
            
            // Fill fields
            const results = await inputSimulator.fillFields(fields, currentProfile);
            console.log('Fill results:', results);
            
            // Count successful fills
            const successCount = Object.values(results).filter(r => r.success).length;
            const totalFields = Object.keys(fields).length;
            
            // Log detailed results (friend's logging style)
            Object.entries(results).forEach(([fieldType, result]) => {
                if (result.success) {
                    console.log(`✓ ${fieldType} filled successfully`);
                } else {
                    console.log(`✗ Failed to fill ${fieldType}`);
                }
            });
            
            console.log(`Form filling complete: ${successCount}/${totalFields} fields filled`);
            
            // Log activity
            chrome.runtime.sendMessage({
                action: 'logActivity',
                data: { 
                    action: 'autofill',
                    fieldsFilled: successCount,
                    profile: currentProfile.name,
                    url: window.location.href
                }
            });
            
            return {
                success: true,
                data: {
                    fieldsFilled: successCount,
                    totalFields: totalFields,
                    results: results
                }
            };
        }
        
        // If no fields found and we haven't exceeded max retries, wait and try again
        if (retryCount < maxRetries) {
            console.log(`No form fields found, waiting... (${retryCount + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 200));
            return await waitAndFillForm(retryCount + 1, maxRetries);
        }
        
        // Max retries exceeded
        return {
            success: false,
            error: 'No form fields found after maximum retries'
        };
        
    } catch (error) {
        console.error('Error in waitAndFillForm:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Handle get settings request
function handleGetSettings(sendResponse) {
    sendResponse({ 
        success: true, 
        data: { 
            settings, 
            currentProfile 
        } 
    });
}

// Handle auto-submit
function handleAutoSubmit() {
    if (settings.autoSubmit) {
        const submitButton = fieldDetector.findSubmitButton();
        if (submitButton) {
            console.log('Auto-submitting form...');
            submitButton.click();
        }
    }
}

// Handle get field count request
function handleGetFieldCount(sendResponse) {
    try {
        const fields = fieldDetector.findFields(currentProfile?.fieldMappings || {});
        const count = Object.keys(fields).length;
        
        sendResponse({ 
            success: true, 
            data: { count } 
        });
    } catch (error) {
        console.error('Error getting field count:', error);
        sendResponse({ 
            success: false, 
            error: error.message 
        });
    }
}

// Send message to background script
function sendMessageToBackground(message) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage(message, (response) => {
            resolve(response || { success: false, error: 'No response' });
        });
    });
}

// Show visual indicator
function showIndicator() {
    // Remove existing indicator
    const existing = document.getElementById('testdummy-indicator');
    if (existing) {
        existing.remove();
    }
    
    // Create new indicator
    const indicator = document.createElement('div');
    indicator.id = 'testdummy-indicator';
    indicator.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: #007bff;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        z-index: 10000;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        animation: testdummy-slide-in 0.3s ease;
    `;
    indicator.textContent = 'TestDummy Ready';
    document.body.appendChild(indicator);
    
    // Add CSS animation
    if (!document.getElementById('testdummy-styles')) {
        const style = document.createElement('style');
        style.id = 'testdummy-styles';
        style.textContent = `
            @keyframes testdummy-slide-in {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Hide indicator after 3 seconds
    setTimeout(() => {
        if (indicator.parentNode) {
            indicator.style.animation = 'testdummy-slide-in 0.3s ease reverse';
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.remove();
                }
            }, 300);
        }
    }, 3000);
}

// Show success indicator
function showSuccessIndicator(message = 'Form filled!') {
    const indicator = document.createElement('div');
    indicator.style.cssText = `
        position: fixed;
        top: 50px;
        right: 10px;
        background: #28a745;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        z-index: 10000;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        animation: testdummy-slide-in 0.3s ease;
    `;
    indicator.textContent = message;
    document.body.appendChild(indicator);
    
    setTimeout(() => {
        if (indicator.parentNode) {
            indicator.style.animation = 'testdummy-slide-in 0.3s ease reverse';
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.remove();
                }
            }, 300);
        }
    }, 2000);
}

// Show error indicator
function showErrorIndicator(message = 'Autofill failed') {
    const indicator = document.createElement('div');
    indicator.style.cssText = `
        position: fixed;
        top: 50px;
        right: 10px;
        background: #dc3545;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        z-index: 10000;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        animation: testdummy-slide-in 0.3s ease;
    `;
    indicator.textContent = message;
    document.body.appendChild(indicator);
    
    setTimeout(() => {
        if (indicator.parentNode) {
            indicator.style.animation = 'testdummy-slide-in 0.3s ease reverse';
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.remove();
                }
            }, 300);
        }
    }, 3000);
}

// ============================================
// SMART FILL FUNCTIONALITY
// ============================================

// Wrapper function to check URL before smart fill
async function handleSmartFillWithUrlCheck(options, sendResponse) {
    try {
        const isAllowed = await isCurrentUrlAllowed();
        if (!isAllowed) {
            sendResponse({
                success: false,
                error: 'Current URL is not whitelisted. Please add it to the whitelist in the extension popup.'
            });
            return;
        }

        await handleSmartFill(options, sendResponse);
    } catch (error) {
        console.error('Error in Smart Fill URL check:', error);
        sendResponse({ success: false, error: 'Failed to check URL whitelist' });
    }
}

// Handle smart fill request
async function handleSmartFill(options, sendResponse) {
    try {
        console.log('Starting Smart Fill process with options:', options);

        // Initialize smart fill components if not already done
        let smartFieldDetector, valueGenerator;

        if (typeof SmartFieldDetector !== 'undefined') {
            smartFieldDetector = new SmartFieldDetector();
            smartFieldDetector.setDebugMode(settings.debugMode || false);
        } else {
            console.error('SmartFieldDetector not available');
            sendResponse({ success: false, error: 'Smart Fill components not loaded' });
            return;
        }

        if (typeof ValueGenerator !== 'undefined') {
            valueGenerator = new ValueGenerator();
            valueGenerator.setDebugMode(settings.debugMode || false);
        } else {
            console.error('ValueGenerator not available');
            sendResponse({ success: false, error: 'Smart Fill components not loaded' });
            return;
        }

        // Detect all fields on the page
        const detectedFields = smartFieldDetector.detectAllFields(options);
        console.log(`Smart Fill: Detected ${detectedFields.length} fields`);

        if (detectedFields.length === 0) {
            sendResponse({
                success: false,
                error: 'No fillable form fields found on this page'
            });
            return;
        }

        // Generate a fresh profile for this fill
        valueGenerator.clearCache();
        const profile = valueGenerator.generateProfile(true);

        let fieldsFilled = 0;
        let fieldsSkipped = 0;
        const results = [];

        // Fill each detected field
        for (const field of detectedFields) {
            try {
                const { element, type, confidence, metadata, elementType } = field;

                // Skip if field already has a value and we're not overwriting
                if (!options.overwriteExisting && element.value && element.value.trim() !== '') {
                    console.log(`Smart Fill: Skipping ${type} (already has value)`);
                    fieldsSkipped++;
                    results.push({
                        type,
                        success: false,
                        reason: 'already has value',
                        skipped: true
                    });
                    continue;
                }

                let value;
                let fillSuccess = false;

                // Handle different element types
                if (elementType === 'select') {
                    value = valueGenerator.getSelectValue(element, type);
                    if (value !== null) {
                        element.value = value;
                        element.dispatchEvent(new Event('change', { bubbles: true }));
                        fillSuccess = true;
                    }
                } else if (elementType === 'checkbox') {
                    const shouldCheck = valueGenerator.shouldCheckCheckbox(element, metadata);
                    if (shouldCheck !== element.checked) {
                        element.checked = shouldCheck;
                        element.dispatchEvent(new Event('change', { bubbles: true }));
                        fillSuccess = true;
                    } else {
                        fillSuccess = true; // Already in desired state
                    }
                } else {
                    // Text input or textarea
                    value = valueGenerator.generateValue(type, metadata);

                    if (value) {
                        // Use InputSimulator if available, otherwise direct fill
                        if (typeof InputSimulator !== 'undefined' && inputSimulator) {
                            const result = await inputSimulator.simulateInput(element, value);
                            fillSuccess = result.success;
                        } else {
                            // Fallback: direct value set with events
                            element.focus();
                            element.value = value;
                            element.dispatchEvent(new Event('input', { bubbles: true }));
                            element.dispatchEvent(new Event('change', { bubbles: true }));
                            element.blur();
                            fillSuccess = true;
                        }
                    }
                }

                if (fillSuccess) {
                    fieldsFilled++;
                    console.log(`Smart Fill: ✓ Filled ${type} (${elementType}) with confidence ${confidence.toFixed(2)}`);
                    results.push({
                        type,
                        elementType,
                        confidence,
                        success: true,
                        value: elementType === 'checkbox' ? element.checked : (value || '').substring(0, 50)
                    });
                } else {
                    console.log(`Smart Fill: ✗ Failed to fill ${type}`);
                    results.push({
                        type,
                        elementType,
                        confidence,
                        success: false,
                        reason: 'fill failed'
                    });
                }

            } catch (fieldError) {
                console.error('Smart Fill: Error filling field:', fieldError);
                results.push({
                    type: field.type,
                    success: false,
                    reason: fieldError.message
                });
            }
        }

        console.log(`Smart Fill complete: ${fieldsFilled} filled, ${fieldsSkipped} skipped`);

        // Show success indicator
        if (fieldsFilled > 0) {
            showSuccessIndicator(`Smart Fill: ${fieldsFilled} fields filled`);
        } else {
            showErrorIndicator('Smart Fill: No fields were filled');
        }

        // Log activity
        chrome.runtime.sendMessage({
            action: 'logActivity',
            data: {
                action: 'smartFill',
                fieldsFilled,
                fieldsSkipped,
                totalDetected: detectedFields.length,
                url: window.location.href
            }
        });

        sendResponse({
            success: true,
            data: {
                fieldsFilled,
                fieldsSkipped,
                totalDetected: detectedFields.length,
                results
            }
        });

    } catch (error) {
        console.error('Error during Smart Fill:', error);
        showErrorIndicator('Smart Fill failed: ' + error.message);
        sendResponse({ success: false, error: error.message });
    }
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
