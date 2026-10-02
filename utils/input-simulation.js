// Input Simulation utilities for TestDummy Chrome Extension
// Handles realistic input event simulation for React/Vue compatibility

class InputSimulator {
    constructor() {
        this.debugMode = false;
    }

    // Set debug mode
    setDebugMode(enabled) {
        this.debugMode = enabled;
    }

    // Simulate realistic input for a field
    async simulateInput(element, value, options = {}) {
        if (!element || !this.isValidInput(element)) {
            this.log('Invalid input element', element);
            return false;
        }

        try {
            this.log(`Simulating input for ${this.getElementInfo(element)} with value: "${value}"`);

            // Focus the element first
            await this.focusElement(element);

            // Clear existing value
            await this.clearValue(element);

            // Set the value using the most compatible method
            const success = await this.setValue(element, value);

            if (success) {
                // Dispatch events to trigger React/Vue listeners
                this.dispatchEvents(element, value);
                
                // Wait a bit for any async handlers
                await this.delay(50);
                
                this.log(`Successfully filled ${this.getElementInfo(element)}`);
                return true;
            }

            return false;
        } catch (error) {
            this.log(`Error simulating input: ${error.message}`, error);
            return false;
        }
    }

    // Focus an element
    async focusElement(element) {
        try {
            element.focus();
            
            // Wait for focus to take effect
            await this.delay(10);
            
            // Scroll into view if needed
            if (!this.isInViewport(element)) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await this.delay(100);
            }
            
            return true;
        } catch (error) {
            this.log(`Error focusing element: ${error.message}`);
            return false;
        }
    }

    // Clear existing value
    async clearValue(element) {
        try {
            // Select all text
            element.select();
            
            // Try to clear with backspace
            this.dispatchKeyEvent(element, 'keydown', { key: 'Backspace', keyCode: 8 });
            this.dispatchKeyEvent(element, 'keyup', { key: 'Backspace', keyCode: 8 });
            
            // Clear value directly
            element.value = '';
            
            // Dispatch input event for cleared value
            this.dispatchEvent(element, 'input', { inputType: 'deleteContentBackward' });
            
            await this.delay(10);
            return true;
        } catch (error) {
            this.log(`Error clearing value: ${error.message}`);
            return false;
        }
    }

    // Set value using the most compatible method
    async setValue(element, value) {
        // Try multiple methods in order of preference
        const methods = [
            () => this.setValueWithExecCommand(element, value),
            () => this.setValueWithInput(element, value),
            () => this.setValueWithTyping(element, value),
            () => this.setValueDirect(element, value)
        ];

        for (const method of methods) {
            try {
                const success = await method();
                if (success) {
                    return true;
                }
            } catch (error) {
                this.log(`Method failed: ${error.message}`);
            }
        }

        return false;
    }

    // Method 1: Use execCommand (most compatible) - improved with friend's approach
    async setValueWithExecCommand(element, value) {
        try {
            element.focus();
            element.select();
            
            const success = document.execCommand('insertText', false, value);
            
            // Check if the value was actually set (friend's validation approach)
            if (element.value !== value) {
                this.log('execCommand didn\'t set value, using fallback');
                element.value = value;
                
                // Dispatch input event for React/Vue compatibility
                const event = new Event('input', {
                    bubbles: true,
                    cancelable: true
                });
                element.dispatchEvent(event);
            }
            
            // Blur to complete the interaction (friend's approach)
            element.blur();
            
            this.log('Used execCommand method with validation');
            return true;
        } catch (error) {
            this.log(`execCommand failed: ${error.message}`);
        }
        return false;
    }

    // Method 2: Use input event simulation
    async setValueWithInput(element, value) {
        try {
            element.value = value;
            this.dispatchEvent(element, 'input', { 
                inputType: 'insertText',
                data: value 
            });
            this.log('Used input event method');
            return true;
        } catch (error) {
            this.log(`Input event method failed: ${error.message}`);
        }
        return false;
    }

    // Method 3: Simulate typing
    async setValueWithTyping(element, value) {
        try {
            element.focus();
            element.select();
            
            for (let i = 0; i < value.length; i++) {
                const char = value[i];
                
                // Dispatch keydown
                this.dispatchKeyEvent(element, 'keydown', {
                    key: char,
                    keyCode: char.charCodeAt(0),
                    which: char.charCodeAt(0)
                });
                
                // Update value
                element.value = value.substring(0, i + 1);
                
                // Dispatch input event
                this.dispatchEvent(element, 'input', {
                    inputType: 'insertText',
                    data: char
                });
                
                // Dispatch keyup
                this.dispatchKeyEvent(element, 'keyup', {
                    key: char,
                    keyCode: char.charCodeAt(0),
                    which: char.charCodeAt(0)
                });
                
                // Small delay between characters
                await this.delay(10);
            }
            
            this.log('Used typing simulation method');
            return true;
        } catch (error) {
            this.log(`Typing simulation failed: ${error.message}`);
        }
        return false;
    }

    // Method 4: Direct value setting (fallback)
    async setValueDirect(element, value) {
        try {
            element.value = value;
            this.log('Used direct value setting method');
            return true;
        } catch (error) {
            this.log(`Direct value setting failed: ${error.message}`);
        }
        return false;
    }

    // Dispatch all necessary events
    dispatchEvents(element, value) {
        const events = [
            'focus',
            'input',
            'change',
            'blur'
        ];

        events.forEach(eventType => {
            this.dispatchEvent(element, eventType, {
                bubbles: true,
                cancelable: true
            });
        });
    }

    // Dispatch a single event
    dispatchEvent(element, eventType, eventData = {}) {
        try {
            const event = new Event(eventType, {
                bubbles: true,
                cancelable: true,
                ...eventData
            });
            
            element.dispatchEvent(event);
        } catch (error) {
            this.log(`Error dispatching ${eventType} event: ${error.message}`);
        }
    }

    // Dispatch keyboard event
    dispatchKeyEvent(element, eventType, keyData) {
        try {
            const event = new KeyboardEvent(eventType, {
                bubbles: true,
                cancelable: true,
                key: keyData.key,
                keyCode: keyData.keyCode,
                which: keyData.which,
                charCode: keyData.charCode || 0
            });
            
            element.dispatchEvent(event);
        } catch (error) {
            this.log(`Error dispatching ${eventType} key event: ${error.message}`);
        }
    }

    // Fill multiple fields
    async fillFields(fields, profile) {
        const results = {};
        
        for (const [fieldType, element] of Object.entries(fields)) {
            if (!element) continue;
            
            const value = this.getValueForField(fieldType, profile);
            if (value) {
                const success = await this.simulateInput(element, value);
                results[fieldType] = { success, value, element };
            }
        }
        
        return results;
    }

    // Get value for a specific field type
    getValueForField(fieldType, profile) {
        switch (fieldType) {
            case 'email':
                return profile.email || '';
            case 'firstName':
                return profile.firstName || '';
            case 'lastName':
                return profile.lastName || '';
            case 'fullName':
                return `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
            case 'password':
                return profile.password || '';
            case 'confirmPassword':
                return profile.password || '';
            default:
                return '';
        }
    }

    // Validate input element
    isValidInput(element) {
        if (!element) return false;
        if (!['input', 'textarea'].includes(element.tagName.toLowerCase())) return false;
        if (element.disabled) return false;
        if (element.readOnly && element.type !== 'password') return false;
        return true;
    }

    // Check if element is in viewport
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    // Get element info for debugging
    getElementInfo(element) {
        if (!element) return 'null';
        
        const info = [];
        if (element.id) info.push(`id="${element.id}"`);
        if (element.name) info.push(`name="${element.name}"`);
        if (element.type) info.push(`type="${element.type}"`);
        if (element.className) info.push(`class="${element.className}"`);
        
        return `<${element.tagName.toLowerCase()} ${info.join(' ')}>`;
    }

    // Utility delay function
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Logging utility
    log(message, data = null) {
        if (this.debugMode) {
            console.log(`[InputSimulator] ${message}`, data || '');
        }
    }
}

// Utility functions
const InputUtils = {
    // Check if element supports input simulation
    canSimulateInput(element) {
        if (!element) return false;
        if (element.tagName.toLowerCase() !== 'input') return false;
        if (element.disabled) return false;
        return true;
    },

    // Get input type compatibility
    getInputCompatibility(element) {
        const type = element.type.toLowerCase();
        const compatibilities = {
            'text': 'high',
            'email': 'high',
            'password': 'high',
            'tel': 'medium',
            'url': 'medium',
            'search': 'medium',
            'number': 'low',
            'date': 'low',
            'time': 'low',
            'datetime-local': 'low'
        };
        
        return compatibilities[type] || 'unknown';
    },

    // Check if element is a form field
    isFormField(element) {
        if (!element) return false;
        
        const tagName = element.tagName.toLowerCase();
        return ['input', 'textarea', 'select'].includes(tagName);
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { InputSimulator, InputUtils };
}
