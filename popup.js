// Popup script for TestDummy Chrome Extension
// Handles popup UI interactions and communication with background/content scripts

class PopupManager {
    constructor() {
        this.currentTab = null;
        this.currentProfile = null;
        this.settings = {};
        this.init();
    }

    async init() {
        try {
            console.log('Popup initializing...');
            
            // Get current tab
            await this.getCurrentTab();
            
            // Load settings and profile
            await this.loadSettings();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Update UI
            await this.updateUI();
            
            console.log('Popup initialized successfully');
        } catch (error) {
            console.error('Error initializing popup:', error);
            this.updateStatus('Error initializing', 'error');
        }
    }

    async getCurrentTab() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            this.currentTab = tab;
            console.log('Current tab:', tab?.url || 'No active tab');
        } catch (error) {
            console.error('Error getting current tab:', error);
        }
    }

    async loadSettings() {
        try {
            const response = await this.sendMessageToBackground({ action: 'getSettings' });
            if (response.success) {
                this.settings = response.data.settings || {};
                this.currentProfile = response.data.defaultProfile;
                console.log('Settings loaded:', this.settings);
                console.log('Current profile:', this.currentProfile);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    setupEventListeners() {
        try {
            // Main autofill button
            const autofillBtn = document.getElementById('autofillBtn');
            if (autofillBtn) {
                autofillBtn.addEventListener('click', () => {
                    this.triggerAutofill();
                });
            }

            // Quick action buttons
            const openOptionsBtn = document.getElementById('openOptions');
            if (openOptionsBtn) {
                openOptionsBtn.addEventListener('click', () => {
                    this.openOptions();
                });
            }

            const refreshBtn = document.getElementById('refreshPage');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => {
                    this.refreshPage();
                });
            }

            // Footer links
            const helpLink = document.getElementById('helpLink');
            if (helpLink) {
                helpLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.openHelp();
                });
            }

            const feedbackLink = document.getElementById('feedbackLink');
            if (feedbackLink) {
                feedbackLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.openFeedback();
                });
            }
        } catch (error) {
            console.error('Error setting up event listeners:', error);
        }
    }

    async updateUI() {
        try {
            // Update profile info
            this.updateProfileInfo();
            
            // Update domain status
            await this.updateDomainStatus();
            
            // Update stats
            await this.updateStats();
            
            // Update main status
            this.updateStatus('Ready', 'ready');
        } catch (error) {
            console.error('Error updating UI:', error);
        }
    }

    updateProfileInfo() {
        const profileInfo = document.getElementById('profileInfo');
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');

        if (this.currentProfile) {
            profileInfo.style.display = 'block';
            profileName.textContent = this.currentProfile.name || 'Unknown Profile';
            profileEmail.textContent = `${this.currentProfile.emailPrefix}@${this.currentProfile.emailDomain}`;
        } else {
            profileInfo.style.display = 'none';
        }
    }

    async updateDomainStatus() {
        const domainStatus = document.getElementById('domainStatus');
        
        if (!this.currentTab || !this.currentTab.url) {
            domainStatus.textContent = 'No active tab';
            domainStatus.className = 'domain-status blocked';
            return;
        }

        try {
            const isAllowed = await this.isDomainAllowed(this.currentTab.url);
            if (isAllowed) {
                domainStatus.textContent = 'Domain allowed';
                domainStatus.className = 'domain-status allowed';
            } else {
                domainStatus.textContent = 'Domain not allowed';
                domainStatus.className = 'domain-status blocked';
            }
        } catch (error) {
            domainStatus.textContent = 'Error checking domain';
            domainStatus.className = 'domain-status blocked';
        }
    }

    async updateStats() {
        const fieldsFound = document.getElementById('fieldsFound');
        const lastFill = document.getElementById('lastFill');

        try {
            // Get field count from content script
            const response = await this.sendMessageToContentScript({ action: 'getFieldCount' });
            if (response && response.success) {
                fieldsFound.textContent = response.data.count || '0';
            } else {
                fieldsFound.textContent = '-';
            }
        } catch (error) {
            fieldsFound.textContent = '-';
        }

        // Get last fill time from storage
        try {
            const result = await chrome.storage.local.get(['lastFillTime']);
            if (result.lastFillTime) {
                const lastFillTime = new Date(result.lastFillTime);
                const now = new Date();
                const diffMinutes = Math.floor((now - lastFillTime) / (1000 * 60));
                
                if (diffMinutes < 1) {
                    lastFill.textContent = 'Just now';
                } else if (diffMinutes < 60) {
                    lastFill.textContent = `${diffMinutes}m ago`;
                } else {
                    const diffHours = Math.floor(diffMinutes / 60);
                    lastFill.textContent = `${diffHours}h ago`;
                }
            } else {
                lastFill.textContent = 'Never';
            }
        } catch (error) {
            lastFill.textContent = '-';
        }
    }

    async triggerAutofill() {
        const autofillBtn = document.getElementById('autofillBtn');
        const originalText = autofillBtn.innerHTML;
        
        try {
            // Update button state
            autofillBtn.innerHTML = '<span class="btn-icon">⏳</span> Filling...';
            autofillBtn.classList.add('loading');
            autofillBtn.disabled = true;
            
            this.updateStatus('Filling form...', 'loading');

            // Send autofill request to background script
            const response = await this.sendMessageToBackground({ action: 'autofill' });
            
            if (response.success) {
                this.updateStatus(`Filled ${response.data.fieldsFilled} fields!`, 'ready');
                
                // Update last fill time
                await chrome.storage.local.set({ 
                    lastFillTime: new Date().toISOString() 
                });
                
                // Update stats
                await this.updateStats();
            } else {
                this.updateStatus(`Error: ${response.error}`, 'error');
            }
        } catch (error) {
            console.error('Error during autofill:', error);
            this.updateStatus('Autofill failed', 'error');
        } finally {
            // Reset button state
            autofillBtn.innerHTML = originalText;
            autofillBtn.classList.remove('loading');
            autofillBtn.disabled = false;
        }
    }

    async isDomainAllowed(url) {
        try {
            const response = await this.sendMessageToBackground({ 
                action: 'checkDomain', 
                data: { url } 
            });
            return response.success && response.data.allowed;
        } catch (error) {
            console.error('Error checking domain:', error);
            return false;
        }
    }

    openOptions() {
        chrome.runtime.openOptionsPage();
    }

    async refreshPage() {
        try {
            if (this.currentTab) {
                await chrome.tabs.reload(this.currentTab.id);
                window.close();
            }
        } catch (error) {
            console.error('Error refreshing page:', error);
        }
    }

    openHelp() {
        // Open help documentation
        chrome.tabs.create({ 
            url: 'https://github.com/your-repo/testdummy#help' 
        });
    }

    openFeedback() {
        // Open feedback form
        chrome.tabs.create({ 
            url: 'https://github.com/your-repo/testdummy/issues' 
        });
    }

    updateStatus(message, type = 'ready') {
        const statusDiv = document.getElementById('status');
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
    }

    async sendMessageToBackground(message) {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage(message, (response) => {
                resolve(response || { success: false, error: 'No response' });
            });
        });
    }

    async sendMessageToContentScript(message) {
        if (!this.currentTab) {
            return { success: false, error: 'No active tab' };
        }

        try {
            return await chrome.tabs.sendMessage(this.currentTab.id, message);
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.popupManager = new PopupManager();
});
