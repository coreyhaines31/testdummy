// Storage Manager for TestDummy Chrome Extension
// Handles all Chrome storage operations for profiles, settings, and domains

class StorageManager {
    constructor() {
        this.defaultSettings = {
            defaultProfile: null,
            emailStrategy: 'counter',
            autoSubmit: false,
            debugMode: false,
            allowedDomains: [
                'localhost',
                'localhost:*',
                '*.staging.*'
            ]
        };
        
        this.defaultProfiles = [
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
        ];
    }

    // Initialize storage with defaults
    async initialize() {
        try {
            const result = await chrome.storage.local.get(['settings', 'profiles', 'counters']);
            
            // Initialize settings if not exists
            if (!result.settings) {
                await chrome.storage.local.set({ settings: this.defaultSettings });
            }
            
            // Initialize profiles if not exists
            if (!result.profiles || result.profiles.length === 0) {
                await chrome.storage.local.set({ profiles: this.defaultProfiles });
            }
            
            // Initialize counters if not exists
            if (!result.counters) {
                await chrome.storage.local.set({ counters: {} });
            }
            
            console.log('StorageManager initialized');
        } catch (error) {
            console.error('Error initializing storage:', error);
        }
    }

    // Profile Management
    async getProfiles() {
        try {
            const result = await chrome.storage.local.get(['profiles']);
            return result.profiles || [];
        } catch (error) {
            console.error('Error getting profiles:', error);
            return [];
        }
    }

    async saveProfile(profile) {
        try {
            const profiles = await this.getProfiles();
            const existingIndex = profiles.findIndex(p => p.id === profile.id);
            
            if (existingIndex >= 0) {
                profiles[existingIndex] = profile;
            } else {
                profiles.push(profile);
            }
            
            await chrome.storage.local.set({ profiles });
            console.log('Profile saved:', profile.name);
            return true;
        } catch (error) {
            console.error('Error saving profile:', error);
            return false;
        }
    }

    async deleteProfile(profileId) {
        try {
            const profiles = await this.getProfiles();
            const filteredProfiles = profiles.filter(p => p.id !== profileId);
            await chrome.storage.local.set({ profiles: filteredProfiles });
            
            // If this was the default profile, clear it
            const settings = await this.getSettings();
            if (settings.defaultProfile === profileId) {
                settings.defaultProfile = null;
                await this.saveSettings(settings);
            }
            
            console.log('Profile deleted:', profileId);
            return true;
        } catch (error) {
            console.error('Error deleting profile:', error);
            return false;
        }
    }

    async getProfile(profileId) {
        try {
            const profiles = await this.getProfiles();
            return profiles.find(p => p.id === profileId) || null;
        } catch (error) {
            console.error('Error getting profile:', error);
            return null;
        }
    }

    async getDefaultProfile() {
        try {
            const settings = await this.getSettings();
            if (settings.defaultProfile) {
                return await this.getProfile(settings.defaultProfile);
            }
            
            // Return first profile if no default set
            const profiles = await this.getProfiles();
            return profiles[0] || null;
        } catch (error) {
            console.error('Error getting default profile:', error);
            return null;
        }
    }

    // Settings Management
    async getSettings() {
        try {
            const result = await chrome.storage.local.get(['settings']);
            return { ...this.defaultSettings, ...result.settings };
        } catch (error) {
            console.error('Error getting settings:', error);
            return this.defaultSettings;
        }
    }

    async saveSettings(settings) {
        try {
            await chrome.storage.local.set({ settings });
            console.log('Settings saved');
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    }

    async updateSetting(key, value) {
        try {
            const settings = await this.getSettings();
            settings[key] = value;
            await this.saveSettings(settings);
            return true;
        } catch (error) {
            console.error('Error updating setting:', error);
            return false;
        }
    }

    // Domain Management
    async getAllowedDomains() {
        try {
            const settings = await this.getSettings();
            return settings.allowedDomains || [];
        } catch (error) {
            console.error('Error getting allowed domains:', error);
            return [];
        }
    }

    async addDomain(domain) {
        try {
            const settings = await this.getSettings();
            if (!settings.allowedDomains.includes(domain)) {
                settings.allowedDomains.push(domain);
                await this.saveSettings(settings);
                console.log('Domain added:', domain);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error adding domain:', error);
            return false;
        }
    }

    async removeDomain(domain) {
        try {
            const settings = await this.getSettings();
            settings.allowedDomains = settings.allowedDomains.filter(d => d !== domain);
            await this.saveSettings(settings);
            console.log('Domain removed:', domain);
            return true;
        } catch (error) {
            console.error('Error removing domain:', error);
            return false;
        }
    }

    // Counter Management
    async getCounter(profileId) {
        try {
            const result = await chrome.storage.local.get(['counters']);
            return result.counters[profileId] || 0;
        } catch (error) {
            console.error('Error getting counter:', error);
            return 0;
        }
    }

    async incrementCounter(profileId) {
        try {
            const result = await chrome.storage.local.get(['counters']);
            const counters = result.counters || {};
            counters[profileId] = (counters[profileId] || 0) + 1;
            await chrome.storage.local.set({ counters });
            return counters[profileId];
        } catch (error) {
            console.error('Error incrementing counter:', error);
            return 1;
        }
    }

    // Check if current domain is allowed
    async isDomainAllowed(url) {
        try {
            const allowedDomains = await this.getAllowedDomains();
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

    // Export/Import
    async exportSettings() {
        try {
            const [settings, profiles, counters] = await Promise.all([
                this.getSettings(),
                this.getProfiles(),
                chrome.storage.local.get(['counters'])
            ]);
            
            return {
                settings,
                profiles,
                counters: counters.counters || {},
                exportDate: new Date().toISOString(),
                version: '1.0.0'
            };
        } catch (error) {
            console.error('Error exporting settings:', error);
            return null;
        }
    }

    async importSettings(data) {
        try {
            if (data.settings) {
                await chrome.storage.local.set({ settings: data.settings });
            }
            if (data.profiles) {
                await chrome.storage.local.set({ profiles: data.profiles });
            }
            if (data.counters) {
                await chrome.storage.local.set({ counters: data.counters });
            }
            
            console.log('Settings imported successfully');
            return true;
        } catch (error) {
            console.error('Error importing settings:', error);
            return false;
        }
    }

    // Reset all data
    async resetAll() {
        try {
            await chrome.storage.local.clear();
            await this.initialize();
            console.log('All settings reset');
            return true;
        } catch (error) {
            console.error('Error resetting settings:', error);
            return false;
        }
    }

    // Whitelist URL management
    async getWhitelistedUrls() {
        try {
            const result = await chrome.storage.local.get(['whitelistedUrls']);
            return result.whitelistedUrls || [];
        } catch (error) {
            console.error('Error getting whitelisted URLs:', error);
            return [];
        }
    }

    async addWhitelistedUrl(url) {
        try {
            const whitelisted = await this.getWhitelistedUrls();
            const normalizedUrl = this.normalizeUrl(url);

            if (!whitelisted.includes(normalizedUrl)) {
                whitelisted.push(normalizedUrl);
                await chrome.storage.local.set({ whitelistedUrls: whitelisted });
                console.log('URL added to whitelist:', normalizedUrl);
                return true;
            }
            return false; // Already exists
        } catch (error) {
            console.error('Error adding whitelisted URL:', error);
            return false;
        }
    }

    async removeWhitelistedUrl(url) {
        try {
            const whitelisted = await this.getWhitelistedUrls();
            const normalizedUrl = this.normalizeUrl(url);
            const index = whitelisted.indexOf(normalizedUrl);

            if (index > -1) {
                whitelisted.splice(index, 1);
                await chrome.storage.local.set({ whitelistedUrls: whitelisted });
                console.log('URL removed from whitelist:', normalizedUrl);
                return true;
            }
            return false; // Not found
        } catch (error) {
            console.error('Error removing whitelisted URL:', error);
            return false;
        }
    }

    normalizeUrl(url) {
        // Remove protocol and trailing slash
        return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    }

    async isUrlWhitelisted(currentUrl) {
        try {
            const whitelisted = await this.getWhitelistedUrls();
            const normalizedCurrentUrl = this.normalizeUrl(currentUrl);

            // Check exact matches
            if (whitelisted.includes(normalizedCurrentUrl)) {
                return true;
            }

            // Check if current URL matches any whitelisted pattern
            for (const whitelistedUrl of whitelisted) {
                if (this.urlMatches(normalizedCurrentUrl, whitelistedUrl)) {
                    return true;
                }
            }

            return false;
        } catch (error) {
            console.error('Error checking URL whitelist:', error);
            return false;
        }
    }

    urlMatches(currentUrl, pattern) {
        // Convert pattern to regex
        const regexPattern = pattern
            .replace(/\./g, '\\.')
            .replace(/\*/g, '.*');

        const regex = new RegExp(`^${regexPattern}$`, 'i');
        return regex.test(currentUrl);
    }
}

// Create global instance
window.storageManager = new StorageManager();
