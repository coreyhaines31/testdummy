# TestDummy Extension Troubleshooting Guide

## 🚨 Common Issues and Solutions

### 1. Extension Not Loading
**Symptoms:** Extension doesn't appear in Chrome extensions list
**Solutions:**
- Make sure you're in Developer mode (chrome://extensions/)
- Check that you selected the correct folder (testdummy, not a subfolder)
- Try refreshing the extensions page

### 2. Content Script Not Running
**Symptoms:** No console logs, fields not detected
**Solutions:**
- Check that you're on localhost or staging domain
- Verify manifest.json has correct host_permissions
- Check browser console for errors
- Try refreshing the page

### 3. Fields Not Detected
**Symptoms:** "No form fields found" error
**Solutions:**
- Check that form fields have proper attributes (name, type, id)
- Try adding custom field mappings in options
- Check if fields are in Shadow DOM (not supported yet)
- Verify fields are visible and not disabled

### 4. Input Not Filling
**Symptoms:** Fields detected but not filled
**Solutions:**
- Check browser console for errors
- Try different input simulation methods
- Verify React/Vue compatibility
- Check if fields are readonly or disabled

### 5. Email Generation Not Working
**Symptoms:** Email field not filled or wrong format
**Solutions:**
- Check that profile is configured in options
- Verify email strategy setting
- Check Chrome storage permissions
- Try localStorage fallback

## 🔍 Debugging Steps

### 1. Check Console Logs
Open browser console (F12) and look for:
```
TestDummy content script loaded on: [URL]
TestDummy content script initializing...
Settings loaded: [settings]
Current profile: [profile]
```

### 2. Test Field Detection
Run in console:
```javascript
// Check if content script is loaded
console.log('Field detector:', typeof fieldDetector);

// Test field detection
if (typeof fieldDetector !== 'undefined') {
    const fields = fieldDetector.findFields();
    console.log('Found fields:', fields);
}
```

### 3. Test Email Generation
Run in console:
```javascript
// Test email generation
if (typeof emailGenerator !== 'undefined') {
    emailGenerator.generateEmail().then(email => {
        console.log('Generated email:', email);
    });
}
```

### 4. Test Input Simulation
Run in console:
```javascript
// Test input simulation
const nameField = document.querySelector('input[name="name"]');
if (nameField && typeof inputSimulator !== 'undefined') {
    inputSimulator.simulateInput(nameField, 'Test User').then(success => {
        console.log('Input simulation success:', success);
    });
}
```

### 5. Test Autofill
Run in console:
```javascript
// Test autofill
chrome.runtime.sendMessage({ action: 'autofill' }, (response) => {
    console.log('Autofill response:', response);
});
```

## 🛠️ Manual Testing

### 1. Load Test Page
1. Go to `http://localhost:8000/test-page.html`
2. Open browser console
3. Run `testDummyTests.runAll()`

### 2. Test Different Form Types
- Standard HTML forms
- React forms
- Vue forms
- Forms with custom validation

### 3. Test Edge Cases
- Forms with no fields
- Forms with disabled fields
- Forms with readonly fields
- Forms with custom field names

## 📋 Checklist

- [ ] Extension loads in Chrome
- [ ] Content script runs on localhost
- [ ] Fields are detected
- [ ] Email is generated
- [ ] Input simulation works
- [ ] Autofill completes successfully
- [ ] Options page works
- [ ] Popup works
- [ ] Hotkey works (Alt+Shift+F)

## 🆘 Still Having Issues?

1. Check the browser console for errors
2. Verify all files are in the correct location
3. Try reloading the extension
4. Test on a simple form first
5. Check Chrome extension permissions

## 📞 Getting Help

If you're still having issues:
1. Copy the console error messages
2. Note which step is failing
3. Check the troubleshooting steps above
4. Try the manual testing methods
