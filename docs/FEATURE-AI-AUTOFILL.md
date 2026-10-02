# AI-Powered Smart Form Autofill Feature

## Overview

This feature adds intelligent form filling capabilities beyond the current signup-focused autofill. When working on dev/staging versions of web apps, users often need to fill out various forms (user profiles, product details, settings, multi-step wizards) with test data. This feature uses contextual analysis to automatically fill ANY form fields with appropriate mock data.

## User Experience Goals

1. **One-click convenience** - Fill entire forms with contextually appropriate test data
2. **Mode toggle** - Easy switch between "Signup Mode" (current behavior) and "Smart Fill" mode
3. **Works everywhere** - Handles any form type: contact forms, user profiles, product creation, settings, surveys
4. **Intelligent defaults** - Generates realistic mock data based on field context (labels, placeholders, names)
5. **Non-destructive** - Skip fields that already have values (optional)

## Proposed UI Changes

### Popup Header Toggle

```
┌─────────────────────────────────────┐
│  TestDummy                          │
│  ┌──────────────┬──────────────┐    │
│  │   Signup     │  Smart Fill  │    │
│  │   Mode       │    Mode      │    │
│  └──────────────┴──────────────┘    │
│                                     │
│  [Current settings area...]         │
│                                     │
│  [Autofill Form]                    │
└─────────────────────────────────────┘
```

### Mode Descriptions

**Signup Mode** (current behavior):
- Uses profile data (first name, last name, email with counter)
- Targets signup/registration forms
- Fills: email, name, password fields

**Smart Fill Mode** (new):
- Analyzes ALL visible form fields on the page
- Generates contextually appropriate mock data
- Works with any form type
- Optional: Can use AI/LLM for better context understanding (future)

## Technical Design

### 1. Expanded Field Detection

Current field types: `email`, `firstName`, `lastName`, `fullName`, `password`, `confirmPassword`

**New field types to add:**

| Category | Field Types |
|----------|-------------|
| **Contact** | phone, mobilePhone, workPhone, fax |
| **Address** | address, address2, city, state, zipCode, country |
| **Personal** | birthDate, age, gender, ssn (masked), occupation, bio |
| **Company** | companyName, jobTitle, department, website, industry |
| **Financial** | creditCard (fake), cardExpiry, cardCVV, bankAccount |
| **Social** | username, twitter, linkedin, github |
| **Content** | title, description, message, comment, notes |
| **Numeric** | quantity, price, amount, percentage |
| **Date/Time** | date, time, datetime, startDate, endDate |

### 2. Field Type Detection Strategy

```javascript
class SmartFieldDetector {
  detectFieldType(element) {
    // Priority order for detection:
    // 1. HTML5 input type (email, tel, date, number, url)
    // 2. Name attribute patterns
    // 3. ID attribute patterns
    // 4. Placeholder text analysis
    // 5. Associated label text
    // 6. aria-label attribute
    // 7. Surrounding context (adjacent labels, form section headers)
    // 8. Input constraints (min, max, pattern, maxlength)
  }
}
```

### 3. Contextual Value Generator

```javascript
class ContextualValueGenerator {
  // Mock data libraries
  static DATA = {
    firstNames: ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey'],
    lastNames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Davis'],
    companies: ['Acme Corp', 'Tech Solutions', 'Global Industries', 'StartupXYZ'],
    cities: ['San Francisco', 'New York', 'Austin', 'Seattle', 'Chicago'],
    states: ['CA', 'NY', 'TX', 'WA', 'IL'],
    streets: ['Main St', 'Oak Ave', 'Park Blvd', 'First St', 'Elm Dr'],
    // ... more libraries
  };

  generateValue(fieldType, options = {}) {
    switch(fieldType) {
      case 'phone':
        return this.generatePhone(options.format);
      case 'address':
        return this.generateAddress();
      case 'companyName':
        return this.randomFrom(this.DATA.companies);
      case 'description':
        return this.generateLoremIpsum(options.length || 'short');
      // ... etc
    }
  }

  // Generate consistent data within same form
  generateProfile() {
    // Returns a coherent set of related data
    return {
      firstName: 'Alex',
      lastName: 'Johnson',
      fullName: 'Alex Johnson',
      email: 'alex.johnson+test@example.com',
      phone: '(555) 123-4567',
      company: 'Acme Corp',
      // ... all fields use consistent identity
    };
  }
}
```

### 4. Smart Fill Algorithm

```javascript
async function smartFill(options = {}) {
  // 1. Scan page for all form fields
  const allFields = await scanAllFormFields();

  // 2. Generate a consistent mock identity for this fill
  const mockProfile = valueGenerator.generateProfile();

  // 3. For each detected field
  for (const field of allFields) {
    // Skip if field already has value (configurable)
    if (field.value && !options.overwriteExisting) continue;

    // Skip if field is hidden/disabled
    if (!isValidField(field)) continue;

    // Detect what type of data this field expects
    const fieldType = detectFieldType(field);

    // Generate appropriate value
    const value = mockProfile[fieldType] || generateValue(fieldType);

    // Fill the field using existing InputSimulator
    await InputSimulator.simulateInput(field, value);
  }

  return { success: true, fieldsFilled: count };
}
```

### 5. Special Field Handling

#### Select/Dropdown Fields
```javascript
function fillSelectField(select, fieldType) {
  // Strategy 1: Pick first non-placeholder option
  // Strategy 2: Pick random option
  // Strategy 3: Match by value keyword (e.g., 'US' for country)

  const options = Array.from(select.options);
  const validOptions = options.filter(o => o.value && !o.disabled);

  // For known types, try to pick appropriate value
  if (fieldType === 'country') {
    const usOption = validOptions.find(o =>
      o.value === 'US' || o.text.includes('United States')
    );
    if (usOption) return selectOption(select, usOption);
  }

  // Default: pick first valid option
  return selectOption(select, validOptions[0]);
}
```

#### Textarea Fields
```javascript
function fillTextarea(textarea, fieldType) {
  const length = getRecommendedLength(textarea); // based on maxlength, rows

  switch(fieldType) {
    case 'bio':
    case 'description':
    case 'about':
      return generateLoremIpsum(length);
    case 'message':
    case 'comment':
      return generatePlaceholderText(length);
    default:
      return generateLoremIpsum('short');
  }
}
```

#### Checkbox and Radio Fields
```javascript
function fillCheckboxRadio(elements) {
  // Radio groups: select first or random option
  // Checkboxes:
  //   - Terms & conditions: check it
  //   - Newsletter opt-in: leave unchecked
  //   - Random features: 50% chance
}
```

### 6. Storage Changes

```javascript
// Add to settings structure
settings: {
  // ... existing settings
  fillMode: 'signup' | 'smart',        // NEW
  smartFillOptions: {                   // NEW
    overwriteExisting: false,
    fillSelects: true,
    fillTextareas: true,
    fillCheckboxes: false,              // Conservative default
    useConsistentIdentity: true         // Same person across form
  }
}
```

### 7. Message Flow

```
User clicks "Autofill Form" in Smart Fill mode
         ↓
popup.js: chrome.runtime.sendMessage({
  action: 'autofill',
  mode: 'smart',
  options: smartFillOptions
})
         ↓
background.js: routes to content script
         ↓
content.js:
  if (mode === 'smart') {
    await smartFill(options);
  } else {
    await signupFill();  // existing behavior
  }
         ↓
Returns: { success, fieldsFilled, fieldsSkipped, errors }
```

## Implementation Phases

### Phase 1: Core Infrastructure
- [ ] Add fill mode toggle to popup UI
- [ ] Create `smart-field-detector.js` utility
- [ ] Create `value-generator.js` utility
- [ ] Add storage for new settings

### Phase 2: Field Detection Expansion
- [ ] Implement detection for 20+ field types
- [ ] Add label text analysis
- [ ] Add input pattern/constraint analysis
- [ ] Test with various form frameworks (React, Vue, vanilla)

### Phase 3: Value Generation
- [ ] Build mock data libraries
- [ ] Implement consistent identity generation
- [ ] Add special handling for selects, textareas, checkboxes
- [ ] Add date/time field handling

### Phase 4: Integration & Polish
- [ ] Wire up smart fill to content script
- [ ] Add visual feedback during fill process
- [ ] Add settings for smart fill options
- [ ] Comprehensive testing across form types

### Phase 5: Future Enhancements (Optional)
- [ ] AI/LLM integration for better context understanding
- [ ] Learn from user corrections
- [ ] Support for multi-page wizards
- [ ] Export/import mock data libraries

## Files to Create/Modify

### New Files
- `utils/smart-field-detector.js` - Enhanced field detection
- `utils/value-generator.js` - Mock data generation
- `docs/FEATURE-AI-AUTOFILL.md` - This document

### Modified Files
- `popup-fixed.html` - Add mode toggle UI
- `popup-fixed.js` - Handle mode toggle, pass mode to messages
- `content.js` - Add smart fill handler alongside existing signup fill
- `utils/storage-manager.js` - Add new settings structure
- `manifest.json` - Add new utility files to content_scripts

## Testing Strategy

1. **Unit tests** for field detection patterns
2. **Unit tests** for value generation
3. **Integration tests** with sample forms:
   - Simple contact form
   - Multi-step registration wizard
   - Complex user profile form
   - Product creation form
   - Settings/preferences form
4. **Framework tests**: React forms, Vue forms, Angular forms, vanilla HTML

## Open Questions

1. **Overwrite behavior**: Should smart fill overwrite existing values by default?
   - Recommendation: No, skip fields with values (safer default)

2. **Checkbox handling**: How aggressive should checkbox filling be?
   - Recommendation: Off by default, user-configurable

3. **AI integration**: Should we integrate an actual LLM for better context?
   - Recommendation: Start without, add as future enhancement
   - Could use Claude API for field analysis if user provides API key

4. **Consistency scope**: Should identity be consistent across page reload?
   - Recommendation: Per-session consistency, reset on page reload

## Success Metrics

- Fills 80%+ of common form fields correctly
- Works across major form frameworks (React, Vue, Angular)
- User can fill complex forms in one click vs. manual entry
- No false positives (filling wrong data in wrong field)

---

## UI Mockup: Mode Toggle

The popup will have a segmented toggle at the top to switch between modes:

```
┌─────────────────────────────────────────┐
│  ┌─────────────────┬─────────────────┐  │
│  │    Signup       │   Smart Fill    │  │
│  │    (active)     │                 │  │
│  └─────────────────┴─────────────────┘  │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ First Name    │ Last Name          ││
│  │ [John       ] │ [Doe            ]  ││
│  ├─────────────────────────────────────┤│
│  │ Email Prefix  │ Email Domain       ││
│  │ [test       ] │ [example.com    ]  ││
│  └─────────────────────────────────────┘│
│                                         │
│  Current Counter: [-] [42] [+] [Reset]  │
│                                         │
│  [x] Auto-submit forms after filling    │
│                                         │
│  ── URL Whitelist ──────────────────── │
│  [Enter URL...        ] [Current] [Add] │
│  localhost:3000                     [x] │
│                                         │
│  [Save Settings]      [Autofill Form]   │
└─────────────────────────────────────────┘
```

When "Smart Fill" is selected:

```
┌─────────────────────────────────────────┐
│  ┌─────────────────┬─────────────────┐  │
│  │    Signup       │   Smart Fill    │  │
│  │                 │    (active)     │  │
│  └─────────────────┴─────────────────┘  │
│                                         │
│  Smart Fill Options:                    │
│                                         │
│  [x] Fill text inputs                   │
│  [x] Fill select/dropdown fields        │
│  [x] Fill textarea fields               │
│  [ ] Fill checkbox fields               │
│  [ ] Overwrite existing values          │
│                                         │
│  ── URL Whitelist ──────────────────── │
│  [Enter URL...        ] [Current] [Add] │
│  localhost:3000                     [x] │
│                                         │
│  [Save Settings]     [Smart Fill Now]   │
└─────────────────────────────────────────┘
```

---

## Concrete Implementation Plan

### Step 1: Add Mode Toggle to Popup (popup-fixed.html/js)

**Changes to popup-fixed.html:**
- Add a mode toggle segment control at the top of the container
- Create two content sections: `signup-mode-content` and `smart-fill-content`
- Show/hide content based on selected mode

**Changes to popup-fixed.js:**
- Add event listeners for mode toggle
- Save selected mode to storage
- Load mode from storage on popup open
- Show/hide appropriate content sections

### Step 2: Create Smart Field Detector (utils/smart-field-detector.js)

```javascript
class SmartFieldDetector {
  // Field type patterns for 25+ common field types
  static FIELD_PATTERNS = {
    // Contact
    phone: ['tel', 'phone', 'mobile', 'cell'],
    // Address
    address: ['address', 'street', 'addr'],
    city: ['city', 'town'],
    state: ['state', 'province', 'region'],
    zipCode: ['zip', 'postal', 'postcode'],
    country: ['country', 'nation'],
    // ... etc
  };

  detectAllFields() {
    // Find all fillable inputs, selects, textareas
    // Return array of { element, detectedType, confidence }
  }

  detectFieldType(element) {
    // Analyze element attributes and context
    // Return { type: string, confidence: number }
  }
}
```

### Step 3: Create Value Generator (utils/value-generator.js)

```javascript
class ValueGenerator {
  static DATA = {
    // Mock data libraries for each field type
  };

  generateProfile() {
    // Generate consistent identity for form
  }

  generateValue(fieldType, options) {
    // Generate single value for field type
  }
}
```

### Step 4: Add Smart Fill Handler to Content Script

**Changes to content.js:**
- Add `handleSmartFill()` function
- Listen for `{ action: 'autofill', mode: 'smart' }` messages
- Use SmartFieldDetector to find all fields
- Use ValueGenerator to create values
- Use InputSimulator to fill fields

### Step 5: Update Storage Manager

**Changes to storage-manager.js:**
- Add `fillMode` setting ('signup' | 'smart')
- Add `smartFillOptions` object

### Step 6: Update Manifest

**Changes to manifest.json:**
- Add new utility files to content_scripts array

### Step 7: Testing & Polish

- Test with various form types
- Add visual feedback during smart fill
- Handle edge cases (readonly fields, hidden fields, etc.)

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `popup-fixed.html` | Modify | Add mode toggle UI, smart fill options panel |
| `popup-fixed.js` | Modify | Add mode toggle logic, smart fill trigger |
| `utils/smart-field-detector.js` | Create | New field detection with 25+ field types |
| `utils/value-generator.js` | Create | Mock data generation |
| `content.js` | Modify | Add smart fill handler |
| `utils/storage-manager.js` | Modify | Add new settings |
| `manifest.json` | Modify | Add new utility scripts |
| `popup.css` | Modify | Add toggle styles (if using external CSS) |

---

## Estimated Effort by Phase

| Phase | Files | Complexity |
|-------|-------|------------|
| Phase 1: UI Toggle | 2 | Low |
| Phase 2: Field Detection | 1 | Medium |
| Phase 3: Value Generation | 1 | Medium |
| Phase 4: Integration | 3 | Medium |
| Phase 5: Testing | - | Medium |

---

## Next Steps

1. Review this spec and confirm approach
2. Start with Phase 1 (UI changes) to validate UX
3. Implement detection and generation utilities
4. Wire everything together
5. Test across different form types
