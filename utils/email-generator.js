// Email Generator for TestDummy Chrome Extension
// Handles generation of unique test emails with different strategies

class EmailGenerator {
    constructor(profile) {
        this.profile = profile;
    }

    // Generate email with counter (e.g., test+1@example.com)
    async generateEmail() {
        try {
            const counter = await this.getNextCounter();
            return `${this.profile.emailPrefix}+${counter}@${this.profile.emailDomain}`;
        } catch (error) {
            console.error('Error generating email:', error);
            return this.generateDefaultEmail();
        }
    }

    // Generate default email (fallback)
    generateDefaultEmail() {
        return `${this.profile.emailPrefix}+test@${this.profile.emailDomain}`;
    }

    // Get next counter for profile
    async getNextCounter() {
        try {
            // Always read fresh from storage to get the latest value
            const result = await chrome.storage.local.get(['counters']);
            const counters = result.counters || {};
            // Use 'default' key to match what the popup is using
            const currentCounter = counters['default'] || counters[this.profile.id] || 1;
            
            console.log('EmailGenerator: Reading counter from storage:', currentCounter);
            
            // Use the current counter value for the email
            const emailCounter = currentCounter;

            // Increment for next time
            const nextCounter = currentCounter + 1;

            console.log('EmailGenerator: Current counter:', currentCounter, 'Email counter:', emailCounter, 'Next counter:', nextCounter);

            // Update counter for next time (use 'default' key to match popup)
            counters['default'] = nextCounter;
            await chrome.storage.local.set({ counters });

            console.log(`EmailGenerator: Using counter: ${emailCounter}, next will be: ${nextCounter}`);
            return emailCounter;
        } catch (error) {
            console.error('EmailGenerator: Error getting counter from Chrome storage, trying localStorage:', error);
            
            // Fallback to localStorage (friend's approach)
            try {
                const storageKey = `testdummy_email_version_${this.profile.id}`;
                let currentVersion = localStorage.getItem(storageKey);
                
                if (currentVersion === null) {
                    currentVersion = 1;
                } else {
                    currentVersion = parseInt(currentVersion) + 1;
                }
                
                localStorage.setItem(storageKey, currentVersion.toString());
                return currentVersion;
            } catch (localStorageError) {
                console.error('EmailGenerator: Error with localStorage fallback:', localStorageError);
                return 1;
            }
        }
    }

    // Reset counter for profile
    async resetCounter() {
        try {
            const result = await chrome.storage.local.get(['counters']);
            const counters = result.counters || {};
            counters['default'] = 1;  // Use 'default' key to match popup
            await chrome.storage.local.set({ counters });
            console.log('Counter reset for profile:', this.profile.name);
            return true;
        } catch (error) {
            console.error('Error resetting counter:', error);
            return false;
        }
    }

    // Get current counter value
    async getCurrentCounter() {
        try {
            const result = await chrome.storage.local.get(['counters']);
            const counters = result.counters || {};
            return counters['default'] || 1;  // Use 'default' key to match popup
        } catch (error) {
            console.error('Error getting current counter:', error);
            return 1;
        }
    }

    // Validate email format
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Parse email components
    static parseEmail(email) {
        const [localPart, domain] = email.split('@');
        const [prefix, suffix] = localPart.split('+');
        
        return {
            prefix: prefix || '',
            suffix: suffix || '',
            domain: domain || '',
            full: email
        };
    }

    // Generate preview of next few emails
    async generatePreview(count = 5) {
        const preview = [];
        const currentCounter = await this.getCurrentCounter();
        
        for (let i = 1; i <= count; i++) {
            const counter = currentCounter + i;
            const email = `${this.profile.emailPrefix}+${counter}@${this.profile.emailDomain}`;
            preview.push({
                counter,
                email
            });
        }
        
        return preview;
    }

    // Get email statistics
    async getEmailStats() {
        try {
            const currentCounter = await this.getCurrentCounter();
            const result = await chrome.storage.local.get(['emailHistory']);
            const history = result.emailHistory || [];
            const profileHistory = history.filter(entry => entry.profileId === this.profile.id);
            
            return {
                currentCounter,
                totalGenerated: currentCounter,
                lastGenerated: profileHistory[profileHistory.length - 1] || null,
                profile: this.profile.name
            };
        } catch (error) {
            console.error('Error getting email stats:', error);
            return {
                currentCounter: 1,
                totalGenerated: 1,
                lastGenerated: null,
                profile: this.profile.name
            };
        }
    }

    // Log email generation for analytics
    async logEmailGeneration(email) {
        try {
            const result = await chrome.storage.local.get(['emailHistory']);
            const history = result.emailHistory || [];
            
            const logEntry = {
                email,
                profileId: this.profile.id,
                profileName: this.profile.name,
                timestamp: new Date().toISOString(),
                url: window.location.href
            };
            
            history.push(logEntry);
            
            // Keep only last 100 entries
            if (history.length > 100) {
                history.splice(0, history.length - 100);
            }
            
            await chrome.storage.local.set({ emailHistory: history });
        } catch (error) {
            console.error('Error logging email generation:', error);
        }
    }
}

// Utility functions for email generation
const EmailUtils = {
    // Generate random test email
    generateRandomEmail() {
        const prefixes = ['test', 'dev', 'demo', 'user', 'admin'];
        const domains = ['example.com', 'test.com', 'demo.org'];
        
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const domain = domains[Math.floor(Math.random() * domains.length)];
        const random = Math.floor(Math.random() * 10000);
        
        return `${prefix}${random}@${domain}`;
    },

    // Check if email is a test email
    isTestEmail(email) {
        const testPatterns = [
            /\+.*@/,  // Contains + (plus addressing)
            /test.*@/i,  // Starts with test
            /dev.*@/i,   // Starts with dev
            /demo.*@/i,  // Starts with demo
            /@example\./i,  // Example domain
            /@test\./i,     // Test domain
            /@demo\./i      // Demo domain
        ];
        
        return testPatterns.some(pattern => pattern.test(email));
    },

    // Extract domain from email
    extractDomain(email) {
        const parts = email.split('@');
        return parts.length > 1 ? parts[1] : null;
    },

    // Generate email variations for testing
    generateVariations(baseEmail, count = 3) {
        const [localPart, domain] = baseEmail.split('@');
        const variations = [];
        
        for (let i = 1; i <= count; i++) {
            variations.push(`${localPart}+${i}@${domain}`);
        }
        
        return variations;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EmailGenerator, EmailUtils };
}
