/**
 * Centralized Marathi (मराठी) UI text constants for Attendance Portal.
 */

export const MR = {
  // App General
  appName: 'हजेरी पोर्टल',
  appSubtitle: 'कर्मचारी उपस्थिती आणि वेतन व्यवस्थापन प्रणाली',
  portalVersion: 'स्प्रिंट १: पायाभूत सुविधा व प्रमाणीकरण',
  
  // Roles
  roles: {
    ADMIN: 'मुख्य प्रशासक (Admin)',
    CONTRACTOR: 'कंत्राटदार (Contractor)',
    EMPLOYEE: 'कर्मचारी (Employee)',
  },

  // Auth & Login
  login: {
    title: 'पोर्टलमध्ये प्रवेश करा',
    subtitle: 'कृपया तुमचे वापरकर्तानाव आणि पासवर्ड प्रविष्ट करा',
    usernameLabel: 'वापरकर्तानाव (Username)',
    usernamePlaceholder: 'वापरकर्तानाव प्रविष्ट करा',
    passwordLabel: 'पासवर्ड (Password)',
    passwordPlaceholder: 'पासवर्ड प्रविष्ट करा',
    submitButton: 'लॉगिन करा',
    submitting: 'प्रवेश केला जात आहे...',
    activatePrompt: 'नवीन कंत्राटदार किंवा कर्मचारी आहात?',
    activateLink: 'नोंदणी कोडद्वारे खाते सक्रिय करा',
    securityNotice: 'फक्त अधिकृत कर्मचाऱ्यांसाठी. सर्व लॉगिन प्रयत्नांची नोंद ठेवली जाते.',
  },

  // Account Activation
  activation: {
    title: 'खाते सक्रिय करा (First Login)',
    subtitle: 'तुम्हाला मिळालेला नोंदणी कोड वापरून तुमचे खाते सक्रिय करा',
    codeLabel: 'नोंदणी कोड (Registration Code)',
    codePlaceholder: 'उदा. CTR-XXXX-XXXX किंवा EMP-XXXX-XXXX',
    usernameLabel: 'नवीन वापरकर्तानाव (Username)',
    usernamePlaceholder: 'किमान ३ ते ५० अक्षरे',
    passwordLabel: 'पासवर्ड (Password)',
    passwordPlaceholder: 'किमान ८ अक्षरे',
    confirmPasswordLabel: 'पासवर्डची पुष्टी करा',
    confirmPasswordPlaceholder: 'पासवर्ड पुन्हा प्रविष्ट करा',
    fullNameLabel: 'पूर्ण नाव (Full Name)',
    fullNamePlaceholder: 'तुमचे पूर्ण नाव प्रविष्ट करा',
    companyNameLabel: 'कंपनी किंवा फर्मचे नाव (Company Name)',
    companyNamePlaceholder: 'कंत्राटदाराच्या संस्थेचे नाव',
    submitButton: 'खाते सक्रिय करा',
    submitting: 'खाते सक्रिय केले जात आहे...',
    alreadyActivatedPrompt: 'आधीच सक्रिय खाते आहे?',
    loginLink: 'लॉगिन पृष्ठावर जा',
    successTitle: 'खाते यशस्वीरित्या सक्रिय झाले!',
    successMessage: 'तुमचे खाते आता सक्रिय आहे. तुम्ही तुमच्या वापरकर्तानाव आणि पासवर्डने लॉगिन करू शकता.',
  },

  // Error Messages
  errors: {
    invalidCredentials: 'अवैध वापरकर्तानाव किंवा पासवर्ड. कृपया पुन्हा तपासा.',
    rateLimitExceeded: 'खूप जास्त अयशस्वी प्रयत्न झाले आहेत. कृपया १५ मिनिटांनी पुन्हा प्रयत्न करा.',
    emptyFields: 'कृपया सर्व आवश्यक माहिती भरा.',
    passwordMismatch: 'पासवर्ड आणि पुष्टीकरण पासवर्ड जुळत नाहीत.',
    passwordTooShort: 'पासवर्ड किमान ८ अक्षरांचा असावा.',
    invalidUsername: 'वापरकर्तानाव ३ ते ५० वर्णांचे (फक्त अक्षरे, अंक, अंडरस्कोअर) असावे.',
    codeRequired: 'नोंदणी कोड आवश्यक आहे.',
    genericError: 'एक त्रुटी आली. कृपया पुन्हा प्रयत्न करा.',
    networkError: 'सर्व्हरशी संपर्क साधता आला नाही. कृपया तुमचे इंटरनेट तपासा.',
  },

  // Landing / Placeholder Pages (Sprint 1 scope)
  landing: {
    sessionActive: 'सत्र सक्रिय (Active Session)',
    welcome: 'स्वागत आहे',
    roleLabel: 'तुमची प्रणाली भूमिका:',
    userIdLabel: 'वापरकर्ता ओळख (ID):',
    sprintNoticeTitle: 'स्प्रिंट १ अंमलबजावणी यशस्वी',
    sprintNoticeBody: 'डेटाबेस, भूमिका-आधारित सुरक्षा (RLS), आणि सुरक्षित ऑथेंटिकेशन पूर्ण झाले आहे. कंत्राटदार आणि कर्मचारी डॅशबोर्ड पुढील स्प्रिंटमध्ये जोडले जातील.',
    logoutButton: 'लॉगआउट करा',
    loggingOut: 'बाहेर पडत आहे...',
  },

  // Unauthorized Access
  unauthorized: {
    title: 'अनधिकृत प्रवेश (Unauthorized)',
    message: 'तुम्हाला या पृष्ठावर प्रवेश करण्याची परवानगी नाही किंवा तुमची भूमिका अपुरी आहे.',
    backToHome: 'माझ्या अधिकृत पृष्ठावर जा',
    logout: 'दुसऱ्या खात्याने लॉगिन करा',
  },
};
