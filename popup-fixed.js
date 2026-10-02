// TestDummy Popup Script - CSP Compliant
console.log('Popup script loaded');

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM ready');

    // Mode toggle elements
    const signupModeBtn = document.getElementById('signupModeBtn');
    const smartFillModeBtn = document.getElementById('smartFillModeBtn');
    const signupModeContent = document.getElementById('signupModeContent');
    const smartFillModeContent = document.getElementById('smartFillModeContent');

    // Current mode state
    let currentMode = 'signup';

    // Get elements
    const saveSettingsBtn = document.getElementById('saveSettings');
    const autofillBtn = document.getElementById('autofillButton');
    const status = document.getElementById('status');
    
    // Settings elements
    const firstName = document.getElementById('firstName');
    const lastName = document.getElementById('lastName');
    const emailPrefix = document.getElementById('emailPrefix');
    const emailDomain = document.getElementById('emailDomain');
    const currentCounter = document.getElementById('currentCounter');
    const autoSubmit = document.getElementById('autoSubmit');
    
    // Counter control elements
    const decrementCounter = document.getElementById('decrementCounter');
    const incrementCounter = document.getElementById('incrementCounter');
    const resetCounter = document.getElementById('resetCounter');

    // Whitelist elements
    const whitelistUrl = document.getElementById('whitelistUrl');
    const addCurrentUrl = document.getElementById('addCurrentUrl');
    const addWhitelistUrl = document.getElementById('addWhitelistUrl');
    const currentUrlDisplay = document.getElementById('currentUrlDisplay');
    const whitelistList = document.getElementById('whitelistList');

    // Smart Fill mode elements
    const fillTextInputs = document.getElementById('fillTextInputs');
    const fillSelects = document.getElementById('fillSelects');
    const fillTextareas = document.getElementById('fillTextareas');
    const fillCheckboxes = document.getElementById('fillCheckboxes');
    const overwriteExisting = document.getElementById('overwriteExisting');
    const saveSmartSettings = document.getElementById('saveSmartSettings');
    const smartFillButton = document.getElementById('smartFillButton');
    const whitelistUrlSmart = document.getElementById('whitelistUrlSmart');
    const addCurrentUrlSmart = document.getElementById('addCurrentUrlSmart');
    const addWhitelistUrlSmart = document.getElementById('addWhitelistUrlSmart');
    const currentUrlDisplaySmart = document.getElementById('currentUrlDisplaySmart');
    const whitelistListSmart = document.getElementById('whitelistListSmart');

    // Load settings on startup
    loadSettings();
    loadSmartFillSettings();
    loadCurrentUrl();
    loadWhitelistedUrls();
    loadSavedMode();

    // Mode toggle event listeners
    signupModeBtn.addEventListener('click', function() {
        switchMode('signup');
    });

    smartFillModeBtn.addEventListener('click', function() {
        switchMode('smart');
    });

    function switchMode(mode) {
        currentMode = mode;

        if (mode === 'signup') {
            signupModeBtn.classList.add('active');
            smartFillModeBtn.classList.remove('active');
            signupModeContent.style.display = 'block';
            smartFillModeContent.style.display = 'none';
        } else {
            signupModeBtn.classList.remove('active');
            smartFillModeBtn.classList.add('active');
            signupModeContent.style.display = 'none';
            smartFillModeContent.style.display = 'block';
            // Sync whitelist display
            loadWhitelistedUrls();
            loadCurrentUrl();
        }

        // Save mode preference
        chrome.storage.local.set({ fillMode: mode });
        console.log('Switched to mode:', mode);
    }

    async function loadSavedMode() {
        try {
            const result = await chrome.storage.local.get(['fillMode']);
            if (result.fillMode) {
                switchMode(result.fillMode);
            }
        } catch (error) {
            console.error('Error loading saved mode:', error);
        }
    }

    async function loadSmartFillSettings() {
        try {
            const result = await chrome.storage.local.get(['smartFillOptions']);
            const options = result.smartFillOptions || {};

            fillTextInputs.checked = options.fillTextInputs !== false; // default true
            fillSelects.checked = options.fillSelects !== false; // default true
            fillTextareas.checked = options.fillTextareas !== false; // default true
            fillCheckboxes.checked = options.fillCheckboxes === true; // default false
            overwriteExisting.checked = options.overwriteExisting === true; // default false

            console.log('Smart fill settings loaded:', options);
        } catch (error) {
            console.error('Error loading smart fill settings:', error);
        }
    }
    
    // Counter control event listeners
    decrementCounter.addEventListener('click', function() {
        const currentValue = parseInt(currentCounter.value) || 1;
        if (currentValue > 1) {
            currentCounter.value = currentValue - 1;
            updateCounterInStorage();
        }
    });
    
    incrementCounter.addEventListener('click', function() {
        const currentValue = parseInt(currentCounter.value) || 1;
        if (currentValue < 9999) {
            currentCounter.value = currentValue + 1;
            updateCounterInStorage();
        }
    });
    
    // Update counter when value changes manually
    currentCounter.addEventListener('change', function() {
        updateCounterInStorage();
    });
    
    currentCounter.addEventListener('input', function() {
        updateCounterInStorage();
    });
    
    resetCounter.addEventListener('click', function() {
        currentCounter.value = 1;
        updateCounterInStorage();
        showStatus('Counter reset to 1', 'success');
    });

    // Save settings button
    saveSettingsBtn.addEventListener('click', async function() {
        console.log('Save settings clicked');
        status.textContent = 'Saving settings...';
        status.className = 'status info';
        status.style.display = 'block';

        try {
            const settings = {
                firstName: firstName.value,
                lastName: lastName.value,
                emailPrefix: emailPrefix.value,
                emailDomain: emailDomain.value,
                autoSubmit: autoSubmit.checked
            };

            // Save to Chrome storage
            await chrome.storage.local.set({ settings });
            
            status.textContent = 'Settings saved successfully!';
            status.className = 'status success';
            
            // Hide status after 2 seconds
            setTimeout(() => {
                status.style.display = 'none';
            }, 2000);

        } catch (error) {
            console.error('Error saving settings:', error);
            status.textContent = 'Error saving settings: ' + error.message;
            status.className = 'status error';
        }
    });
    
    // Autofill button
    autofillBtn.addEventListener('click', async function() {
        console.log('Autofill button clicked');
        status.textContent = 'Starting autofill...';
        status.className = 'status info';
        status.style.display = 'block';
        
        try {
            // First test Chrome API
            const pingResponse = await new Promise((resolve) => {
                chrome.runtime.sendMessage({action: 'ping'}, resolve);
            });
            
            console.log('Chrome API response:', pingResponse);
            if (!pingResponse || !pingResponse.success) {
                status.textContent = 'Chrome API failed';
                status.className = 'status error';
                return;
            }
            
            status.textContent = 'Chrome API works! Starting autofill...';
            
            // Get current tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            console.log('Current tab:', tab);
            
            if (!tab) {
                status.textContent = 'No active tab found';
                status.className = 'status error';
                return;
            }
            
            // Now test actual autofill
            const autofillResponse = await new Promise((resolve) => {
                chrome.runtime.sendMessage({action: 'autofill'}, resolve);
            });
            
            console.log('Autofill response:', autofillResponse);
                if (autofillResponse && autofillResponse.success) {
                    status.textContent = `Success! Filled ${autofillResponse.data.fieldsFilled} fields`;
                    status.className = 'status success';
                    
                    // Refresh counter display to show updated value
                    await refreshCounterDisplay();
                } else {
                    status.textContent = `Autofill failed: ${autofillResponse?.error || 'Unknown error'}`;
                    status.className = 'status error';
                }
        } catch (error) {
            console.error('Chrome API error:', error);
            status.textContent = 'Chrome API error: ' + error.message;
            status.className = 'status error';
        }
    });
    
    // Load settings from storage
    async function loadSettings() {
        try {
            const result = await chrome.storage.local.get(['settings', 'counters']);
            const settings = result.settings || {};
            const counters = result.counters || {};
            
            // Set default values if not present
            firstName.value = settings.firstName || 'Test';
            lastName.value = settings.lastName || 'User';
            emailPrefix.value = settings.emailPrefix || 'test';
            emailDomain.value = settings.emailDomain || 'example.com';
            
            // Load current counter from storage, default to 1
            const currentCounterValue = counters['default'] || 1;
            currentCounter.value = currentCounterValue;
            
            autoSubmit.checked = settings.autoSubmit || false;
            
            console.log('Settings loaded:', settings);
            console.log('Current counter loaded:', currentCounterValue);
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }
    
    // Update counter in storage
    async function updateCounterInStorage() {
        try {
            const newCounter = parseInt(currentCounter.value) || 1;
            const result = await chrome.storage.local.get(['counters']);
            const counters = result.counters || {};
            counters['default'] = newCounter;
            await chrome.storage.local.set({ counters });
            
            console.log('Popup: Counter updated to:', newCounter);
            console.log('Popup: Storage updated with counters:', counters);
            
            // Verify the update
            const verifyResult = await chrome.storage.local.get(['counters']);
            console.log('Popup: Verification - storage now contains:', verifyResult.counters);
        } catch (error) {
            console.error('Error updating counter:', error);
        }
    }
    
    // Show status message
    function showStatus(message, type = 'info') {
        status.textContent = message;
        status.className = `status ${type}`;
        status.style.display = 'block';
        
        // Hide status after 2 seconds
        setTimeout(() => {
            status.style.display = 'none';
        }, 2000);
    }
    
    // Refresh counter display from storage
    async function refreshCounterDisplay() {
        try {
            const result = await chrome.storage.local.get(['counters']);
            const counters = result.counters || {};
            const currentCounterValue = counters['default'] || 1;

            console.log('Refreshing counter display to:', currentCounterValue);
            currentCounter.value = currentCounterValue;
        } catch (error) {
            console.error('Error refreshing counter display:', error);
        }
    }

    // URL Whitelist functionality
    async function loadCurrentUrl() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.url) {
                const normalizedUrl = normalizeUrl(tab.url);
                // Update both panels
                currentUrlDisplay.textContent = `Current page: ${normalizedUrl}`;
                currentUrlDisplaySmart.textContent = `Current page: ${normalizedUrl}`;

                // Pre-fill the whitelist input with current URL
                whitelistUrl.value = normalizedUrl;
                whitelistUrlSmart.value = normalizedUrl;
            }
        } catch (error) {
            console.error('Error getting current URL:', error);
            currentUrlDisplay.textContent = 'Could not detect current URL';
            currentUrlDisplaySmart.textContent = 'Could not detect current URL';
        }
    }

    async function loadWhitelistedUrls() {
        try {
            const result = await chrome.storage.local.get(['whitelistedUrls']);
            const whitelisted = result.whitelistedUrls || [];
            displayWhitelistedUrls(whitelisted);
        } catch (error) {
            console.error('Error loading whitelisted URLs:', error);
        }
    }

    function displayWhitelistedUrls(urls) {
        // Update both panels
        [whitelistList, whitelistListSmart].forEach(listEl => {
            if (!listEl) return;
            listEl.innerHTML = '';

            if (urls.length === 0) {
                listEl.innerHTML = '<div style="font-size: 10px; color: #9ca3af; text-align: center; padding: 2px 8px; margin: 0;">No whitelisted URLs</div>';
                return;
            }

            urls.forEach(url => {
                const item = document.createElement('div');
                item.className = 'whitelist-item';

                item.innerHTML = `
                    <span class="whitelist-url">${url}</span>
                    <button class="whitelist-remove-btn" data-url="${url}">Remove</button>
                `;

                // Add remove functionality
                const removeBtn = item.querySelector('.whitelist-remove-btn');
                removeBtn.addEventListener('click', () => removeWhitelistedUrl(url));

                listEl.appendChild(item);
            });
        });
    }

    async function addUrlToWhitelist(url) {
        try {
            if (!url.trim()) {
                showStatus('Please enter a valid URL', 'error');
                return;
            }

            const normalizedUrl = normalizeUrl(url.trim());
            const result = await chrome.storage.local.get(['whitelistedUrls']);
            const whitelisted = result.whitelistedUrls || [];

            if (whitelisted.includes(normalizedUrl)) {
                showStatus('URL already whitelisted', 'error');
                return;
            }

            whitelisted.push(normalizedUrl);
            await chrome.storage.local.set({ whitelistedUrls: whitelisted });

            displayWhitelistedUrls(whitelisted);
            whitelistUrl.value = '';
            showStatus('URL added to whitelist', 'success');
        } catch (error) {
            console.error('Error adding URL to whitelist:', error);
            showStatus('Error adding URL to whitelist', 'error');
        }
    }

    async function removeWhitelistedUrl(url) {
        try {
            const result = await chrome.storage.local.get(['whitelistedUrls']);
            const whitelisted = result.whitelistedUrls || [];
            const index = whitelisted.indexOf(url);

            if (index > -1) {
                whitelisted.splice(index, 1);
                await chrome.storage.local.set({ whitelistedUrls: whitelisted });
                displayWhitelistedUrls(whitelisted);
                showStatus('URL removed from whitelist', 'success');
            }
        } catch (error) {
            console.error('Error removing URL from whitelist:', error);
            showStatus('Error removing URL from whitelist', 'error');
        }
    }

    function normalizeUrl(url) {
        // Remove protocol and trailing slash
        return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    }

    // Whitelist event listeners
    addWhitelistUrl.addEventListener('click', () => {
        addUrlToWhitelist(whitelistUrl.value);
    });

    addCurrentUrl.addEventListener('click', async () => {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.url) {
                await addUrlToWhitelist(tab.url);
            }
        } catch (error) {
            console.error('Error adding current URL:', error);
            showStatus('Error adding current URL', 'error');
        }
    });

    whitelistUrl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addUrlToWhitelist(whitelistUrl.value);
        }
    });

    // Smart Fill mode event listeners
    saveSmartSettings.addEventListener('click', async function() {
        console.log('Save smart settings clicked');
        status.textContent = 'Saving settings...';
        status.className = 'status info';
        status.style.display = 'block';

        try {
            const smartFillOptions = {
                fillTextInputs: fillTextInputs.checked,
                fillSelects: fillSelects.checked,
                fillTextareas: fillTextareas.checked,
                fillCheckboxes: fillCheckboxes.checked,
                overwriteExisting: overwriteExisting.checked
            };

            await chrome.storage.local.set({ smartFillOptions });

            status.textContent = 'Smart Fill settings saved!';
            status.className = 'status success';

            setTimeout(() => {
                status.style.display = 'none';
            }, 2000);
        } catch (error) {
            console.error('Error saving smart fill settings:', error);
            status.textContent = 'Error saving settings: ' + error.message;
            status.className = 'status error';
        }
    });

    smartFillButton.addEventListener('click', async function() {
        console.log('Smart Fill button clicked');
        status.textContent = 'Starting Smart Fill...';
        status.className = 'status info';
        status.style.display = 'block';

        try {
            // Get smart fill options
            const smartFillOptions = {
                fillTextInputs: fillTextInputs.checked,
                fillSelects: fillSelects.checked,
                fillTextareas: fillTextareas.checked,
                fillCheckboxes: fillCheckboxes.checked,
                overwriteExisting: overwriteExisting.checked
            };

            // Send smart fill message
            const response = await new Promise((resolve) => {
                chrome.runtime.sendMessage({
                    action: 'smartFill',
                    options: smartFillOptions
                }, resolve);
            });

            console.log('Smart Fill response:', response);

            if (response && response.success) {
                const data = response.data || {};
                status.textContent = `Success! Filled ${data.fieldsFilled || 0} fields`;
                status.className = 'status success';
            } else {
                status.textContent = `Smart Fill failed: ${response?.error || 'Unknown error'}`;
                status.className = 'status error';
            }
        } catch (error) {
            console.error('Smart Fill error:', error);
            status.textContent = 'Smart Fill error: ' + error.message;
            status.className = 'status error';
        }
    });

    // Smart Fill mode whitelist event listeners
    addWhitelistUrlSmart.addEventListener('click', () => {
        addUrlToWhitelist(whitelistUrlSmart.value);
        whitelistUrlSmart.value = '';
    });

    addCurrentUrlSmart.addEventListener('click', async () => {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.url) {
                await addUrlToWhitelist(tab.url);
            }
        } catch (error) {
            console.error('Error adding current URL:', error);
            showStatus('Error adding current URL', 'error');
        }
    });

    whitelistUrlSmart.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addUrlToWhitelist(whitelistUrlSmart.value);
            whitelistUrlSmart.value = '';
        }
    });

    console.log('Event listeners attached');
});
