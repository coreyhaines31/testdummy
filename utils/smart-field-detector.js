// Smart Field Detector - Detects and classifies form fields for intelligent autofill
// Supports 25+ field types with confidence scoring

class SmartFieldDetector {
    // Field type patterns - keywords to look for in attributes
    static FIELD_PATTERNS = {
        // Contact Information
        email: ['email', 'e-mail', 'mail'],
        phone: ['phone', 'tel', 'mobile', 'cell', 'fax'],

        // Personal Information
        firstName: ['firstname', 'first_name', 'first-name', 'fname', 'given'],
        lastName: ['lastname', 'last_name', 'last-name', 'lname', 'surname', 'family'],
        fullName: ['fullname', 'full_name', 'full-name', 'name'],
        middleName: ['middlename', 'middle_name', 'middle-name', 'mname'],

        // Address
        address: ['address', 'street', 'addr', 'line1', 'address1'],
        address2: ['address2', 'line2', 'apt', 'suite', 'unit'],
        city: ['city', 'town', 'locality'],
        state: ['state', 'province', 'region'],
        zipCode: ['zip', 'postal', 'postcode', 'postalcode'],
        country: ['country', 'nation'],

        // Professional
        company: ['company', 'organization', 'org', 'employer', 'business'],
        jobTitle: ['title', 'job', 'position', 'role', 'occupation'],
        department: ['department', 'dept', 'division'],
        website: ['website', 'url', 'homepage', 'site'],

        // Authentication
        username: ['username', 'user_name', 'user-name', 'login', 'userid'],
        password: ['password', 'pass', 'pwd', 'secret'],
        confirmPassword: ['confirm', 'repeat', 'verify', 'retype'],

        // Dates
        birthDate: ['birth', 'dob', 'birthday', 'dateofbirth'],
        date: ['date'],
        startDate: ['start', 'begin', 'from'],
        endDate: ['end', 'finish', 'to', 'until'],

        // Numbers
        age: ['age'],
        quantity: ['quantity', 'qty', 'amount', 'count'],
        price: ['price', 'cost', 'amount', 'total'],

        // Content
        description: ['description', 'desc', 'about', 'summary', 'bio'],
        message: ['message', 'msg', 'content', 'body'],
        comment: ['comment', 'note', 'notes', 'feedback'],
        title: ['title', 'subject', 'heading'],

        // Social
        twitter: ['twitter'],
        linkedin: ['linkedin'],
        github: ['github'],
        facebook: ['facebook'],
        instagram: ['instagram'],

        // Financial (fake data only)
        creditCard: ['card', 'credit', 'cc'],
        cvv: ['cvv', 'cvc', 'security'],
        expiry: ['expiry', 'exp', 'expiration'],

        // Other
        gender: ['gender', 'sex'],
        ssn: ['ssn', 'social', 'taxid', 'tin'],
    };

    // HTML5 input types that give strong hints
    static TYPE_MAPPINGS = {
        'email': 'email',
        'tel': 'phone',
        'url': 'website',
        'date': 'date',
        'datetime-local': 'date',
        'number': 'quantity',
        'password': 'password',
    };

    constructor() {
        this.debugMode = false;
    }

    setDebugMode(enabled) {
        this.debugMode = enabled;
    }

    log(...args) {
        if (this.debugMode) {
            console.log('[SmartFieldDetector]', ...args);
        }
    }

    /**
     * Detect all fillable fields on the page
     * @param {Object} options - Detection options
     * @returns {Array} Array of { element, type, confidence, metadata }
     */
    detectAllFields(options = {}) {
        const {
            fillTextInputs = true,
            fillSelects = true,
            fillTextareas = true,
            fillCheckboxes = false,
        } = options;

        const fields = [];

        // Find text inputs
        if (fillTextInputs) {
            const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]):not([type="file"])');
            inputs.forEach(input => {
                if (this.isValidField(input)) {
                    const detection = this.detectFieldType(input);
                    if (detection.type !== 'unknown' || input.type === 'text' || !input.type) {
                        fields.push({
                            element: input,
                            ...detection,
                            elementType: 'input'
                        });
                    }
                }
            });
        }

        // Find select elements
        if (fillSelects) {
            const selects = document.querySelectorAll('select');
            selects.forEach(select => {
                if (this.isValidField(select)) {
                    const detection = this.detectFieldType(select);
                    fields.push({
                        element: select,
                        ...detection,
                        elementType: 'select'
                    });
                }
            });
        }

        // Find textareas
        if (fillTextareas) {
            const textareas = document.querySelectorAll('textarea');
            textareas.forEach(textarea => {
                if (this.isValidField(textarea)) {
                    const detection = this.detectFieldType(textarea);
                    fields.push({
                        element: textarea,
                        ...detection,
                        elementType: 'textarea'
                    });
                }
            });
        }

        // Find checkboxes
        if (fillCheckboxes) {
            const checkboxes = document.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                if (this.isValidField(checkbox)) {
                    fields.push({
                        element: checkbox,
                        type: 'checkbox',
                        confidence: 1.0,
                        metadata: this.extractMetadata(checkbox),
                        elementType: 'checkbox'
                    });
                }
            });
        }

        this.log(`Detected ${fields.length} fields`);
        return fields;
    }

    /**
     * Detect the type of a single field
     * @param {HTMLElement} element - The form field element
     * @returns {Object} { type, confidence, metadata }
     */
    detectFieldType(element) {
        const metadata = this.extractMetadata(element);

        // Check HTML5 type first (highest confidence)
        if (element.type && SmartFieldDetector.TYPE_MAPPINGS[element.type]) {
            return {
                type: SmartFieldDetector.TYPE_MAPPINGS[element.type],
                confidence: 0.95,
                metadata
            };
        }

        // Build searchable text from all relevant attributes
        const searchText = [
            metadata.name,
            metadata.id,
            metadata.placeholder,
            metadata.ariaLabel,
            metadata.labelText,
            metadata.className
        ].filter(Boolean).join(' ').toLowerCase();

        // Check each field type pattern
        let bestMatch = { type: 'unknown', confidence: 0 };

        for (const [fieldType, patterns] of Object.entries(SmartFieldDetector.FIELD_PATTERNS)) {
            for (const pattern of patterns) {
                if (searchText.includes(pattern.toLowerCase())) {
                    // Calculate confidence based on where the match was found
                    let confidence = 0.5;

                    if (metadata.name && metadata.name.toLowerCase().includes(pattern)) {
                        confidence = 0.9;
                    } else if (metadata.id && metadata.id.toLowerCase().includes(pattern)) {
                        confidence = 0.85;
                    } else if (metadata.placeholder && metadata.placeholder.toLowerCase().includes(pattern)) {
                        confidence = 0.75;
                    } else if (metadata.labelText && metadata.labelText.toLowerCase().includes(pattern)) {
                        confidence = 0.8;
                    } else if (metadata.ariaLabel && metadata.ariaLabel.toLowerCase().includes(pattern)) {
                        confidence = 0.7;
                    }

                    if (confidence > bestMatch.confidence) {
                        bestMatch = { type: fieldType, confidence };
                    }
                }
            }
        }

        // Handle special cases
        if (bestMatch.type === 'unknown') {
            // Check for password confirmation by looking at context
            if (element.type === 'password') {
                bestMatch = { type: 'password', confidence: 0.9 };
            }
            // Generic text input
            else if (element.tagName === 'INPUT' && (!element.type || element.type === 'text')) {
                bestMatch = { type: 'text', confidence: 0.3 };
            }
            // Generic textarea
            else if (element.tagName === 'TEXTAREA') {
                bestMatch = { type: 'description', confidence: 0.4 };
            }
            // Generic select
            else if (element.tagName === 'SELECT') {
                bestMatch = { type: 'select', confidence: 0.4 };
            }
        }

        return {
            ...bestMatch,
            metadata
        };
    }

    /**
     * Extract metadata from a form field
     * @param {HTMLElement} element - The form field element
     * @returns {Object} Metadata object
     */
    extractMetadata(element) {
        const metadata = {
            name: element.name || '',
            id: element.id || '',
            type: element.type || '',
            placeholder: element.placeholder || '',
            ariaLabel: element.getAttribute('aria-label') || '',
            className: element.className || '',
            maxLength: element.maxLength > 0 ? element.maxLength : null,
            pattern: element.pattern || '',
            required: element.required || false,
            labelText: this.findLabelText(element),
            currentValue: element.value || '',
        };

        return metadata;
    }

    /**
     * Find the label text associated with a form field
     * @param {HTMLElement} element - The form field element
     * @returns {string} The label text or empty string
     */
    findLabelText(element) {
        // Check for explicit label via for attribute
        if (element.id) {
            const label = document.querySelector(`label[for="${element.id}"]`);
            if (label) {
                return label.textContent.trim();
            }
        }

        // Check for wrapping label
        const parentLabel = element.closest('label');
        if (parentLabel) {
            // Get text content excluding the input's own text
            const clone = parentLabel.cloneNode(true);
            const inputs = clone.querySelectorAll('input, select, textarea');
            inputs.forEach(input => input.remove());
            return clone.textContent.trim();
        }

        // Check for adjacent label (previous sibling)
        const prevSibling = element.previousElementSibling;
        if (prevSibling && prevSibling.tagName === 'LABEL') {
            return prevSibling.textContent.trim();
        }

        // Check parent container for label-like text
        const parent = element.parentElement;
        if (parent) {
            const labelEl = parent.querySelector('label, .label, [class*="label"]');
            if (labelEl && labelEl !== element) {
                return labelEl.textContent.trim();
            }
        }

        return '';
    }

    /**
     * Check if a field is valid for filling
     * @param {HTMLElement} element - The form field element
     * @returns {boolean} True if the field can be filled
     */
    isValidField(element) {
        // Check if element is visible
        if (!this.isVisible(element)) {
            return false;
        }

        // Check if element is disabled
        if (element.disabled) {
            return false;
        }

        // Check if element is readonly (allow password fields)
        if (element.readOnly && element.type !== 'password') {
            return false;
        }

        // Check for hidden inputs
        if (element.type === 'hidden') {
            return false;
        }

        return true;
    }

    /**
     * Check if an element is visible in the viewport
     * @param {HTMLElement} element - The element to check
     * @returns {boolean} True if visible
     */
    isVisible(element) {
        const style = window.getComputedStyle(element);

        if (style.display === 'none') return false;
        if (style.visibility === 'hidden') return false;
        if (parseFloat(style.opacity) === 0) return false;

        // Check if element has any dimensions
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return false;

        return true;
    }

    /**
     * Analyze a select element's options to determine the best choice
     * @param {HTMLSelectElement} select - The select element
     * @param {string} fieldType - The detected field type
     * @returns {Object} { selectedIndex, selectedValue, reason }
     */
    analyzeSelectOptions(select, fieldType) {
        const options = Array.from(select.options);
        const validOptions = options.filter(opt =>
            opt.value &&
            !opt.disabled &&
            opt.value !== '' &&
            !opt.value.toLowerCase().includes('select') &&
            !opt.text.toLowerCase().includes('select') &&
            !opt.text.toLowerCase().includes('choose') &&
            !opt.text.toLowerCase().includes('--')
        );

        if (validOptions.length === 0) {
            return { selectedIndex: -1, selectedValue: null, reason: 'no valid options' };
        }

        // For country fields, prefer US/USA
        if (fieldType === 'country') {
            const usOption = validOptions.find(opt =>
                opt.value === 'US' ||
                opt.value === 'USA' ||
                opt.text.includes('United States') ||
                opt.text.includes('USA')
            );
            if (usOption) {
                return {
                    selectedIndex: options.indexOf(usOption),
                    selectedValue: usOption.value,
                    reason: 'US preference for country'
                };
            }
        }

        // For state fields, prefer California
        if (fieldType === 'state') {
            const caOption = validOptions.find(opt =>
                opt.value === 'CA' ||
                opt.text.includes('California')
            );
            if (caOption) {
                return {
                    selectedIndex: options.indexOf(caOption),
                    selectedValue: caOption.value,
                    reason: 'CA preference for state'
                };
            }
        }

        // Default: pick first valid option
        return {
            selectedIndex: options.indexOf(validOptions[0]),
            selectedValue: validOptions[0].value,
            reason: 'first valid option'
        };
    }
}

// Make available globally for content scripts
if (typeof window !== 'undefined') {
    window.SmartFieldDetector = SmartFieldDetector;
}
