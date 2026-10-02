// Value Generator - Generates contextually appropriate mock data for form fields

class ValueGenerator {
    // Mock data libraries
    static DATA = {
        firstNames: ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery', 'Parker', 'Dakota'],
        lastNames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson'],
        companies: ['Acme Corp', 'TechStart Inc', 'Global Solutions', 'Innovation Labs', 'Digital Dynamics', 'Cloud Systems', 'DataFlow Inc', 'NextGen Tech'],
        jobTitles: ['Software Engineer', 'Product Manager', 'Designer', 'Data Analyst', 'Marketing Manager', 'Sales Representative', 'Operations Lead', 'Customer Success Manager'],
        departments: ['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'Operations', 'Finance', 'Human Resources'],
        cities: ['San Francisco', 'New York', 'Austin', 'Seattle', 'Chicago', 'Boston', 'Denver', 'Portland', 'Los Angeles', 'Miami'],
        states: ['CA', 'NY', 'TX', 'WA', 'IL', 'MA', 'CO', 'OR', 'FL', 'GA'],
        statesFull: ['California', 'New York', 'Texas', 'Washington', 'Illinois', 'Massachusetts', 'Colorado', 'Oregon', 'Florida', 'Georgia'],
        streets: ['Main St', 'Oak Ave', 'Park Blvd', 'First St', 'Elm Dr', 'Cedar Ln', 'Maple Way', 'Pine Rd', 'Lake Dr', 'Hill St'],
        zipCodes: ['94102', '10001', '78701', '98101', '60601', '02101', '80202', '97201', '33101', '30301'],
        countries: ['United States', 'US', 'USA'],

        // Lorem ipsum segments for text generation
        loremWords: ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua'],

        // Descriptive sentences for bios/descriptions
        descriptions: [
            'Passionate about building great products and solving complex problems.',
            'Experienced professional with a track record of delivering results.',
            'Dedicated team player focused on innovation and continuous improvement.',
            'Enthusiastic learner always seeking new challenges and opportunities.',
            'Detail-oriented individual committed to excellence in every project.'
        ],

        messages: [
            'Thank you for your time and consideration.',
            'Looking forward to hearing from you soon.',
            'Please let me know if you have any questions.',
            'I appreciate your help with this matter.',
            'Feel free to reach out if you need more information.'
        ],

        genders: ['Male', 'Female', 'Non-binary', 'Prefer not to say'],
    };

    constructor() {
        this.debugMode = false;
        // Cache for consistent identity within a session
        this.cachedProfile = null;
    }

    setDebugMode(enabled) {
        this.debugMode = enabled;
    }

    log(...args) {
        if (this.debugMode) {
            console.log('[ValueGenerator]', ...args);
        }
    }

    /**
     * Pick a random item from an array
     */
    randomFrom(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    /**
     * Generate a random number between min and max (inclusive)
     */
    randomBetween(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Generate a consistent profile for form filling
     * @param {boolean} fresh - Force regeneration of profile
     * @returns {Object} Profile with all field values
     */
    generateProfile(fresh = false) {
        if (this.cachedProfile && !fresh) {
            return this.cachedProfile;
        }

        const firstName = this.randomFrom(ValueGenerator.DATA.firstNames);
        const lastName = this.randomFrom(ValueGenerator.DATA.lastNames);
        const company = this.randomFrom(ValueGenerator.DATA.companies);
        const city = this.randomFrom(ValueGenerator.DATA.cities);
        const stateIndex = ValueGenerator.DATA.cities.indexOf(city);
        const state = ValueGenerator.DATA.states[stateIndex] || 'CA';
        const stateFull = ValueGenerator.DATA.statesFull[stateIndex] || 'California';
        const zipCode = ValueGenerator.DATA.zipCodes[stateIndex] || '94102';
        const streetNumber = this.randomBetween(100, 9999);
        const street = this.randomFrom(ValueGenerator.DATA.streets);

        const profile = {
            firstName,
            lastName,
            fullName: `${firstName} ${lastName}`,
            middleName: this.randomFrom(ValueGenerator.DATA.firstNames),
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}+test${Date.now()}@example.com`,
            phone: this.generatePhone(),
            company,
            jobTitle: this.randomFrom(ValueGenerator.DATA.jobTitles),
            department: this.randomFrom(ValueGenerator.DATA.departments),
            website: `https://www.${company.toLowerCase().replace(/\s+/g, '')}.com`,
            address: `${streetNumber} ${street}`,
            address2: `Suite ${this.randomBetween(100, 999)}`,
            city,
            state,
            stateFull,
            zipCode,
            country: 'United States',
            username: `${firstName.toLowerCase()}${lastName.toLowerCase()}${this.randomBetween(100, 999)}`,
            password: 'TestPass123!',
            birthDate: this.generateBirthDate(),
            age: this.randomBetween(25, 55),
            gender: this.randomFrom(ValueGenerator.DATA.genders),
            description: this.randomFrom(ValueGenerator.DATA.descriptions),
            message: this.randomFrom(ValueGenerator.DATA.messages),
            comment: this.randomFrom(ValueGenerator.DATA.messages),
            title: `${firstName}'s ${this.randomFrom(['Project', 'Request', 'Inquiry', 'Application'])}`,

            // Social (fake handles)
            twitter: `@${firstName.toLowerCase()}${lastName.toLowerCase()}`,
            linkedin: `linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
            github: `github.com/${firstName.toLowerCase()}${lastName.toLowerCase()}`,
            facebook: `facebook.com/${firstName.toLowerCase()}.${lastName.toLowerCase()}`,
            instagram: `@${firstName.toLowerCase()}_${lastName.toLowerCase()}`,

            // Financial (fake, for testing only)
            creditCard: '4111111111111111', // Standard test card number
            cvv: '123',
            expiry: '12/28',

            // SSN placeholder (fake)
            ssn: '000-00-0000',
        };

        this.cachedProfile = profile;
        this.log('Generated profile:', profile);
        return profile;
    }

    /**
     * Generate a value for a specific field type
     * @param {string} fieldType - The type of field
     * @param {Object} metadata - Field metadata for context
     * @returns {string} The generated value
     */
    generateValue(fieldType, metadata = {}) {
        const profile = this.generateProfile();

        // Map field types to profile values
        const valueMap = {
            // Personal
            firstName: profile.firstName,
            lastName: profile.lastName,
            fullName: profile.fullName,
            middleName: profile.middleName,
            email: profile.email,
            phone: profile.phone,

            // Address
            address: profile.address,
            address2: profile.address2,
            city: profile.city,
            state: profile.state,
            zipCode: profile.zipCode,
            country: profile.country,

            // Professional
            company: profile.company,
            jobTitle: profile.jobTitle,
            department: profile.department,
            website: profile.website,

            // Authentication
            username: profile.username,
            password: profile.password,
            confirmPassword: profile.password,

            // Dates
            birthDate: profile.birthDate,
            date: this.generateDate(),
            startDate: this.generateDate(-30),
            endDate: this.generateDate(30),

            // Numbers
            age: profile.age.toString(),
            quantity: this.randomBetween(1, 10).toString(),
            price: this.randomBetween(10, 1000).toFixed(2),

            // Content
            description: profile.description,
            message: profile.message,
            comment: profile.comment,
            title: profile.title,

            // Social
            twitter: profile.twitter,
            linkedin: profile.linkedin,
            github: profile.github,
            facebook: profile.facebook,
            instagram: profile.instagram,

            // Financial
            creditCard: profile.creditCard,
            cvv: profile.cvv,
            expiry: profile.expiry,

            // Other
            gender: profile.gender,
            ssn: profile.ssn,

            // Generic fallbacks
            text: this.generateLoremIpsum('short'),
            select: null, // Handled separately
            checkbox: null, // Handled separately
            unknown: this.generateLoremIpsum('short'),
        };

        // Check for maxLength constraint
        let value = valueMap[fieldType] || this.generateLoremIpsum('short');

        if (metadata.maxLength && value && value.length > metadata.maxLength) {
            value = value.substring(0, metadata.maxLength);
        }

        this.log(`Generated value for ${fieldType}:`, value);
        return value;
    }

    /**
     * Generate a formatted phone number
     * @returns {string} Phone number in (XXX) XXX-XXXX format
     */
    generatePhone() {
        const areaCode = this.randomBetween(200, 999);
        const exchange = this.randomBetween(200, 999);
        const subscriber = this.randomBetween(1000, 9999);
        return `(${areaCode}) ${exchange}-${subscriber}`;
    }

    /**
     * Generate a date string
     * @param {number} offsetDays - Days from today (positive = future, negative = past)
     * @returns {string} Date in YYYY-MM-DD format
     */
    generateDate(offsetDays = 0) {
        const date = new Date();
        date.setDate(date.getDate() + offsetDays);
        return date.toISOString().split('T')[0];
    }

    /**
     * Generate a birth date (adult age)
     * @returns {string} Date in YYYY-MM-DD format
     */
    generateBirthDate() {
        const today = new Date();
        const age = this.randomBetween(25, 55);
        const year = today.getFullYear() - age;
        const month = String(this.randomBetween(1, 12)).padStart(2, '0');
        const day = String(this.randomBetween(1, 28)).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Generate lorem ipsum text
     * @param {string|number} length - 'short', 'medium', 'long', or specific word count
     * @returns {string} Generated text
     */
    generateLoremIpsum(length = 'short') {
        const words = ValueGenerator.DATA.loremWords;
        let wordCount;

        if (typeof length === 'number') {
            wordCount = length;
        } else {
            switch (length) {
                case 'short':
                    wordCount = this.randomBetween(3, 8);
                    break;
                case 'medium':
                    wordCount = this.randomBetween(15, 30);
                    break;
                case 'long':
                    wordCount = this.randomBetween(50, 100);
                    break;
                default:
                    wordCount = this.randomBetween(3, 8);
            }
        }

        const result = [];
        for (let i = 0; i < wordCount; i++) {
            result.push(this.randomFrom(words));
        }

        // Capitalize first letter
        const text = result.join(' ');
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    /**
     * Determine what value to select from a dropdown
     * @param {HTMLSelectElement} select - The select element
     * @param {string} fieldType - The detected field type
     * @returns {string|null} The value to select, or null if none
     */
    getSelectValue(select, fieldType) {
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
            return null;
        }

        const profile = this.generateProfile();

        // For country fields, prefer US/USA
        if (fieldType === 'country') {
            const usOption = validOptions.find(opt =>
                opt.value === 'US' ||
                opt.value === 'USA' ||
                opt.text.includes('United States') ||
                opt.text.includes('USA')
            );
            if (usOption) return usOption.value;
        }

        // For state fields, prefer matching state
        if (fieldType === 'state') {
            const stateOption = validOptions.find(opt =>
                opt.value === profile.state ||
                opt.text.includes(profile.stateFull)
            );
            if (stateOption) return stateOption.value;

            // Fallback to California
            const caOption = validOptions.find(opt =>
                opt.value === 'CA' ||
                opt.text.includes('California')
            );
            if (caOption) return caOption.value;
        }

        // For gender fields
        if (fieldType === 'gender') {
            const genderOption = validOptions.find(opt =>
                opt.text.toLowerCase() === profile.gender.toLowerCase() ||
                opt.value.toLowerCase() === profile.gender.toLowerCase()
            );
            if (genderOption) return genderOption.value;
        }

        // Default: pick first valid option
        return validOptions[0].value;
    }

    /**
     * Determine if a checkbox should be checked
     * @param {HTMLInputElement} checkbox - The checkbox element
     * @param {Object} metadata - Field metadata
     * @returns {boolean} Whether to check the checkbox
     */
    shouldCheckCheckbox(checkbox, metadata = {}) {
        const searchText = [
            metadata.name,
            metadata.id,
            metadata.labelText
        ].filter(Boolean).join(' ').toLowerCase();

        // Always check terms/conditions/agreement checkboxes
        if (searchText.includes('terms') ||
            searchText.includes('agree') ||
            searchText.includes('accept') ||
            searchText.includes('consent') ||
            searchText.includes('policy')) {
            return true;
        }

        // Don't check newsletter/marketing checkboxes by default
        if (searchText.includes('newsletter') ||
            searchText.includes('marketing') ||
            searchText.includes('subscribe') ||
            searchText.includes('promotional')) {
            return false;
        }

        // Default: 50% chance for other checkboxes
        return Math.random() > 0.5;
    }

    /**
     * Clear the cached profile to generate fresh data
     */
    clearCache() {
        this.cachedProfile = null;
    }
}

// Make available globally for content scripts
if (typeof window !== 'undefined') {
    window.ValueGenerator = ValueGenerator;
}
