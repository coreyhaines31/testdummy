// Field Detection utilities for TestDummy Chrome Extension
// Handles heuristic detection of form fields

class FieldDetector {
    constructor() {
        this.fieldSelectors = {
            email: [
                'input[type="email"]',
                'input[name*="email" i]',
                'input[id*="email" i]',
                'input[placeholder*="email" i]',
                'input[aria-label*="email" i]',
                'input[name*="mail" i]',
                'input[id*="mail" i]'
            ],
            firstName: [
                'input[name*="first" i]',
                'input[id*="first" i]',
                'input[placeholder*="first" i]',
                'input[aria-label*="first" i]',
                'input[name*="fname" i]',
                'input[id*="fname" i]'
            ],
            lastName: [
                'input[name*="last" i]',
                'input[id*="last" i]',
                'input[placeholder*="last" i]',
                'input[aria-label*="last" i]',
                'input[name*="lname" i]',
                'input[id*="lname" i]'
            ],
            fullName: [
                'input[name*="full" i]',
                'input[id*="full" i]',
                'input[placeholder*="full" i]',
                'input[aria-label*="full" i]',
                'input[name*="name" i]',
                'input[id*="name" i]',
                'input[placeholder*="name" i]',
                'input[aria-label*="name" i]'
            ],
            password: [
                'input[type="password"]',
                'input[name*="pass" i]',
                'input[id*="pass" i]',
                'input[placeholder*="pass" i]',
                'input[aria-label*="pass" i]'
            ],
            confirmPassword: [
                'input[name*="confirm" i]',
                'input[id*="confirm" i]',
                'input[placeholder*="confirm" i]',
                'input[aria-label*="confirm" i]',
                'input[name*="repeat" i]',
                'input[id*="repeat" i]'
            ]
        };
    }

    // Find all form fields on the page
    findFields(customMappings = {}) {
        const fields = {};
        const usedElements = new Set(); // Track elements already matched
        
        // Search in priority order: email, password first (most specific), then names
        const searchOrder = ['email', 'password', 'confirmPassword', 'firstName', 'lastName', 'fullName'];
        
        for (const fieldType of searchOrder) {
            const element = this.findField(fieldType, customMappings[fieldType], usedElements);
            if (element) {
                fields[fieldType] = element;
                usedElements.add(element); // Mark as used to prevent duplicate matches
            }
        }

        return fields;
    }

    // Find a specific field type
    findField(fieldType, customSelector = null, usedElements = null) {
        // Try custom selector first
        if (customSelector) {
            const element = document.querySelector(customSelector);
            if (element && this.isValidField(element)) {
                // Check if element is already used
                if (!usedElements || !usedElements.has(element)) {
                    // For fullName fields, exclude if name/id contains email/first/last
                    if (fieldType === 'fullName' && !this.isValidFullNameField(element)) {
                        return null;
                    }
                    return element;
                }
            }
        }

        // Try default selectors
        const selectors = this.fieldSelectors[fieldType] || [];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && this.isValidField(element)) {
                // Check if element is already used
                if (!usedElements || !usedElements.has(element)) {
                    // For fullName fields, exclude if name/id contains email/first/last
                    if (fieldType === 'fullName' && !this.isValidFullNameField(element)) {
                        continue; // Skip this element, try next selector
                    }
                    return element;
                }
            }
        }

        return null;
    }

    // Validate that a field is a valid fullName field (exclude email/first/last fields)
    isValidFullNameField(element) {
        if (!element) return false;
        
        const name = (element.name || '').toLowerCase();
        const id = (element.id || '').toLowerCase();
        const placeholder = (element.placeholder || '').toLowerCase();
        const ariaLabel = (element.getAttribute('aria-label') || '').toLowerCase();
        
        // If field explicitly contains "full", it's valid
        if (name.includes('full') || id.includes('full') || 
            placeholder.includes('full') || ariaLabel.includes('full')) {
            return true;
        }
        
        // If field contains "name" but also contains email/first/last, exclude it
        const hasNameKeyword = name.includes('name') || id.includes('name') || 
                              placeholder.includes('name') || ariaLabel.includes('name');
        
        if (hasNameKeyword) {
            // Exclude if it contains email/first/last keywords
            const hasEmailKeyword = name.includes('email') || id.includes('email') || 
                                   placeholder.includes('email') || ariaLabel.includes('email') ||
                                   name.includes('mail') || id.includes('mail') ||
                                   placeholder.includes('mail') || ariaLabel.includes('mail');
            
            const hasFirstNameKeyword = name.includes('first') || id.includes('first') || 
                                       placeholder.includes('first') || ariaLabel.includes('first') ||
                                       name.includes('fname') || id.includes('fname') ||
                                       placeholder.includes('fname') || ariaLabel.includes('fname');
            
            const hasLastNameKeyword = name.includes('last') || id.includes('last') || 
                                      placeholder.includes('last') || ariaLabel.includes('last') ||
                                      name.includes('lname') || id.includes('lname') ||
                                      placeholder.includes('lname') || ariaLabel.includes('lname');
            
            // Only valid if it has "name" but NOT email/first/last
            return !hasEmailKeyword && !hasFirstNameKeyword && !hasLastNameKeyword;
        }
        
        return false;
    }

    // Validate that an element is a proper form field
    isValidField(element) {
        if (!element) return false;
        
        // Must be an input element
        if (element.tagName.toLowerCase() !== 'input') return false;
        
        // Must be visible
        if (!this.isVisible(element)) return false;
        
        // Must not be disabled
        if (element.disabled) return false;
        
        // Must not be readonly (unless it's a password field)
        if (element.readOnly && element.type !== 'password') return false;
        
        return true;
    }

    // Check if element is visible
    isVisible(element) {
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               style.opacity !== '0' &&
               element.offsetWidth > 0 && 
               element.offsetHeight > 0;
    }

    // Find all form elements on the page
    findForms() {
        return Array.from(document.querySelectorAll('form')).filter(form => 
            this.isVisible(form)
        );
    }

    // Get field information for debugging
    getFieldInfo(element) {
        if (!element) return null;
        
        return {
            tagName: element.tagName,
            type: element.type,
            name: element.name,
            id: element.id,
            placeholder: element.placeholder,
            className: element.className,
            ariaLabel: element.getAttribute('aria-label'),
            visible: this.isVisible(element),
            disabled: element.disabled,
            readonly: element.readOnly,
            value: element.value
        };
    }

    // Find fields within a specific form
    findFieldsInForm(form, customMappings = {}) {
        const fields = {};
        const usedElements = new Set(); // Track elements already matched
        
        // Search in priority order: email, password first (most specific), then names
        const searchOrder = ['email', 'password', 'confirmPassword', 'firstName', 'lastName', 'fullName'];
        
        for (const fieldType of searchOrder) {
            const customSelector = customMappings[fieldType];
            const selectors = this.fieldSelectors[fieldType] || [];
            
            // Try custom selector first
            if (customSelector) {
                const element = form.querySelector(customSelector);
                if (element && this.isValidField(element) && !usedElements.has(element)) {
                    // For fullName fields, exclude if name/id contains email/first/last
                    if (fieldType === 'fullName' && !this.isValidFullNameField(element)) {
                        continue;
                    }
                    fields[fieldType] = element;
                    usedElements.add(element);
                    continue;
                }
            }
            
            // Try default selectors
            for (const selector of selectors) {
                const element = form.querySelector(selector);
                if (element && this.isValidField(element) && !usedElements.has(element)) {
                    // For fullName fields, exclude if name/id contains email/first/last
                    if (fieldType === 'fullName' && !this.isValidFullNameField(element)) {
                        continue;
                    }
                    fields[fieldType] = element;
                    usedElements.add(element);
                    break;
                }
            }
        }
        
        return fields;
    }

    // Detect form type (signup, login, etc.)
    detectFormType() {
        const forms = this.findForms();
        if (forms.length === 0) return 'unknown';
        
        const form = forms[0]; // Use first form
        const formText = form.textContent.toLowerCase();
        const formAction = form.action ? form.action.toLowerCase() : '';
        
        // Check for signup indicators
        if (formText.includes('sign up') || 
            formText.includes('register') || 
            formText.includes('create account') ||
            formAction.includes('signup') ||
            formAction.includes('register')) {
            return 'signup';
        }
        
        // Check for login indicators
        if (formText.includes('sign in') || 
            formText.includes('log in') || 
            formText.includes('login') ||
            formAction.includes('login') ||
            formAction.includes('signin')) {
            return 'login';
        }
        
        return 'unknown';
    }

    // Get all potential form fields (for debugging)
    getAllPotentialFields() {
        const allFields = [];
        const inputs = document.querySelectorAll('input');
        
        inputs.forEach(input => {
            if (this.isVisible(input) && !input.disabled) {
                allFields.push({
                    element: input,
                    info: this.getFieldInfo(input),
                    suggestedType: this.suggestFieldType(input)
                });
            }
        });
        
        return allFields;
    }

    // Suggest field type based on element attributes
    suggestFieldType(element) {
        const name = (element.name || '').toLowerCase();
        const id = (element.id || '').toLowerCase();
        const placeholder = (element.placeholder || '').toLowerCase();
        const type = element.type.toLowerCase();
        
        // Check for email
        if (type === 'email' || 
            name.includes('email') || 
            id.includes('email') || 
            placeholder.includes('email')) {
            return 'email';
        }
        
        // Check for password
        if (type === 'password' || 
            name.includes('pass') || 
            id.includes('pass')) {
            return 'password';
        }
        
        // Check for first name
        if (name.includes('first') || 
            id.includes('first') || 
            placeholder.includes('first')) {
            return 'firstName';
        }
        
        // Check for last name
        if (name.includes('last') || 
            id.includes('last') || 
            placeholder.includes('last')) {
            return 'lastName';
        }
        
        // Check for full name
        if (name.includes('name') || 
            id.includes('name') || 
            placeholder.includes('name')) {
            return 'fullName';
        }
        
        return 'unknown';
    }

    // Find submit button
    findSubmitButton() {
        const submitSelectors = [
            'button[type="submit"]',
            'input[type="submit"]',
            'button:contains("Submit")',
            'button:contains("Sign Up")',
            'button:contains("Register")',
            'button:contains("Create Account")',
            'button:contains("Sign In")',
            'button:contains("Log In")',
            '[role="button"]:contains("Submit")',
            '[role="button"]:contains("Sign Up")'
        ];
        
        for (const selector of submitSelectors) {
            const element = document.querySelector(selector);
            if (element && this.isVisible(element) && !element.disabled) {
                return element;
            }
        }
        
        return null;
    }
}

// Utility functions
const FieldUtils = {
    // Check if two elements are the same
    isSameElement(el1, el2) {
        return el1 && el2 && el1 === el2;
    },

    // Get element selector for debugging
    getElementSelector(element) {
        if (!element) return null;
        
        if (element.id) {
            return `#${element.id}`;
        }
        
        if (element.name) {
            return `input[name="${element.name}"]`;
        }
        
        if (element.className) {
            const classes = element.className.split(' ').filter(c => c.trim());
            if (classes.length > 0) {
                return `.${classes.join('.')}`;
            }
        }
        
        return element.tagName.toLowerCase();
    },

    // Check if element is in viewport
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },

    // Scroll element into view
    scrollIntoView(element) {
        if (element && typeof element.scrollIntoView === 'function') {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FieldDetector, FieldUtils };
}
