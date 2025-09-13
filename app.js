// Healthcare AI Test Case Generator - Enhanced with Audio Tour (Light Theme) - FIXED
class HealthcareAITestGen {
    constructor() {
        this.currentScreen = 'welcome';
        this.currentLanguage = 'en';
        this.isProcessing = false;
        this.testCases = [];
        this.requirements = [];
        this.currentFilter = 'all';
        this.tourStep = 0;
        this.isTourActive = false;
        this.exportHistory = [];
        this.tourSteps = this.initializeTourSteps();
        
        // Audio Tour Properties
        this.audioEnabled = this.getAudioPreference();
        this.isAudioPlaying = false;
        this.currentUtterance = null;
        this.speechSynthesis = window.speechSynthesis;
        this.isAudioSupported = 'speechSynthesis' in window;
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    
    // Audio Tour Methods
    getAudioPreference() {
        try {
            return localStorage.getItem('healthai-audio-enabled') !== 'false';
        } catch (e) {
            return true;
        }
    }
    
    setAudioPreference(enabled) {
        try {
            localStorage.setItem('healthai-audio-enabled', enabled.toString());
        } catch (e) {
            console.log('Could not save audio preference');
        }
        this.audioEnabled = enabled;
    }
    
    initializeAudioSystem() {
        if (!this.isAudioSupported) {
            console.warn('Speech Synthesis API not supported');
            this.showAudioUnavailableMessage();
            return;
        }
        
        // Wait for voices to load
        if (this.speechSynthesis.getVoices().length === 0) {
            this.speechSynthesis.addEventListener('voiceschanged', () => {
                console.log('Voices loaded:', this.speechSynthesis.getVoices().length);
            });
        }
        
        this.setupAudioControls();
        this.setupKeyboardShortcuts();
        this.updateAudioButtonStates();
    }
    
    setupAudioControls() {
        // Tour audio toggle
        const tourAudioToggle = document.getElementById('tourAudioToggle');
        if (tourAudioToggle) {
            tourAudioToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleTourAudio();
            });
        }
        
        // Header audio toggle
        const audioToggleHeader = document.getElementById('audioToggleHeader');
        if (audioToggleHeader) {
            audioToggleHeader.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleAudioPreference();
            });
        }
        
        // Listen to tour button in welcome modal
        const listenTourBtn = document.getElementById('listenTourBtn');
        if (listenTourBtn) {
            listenTourBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.startAudioTour();
            });
        }
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (this.isTourActive) {
                if (e.code === 'Space' && !e.target.matches('input, textarea, button')) {
                    e.preventDefault();
                    this.toggleTourAudio();
                } else if (e.code === 'KeyM' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    this.toggleAudioPreference();
                }
            }
        });
    }
    
    updateAudioButtonStates() {
        const tourToggle = document.getElementById('tourAudioToggle');
        const headerToggle = document.getElementById('audioToggleHeader');
        
        if (tourToggle) {
            tourToggle.classList.toggle('active', this.audioEnabled && this.isAudioPlaying);
            tourToggle.classList.toggle('muted', !this.audioEnabled);
            
            const icon = tourToggle.querySelector('i');
            if (icon) {
                icon.className = this.audioEnabled ? 
                    (this.isAudioPlaying ? 'fas fa-pause' : 'fas fa-volume-up') : 
                    'fas fa-volume-mute';
            }
        }
        
        if (headerToggle) {
            headerToggle.classList.toggle('active', this.audioEnabled);
            const icon = headerToggle.querySelector('i');
            if (icon) {
                icon.className = this.audioEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
            }
        }
        
        // Update audio visualizer
        const visualizer = document.getElementById('audioVisualizer');
        if (visualizer) {
            visualizer.classList.toggle('hidden', !this.isAudioPlaying);
        }
    }
    
    showAudioUnavailableMessage() {
        const audioButtons = document.querySelectorAll('#tourAudioToggle, #audioToggleHeader, #listenTourBtn');
        audioButtons.forEach(button => {
            if (button) {
                button.title = this.currentLanguage === 'en' ? 
                    'Audio unavailable in this browser' : 
                    'इस ब्राउज़र में ऑडियो उपलब्ध नहीं है';
                button.style.opacity = '0.5';
                button.disabled = true;
            }
        });
    }
    
    getPreferredVoice(language) {
        if (!this.isAudioSupported) return null;
        
        const voices = this.speechSynthesis.getVoices();
        
        const voicePreferences = {
            'en': ['en-US', 'en-GB', 'en'],
            'hi': ['hi-IN', 'hi']
        };
        
        const prefs = voicePreferences[language] || voicePreferences['en'];
        
        for (const langCode of prefs) {
            const voice = voices.find(v => v.lang.startsWith(langCode));
            if (voice) return voice;
        }
        
        return voices.find(v => v.default) || voices[0] || null;
    }
    
    playTourAudio(text, language = this.currentLanguage) {
        if (!this.isAudioSupported || !this.audioEnabled || !text) {
            return Promise.resolve();
        }
        
        this.stopTourAudio();
        
        return new Promise((resolve) => {
            const utterance = new SpeechSynthesisUtterance(text);
            const voice = this.getPreferredVoice(language);
            
            if (voice) {
                utterance.voice = voice;
            }
            
            utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US';
            utterance.rate = 0.9;
            utterance.pitch = 1;
            utterance.volume = 0.8;
            
            utterance.onstart = () => {
                this.isAudioPlaying = true;
                this.currentUtterance = utterance;
                this.updateAudioButtonStates();
            };
            
            utterance.onend = () => {
                this.isAudioPlaying = false;
                this.currentUtterance = null;
                this.updateAudioButtonStates();
                resolve();
            };
            
            utterance.onerror = () => {
                this.isAudioPlaying = false;
                this.currentUtterance = null;
                this.updateAudioButtonStates();
                resolve();
            };
            
            try {
                this.speechSynthesis.speak(utterance);
            } catch (error) {
                resolve();
            }
        });
    }
    
    stopTourAudio() {
        if (this.speechSynthesis && this.isAudioPlaying) {
            this.speechSynthesis.cancel();
            this.isAudioPlaying = false;
            this.currentUtterance = null;
            this.updateAudioButtonStates();
        }
    }
    
    toggleTourAudio() {
        if (this.isAudioPlaying) {
            this.stopTourAudio();
        } else if (this.audioEnabled && this.isTourActive) {
            const steps = this.tourSteps[this.currentLanguage];
            const currentStep = steps[this.tourStep];
            if (currentStep) {
                this.playTourAudio(currentStep.description);
            }
        }
    }
    
    toggleAudioPreference() {
        const newState = !this.audioEnabled;
        this.setAudioPreference(newState);
        this.updateAudioButtonStates();
        
        if (!newState) {
            this.stopTourAudio();
        }
        
        this.showNotification(
            this.currentLanguage === 'en' ? 'Audio Settings' : 'ऑडियो सेटिंग्स',
            this.currentLanguage === 'en' ? 
                `Audio tour ${newState ? 'enabled' : 'disabled'}` :
                `ऑडियो टूर ${newState ? 'सक्षम' : 'अक्षम'} किया गया`,
            'info'
        );
    }
    
    startAudioTour() {
        this.setAudioPreference(true);
        this.startTour();
    }
    
    initializeTourSteps() {
        return {
            en: [
                {
                    target: '.hero-content',
                    title: 'Welcome to HealthAI TestGen',
                    description: 'This is your AI-powered healthcare test case generator. Let\'s explore its powerful features together.',
                    position: 'center',
                    screen: 'welcome'
                },
                {
                    target: '#getStartedBtn',
                    title: 'Get Started Button',
                    description: 'Click here to begin uploading your healthcare requirements document.',
                    position: 'top',
                    screen: 'welcome'
                },
                {
                    target: '#uploadArea',
                    title: 'Document Upload Area',
                    description: 'Drag and drop your PDF, Word, or XML files here. The AI will analyze your healthcare requirements.',
                    position: 'bottom',
                    screen: 'upload'
                },
                {
                    target: '#processBtn',
                    title: 'AI Processing',
                    description: 'Once your document is uploaded, click here to start AI analysis and test case generation.',
                    position: 'top',
                    screen: 'upload'
                },
                {
                    target: '#testCasesTable',
                    title: 'Test Cases Table',
                    description: 'View all generated test cases with detailed information. Click on any row to see more details.',
                    position: 'top',
                    screen: 'dashboard'
                },
                {
                    target: '.filters-section',
                    title: 'Search & Filters',
                    description: 'Search test cases by keywords and filter by priority levels to find what you need.',
                    position: 'bottom',
                    screen: 'dashboard'
                },
                {
                    target: '#traceabilityBtn',
                    title: 'Traceability Map',
                    description: 'Visualize how requirements map to test cases with our interactive traceability diagram.',
                    position: 'bottom',
                    screen: 'dashboard'
                },
                {
                    target: '#exportBtn',
                    title: 'Export Options',
                    description: 'Download your test cases in multiple formats: CSV, Excel, PDF, or integration templates.',
                    position: 'bottom',
                    screen: 'dashboard'
                }
            ],
            hi: [
                {
                    target: '.hero-content',
                    title: 'HealthAI TestGen में आपका स्वागत है',
                    description: 'यह आपका AI-संचालित स्वास्थ्य सेवा परीक्षण केस जेनरेटर है। आइए इसकी शक्तिशाली सुविधाओं को एक साथ जानते हैं।',
                    position: 'center',
                    screen: 'welcome'
                },
                {
                    target: '#getStartedBtn',
                    title: 'शुरू करें बटन',
                    description: 'अपने स्वास्थ्य सेवा आवश्यकताएं दस्तावेज़ अपलोड करना शुरू करने के लिए यहाँ क्लिक करें।',
                    position: 'top',
                    screen: 'welcome'
                },
                {
                    target: '#uploadArea',
                    title: 'दस्तावेज़ अपलोड क्षेत्र',
                    description: 'यहाँ अपनी PDF, Word, या XML फ़ाइलें खींचें और छोड़ें। AI आपकी स्वास्थ्य सेवा आवश्यकताओं का विश्लेषण करेगा।',
                    position: 'bottom',
                    screen: 'upload'
                },
                {
                    target: '#processBtn',
                    title: 'AI प्रोसेसिंग',
                    description: 'आपका दस्तावेज़ अपलोड होने के बाद, AI विश्लेषण और परीक्षण केस जेनरेशन शुरू करने के लिए यहाँ क्लिक करें।',
                    position: 'top',
                    screen: 'upload'
                },
                {
                    target: '#testCasesTable',
                    title: 'परीक्षण केस तालिका',
                    description: 'विस्तृत जानकारी के साथ सभी जेनरेट किए गए परीक्षण केस देखें। अधिक विवरण के लिए किसी भी पंक्ति पर क्लिक करें।',
                    position: 'top',
                    screen: 'dashboard'
                },
                {
                    target: '.filters-section',
                    title: 'खोज और फ़िल्टर',
                    description: 'कीवर्ड के द्वारा परीक्षण केस खोजें और प्राथमिकता स्तर के अनुसार फ़िल्टर करें।',
                    position: 'bottom',
                    screen: 'dashboard'
                },
                {
                    target: '#traceabilityBtn',
                    title: 'ट्रेसेबिलिटी मैप',
                    description: 'हमारे इंटरैक्टिव ट्रेसेबिलिटी डायग्राम के साथ देखें कि आवश्यकताएं परीक्षण केसों से कैसे जुड़ती हैं।',
                    position: 'bottom',
                    screen: 'dashboard'
                },
                {
                    target: '#exportBtn',
                    title: 'निर्यात विकल्प',
                    description: 'अपने परीक्षण केसों को कई प्रारूपों में डाउनलोड करें: CSV, Excel, PDF, या एकीकरण टेम्प्लेट।',
                    position: 'bottom',
                    screen: 'dashboard'
                }
            ]
        };
    }
    
    init() {
        console.log('Initializing Healthcare AI Test Case Generator...');
        try {
            this.loadData();
            this.setupEventListeners();
            this.initializeComponents();
            this.initializeAudioSystem();
            
            // Show welcome tour after everything is set up
            setTimeout(() => {
                this.showWelcomeTour();
            }, 500);
            
            console.log('Initialization complete');
        } catch (error) {
            console.error('Initialization failed:', error);
        }
    }
    
    async loadData() {
        this.requirements = [
            {
                req_id: "REQ-001",
                title: "Patient Authentication System",
                description: "The system shall provide secure authentication for healthcare providers accessing patient electronic health records (EHR) with multi-factor authentication (MFA) compliant with HIPAA regulations.",
                category: "Security",
                priority: "Critical",
                compliance_standards: ["HIPAA", "FDA 21 CFR Part 11", "IEC 62304 Class B"]
            },
            {
                req_id: "REQ-002", 
                title: "Medication Dosage Calculation",
                description: "The system shall calculate and validate medication dosages based on patient weight, age, and medical history to prevent dosing errors and adverse drug events.",
                category: "Clinical Decision Support",
                priority: "Critical",
                compliance_standards: ["FDA Class II", "IEC 62304 Class C", "ISO 14971"]
            },
            {
                req_id: "REQ-003",
                title: "Lab Result Integration", 
                description: "The system shall integrate laboratory test results from external lab systems using HL7 FHIR standards and display results in patient dashboard with appropriate alerts for critical values.",
                category: "Interoperability",
                priority: "High",
                compliance_standards: ["HL7 FHIR R4", "FDA Class I", "IEC 62304 Class A"]
            },
            {
                req_id: "REQ-004",
                title: "Medical Device Data Acquisition",
                description: "The system shall acquire real-time vital signs data from connected medical devices and integrate with patient monitoring workflows.",
                category: "Device Integration", 
                priority: "High",
                compliance_standards: ["IEC 62304 Class B", "ISO 13485", "FDA 510(k)"]
            },
            {
                req_id: "REQ-005",
                title: "Clinical Data Backup and Recovery",
                description: "The system shall provide automated backup of all clinical data with disaster recovery capabilities to ensure data availability and business continuity.",
                category: "Data Management",
                priority: "High", 
                compliance_standards: ["HIPAA", "FDA 21 CFR Part 11", "IEC 62304 Class A"]
            },
            {
                req_id: "REQ-006",
                title: "Clinical Decision Support Alerts",
                description: "The system shall provide evidence-based clinical decision support alerts for drug interactions, allergies, and best practice recommendations.",
                category: "Clinical Decision Support",
                priority: "Medium",
                compliance_standards: ["FDA Class II", "IEC 62304 Class B"]
            }
        ];
        
        this.testCases = [
            {
                test_id: "TC-001-001",
                req_id: "REQ-001", 
                title: "Valid User Login with MFA",
                description: "Verify that authorized healthcare providers can successfully log in using valid credentials and complete MFA process",
                priority: "Critical",
                test_steps: [
                    "1. Navigate to the healthcare application login page",
                    "2. Enter valid username and password", 
                    "3. Click Login button",
                    "4. Complete MFA verification (SMS/App authenticator)",
                    "5. Verify successful login to main dashboard"
                ],
                expected_result: "User successfully logs in and dashboard is displayed within 30 seconds",
                compliance_standard: "HIPAA",
                status: "Pass"
            },
            {
                test_id: "TC-001-002",
                req_id: "REQ-001",
                title: "Account Lockout After Failed Attempts", 
                description: "Verify that user account gets locked after 3 consecutive failed login attempts",
                priority: "Critical",
                test_steps: [
                    "1. Navigate to login page",
                    "2. Enter valid username with incorrect password",
                    "3. Repeat step 2 two more times (total 3 failed attempts)", 
                    "4. Verify account lockout message is displayed",
                    "5. Attempt login with correct credentials"
                ],
                expected_result: "Account is locked and error message displayed, correct credentials rejected until unlock",
                compliance_standard: "HIPAA",
                status: "Pass"
            },
            {
                test_id: "TC-002-001",
                req_id: "REQ-002",
                title: "Accurate Dosage Calculation for Adult Patient",
                description: "Verify that medication dosage is calculated accurately based on patient weight and age for adult patients",
                priority: "Critical",
                test_steps: [
                    "1. Access medication prescription module",
                    "2. Select patient (Adult, 70kg, 35 years old)",
                    "3. Select medication (Amoxicillin 500mg)",
                    "4. Enter dosing parameters", 
                    "5. Verify calculated dosage is accurate"
                ],
                expected_result: "Dosage calculated as 15mg/kg = 1050mg per day, accurate to 0.01mg precision",
                compliance_standard: "FDA Class II",
                status: "Pass"
            },
            {
                test_id: "TC-002-002",
                req_id: "REQ-002",
                title: "Drug Interaction Alert Detection",
                description: "Verify that system detects and alerts for potential drug interactions",
                priority: "Critical",
                test_steps: [
                    "1. Access patient with existing prescription (Warfarin)",
                    "2. Attempt to prescribe interacting medication (Aspirin)",
                    "3. Verify drug interaction alert is displayed",
                    "4. Review alert details and recommendations",
                    "5. Verify option to override with justification"
                ],
                expected_result: "Drug interaction alert displayed with severity level and clinical recommendations",
                compliance_standard: "FDA Class II",
                status: "Pass"
            },
            {
                test_id: "TC-003-001",
                req_id: "REQ-003", 
                title: "HL7 FHIR Lab Result Processing",
                description: "Verify that lab results received via HL7 FHIR are processed and displayed correctly",
                priority: "High",
                test_steps: [
                    "1. Send HL7 FHIR lab result message to system endpoint",
                    "2. Verify message is received and acknowledged",
                    "3. Check that result appears in patient dashboard",
                    "4. Verify all result values and units are correct",
                    "5. Confirm timestamp and ordering provider information"
                ],
                expected_result: "Lab result processed within 2 minutes and correctly displayed in patient record",
                compliance_standard: "HL7 FHIR R4",
                status: "Pass"
            },
            {
                test_id: "TC-003-002",
                req_id: "REQ-003",
                title: "Critical Value Alert Generation", 
                description: "Verify that critical lab values trigger immediate alerts to clinical staff",
                priority: "Critical",
                test_steps: [
                    "1. Send lab result with critical value (Glucose 450 mg/dL)",
                    "2. Verify critical value alert is triggered",
                    "3. Check that alert is sent to appropriate clinical staff",
                    "4. Verify alert includes patient information and result details",
                    "5. Confirm alert acknowledgment functionality"
                ],
                expected_result: "Critical value alert generated immediately with appropriate urgency level",
                compliance_standard: "FDA Class I", 
                status: "Pass"
            },
            {
                test_id: "TC-004-001",
                req_id: "REQ-004",
                title: "Real-time Vital Signs Acquisition",
                description: "Verify that vital signs data is acquired from connected monitors in real-time",
                priority: "High",
                test_steps: [
                    "1. Connect patient monitor to the system",
                    "2. Verify device connection status",
                    "3. Monitor vital signs data stream", 
                    "4. Verify data latency is less than 1 second",
                    "5. Check that all parameters (HR, BP, SpO2) are captured"
                ],
                expected_result: "Vital signs data acquired with <1 second latency and displayed on patient monitor",
                compliance_standard: "IEC 62304 Class B",
                status: "Pass"
            },
            {
                test_id: "TC-005-001", 
                req_id: "REQ-005",
                title: "Automated Backup Execution",
                description: "Verify that automated backups execute every 4 hours as scheduled",
                priority: "High",
                test_steps: [
                    "1. Verify backup schedule configuration",
                    "2. Monitor system for 8 hours to capture 2 backup cycles",
                    "3. Check backup completion logs",
                    "4. Verify backup files are created in designated location",
                    "5. Validate backup file integrity"
                ],
                expected_result: "Automated backups execute every 4 hours with successful completion status",
                compliance_standard: "FDA 21 CFR Part 11",
                status: "Pass"
            },
            {
                test_id: "TC-006-001",
                req_id: "REQ-006",
                title: "Clinical Alert Response Time",
                description: "Verify that clinical decision support alerts appear within 3 seconds of triggering event", 
                priority: "Medium",
                test_steps: [
                    "1. Access patient record with allergy information",
                    "2. Attempt to prescribe medication patient is allergic to",
                    "3. Measure time from prescription entry to alert display",
                    "4. Verify alert content and accuracy",
                    "5. Test alert acknowledgment functionality"
                ],
                expected_result: "Allergy alert displayed within 3 seconds with accurate patient and medication information",
                compliance_standard: "FDA Class II",
                status: "Pass"
            }
        ];
        
        console.log('Data loaded:', { requirements: this.requirements.length, testCases: this.testCases.length });
    }
    
    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        try {
            // Language toggle - FIXED
            const langToggle = document.getElementById('langToggle');
            if (langToggle) {
                langToggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.toggleLanguage();
                });
            }
            
            // Help button - FIXED
            const helpBtn = document.getElementById('helpBtn');
            if (helpBtn) {
                helpBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.showWelcomeTour();
                });
            }
            
            // Navigation buttons - FIXED
            const getStartedBtn = document.getElementById('getStartedBtn');
            if (getStartedBtn) {
                console.log('Setting up Get Started button');
                getStartedBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Get Started clicked - navigating to upload');
                    this.navigateToScreen('upload');
                });
            }
            
            // Tour controls - FIXED
            this.setupTourControls();
            
            // Upload functionality
            this.setupUploadHandlers();
            
            // Dashboard functionality
            this.setupDashboardHandlers();
            
            // Export functionality
            this.setupExportHandlers();
            
            // Modal controls
            this.setupModalHandlers();
            
            // Other handlers
            this.setupOtherHandlers();
            
            console.log('Event listeners setup complete');
            
        } catch (error) {
            console.error('Error setting up event listeners:', error);
        }
    }
    
    setupTourControls() {
        // Welcome tour controls - FIXED
        const startTourBtn = document.getElementById('startTourBtn');
        const skipTourBtn = document.getElementById('skipTourBtn');
        const tourLangEn = document.getElementById('tourLangEn');
        const tourLangHi = document.getElementById('tourLangHi');
        
        if (startTourBtn) {
            startTourBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Start tour clicked');
                this.startTour();
            });
        }
        
        if (skipTourBtn) {
            skipTourBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Skip tour clicked');
                this.skipTour();
            });
        }
        
        if (tourLangEn) {
            tourLangEn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.setTourLanguage('en');
            });
        }
        
        if (tourLangHi) {
            tourLangHi.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.setTourLanguage('hi');
            });
        }
        
        // Interactive tour controls - FIXED
        const tourNextBtn = document.getElementById('tourNextBtn');
        const tourPrevBtn = document.getElementById('tourPrevBtn');
        const tourSkipBtn = document.getElementById('tourSkipBtn');
        const tourFinishBtn = document.getElementById('tourFinishBtn');
        
        if (tourNextBtn) {
            tourNextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Tour next clicked');
                this.nextTourStep();
            });
        }
        
        if (tourPrevBtn) {
            tourPrevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Tour prev clicked');
                this.prevTourStep();
            });
        }
        
        if (tourSkipBtn) {
            tourSkipBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Tour skip clicked');
                this.endTour();
            });
        }
        
        if (tourFinishBtn) {
            tourFinishBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Tour finish clicked');
                this.endTour();
            });
        }
    }
    
    setupUploadHandlers() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        
        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => fileInput.click());
            uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
            uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            uploadArea.addEventListener('drop', (e) => this.handleFileDrop(e));
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }
        
        // Sample document buttons - FIXED
        document.querySelectorAll('.sample-doc-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Sample document selected');
                this.selectSampleDocument(e.target.closest('.sample-doc-btn'));
            });
        });
        
        // Process button - FIXED
        const processBtn = document.getElementById('processBtn');
        if (processBtn) {
            processBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Process button clicked');
                this.startProcessing();
            });
        }
    }
    
    setupDashboardHandlers() {
        // Dashboard buttons - FIXED
        const traceabilityBtn = document.getElementById('traceabilityBtn');
        const exportBtn = document.getElementById('exportBtn');
        
        if (traceabilityBtn) {
            traceabilityBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.navigateToScreen('traceability');
            });
        }
        
        if (exportBtn) {
            exportBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.navigateToScreen('export');
            });
        }
        
        // Search and filter
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterTestCases(e.target.value));
        }
        
        document.querySelectorAll('.filter-tag').forEach(tag => {
            tag.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.setFilter(e.target.dataset.filter);
            });
        });
        
        // Breadcrumb navigation - FIXED
        document.querySelectorAll('.breadcrumb-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const screen = e.target.dataset.screen;
                if (screen) {
                    this.navigateToScreen(screen);
                }
            });
        });
    }
    
    setupExportHandlers() {
        // Export buttons - FIXED Working downloads
        document.querySelectorAll('.download-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Download button clicked');
                const formatCard = e.target.closest('[data-format]');
                if (formatCard) {
                    console.log('Format found:', formatCard.dataset.format);
                    this.handleDownload(formatCard.dataset.format);
                }
            });
        });
        
        document.querySelectorAll('.integration-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Integration button clicked');
                const integrationCard = e.target.closest('[data-integration]');
                if (integrationCard) {
                    this.handleIntegrationDownload(integrationCard.dataset.integration);
                }
            });
        });
    }
    
    setupModalHandlers() {
        // Modal controls - FIXED
        document.querySelectorAll('.modal-close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.closeModal(e.target.closest('.modal'));
            });
        });
        
        document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
            backdrop.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.closeModal(e.target.closest('.modal'));
            });
        });
        
        // Judge mode button
        const futureVisionBtn = document.getElementById('futureVisionBtn');
        if (futureVisionBtn) {
            futureVisionBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showFutureVision();
            });
        }
    }
    
    setupOtherHandlers() {
        // Toast close
        const toastClose = document.getElementById('toastClose');
        if (toastClose) {
            toastClose.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.hideNotification();
            });
        }
        
        // Traceability map controls
        const zoomInBtn = document.getElementById('zoomIn');
        const zoomOutBtn = document.getElementById('zoomOut');
        const resetZoomBtn = document.getElementById('resetZoom');
        
        if (zoomInBtn) zoomInBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.zoomMap(1.2);
        });
        
        if (zoomOutBtn) zoomOutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.zoomMap(0.8);
        });
        
        if (resetZoomBtn) resetZoomBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.resetMapZoom();
        });
    }
    
    initializeComponents() {
        console.log('Initializing components...');
        this.updateLanguageDisplay();
        this.renderTestCasesTable();
        this.createTraceabilityMap();
        this.setupTooltips();
        this.renderExportHistory();
        console.log('Components initialized');
    }
    
    // Tour System Implementation - Enhanced with Audio
    showWelcomeTour() {
        console.log('Showing welcome tour');
        const modal = document.getElementById('welcomeTourModal');
        if (modal) {
            modal.classList.remove('hidden');
            this.updateTourWelcomeLanguage();
        }
    }
    
    setTourLanguage(lang) {
        console.log('Setting tour language to:', lang);
        this.currentLanguage = lang;
        
        // Update active language button
        document.querySelectorAll('.language-selector .btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.lang === lang) {
                btn.classList.add('active');
            }
        });
        
        this.updateTourWelcomeLanguage();
        this.updateLanguageDisplay();
    }
    
    updateTourWelcomeLanguage() {
        document.querySelectorAll('[data-en]').forEach(element => {
            const key = this.currentLanguage === 'en' ? 'en' : 'hi';
            if (element.dataset[key]) {
                element.textContent = element.dataset[key];
            }
        });
    }
    
    startTour() {
        console.log('Starting interactive tour');
        const modal = document.getElementById('welcomeTourModal');
        if (modal) modal.classList.add('hidden');
        
        this.isTourActive = true;
        this.tourStep = 0;
        
        // Make sure we're on the welcome screen
        this.navigateToScreen('welcome');
        
        // Start the tour after navigation
        setTimeout(() => {
            this.showTourStep();
        }, 300);
    }
    
    skipTour() {
        console.log('Skipping tour');
        const modal = document.getElementById('welcomeTourModal');
        if (modal) modal.classList.add('hidden');
        
        this.showNotification(
            this.currentLanguage === 'en' ? 'Tour Skipped' : 'टूर छोड़ दिया गया',
            this.currentLanguage === 'en' ? 
                'You can restart the tour anytime by clicking the Help button.' :
                'आप किसी भी समय सहायता बटन पर क्लिक करके टूर को फिर से शुरू कर सकते हैं।',
            'info'
        );
    }
    
    async showTourStep() {
        console.log('Showing tour step:', this.tourStep);
        const overlay = document.getElementById('tourOverlay');
        if (!overlay) return;
        
        const steps = this.tourSteps[this.currentLanguage];
        if (this.tourStep >= steps.length) {
            this.endTour();
            return;
        }
        
        const step = steps[this.tourStep];
        
        // Navigate to the correct screen if needed
        if (step.screen && step.screen !== this.currentScreen) {
            this.navigateToScreen(step.screen);
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        this.showTourStepUI(step, steps);
        
        // Auto-play audio if enabled
        if (this.audioEnabled && this.isAudioSupported) {
            await this.playTourAudio(step.description, this.currentLanguage);
        }
    }
    
    showTourStepUI(step, steps) {
        const overlay = document.getElementById('tourOverlay');
        const target = document.querySelector(step.target);
        
        if (!target) {
            console.warn('Tour target not found:', step.target);
            this.nextTourStep();
            return;
        }
        
        // Show overlay
        overlay.classList.remove('hidden');
        
        // Update step content
        const titleEl = document.getElementById('tourStepTitle');
        const descEl = document.getElementById('tourStepDescription');
        const progressEl = document.getElementById('tourProgress');
        
        if (titleEl) titleEl.textContent = step.title;
        if (descEl) descEl.textContent = step.description;
        if (progressEl) progressEl.textContent = `${this.tourStep + 1} / ${steps.length}`;
        
        // Position spotlight and tooltip
        this.positionTourElements(target, step.position);
        
        // Update button states
        this.updateTourButtons(steps);
        
        // Add ARIA live region announcement
        this.announceStepChange(step.title, step.description);
    }
    
    announceStepChange(title, description) {
        // Create or update ARIA live region for screen readers
        let liveRegion = document.getElementById('tourLiveRegion');
        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'tourLiveRegion';
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.style.position = 'absolute';
            liveRegion.style.left = '-10000px';
            liveRegion.style.width = '1px';
            liveRegion.style.height = '1px';
            liveRegion.style.overflow = 'hidden';
            document.body.appendChild(liveRegion);
        }
        
        setTimeout(() => {
            liveRegion.textContent = `Tour step: ${title}. ${description}`;
        }, 100);
    }
    
    positionTourElements(target, position) {
        const spotlight = document.querySelector('.tour-spotlight');
        const tooltip = document.querySelector('.tour-tooltip');
        
        if (!spotlight || !tooltip || !target) return;
        
        const rect = target.getBoundingClientRect();
        const padding = 20;
        
        // Position spotlight
        spotlight.style.left = `${rect.left - padding}px`;
        spotlight.style.top = `${rect.top - padding}px`;
        spotlight.style.width = `${rect.width + 2 * padding}px`;
        spotlight.style.height = `${rect.height + 2 * padding}px`;
        
        // Position tooltip
        let tooltipTop, tooltipLeft;
        
        switch (position) {
            case 'top':
                tooltipTop = rect.top - 250;
                tooltipLeft = rect.left + (rect.width / 2) - 200;
                break;
            case 'bottom':
                tooltipTop = rect.bottom + 20;
                tooltipLeft = rect.left + (rect.width / 2) - 200;
                break;
            case 'center':
                tooltipTop = window.innerHeight / 2 - 100;
                tooltipLeft = window.innerWidth / 2 - 200;
                break;
            default:
                tooltipTop = rect.top - 50;
                tooltipLeft = rect.right + 20;
        }
        
        // Keep tooltip in viewport
        tooltipTop = Math.max(20, Math.min(tooltipTop, window.innerHeight - 300));
        tooltipLeft = Math.max(20, Math.min(tooltipLeft, window.innerWidth - 420));
        
        tooltip.style.top = `${tooltipTop}px`;
        tooltip.style.left = `${tooltipLeft}px`;
    }
    
    updateTourButtons(steps) {
        const prevBtn = document.getElementById('tourPrevBtn');
        const nextBtn = document.getElementById('tourNextBtn');
        const finishBtn = document.getElementById('tourFinishBtn');
        
        if (prevBtn) {
            prevBtn.style.display = this.tourStep === 0 ? 'none' : 'flex';
        }
        
        if (nextBtn && finishBtn) {
            if (this.tourStep === steps.length - 1) {
                nextBtn.classList.add('hidden');
                finishBtn.classList.remove('hidden');
            } else {
                nextBtn.classList.remove('hidden');
                finishBtn.classList.add('hidden');
            }
        }
    }
    
    nextTourStep() {
        this.stopTourAudio();
        this.tourStep++;
        this.showTourStep();
    }
    
    prevTourStep() {
        if (this.tourStep > 0) {
            this.stopTourAudio();
            this.tourStep--;
            this.showTourStep();
        }
    }
    
    endTour() {
        console.log('Ending tour');
        this.stopTourAudio();
        this.isTourActive = false;
        
        const overlay = document.getElementById('tourOverlay');
        if (overlay) overlay.classList.add('hidden');
        
        // Remove live region
        const liveRegion = document.getElementById('tourLiveRegion');
        if (liveRegion) liveRegion.remove();
        
        this.showNotification(
            this.currentLanguage === 'en' ? 'Tour Complete!' : 'टूर पूरा!',
            this.currentLanguage === 'en' ? 
                'Great! You\'re now ready to use HealthAI TestGen effectively.' :
                'बहुत बढ़िया! अब आप HealthAI TestGen का प्रभावी रूप से उपयोग करने के लिए तैयार हैं।',
            'success'
        );
    }
    
    // Language System - FIXED
    toggleLanguage() {
        this.currentLanguage = this.currentLanguage === 'en' ? 'hi' : 'en';
        console.log('Language switched to:', this.currentLanguage);
        this.updateLanguageDisplay();
        
        this.showNotification(
            this.currentLanguage === 'en' ? 'Language Changed' : 'भाषा बदली गई',
            this.currentLanguage === 'en' ? 'Interface language changed to English' : 'इंटरफेस भाषा हिंदी में बदल गई',
            'info'
        );
    }
    
    updateLanguageDisplay() {
        const langButton = document.getElementById('currentLang');
        if (langButton) {
            langButton.textContent = this.currentLanguage.toUpperCase();
        }
        
        // Update all translatable elements
        document.querySelectorAll('[data-en]').forEach(element => {
            const key = this.currentLanguage === 'en' ? 'en' : 'hi';
            if (element.dataset[key]) {
                if (element.tagName === 'INPUT') {
                    element.placeholder = element.dataset[key + 'Placeholder'] || element.dataset[key];
                } else {
                    element.textContent = element.dataset[key];
                }
            }
        });
    }
    
    // Navigation System - FIXED
    navigateToScreen(screenId) {
        console.log('Navigating to screen:', screenId);
        
        // Hide current screen
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        const targetScreen = document.getElementById(screenId + 'Screen');
        if (targetScreen) {
            targetScreen.classList.add('active');
            console.log('Screen activated:', screenId);
        } else {
            console.error('Screen not found:', screenId + 'Screen');
            return;
        }
        
        // Update breadcrumb
        this.updateBreadcrumb(screenId);
        
        // Show/hide breadcrumb based on screen
        const breadcrumb = document.getElementById('breadcrumb');
        if (breadcrumb) {
            if (screenId === 'welcome') {
                breadcrumb.classList.add('hidden');
            } else {
                breadcrumb.classList.remove('hidden');
            }
        }
        
        this.currentScreen = screenId;
        
        // Special handling for specific screens
        if (screenId === 'traceability') {
            setTimeout(() => this.animateTraceabilityMap(), 300);
        } else if (screenId === 'judge') {
            setTimeout(() => this.animateConfidenceMeters(), 300);
        }
    }
    
    updateBreadcrumb(activeScreen) {
        document.querySelectorAll('.breadcrumb-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.screen === activeScreen) {
                item.classList.add('active');
            }
        });
    }
    
    // File Upload System - FIXED
    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    }
    
    handleDragLeave(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
    }
    
    handleFileDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.handleFileSelection(files[0]);
        }
    }
    
    handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            this.handleFileSelection(files[0]);
        }
    }
    
    selectSampleDocument(button) {
        console.log('Sample document selected');
        // Highlight selected sample
        document.querySelectorAll('.sample-doc-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        const docType = button.dataset.doc;
        const docName = docType === 'ehr-requirements' ? 'EHR_System_Requirements.pdf' : 'Medical_Device_Integration.xml';
        
        // Show file info
        this.showFileInfo({
            name: docName,
            size: docType === 'ehr-requirements' ? 2.4 : 1.8,
            type: docType === 'ehr-requirements' ? 'PDF Document' : 'XML Document',
            processingTime: docType === 'ehr-requirements' ? 45 : 35
        });
        
        // Enable process button
        const processBtn = document.getElementById('processBtn');
        if (processBtn) {
            processBtn.disabled = false;
            console.log('Process button enabled');
        }
    }
    
    handleFileSelection(file) {
        // Validate file type
        const allowedTypes = ['.pdf', '.doc', '.docx', '.xml'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!allowedTypes.includes(fileExtension)) {
            this.showNotification(
                this.currentLanguage === 'en' ? 'Invalid File Type' : 'अमान्य फ़ाइल प्रकार',
                this.currentLanguage === 'en' ? 
                    'Please upload a PDF, DOC, DOCX, or XML file.' :
                    'कृपया PDF, DOC, DOCX, या XML फ़ाइल अपलोड करें।',
                'error'
            );
            return;
        }
        
        // Calculate estimated processing time based on file size
        const sizeInMB = file.size / (1024 * 1024);
        const processingTime = Math.max(30, Math.round(sizeInMB * 20));
        
        this.showFileInfo({
            name: file.name,
            size: sizeInMB,
            type: this.getFileTypeDisplay(fileExtension),
            processingTime: processingTime
        });
        
        // Enable process button
        const processBtn = document.getElementById('processBtn');
        if (processBtn) {
            processBtn.disabled = false;
        }
    }
    
    showFileInfo(fileData) {
        const fileInfo = document.getElementById('fileInfo');
        const fileName = document.getElementById('fileName');
        const fileSize = document.getElementById('fileSize');
        const fileType = document.getElementById('fileType');
        const processingTime = document.getElementById('processingTime');
        
        if (fileName) fileName.textContent = fileData.name;
        if (fileSize) fileSize.textContent = `${fileData.size.toFixed(1)} MB`;
        if (fileType) fileType.textContent = fileData.type;
        if (processingTime) {
            processingTime.textContent = this.currentLanguage === 'en' ? 
                `Est. ${fileData.processingTime} seconds` :
                `अनु. ${fileData.processingTime} सेकंड`;
        }
        
        if (fileInfo) {
            fileInfo.classList.remove('hidden');
        }
        
        // Update upload area
        const uploadContent = document.querySelector('.upload-content');
        if (uploadContent) {
            uploadContent.innerHTML = `
                <i class="fas fa-check-circle" style="color: var(--color-success);"></i>
                <h3>${fileData.name}</h3>
                <p data-en="Ready to process with AI" data-hi="AI के साथ प्रक्रिया के लिए तैयार">${this.currentLanguage === 'en' ? 'Ready to process with AI' : 'AI के साथ प्रक्रिया के लिए तैयार'}</p>
            `;
        }
    }
    
    getFileTypeDisplay(extension) {
        const types = {
            '.pdf': 'PDF Document',
            '.doc': 'Word Document', 
            '.docx': 'Word Document',
            '.xml': 'XML Document'
        };
        return types[extension] || 'Document';
    }
    
    // AI Processing System - FIXED
    async startProcessing() {
        if (this.isProcessing) return;
        
        console.log('Starting AI processing...');
        this.isProcessing = true;
        this.navigateToScreen('processing');
        
        const typingMessages = [
            this.currentLanguage === 'en' ? "Analyzing document structure..." : "दस्तावेज़ संरचना का विश्लेषण...",
            this.currentLanguage === 'en' ? "Identifying healthcare requirements..." : "स्वास्थ्य सेवा आवश्यकताओं की पहचान...", 
            this.currentLanguage === 'en' ? "Mapping compliance standards..." : "अनुपालन मानकों को मैप करना...",
            this.currentLanguage === 'en' ? "Generating test cases..." : "परीक्षण मामले जेनरेट करना...",
            this.currentLanguage === 'en' ? "Validating against regulations..." : "नियमों के विरुद्ध सत्यापन...",
            this.currentLanguage === 'en' ? "Finalizing test suite..." : "परीक्षण सूट को अंतिम रूप देना..."
        ];
        
        let progress = 0;
        let messageIndex = 0;
        
        // Animate counters
        this.animateProcessingStats();
        
        const updateProgress = () => {
            progress += Math.random() * 20 + 10;
            if (progress > 100) progress = 100;
            
            const progressFill = document.getElementById('progressFill');
            const progressPercentage = document.getElementById('progressPercentage');
            
            if (progressFill) progressFill.style.width = `${progress}%`;
            if (progressPercentage) progressPercentage.textContent = `${Math.round(progress)}%`;
            
            // Update typing animation
            if (messageIndex < typingMessages.length) {
                this.typeMessage(typingMessages[messageIndex]);
                messageIndex++;
            }
            
            // Show achievements
            if (progress > 30) {
                const achievement1 = document.getElementById('achievement1');
                if (achievement1) achievement1.classList.add('completed');
            }
            if (progress > 60) {
                const achievement2 = document.getElementById('achievement2');
                if (achievement2) achievement2.classList.add('completed');
            }
            if (progress > 90) {
                const achievement3 = document.getElementById('achievement3');
                if (achievement3) achievement3.classList.add('completed');
            }
            
            if (progress < 100) {
                setTimeout(updateProgress, 800 + Math.random() * 400);
            } else {
                // Processing complete
                setTimeout(() => {
                    console.log('Processing complete, navigating to dashboard');
                    this.isProcessing = false;
                    this.navigateToScreen('dashboard');
                    
                    this.showNotification(
                        this.currentLanguage === 'en' ? 'Processing Complete!' : 'प्रसंस्करण पूर्ण!',
                        this.currentLanguage === 'en' ? 
                            'Generated 12 test cases from 6 requirements with 100% coverage.' :
                            '6 आवश्यकताओं से 12 परीक्षण मामले 100% कवरेज के साथ जेनरेट किए गए।',
                        'success'
                    );
                }, 1000);
            }
        };
        
        updateProgress();
    }
    
    animateProcessingStats() {
        const counters = [
            { element: 'documentsProcessed', target: 1, current: 0 },
            { element: 'requirementsFound', target: 6, current: 0 },
            { element: 'testCasesGenerated', target: 12, current: 0 }
        ];
        
        const animateCounter = (counter) => {
            const element = document.getElementById(counter.element);
            if (!element) return;
            
            const increment = Math.ceil(counter.target / 20);
            
            const update = () => {
                counter.current = Math.min(counter.current + increment, counter.target);
                element.textContent = counter.current;
                
                if (counter.current < counter.target) {
                    setTimeout(update, 100);
                }
            };
            
            setTimeout(update, Math.random() * 2000);
        };
        
        counters.forEach(animateCounter);
    }
    
    typeMessage(message) {
        const typingElement = document.getElementById('typingText');
        if (!typingElement) return;
        
        typingElement.textContent = '';
        
        let charIndex = 0;
        const typeChar = () => {
            if (charIndex < message.length) {
                typingElement.textContent += message[charIndex];
                charIndex++;
                setTimeout(typeChar, 50 + Math.random() * 30);
            }
        };
        
        typeChar();
    }
    
    // Test Cases Management - FIXED
    renderTestCasesTable() {
        const tbody = document.getElementById('testCasesTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        let filteredCases = this.testCases;
        
        // Apply filter
        if (this.currentFilter !== 'all') {
            filteredCases = this.testCases.filter(tc => tc.priority.toLowerCase() === this.currentFilter);
        }
        
        // Apply search
        const searchInput = document.getElementById('searchInput');
        const searchTerm = searchInput?.value?.toLowerCase() || '';
        if (searchTerm) {
            filteredCases = filteredCases.filter(tc => 
                tc.title.toLowerCase().includes(searchTerm) ||
                tc.description.toLowerCase().includes(searchTerm) ||
                tc.test_id.toLowerCase().includes(searchTerm)
            );
        }
        
        filteredCases.forEach(testCase => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><code>${testCase.test_id}</code></td>
                <td><code>${testCase.req_id}</code></td>
                <td>
                    <strong>${testCase.title}</strong>
                    <br>
                    <small style="color: var(--color-text-secondary);">${testCase.description.substring(0, 80)}...</small>
                </td>
                <td><span class="priority-badge priority-${testCase.priority.toLowerCase()}">${testCase.priority}</span></td>
                <td><small>${testCase.compliance_standard}</small></td>
                <td><span class="status-badge">${testCase.status}</span></td>
            `;
            
            row.addEventListener('click', () => this.showTestCaseDetails(testCase));
            tbody.appendChild(row);
        });
        
        // Update statistics
        const totalTestCases = document.getElementById('totalTestCases');
        const totalRequirements = document.getElementById('totalRequirements');
        
        if (totalTestCases) totalTestCases.textContent = this.testCases.length;
        if (totalRequirements) totalRequirements.textContent = this.requirements.length;
    }
    
    showTestCaseDetails(testCase) {
        const modal = document.getElementById('testCaseModal');
        const modalTitle = document.getElementById('modalTestCaseTitle');
        const modalBody = document.getElementById('modalBody');
        
        if (modalTitle) modalTitle.textContent = `${testCase.test_id}: ${testCase.title}`;
        
        if (modalBody) {
            modalBody.innerHTML = `
                <div style="margin-bottom: var(--space-16);">
                    <strong>Description:</strong>
                    <p>${testCase.description}</p>
                </div>
                
                <div style="margin-bottom: var(--space-16);">
                    <strong>Test Steps:</strong>
                    <ol style="margin: var(--space-8) 0; padding-left: var(--space-20);">
                        ${testCase.test_steps.map(step => `<li style="margin-bottom: var(--space-4);">${step}</li>`).join('')}
                    </ol>
                </div>
                
                <div style="margin-bottom: var(--space-16);">
                    <strong>Expected Result:</strong>
                    <p style="background: var(--color-bg-3); padding: var(--space-12); border-radius: var(--radius-sm);">${testCase.expected_result}</p>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-16);">
                    <div>
                        <strong>Priority:</strong>
                        <span class="priority-badge priority-${testCase.priority.toLowerCase()}">${testCase.priority}</span>
                    </div>
                    <div>
                        <strong>Compliance:</strong>
                        <p>${testCase.compliance_standard}</p>
                    </div>
                </div>
            `;
        }
        
        if (modal) modal.classList.remove('hidden');
    }
    
    filterTestCases(searchTerm) {
        this.renderTestCasesTable();
    }
    
    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter tag
        document.querySelectorAll('.filter-tag').forEach(tag => {
            tag.classList.remove('active');
            if (tag.dataset.filter === filter) {
                tag.classList.add('active');
            }
        });
        
        this.renderTestCasesTable();
    }
    
    // Working Export System - FIXED
    async handleDownload(format) {
        console.log(`Starting download for format: ${format}`);
        
        // Show download progress modal
        this.showDownloadProgress(format);
        
        // Simulate realistic download preparation time
        await this.simulateDownloadProgress(format);
        
        try {
            let fileContent, fileName, mimeType;
            
            switch (format) {
                case 'csv':
                    ({ fileContent, fileName, mimeType } = this.generateCSV());
                    break;
                case 'excel':
                    ({ fileContent, fileName, mimeType } = this.generateExcel());
                    break;
                case 'pdf':
                    ({ fileContent, fileName, mimeType } = this.generatePDF());
                    break;
                default:
                    throw new Error('Unsupported format');
            }
            
            // Create and download file
            this.downloadFile(fileContent, fileName, mimeType);
            
            // Add to export history
            this.addToExportHistory(format, fileName);
            
            // Close download modal
            this.closeModal(document.getElementById('downloadProgressModal'));
            
            // Show success message
            this.showSuccessMessage(
                this.currentLanguage === 'en' ? 'Download Complete!' : 'डाउनलोड पूर्ण!',
                this.currentLanguage === 'en' ? 
                    `${fileName} has been downloaded successfully.` :
                    `${fileName} सफलतापूर्वक डाउनलोड हो गया है।`
            );
            
        } catch (error) {
            console.error('Download error:', error);
            this.closeModal(document.getElementById('downloadProgressModal'));
            
            this.showNotification(
                this.currentLanguage === 'en' ? 'Download Failed' : 'डाउनलोड असफल',
                this.currentLanguage === 'en' ? 
                    'There was an error generating the file. Please try again.' :
                    'फ़ाइल जेनरेट करने में त्रुटि थी। कृपया पुनः प्रयास करें।',
                'error'
            );
        }
    }
    
    async handleIntegrationDownload(integration) {
        const templates = {
            jira: { format: 'csv', name: 'Jira_Import_Template' },
            azure: { format: 'excel', name: 'Azure_DevOps_Template' }
        };
        
        const template = templates[integration];
        if (template) {
            await this.handleDownload(template.format);
        }
    }
    
    showDownloadProgress(format) {
        const modal = document.getElementById('downloadProgressModal');
        const title = document.getElementById('downloadTitle');
        
        const formatNames = {
            csv: 'CSV',
            excel: 'Excel',
            pdf: 'PDF'
        };
        
        if (title) {
            title.textContent = this.currentLanguage === 'en' ? 
                `Preparing ${formatNames[format]} Export...` :
                `${formatNames[format]} निर्यात तैयार हो रहा है...`;
        }
        
        if (modal) modal.classList.remove('hidden');
    }
    
    async simulateDownloadProgress(format) {
        const progressFill = document.getElementById('downloadProgressFill');
        const progressPercentage = document.getElementById('downloadPercentage');
        const progressStatus = document.getElementById('downloadStatus');
        
        const steps = [
            { percent: 20, status: this.currentLanguage === 'en' ? 'Collecting data...' : 'डेटा एकत्रित कर रहा है...' },
            { percent: 45, status: this.currentLanguage === 'en' ? 'Formatting content...' : 'सामग्री को फॉर्मेट कर रहा है...' },
            { percent: 70, status: this.currentLanguage === 'en' ? 'Generating file...' : 'फ़ाइल जेनरेट कर रहा है...' },
            { percent: 90, status: this.currentLanguage === 'en' ? 'Finalizing...' : 'अंतिम रूप दे रहा है...' },
            { percent: 100, status: this.currentLanguage === 'en' ? 'Complete!' : 'पूर्ण!' }
        ];
        
        for (const step of steps) {
            if (progressFill) progressFill.style.width = `${step.percent}%`;
            if (progressPercentage) progressPercentage.textContent = `${step.percent}%`;
            if (progressStatus) progressStatus.textContent = step.status;
            
            await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 300));
        }
    }
    
    generateCSV() {
        const timestamp = new Date().toISOString().split('T')[0];
        const fileName = `Healthcare_TestCases_${timestamp}.csv`;
        
        // CSV Headers
        const headers = [
            'Test ID',
            'Requirement ID', 
            'Title',
            'Description',
            'Priority',
            'Compliance Standard',
            'Status',
            'Expected Result',
            'Test Steps'
        ];
        
        // CSV Content
        let csvContent = headers.join(',') + '\n';
        
        this.testCases.forEach(testCase => {
            const row = [
                `"${testCase.test_id}"`,
                `"${testCase.req_id}"`,
                `"${testCase.title}"`,
                `"${testCase.description.replace(/"/g, '""')}"`,
                `"${testCase.priority}"`,
                `"${testCase.compliance_standard}"`,
                `"${testCase.status}"`,
                `"${testCase.expected_result.replace(/"/g, '""')}"`,
                `"${testCase.test_steps.join('; ').replace(/"/g, '""')}"`
            ];
            csvContent += row.join(',') + '\n';
        });
        
        return {
            fileContent: csvContent,
            fileName: fileName,
            mimeType: 'text/csv;charset=utf-8;'
        };
    }
    
    generateExcel() {
        const timestamp = new Date().toISOString().split('T')[0];
        const fileName = `Healthcare_TestCases_${timestamp}.xlsx`;
        
        // Create a simple Excel-like format using HTML table
        const htmlContent = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
                <style>
                    table { border-collapse: collapse; width: 100%; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #4f9eea; color: white; font-weight: bold; }
                </style>
            </head>
            <body>
                <table>
                    <thead>
                        <tr>
                            <th>Test ID</th>
                            <th>Requirement ID</th>
                            <th>Title</th>
                            <th>Description</th>
                            <th>Priority</th>
                            <th>Compliance Standard</th>
                            <th>Status</th>
                            <th>Expected Result</th>
                            <th>Test Steps</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.testCases.map(testCase => `
                            <tr>
                                <td>${testCase.test_id}</td>
                                <td>${testCase.req_id}</td>
                                <td>${testCase.title}</td>
                                <td>${testCase.description}</td>
                                <td>${testCase.priority}</td>
                                <td>${testCase.compliance_standard}</td>
                                <td>${testCase.status}</td>
                                <td>${testCase.expected_result}</td>
                                <td>${testCase.test_steps.join(' | ')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;
        
        return {
            fileContent: htmlContent,
            fileName: fileName,
            mimeType: 'application/vnd.ms-excel'
        };
    }
    
    generatePDF() {
        const timestamp = new Date().toISOString().split('T')[0];
        const fileName = `Healthcare_TestCases_Report_${timestamp}.html`;
        
        // Generate a comprehensive HTML report that can be saved as PDF
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Healthcare Test Cases Report</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; color: #263238; }
                    .header { text-align: center; border-bottom: 2px solid #4f9eea; padding-bottom: 20px; margin-bottom: 30px; }
                    .logo { color: #4f9eea; font-size: 24px; font-weight: bold; }
                    .meta-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
                    .summary { background: #f5f7fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #4f9eea; }
                    .test-case { border: 1px solid #e0e7ff; border-radius: 8px; margin-bottom: 20px; padding: 20px; }
                    .test-case h3 { color: #4f9eea; margin-top: 0; }
                    .priority { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
                    .priority-critical { background: rgba(229, 115, 115, 0.2); color: #e57373; }
                    .priority-high { background: rgba(255, 183, 77, 0.2); color: #ffb74d; }
                    .priority-medium { background: rgba(79, 158, 234, 0.2); color: #4f9eea; }
                    .steps { padding-left: 20px; }
                    .expected { background: rgba(139, 195, 74, 0.1); padding: 10px; border-radius: 4px; margin-top: 10px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo">🏥 HealthAI TestGen</div>
                    <h1>Healthcare Test Cases Report</h1>
                    <p>AI-Generated Test Cases for Healthcare Software Requirements</p>
                </div>
                
                <div class="meta-info">
                    <div>
                        <strong>Generated:</strong> ${new Date().toLocaleString()}<br>
                        <strong>Document:</strong> Healthcare_Requirements_v2.pdf
                    </div>
                    <div>
                        <strong>Total Requirements:</strong> ${this.requirements.length}<br>
                        <strong>Total Test Cases:</strong> ${this.testCases.length}<br>
                        <strong>Coverage:</strong> 100%
                    </div>
                </div>
                
                <div class="summary">
                    <h2>Executive Summary</h2>
                    <p>This report contains ${this.testCases.length} test cases generated from ${this.requirements.length} healthcare software requirements using AI analysis. All test cases are mapped to compliance standards including HIPAA, FDA regulations, and IEC 62304.</p>
                    <p><strong>Priority Distribution:</strong></p>
                    <ul>
                        <li>Critical: ${this.testCases.filter(tc => tc.priority === 'Critical').length} test cases</li>
                        <li>High: ${this.testCases.filter(tc => tc.priority === 'High').length} test cases</li>
                        <li>Medium: ${this.testCases.filter(tc => tc.priority === 'Medium').length} test cases</li>
                    </ul>
                </div>
                
                <h2>Test Cases</h2>
                ${this.testCases.map(testCase => `
                    <div class="test-case">
                        <h3>${testCase.test_id}: ${testCase.title}</h3>
                        <p><strong>Requirement:</strong> ${testCase.req_id}</p>
                        <p><strong>Priority:</strong> <span class="priority priority-${testCase.priority.toLowerCase()}">${testCase.priority}</span></p>
                        <p><strong>Compliance:</strong> ${testCase.compliance_standard}</p>
                        <p><strong>Description:</strong> ${testCase.description}</p>
                        <p><strong>Test Steps:</strong></p>
                        <ol class="steps">
                            ${testCase.test_steps.map(step => `<li>${step}</li>`).join('')}
                        </ol>
                        <div class="expected">
                            <strong>Expected Result:</strong> ${testCase.expected_result}
                        </div>
                    </div>
                `).join('')}
                
                <div style="margin-top: 40px; text-align: center; color: #546e7a; font-size: 12px;">
                    <p>Generated by HealthAI TestGen - AI-Powered Healthcare Test Case Generator</p>
                    <p>This document contains ${this.testCases.length} test cases with 100% requirements coverage</p>
                </div>
            </body>
            </html>
        `;
        
        return {
            fileContent: htmlContent,
            fileName: fileName,
            mimeType: 'text/html'
        };
    }
    
    downloadFile(content, fileName, mimeType) {
        console.log('Downloading file:', fileName);
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the URL object
        setTimeout(() => window.URL.revokeObjectURL(url), 100);
    }
    
    addToExportHistory(format, fileName) {
        const historyItem = {
            format: format,
            fileName: fileName,
            date: new Date(),
            size: Math.random() * 5 + 1
        };
        
        this.exportHistory.unshift(historyItem);
        if (this.exportHistory.length > 10) {
            this.exportHistory = this.exportHistory.slice(0, 10);
        }
        this.renderExportHistory();
    }
    
    renderExportHistory() {
        const historyList = document.getElementById('exportHistory');
        if (!historyList) return;
        
        if (this.exportHistory.length === 0) {
            historyList.innerHTML = `
                <div class="history-item">
                    <i class="fas fa-info-circle"></i>
                    <div class="history-details">
                        <span class="history-name">${this.currentLanguage === 'en' ? 'No exports yet' : 'अभी तक कोई निर्यात नहीं'}</span>
                        <span class="history-date">${this.currentLanguage === 'en' ? 'Export files to see history' : 'इतिहास देखने के लिए फ़ाइलें निर्यात करें'}</span>
                    </div>
                </div>
            `;
            return;
        }
        
        const formatIcons = {
            csv: 'fa-file-csv',
            excel: 'fa-file-excel', 
            pdf: 'fa-file-pdf'
        };
        
        historyList.innerHTML = this.exportHistory.map(item => `
            <div class="history-item">
                <i class="fas ${formatIcons[item.format] || 'fa-file'}"></i>
                <div class="history-details">
                    <span class="history-name">${item.fileName}</span>
                    <span class="history-date">${item.date.toLocaleDateString()} ${item.date.toLocaleTimeString()}</span>
                </div>
                <div style="font-size: var(--font-size-sm); color: var(--color-text-secondary);">
                    ${item.size.toFixed(1)} MB
                </div>
            </div>
        `).join('');
    }
    
    // Traceability Map - FIXED
    createTraceabilityMap() {
        const mapContainer = document.getElementById('traceabilityMap');
        if (!mapContainer) return;
        
        const width = mapContainer.offsetWidth || 800;
        const height = mapContainer.offsetHeight || 400;
        
        // Create SVG
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'traceability-svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        
        // Position requirements on the left
        const reqX = 100;
        const reqSpacing = height / (this.requirements.length + 1);
        
        // Position test cases on the right
        const testX = width - 150;
        const testSpacing = height / (this.testCases.length + 1);
        
        // Draw connections first (so they appear behind nodes)
        this.testCases.forEach((testCase, testIndex) => {
            const reqIndex = this.requirements.findIndex(req => req.req_id === testCase.req_id);
            if (reqIndex >= 0) {
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('class', 'trace-line');
                line.setAttribute('x1', reqX + 20);
                line.setAttribute('y1', (reqIndex + 1) * reqSpacing);
                line.setAttribute('x2', testX - 20);
                line.setAttribute('y2', (testIndex + 1) * testSpacing);
                line.style.opacity = '0';
                svg.appendChild(line);
            }
        });
        
        // Draw requirement nodes
        this.requirements.forEach((req, index) => {
            const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('class', 'req-node');
            circle.setAttribute('cx', reqX);
            circle.setAttribute('cy', (index + 1) * reqSpacing);
            circle.setAttribute('r', 15);
            circle.style.opacity = '0';
            
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('class', 'node-label');
            text.setAttribute('x', reqX);
            text.setAttribute('y', (index + 1) * reqSpacing - 25);
            text.textContent = req.req_id;
            text.style.opacity = '0';
            
            group.appendChild(circle);
            group.appendChild(text);
            
            // Add hover tooltip
            this.addTooltip(group, `${req.req_id}: ${req.title}`);
            
            svg.appendChild(group);
        });
        
        // Draw test case nodes
        this.testCases.forEach((testCase, index) => {
            const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('class', 'test-node');
            circle.setAttribute('cx', testX);
            circle.setAttribute('cy', (index + 1) * testSpacing);
            circle.setAttribute('r', 10);
            circle.style.opacity = '0';
            
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('class', 'node-label');
            text.setAttribute('x', testX);
            text.setAttribute('y', (index + 1) * testSpacing + 20);
            text.textContent = testCase.test_id.split('-').slice(-1)[0];
            text.style.opacity = '0';
            
            group.appendChild(circle);
            group.appendChild(text);
            
            // Add hover tooltip
            this.addTooltip(group, `${testCase.test_id}: ${testCase.title}`);
            
            svg.appendChild(group);
        });
        
        mapContainer.innerHTML = '';
        mapContainer.appendChild(svg);
    }
    
    animateTraceabilityMap() {
        const svg = document.querySelector('.traceability-svg');
        if (!svg) return;
        
        const elements = svg.querySelectorAll('.req-node, .test-node, .trace-line, .node-label');
        
        elements.forEach((element, index) => {
            setTimeout(() => {
                element.style.transition = 'opacity 0.5s ease';
                element.style.opacity = element.classList.contains('trace-line') ? '0.6' : '1';
            }, index * 100);
        });
    }
    
    addTooltip(element, text) {
        let tooltip = null;
        
        element.addEventListener('mouseenter', (e) => {
            tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = text;
            document.body.appendChild(tooltip);
            
            const rect = element.getBoundingClientRect();
            tooltip.style.left = `${rect.left + rect.width / 2}px`;
            tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
            
            setTimeout(() => tooltip.classList.add('visible'), 10);
        });
        
        element.addEventListener('mouseleave', () => {
            if (tooltip) {
                tooltip.remove();
                tooltip = null;
            }
        });
    }
    
    // Judge Mode - FIXED
    showFutureVision() {
        const modal = document.getElementById('futureVisionModal');
        if (modal) modal.classList.remove('hidden');
    }
    
    animateConfidenceMeters() {
        const meters = document.querySelectorAll('.confidence-fill');
        meters.forEach((meter, index) => {
            setTimeout(() => {
                const width = meter.style.width;
                meter.style.width = '0%';
                setTimeout(() => {
                    meter.style.width = width;
                }, 100);
            }, index * 200);
        });
    }
    
    // Map Controls - FIXED
    zoomMap(scale) {
        const svg = document.querySelector('.traceability-svg');
        if (!svg) return;
        
        const currentTransform = svg.style.transform || 'scale(1)';
        const currentScale = parseFloat(currentTransform.match(/scale\(([\d.]+)\)/)?.[1] || 1);
        const newScale = Math.max(0.5, Math.min(3, currentScale * scale));
        
        svg.style.transform = `scale(${newScale})`;
        svg.style.transformOrigin = 'center center';
    }
    
    resetMapZoom() {
        const svg = document.querySelector('.traceability-svg');
        if (svg) {
            svg.style.transform = 'scale(1)';
        }
    }
    
    // Modal Management - FIXED
    closeModal(modal) {
        if (modal) modal.classList.add('hidden');
    }
    
    // Notification System - FIXED
    showNotification(title, message, type = 'info') {
        const toast = document.getElementById('notificationToast');
        const toastTitle = document.getElementById('toastTitle');
        const toastText = document.getElementById('toastText');
        const toastIcon = document.querySelector('.toast-icon i');
        
        if (toastTitle) toastTitle.textContent = title;
        if (toastText) toastText.textContent = message;
        
        // Update icon based on type
        if (toastIcon) {
            toastIcon.className = `fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}`;
            toastIcon.style.color = type === 'success' ? 'var(--color-success)' : type === 'error' ? 'var(--color-error)' : 'var(--color-primary)';
        }
        
        if (toast) {
            toast.classList.remove('hidden');
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                this.hideNotification();
            }, 5000);
        }
    }
    
    hideNotification() {
        const toast = document.getElementById('notificationToast');
        if (toast) toast.classList.add('hidden');
    }
    
    showSuccessMessage(title, message) {
        const overlay = document.getElementById('successOverlay');
        const titleElement = document.getElementById('successMessage');
        const detailsElement = document.getElementById('successDetails');
        
        if (titleElement) titleElement.textContent = title;
        if (detailsElement) detailsElement.textContent = message;
        
        if (overlay) {
            overlay.classList.remove('hidden');
            
            setTimeout(() => {
                overlay.classList.add('hidden');
            }, 3000);
        }
    }
    
    // Utility Functions - FIXED
    setupTooltips() {
        // Add tooltips to various elements
        const tooltips = [
            { selector: '#traceabilityBtn', text: 'View requirements to test case mapping' },
            { selector: '#exportBtn', text: 'Export test cases in various formats' }, 
            { selector: '.priority-badge', text: 'Test case priority level' },
            { selector: '.status-badge', text: 'Test execution status' },
            { selector: '#searchInput', text: 'Search through test cases' },
            { selector: '.filter-tag', text: 'Filter by priority level' }
        ];
        
        tooltips.forEach(({ selector, text }) => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (!element.title) {
                    element.title = text;
                }
            });
        });
    }
}

// Initialize the application - FIXED
console.log('Script loaded, initializing app...');
const app = new HealthcareAITestGen();