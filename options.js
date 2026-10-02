// Options Page JavaScript for TestDummy Chrome Extension
// Handles all configuration UI interactions

class OptionsManager {
    constructor() {
        this.currentProfile = null;
        this.isEditing = false;
    }

    async init() {
        try {
            // Initialize storage manager
            if (!window.storageManager) {
                console.error('StorageManager not found');
                return;
            }
            await window.storageManager.initialize();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Load initial data
            await this.loadData();
            
            console.log('Options page initialized');
        } catch (error) {
            console.error('Error initializing options:', error);
        }
    }

    setupEventListeners() {
        try {
            // Tab switching
            const tabButtons = document.querySelectorAll('.tab-button');
            tabButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    this.switchTab(e.target.dataset.tab);
                });
            });

            // Profile management
            const addProfileBtn = document.getElementById('addProfile');
            if (addProfileBtn) {
                addProfileBtn.addEventListener('click', () => {
                    this.showProfileModal();
                });
            }

            const profileForm = document.getElementById('profileForm');
            if (profileForm) {
                profileForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.saveProfile();
                });
            }

            const cancelProfileBtn = document.getElementById('cancelProfile');
            if (cancelProfileBtn) {
                cancelProfileBtn.addEventListener('click', () => {
                    this.hideProfileModal();
                });
            }

            const closeModalBtn = document.getElementById('closeModal');
            if (closeModalBtn) {
                closeModalBtn.addEventListener('click', () => {
                    this.hideProfileModal();
                });
            }

            // Domain management
            const addDomainBtn = document.getElementById('addDomain');
            if (addDomainBtn) {
                addDomainBtn.addEventListener('click', () => {
                    this.addDomain();
                });
            }

            // Settings
            const defaultProfileSelect = document.getElementById('defaultProfile');
            if (defaultProfileSelect) {
                defaultProfileSelect.addEventListener('change', (e) => {
                    this.updateSetting('defaultProfile', e.target.value);
                });
            }

            const emailStrategySelect = document.getElementById('emailStrategy');
            if (emailStrategySelect) {
                emailStrategySelect.addEventListener('change', (e) => {
                    this.updateSetting('emailStrategy', e.target.value);
                });
            }

            const autoSubmitCheckbox = document.getElementById('autoSubmit');
            if (autoSubmitCheckbox) {
                autoSubmitCheckbox.addEventListener('change', (e) => {
                    this.updateSetting('autoSubmit', e.target.checked);
                });
            }

            const debugModeCheckbox = document.getElementById('debugMode');
            if (debugModeCheckbox) {
                debugModeCheckbox.addEventListener('change', (e) => {
                    this.updateSetting('debugMode', e.target.checked);
                });
            }

            // Footer actions
            const exportSettingsBtn = document.getElementById('exportSettings');
            if (exportSettingsBtn) {
                exportSettingsBtn.addEventListener('click', () => {
                    this.exportSettings();
                });
            }

            const importSettingsBtn = document.getElementById('importSettings');
            if (importSettingsBtn) {
                importSettingsBtn.addEventListener('click', () => {
                    this.importSettings();
                });
            }

            const resetSettingsBtn = document.getElementById('resetSettings');
            if (resetSettingsBtn) {
                resetSettingsBtn.addEventListener('click', () => {
                    this.resetSettings();
                });
            }

            // Modal backdrop click
            const profileModal = document.getElementById('profileModal');
            if (profileModal) {
                profileModal.addEventListener('click', (e) => {
                    if (e.target.id === 'profileModal') {
                        this.hideProfileModal();
                    }
                });
            }
        } catch (error) {
            console.error('Error setting up event listeners:', error);
        }
    }

    async loadData() {
        await this.loadProfiles();
        await this.loadDomains();
        await this.loadSettings();
    }

    // Tab Management
    switchTab(tabName) {
        try {
            // Update tab buttons
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });
            
            const activeTabButton = document.querySelector(`[data-tab="${tabName}"]`);
            if (activeTabButton) {
                activeTabButton.classList.add('active');
            }

            // Update tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            const activeTabContent = document.getElementById(`${tabName}-tab`);
            if (activeTabContent) {
                activeTabContent.classList.add('active');
            }
        } catch (error) {
            console.error('Error switching tab:', error);
        }
    }

    // Profile Management
    async loadProfiles() {
        try {
            const profiles = await window.storageManager.getProfiles();
            this.renderProfiles(profiles);
            this.updateDefaultProfileSelect(profiles);
        } catch (error) {
            console.error('Error loading profiles:', error);
        }
    }

    renderProfiles(profiles) {
        const container = document.getElementById('profilesList');
        
        if (profiles.length === 0) {
            container.innerHTML = '<p class="no-data">No profiles created yet. Click "Add Profile" to get started.</p>';
            return;
        }

        container.innerHTML = profiles.map(profile => `
            <div class="profile-card" data-profile-id="${profile.id}">
                <div class="profile-info">
                    <h3>${profile.name}</h3>
                    <p>${profile.firstName} ${profile.lastName} • ${profile.emailPrefix}@${profile.emailDomain}</p>
                </div>
                <div class="profile-actions">
                    <button class="btn btn-sm btn-secondary" onclick="optionsManager.editProfile('${profile.id}')">
                        Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="optionsManager.deleteProfile('${profile.id}')">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateDefaultProfileSelect(profiles) {
        const select = document.getElementById('defaultProfile');
        const currentDefault = document.getElementById('defaultProfile').value;
        
        select.innerHTML = '<option value="">Select a profile...</option>' +
            profiles.map(profile => `
                <option value="${profile.id}" ${profile.id === currentDefault ? 'selected' : ''}>
                    ${profile.name}
                </option>
            `).join('');
    }

    showProfileModal(profile = null) {
        this.currentProfile = profile;
        this.isEditing = !!profile;
        
        const modal = document.getElementById('profileModal');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('profileForm');
        
        title.textContent = this.isEditing ? 'Edit Profile' : 'Add Profile';
        
        if (this.isEditing) {
            this.populateProfileForm(profile);
        } else {
            form.reset();
        }
        
        modal.classList.add('show');
    }

    hideProfileModal() {
        const modal = document.getElementById('profileModal');
        modal.classList.remove('show');
        this.currentProfile = null;
        this.isEditing = false;
    }

    populateProfileForm(profile) {
        document.getElementById('profileName').value = profile.name || '';
        document.getElementById('firstName').value = profile.firstName || '';
        document.getElementById('lastName').value = profile.lastName || '';
        document.getElementById('emailPrefix').value = profile.emailPrefix || '';
        document.getElementById('emailDomain').value = profile.emailDomain || '';
        document.getElementById('password').value = profile.password || '';
        document.getElementById('fieldMappings').value = JSON.stringify(profile.fieldMappings || {}, null, 2);
    }

    async saveProfile() {
        try {
            const formData = new FormData(document.getElementById('profileForm'));
            const profileData = {
                id: this.isEditing ? this.currentProfile.id : this.generateId(),
                name: document.getElementById('profileName').value.trim(),
                firstName: document.getElementById('firstName').value.trim(),
                lastName: document.getElementById('lastName').value.trim(),
                emailPrefix: document.getElementById('emailPrefix').value.trim(),
                emailDomain: document.getElementById('emailDomain').value.trim(),
                password: document.getElementById('password').value.trim(),
                fieldMappings: this.parseFieldMappings(document.getElementById('fieldMappings').value)
            };

            // Validation
            if (!profileData.name || !profileData.firstName || !profileData.emailPrefix || !profileData.emailDomain) {
                alert('Please fill in all required fields');
                return;
            }

            const success = await window.storageManager.saveProfile(profileData);
            if (success) {
                this.hideProfileModal();
                await this.loadProfiles();
                this.showNotification('Profile saved successfully', 'success');
            } else {
                this.showNotification('Error saving profile', 'error');
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            this.showNotification('Error saving profile', 'error');
        }
    }

    parseFieldMappings(value) {
        try {
            return value.trim() ? JSON.parse(value) : {};
        } catch (error) {
            console.error('Error parsing field mappings:', error);
            return {};
        }
    }

    async editProfile(profileId) {
        const profile = await window.storageManager.getProfile(profileId);
        if (profile) {
            this.showProfileModal(profile);
        }
    }

    async deleteProfile(profileId) {
        if (confirm('Are you sure you want to delete this profile?')) {
            const success = await window.storageManager.deleteProfile(profileId);
            if (success) {
                await this.loadProfiles();
                this.showNotification('Profile deleted successfully', 'success');
            } else {
                this.showNotification('Error deleting profile', 'error');
            }
        }
    }

    // Domain Management
    async loadDomains() {
        try {
            const domains = await window.storageManager.getAllowedDomains();
            this.renderDomains(domains);
        } catch (error) {
            console.error('Error loading domains:', error);
        }
    }

    renderDomains(domains) {
        const container = document.getElementById('domainsList');
        
        if (domains.length === 0) {
            container.innerHTML = '<p class="no-data">No domains added yet. Add a domain to get started.</p>';
            return;
        }

        container.innerHTML = domains.map(domain => `
            <div class="domain-item">
                <span class="domain-name">${domain}</span>
                <button class="btn btn-sm btn-danger" onclick="optionsManager.removeDomain('${domain}')">
                    Remove
                </button>
            </div>
        `).join('');
    }

    async addDomain() {
        const input = document.getElementById('newDomain');
        const domain = input.value.trim();
        
        if (!domain) {
            alert('Please enter a domain');
            return;
        }

        const success = await window.storageManager.addDomain(domain);
        if (success) {
            input.value = '';
            await this.loadDomains();
            this.showNotification('Domain added successfully', 'success');
        } else {
            this.showNotification('Domain already exists or error adding domain', 'error');
        }
    }

    async removeDomain(domain) {
        if (confirm(`Remove domain "${domain}"?`)) {
            const success = await window.storageManager.removeDomain(domain);
            if (success) {
                await this.loadDomains();
                this.showNotification('Domain removed successfully', 'success');
            } else {
                this.showNotification('Error removing domain', 'error');
            }
        }
    }

    // Settings Management
    async loadSettings() {
        try {
            const settings = await window.storageManager.getSettings();
            
            document.getElementById('defaultProfile').value = settings.defaultProfile || '';
            document.getElementById('emailStrategy').value = settings.emailStrategy || 'counter';
            document.getElementById('autoSubmit').checked = settings.autoSubmit || false;
            document.getElementById('debugMode').checked = settings.debugMode || false;
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    async updateSetting(key, value) {
        try {
            const success = await window.storageManager.updateSetting(key, value);
            if (success) {
                console.log(`Setting updated: ${key} = ${value}`);
            }
        } catch (error) {
            console.error('Error updating setting:', error);
        }
    }

    // Export/Import
    async exportSettings() {
        try {
            const data = await window.storageManager.exportSettings();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `testdummy-settings-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showNotification('Settings exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting settings:', error);
            this.showNotification('Error exporting settings', 'error');
        }
    }

    importSettings() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            try {
                const file = e.target.files[0];
                if (!file) return;
                
                const text = await file.text();
                const data = JSON.parse(text);
                
                if (confirm('This will replace all current settings. Continue?')) {
                    const success = await window.storageManager.importSettings(data);
                    if (success) {
                        await this.loadData();
                        this.showNotification('Settings imported successfully', 'success');
                    } else {
                        this.showNotification('Error importing settings', 'error');
                    }
                }
            } catch (error) {
                console.error('Error importing settings:', error);
                this.showNotification('Invalid settings file', 'error');
            }
        };
        
        input.click();
    }

    async resetSettings() {
        if (confirm('This will delete ALL settings and profiles. This cannot be undone. Continue?')) {
            const success = await window.storageManager.resetAll();
            if (success) {
                await this.loadData();
                this.showNotification('All settings reset', 'success');
            } else {
                this.showNotification('Error resetting settings', 'error');
            }
        }
    }

    // Utility Functions
    generateId() {
        return 'profile_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    showNotification(message, type = 'info') {
        // Simple notification system
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        if (type === 'success') {
            notification.style.background = '#28a745';
        } else if (type === 'error') {
            notification.style.background = '#dc3545';
        } else {
            notification.style.background = '#007bff';
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (!window.optionsManager) {
        window.optionsManager = new OptionsManager();
        window.optionsManager.init();
    }
});

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .no-data {
        text-align: center;
        color: #6c757d;
        font-style: italic;
        padding: 20px;
    }
`;
document.head.appendChild(style);
