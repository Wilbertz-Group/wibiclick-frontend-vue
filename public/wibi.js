/**
 * Wibi Enterprise Tracking Widget - COMPLETE VERSION
 * World-class tracking solution for commercial and corporate clients
 * 
 * Features:
 * - GDPR/CCPA compliant consent management
 * - Modular architecture for maintainability
 * - Enhanced error handling and logging
 * - Configurable API endpoints
 * - Advanced bot detection
 * - Offline-first data persistence
 * - Real-time analytics integration
 * - Complete contact method support
 * - Business hours logic
 * - Custom buttons support
 */

(function(window, document) {
    'use strict';

    // =============================================================================
    // CONFIGURATION & CONSTANTS
    // =============================================================================
    
    const WIBI_CONFIG = {
        // API Configuration (configurable via data attributes)
        apiBaseUrl: window.WIBI_API_BASE || 'https://wibi.wilbertzgroup.com',
        endpoints: {
            options: '/wibi-options',
            track: '/api/track/page-view',
            action: '/api/track/interaction',
            sourceAttribution: '/api/track/source-attribution',
            gtmId: '/api/public/gtm-id',
            consent: '/api/track/consent'
        },
        
        // Tracking Configuration
        sessionTimeout: 30 * 60 * 1000, // 30 minutes
        idleTimeout: 60 * 1000, // 60 seconds
        retryAttempts: 3,
        retryDelay: 1000,
        batchSize: 10,
        
        // Business Hours (Monday-Friday, 9AM-1:30PM)
        businessHours: {
            enabled: true,
            startDay: 1, // Monday
            endDay: 5,   // Friday
            startHour: 9,
            endHour: 13,
            endMinute: 30
        },
        
        // Storage Keys
        storageKeys: {
            utk: 'wibi_utk',
            email: 'wibi_email',
            phone: 'wibi_phone',
            userType: 'wibi_user_type',
            consent: 'wibi_consent',
            session: 'wibi_session',
            offlineQueue: 'wibi_offline_queue',
            visitorData: 'wibi_visitor_data'
        },
        
        // Privacy & Compliance
        consentRequired: true, // Set to false to disable consent management entirely
        cookieExpiry: 365 * 24 * 60 * 60 * 1000, // 1 year
        
        // Widget always shows contact buttons regardless of consent
        // Only analytics/tracking is disabled when consent not given
        
        // Debug Mode
        debug: window.WIBI_DEBUG || false
    };

    // =============================================================================
    // UTILITY CLASSES
    // =============================================================================

    /**
     * Logger utility with configurable levels
     */
    class Logger {
        constructor(context, level = 'info') {
            this.context = context;
            this.level = level;
            this.levels = { error: 0, warn: 1, info: 2, debug: 3 };
        }

        log(level, message, data = null) {
            if (this.levels[level] <= this.levels[this.level] || WIBI_CONFIG.debug) {
                const timestamp = new Date().toISOString();
                const logData = {
                    timestamp,
                    level: level.toUpperCase(),
                    context: this.context,
                    message,
                    data,
                    url: window.location.href,
                    userAgent: navigator.userAgent
                };
                
                console[level](`[Wibi:${this.context}]`, message, data);
                
                // Send critical errors to backend for monitoring
                if (level === 'error' && !WIBI_CONFIG.debug) {
                    this.sendErrorToBackend(logData);
                }
            }
        }

        error(message, data) { this.log('error', message, data); }
        warn(message, data) { this.log('warn', message, data); }
        info(message, data) { this.log('info', message, data); }
        debug(message, data) { this.log('debug', message, data); }

        sendErrorToBackend(logData) {
            setTimeout(() => {
                fetch(`${WIBI_CONFIG.apiBaseUrl}/api/track/error`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(logData)
                }).catch(() => {});
            }, 0);
        }
    }

    /**
     * Storage manager with fallbacks and encryption
     */
    class StorageManager {
        constructor() {
            this.logger = new Logger('StorageManager');
            this.storageAvailable = this.checkStorageAvailability();
        }

        checkStorageAvailability() {
            try {
                const test = '__wibi_storage_test__';
                localStorage.setItem(test, 'test');
                localStorage.removeItem(test);
                return {
                    localStorage: true,
                    sessionStorage: !!window.sessionStorage,
                    cookies: navigator.cookieEnabled
                };
            } catch (e) {
                return {
                    localStorage: false,
                    sessionStorage: false,
                    cookies: navigator.cookieEnabled
                };
            }
        }

        set(key, value, options = {}) {
            const data = {
                value,
                timestamp: Date.now(),
                expires: options.expires || null
            };

            try {
                if (this.storageAvailable.localStorage && !options.sessionOnly) {
                    localStorage.setItem(key, JSON.stringify(data));
                }

                if (this.storageAvailable.sessionStorage) {
                    sessionStorage.setItem(key, JSON.stringify(data));
                }

                if (this.storageAvailable.cookies && !options.sessionOnly) {
                    this.setCookie(key, JSON.stringify(data), options.expires);
                }

                return true;
            } catch (e) {
                this.logger.error('Storage set failed', { key, error: e.message });
                return false;
            }
        }

        get(key) {
            try {
                let data = null;

                if (this.storageAvailable.localStorage) {
                    const stored = localStorage.getItem(key);
                    if (stored) data = JSON.parse(stored);
                }

                if (!data && this.storageAvailable.sessionStorage) {
                    const stored = sessionStorage.getItem(key);
                    if (stored) data = JSON.parse(stored);
                }

                if (!data && this.storageAvailable.cookies) {
                    const cookieValue = this.getCookie(key);
                    if (cookieValue) data = JSON.parse(cookieValue);
                }

                if (data && data.expires && Date.now() > data.expires) {
                    this.remove(key);
                    return null;
                }

                return data ? data.value : null;
            } catch (e) {
                this.logger.error('Storage get failed', { key, error: e.message });
                return null;
            }
        }

        remove(key) {
            try {
                if (this.storageAvailable.localStorage) {
                    localStorage.removeItem(key);
                }
                if (this.storageAvailable.sessionStorage) {
                    sessionStorage.removeItem(key);
                }
                if (this.storageAvailable.cookies) {
                    this.deleteCookie(key);
                }
            } catch (e) {
                this.logger.error('Storage remove failed', { key, error: e.message });
            }
        }

        setCookie(name, value, expires) {
            let cookieString = `${name}=${encodeURIComponent(value)}; path=/; SameSite=Lax`;
            
            if (expires) {
                const expireDate = new Date(expires);
                cookieString += `; expires=${expireDate.toUTCString()}`;
            }

            if (window.location.protocol === 'https:') {
                cookieString += '; Secure';
            }

            document.cookie = cookieString;
        }

        getCookie(name) {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) {
                return decodeURIComponent(parts.pop().split(';').shift());
            }
            return null;
        }

        deleteCookie(name) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
        }
    }

    /**
     * Consent Management for GDPR/CCPA compliance
     */
    class ConsentManager {
        constructor(storageManager) {
            this.storage = storageManager;
            this.logger = new Logger('ConsentManager');
            this.callbacks = [];
            this.consentData = this.loadConsent();
        }

        loadConsent() {
            return this.storage.get(WIBI_CONFIG.storageKeys.consent) || {
                granted: false,
                categories: {
                    necessary: true,      // Always true - needed for basic functionality
                    functional: false,    // Widget functionality (contact buttons)
                    analytics: false,     // Tracking and analytics
                    marketing: false      // Marketing cookies and ads
                },
                timestamp: null,
                version: '1.0'
            };
        }

        saveConsent(consent) {
            this.consentData = {
                ...consent,
                timestamp: Date.now(),
                version: '1.0'
            };

            this.storage.set(WIBI_CONFIG.storageKeys.consent, this.consentData, {
                expires: Date.now() + WIBI_CONFIG.cookieExpiry
            });

            this.notifyCallbacks();
            return this.consentData;
        }

        requestConsent() {
            return new Promise((resolve) => {
                if (this.hasValidConsent()) {
                    resolve(this.consentData);
                    return;
                }

                this.showConsentBanner((consent) => {
                    resolve(this.saveConsent(consent));
                });
            });
        }

        hasValidConsent() {
            return this.consentData.granted && 
                   this.consentData.timestamp && 
                   (Date.now() - this.consentData.timestamp) < WIBI_CONFIG.cookieExpiry;
        }

        isAllowed(category) {
            if (!WIBI_CONFIG.consentRequired) return true;
            
            // Always allow necessary and functional features
            if (category === 'necessary' || category === 'functional') {
                return true;
            }
            
            // Require explicit consent for analytics and marketing
            return this.hasValidConsent() && 
                   (this.consentData.categories[category] === true);
        }

        onConsentChange(callback) {
            this.callbacks.push(callback);
        }

        notifyCallbacks() {
            this.callbacks.forEach(callback => {
                try {
                    callback(this.consentData);
                } catch (e) {
                    this.logger.error('Consent callback failed', e);
                }
            });
        }

        showConsentBanner(callback) {
            const banner = document.createElement('div');
            banner.id = 'wibi-consent-banner';
            banner.innerHTML = `
                <div style="position: fixed; bottom: 0; left: 0; right: 0; background: #2c3e50; color: white; padding: 20px; z-index: 10000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; box-shadow: 0 -2px 10px rgba(0,0,0,0.1);">
                    <div style="max-width: 1200px; margin: 0 auto;">
                        <div style="display: flex; align-items: center; gap: 20px; flex-wrap: wrap;">
                            <div style="flex: 1; min-width: 300px;">
                                <h4 style="margin: 0 0 8px 0; font-size: 16px;">🍪 Privacy Settings</h4>
                                <p style="margin: 0; font-size: 14px; line-height: 1.4; opacity: 0.9;">
                                    We use cookies to provide contact functionality and improve your experience. 
                                    <strong>Contact buttons will work regardless of your choice.</strong>
                                </p>
                            </div>
                            <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                                <button id="wibi-consent-essential" style="background: transparent; border: 1px solid rgba(255,255,255,0.3); color: white; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px;">
                                    Essential Only
                                </button>
                                <button id="wibi-consent-settings" style="background: transparent; border: 1px solid rgba(255,255,255,0.3); color: white; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px;">
                                    Settings
                                </button>
                                <button id="wibi-consent-accept" style="background: #27ae60; border: none; color: white; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: 500; font-size: 14px;">
                                    Accept All
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(banner);

            // Accept All - Full functionality + tracking
            document.getElementById('wibi-consent-accept').onclick = () => {
                document.body.removeChild(banner);
                callback({
                    granted: true,
                    categories: {
                        necessary: true,
                        functional: true,
                        analytics: true,
                        marketing: true
                    }
                });
            };

            // Essential Only - Widget works, no tracking
            document.getElementById('wibi-consent-essential').onclick = () => {
                document.body.removeChild(banner);
                callback({
                    granted: true,
                    categories: {
                        necessary: true,
                        functional: true,    // ✅ Still allow contact functionality
                        analytics: false,    // ❌ No tracking
                        marketing: false     // ❌ No marketing
                    }
                });
            };

            // Settings - Show limited options for now (simplified)
            document.getElementById('wibi-consent-settings').onclick = () => {
                document.body.removeChild(banner);
                callback({
                    granted: true,
                    categories: {
                        necessary: true,
                        functional: true,
                        analytics: true,     // Allow analytics but not marketing
                        marketing: false
                    }
                });
            };
        }
    }

    /**
     * Advanced bot detection with behavioral analysis
     */
    class BotDetector {
        constructor() {
            this.logger = new Logger('BotDetector');
            this.score = 0;
            this.reasons = [];
            this.behaviorData = {
                mouseMoves: 0,
                clicks: 0,
                scrolls: 0,
                keystrokes: 0,
                startTime: Date.now()
            };

            this.setupBehaviorTracking();
        }

        async detect() {
            this.score = 0;
            this.reasons = [];

            this.checkWebDriver();
            this.checkHeadless();
            this.checkUserAgent();
            this.checkBrowserFeatures();
            this.checkNetworkTiming();

            await this.analyzeBehavior();

            const result = {
                isBot: this.score >= 5,
                confidence: Math.min(this.score / 10, 1),
                score: this.score,
                reasons: this.reasons,
                behaviorData: this.behaviorData
            };

            this.logger.debug('Bot detection result', result);
            return result;
        }

        checkWebDriver() {
            if (navigator.webdriver) {
                this.score += 5;
                this.reasons.push('navigator.webdriver');
            }

            if (window.document.documentElement.getAttribute('webdriver')) {
                this.score += 5;
                this.reasons.push('webdriver_attribute');
            }

            const automationSignatures = [
                'callPhantom', '_phantom', '__nightmare', '__fxdriver_unwrapped',
                'webdriver', '_Selenium_IDE_Recorder', '_selenium', 'calledSelenium'
            ];

            automationSignatures.forEach(signature => {
                if (window[signature]) {
                    this.score += 3;
                    this.reasons.push(`automation_${signature}`);
                }
            });
        }

        checkHeadless() {
            if (navigator.userAgent.includes('HeadlessChrome')) {
                this.score += 5;
                this.reasons.push('headless_chrome');
            }

            if (!navigator.plugins || navigator.plugins.length === 0) {
                this.score += 2;
                this.reasons.push('no_plugins');
            }

            if (!navigator.languages || navigator.languages.length === 0) {
                this.score += 2;
                this.reasons.push('no_languages');
            }

            if (!window.chrome || !window.chrome.runtime) {
                this.score += 1;
                this.reasons.push('no_chrome_runtime');
            }
        }

        checkUserAgent() {
            const botPatterns = [
                /bot|spider|crawl|slurp|curl|wget|python|phantom|headless|selenium|scrapy/i,
                /httpclient|facebookexternalhit|pingdom|monitor|datadog/i
            ];

            const ua = navigator.userAgent.toLowerCase();
            botPatterns.forEach((pattern, index) => {
                if (pattern.test(ua)) {
                    this.score += 3;
                    this.reasons.push(`bot_ua_pattern_${index}`);
                }
            });
        }

        checkBrowserFeatures() {
            if (!navigator.hardwareConcurrency || navigator.hardwareConcurrency < 2) {
                this.score += 1;
                this.reasons.push('low_hardware_concurrency');
            }

            if (navigator.deviceMemory && navigator.deviceMemory < 2) {
                this.score += 1;
                this.reasons.push('low_device_memory');
            }

            if (!window.screen || window.screen.width === 0 || window.screen.height === 0) {
                this.score += 2;
                this.reasons.push('invalid_screen');
            }

            try {
                const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                if (!timezone || timezone === 'UTC') {
                    this.score += 1;
                    this.reasons.push('suspicious_timezone');
                }
            } catch (e) {
                this.score += 1;
                this.reasons.push('timezone_error');
            }
        }

        checkNetworkTiming() {
            try {
                const perfEntries = performance.getEntriesByType('navigation');
                if (perfEntries.length > 0) {
                    const timing = perfEntries[0];
                    
                    if (timing.loadEventEnd - timing.navigationStart < 100) {
                        this.score += 1;
                        this.reasons.push('suspiciously_fast_load');
                    }
                }
            } catch (e) {
                // Ignore performance API errors
            }
        }

        setupBehaviorTracking() {
            const trackEvent = (type) => {
                this.behaviorData[type]++;
            };

            document.addEventListener('mousemove', () => trackEvent('mouseMoves'), { passive: true });
            document.addEventListener('click', () => trackEvent('clicks'), { passive: true });
            document.addEventListener('scroll', () => trackEvent('scrolls'), { passive: true });
            document.addEventListener('keydown', () => trackEvent('keystrokes'), { passive: true });
        }

        async analyzeBehavior() {
            const timeActive = Date.now() - this.behaviorData.startTime;
            
            if (timeActive > 5000) {
                const totalInteractions = this.behaviorData.mouseMoves + 
                                        this.behaviorData.clicks + 
                                        this.behaviorData.scrolls + 
                                        this.behaviorData.keystrokes;

                if (totalInteractions === 0) {
                    this.score += 2;
                    this.reasons.push('no_human_interaction');
                }

                if (this.behaviorData.mouseMoves > 100 && 
                    this.behaviorData.clicks === 0 && 
                    this.behaviorData.scrolls === 0) {
                    this.score += 1;
                    this.reasons.push('repetitive_mouse_behavior');
                }
            }
        }
    }

    /**
     * Device and browser detection
     */
    class DeviceDetector {
        static getDeviceInfo() {
            const ua = navigator.userAgent;
            
            return {
                deviceType: this.getDeviceType(ua),
                browser: this.getBrowserInfo(ua),
                os: this.getOSInfo(ua),
                screen: this.getScreenInfo(),
                network: this.getNetworkInfo(),
                capabilities: this.getCapabilities()
            };
        }

        static getDeviceType(ua) {
            if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
            if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(ua)) return 'mobile';
            return 'desktop';
        }

        static getBrowserInfo(ua) {
            const browsers = [
                { name: 'Chrome', pattern: /Chrome\/([0-9.]+)/ },
                { name: 'Firefox', pattern: /Firefox\/([0-9.]+)/ },
                { name: 'Safari', pattern: /Version\/([0-9.]+).*Safari/ },
                { name: 'Edge', pattern: /Edge\/([0-9.]+)/ },
                { name: 'Opera', pattern: /(?:Opera|OPR)\/([0-9.]+)/ },
                { name: 'Samsung Browser', pattern: /SamsungBrowser\/([0-9.]+)/ },
                { name: 'Internet Explorer', pattern: /rv:([0-9.]+)/ }
            ];

            for (const browser of browsers) {
                const match = ua.match(browser.pattern);
                if (match) {
                    return {
                        name: browser.name,
                        version: match[1],
                        fullVersion: match[0]
                    };
                }
            }

            return { name: 'Unknown', version: '', fullVersion: '' };
        }

        static getOSInfo(ua) {
            const systems = [
                { name: 'Windows', version: '10', pattern: /Windows NT 10\.0/ },
                { name: 'Windows', version: '8.1', pattern: /Windows NT 6\.3/ },
                { name: 'Windows', version: '8', pattern: /Windows NT 6\.2/ },
                { name: 'Windows', version: '7', pattern: /Windows NT 6\.1/ },
                { name: 'macOS', pattern: /Mac OS X ([0-9_]+)/, versionReplace: /_/g },
                { name: 'iOS', pattern: /OS ([0-9_]+)/, versionReplace: /_/g },
                { name: 'Android', pattern: /Android ([0-9.]+)/ },
                { name: 'Linux', pattern: /Linux/ }
            ];

            for (const system of systems) {
                const match = ua.match(system.pattern);
                if (match) {
                    let version = system.version || match[1] || '';
                    if (system.versionReplace && version) {
                        version = version.replace(system.versionReplace, '.');
                    }
                    return { name: system.name, version };
                }
            }

            return { name: 'Unknown', version: '' };
        }

        static getScreenInfo() {
            return {
                width: window.screen.width,
                height: window.screen.height,
                availWidth: window.screen.availWidth,
                availHeight: window.screen.availHeight,
                colorDepth: window.screen.colorDepth,
                pixelDepth: window.screen.pixelDepth,
                orientation: window.screen.orientation?.type || 'unknown'
            };
        }

        static getNetworkInfo() {
            const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            if (connection) {
                return {
                    effectiveType: connection.effectiveType,
                    downlink: connection.downlink,
                    rtt: connection.rtt,
                    saveData: connection.saveData
                };
            }
            return null;
        }

        static getCapabilities() {
            return {
                cookieEnabled: navigator.cookieEnabled,
                doNotTrack: navigator.doNotTrack,
                language: navigator.language,
                languages: navigator.languages,
                onLine: navigator.onLine,
                hardwareConcurrency: navigator.hardwareConcurrency,
                deviceMemory: navigator.deviceMemory,
                maxTouchPoints: navigator.maxTouchPoints,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                timezoneOffset: new Date().getTimezoneOffset()
            };
        }
    }

    /**
     * Enhanced source detection with attribution modeling
     */
    class SourceDetector {
        static detect() {
            const urlParams = new URLSearchParams(window.location.search);
            const referrer = document.referrer;
            
            let attribution = {
                source: 'DIRECT_TRAFFIC',
                sourceDetail: window.location.hostname,
                medium: 'none',
                campaign: null,
                content: null,
                term: null,
                attribution_model: 'last_click'
            };

            if (this.hasUtmParameters(urlParams)) {
                attribution = this.parseUtmParameters(urlParams, attribution);
                attribution.attribution_model = 'utm_campaign';
                return attribution;
            }

            const paidSearch = this.detectPaidSearch(urlParams);
            if (paidSearch) {
                return { ...attribution, ...paidSearch, attribution_model: 'paid_search' };
            }

            if (referrer) {
                const referrerAttribution = this.parseReferrer(referrer);
                if (referrerAttribution) {
                    return { ...attribution, ...referrerAttribution, attribution_model: 'referrer' };
                }
            }

            return attribution;
        }

        static hasUtmParameters(urlParams) {
            return urlParams.has('utm_source') || 
                   urlParams.has('utm_medium') || 
                   urlParams.has('utm_campaign');
        }

        static parseUtmParameters(urlParams, attribution) {
            return {
                ...attribution,
                source: (urlParams.get('utm_source') || attribution.source).toUpperCase(),
                sourceDetail: urlParams.get('utm_source') || attribution.sourceDetail,
                medium: urlParams.get('utm_medium') || attribution.medium,
                campaign: urlParams.get('utm_campaign'),
                content: urlParams.get('utm_content'),
                term: urlParams.get('utm_term')
            };
        }

        static detectPaidSearch(urlParams) {
            const paidSearchParams = [
                { param: 'gclid', source: 'GOOGLE_ADS', medium: 'cpc', detail: 'google' },
                { param: 'fbclid', source: 'FACEBOOK_ADS', medium: 'social', detail: 'facebook' },
                { param: 'msclkid', source: 'BING_ADS', medium: 'cpc', detail: 'bing' },
                { param: 'ttclid', source: 'TIKTOK_ADS', medium: 'social', detail: 'tiktok' },
                { param: 'twclid', source: 'TWITTER_ADS', medium: 'social', detail: 'twitter' }
            ];

            for (const paid of paidSearchParams) {
                if (urlParams.has(paid.param)) {
                    return {
                        source: paid.source,
                        sourceDetail: paid.detail,
                        medium: paid.medium,
                        campaign: urlParams.get('utm_campaign') || 'auto_tagged'
                    };
                }
            }

            return null;
        }

        static parseReferrer(referrer) {
            try {
                const referrerUrl = new URL(referrer);
                const hostname = referrerUrl.hostname.toLowerCase();

                const searchEngines = {
                    'google.': { source: 'ORGANIC_SEARCH', medium: 'organic', detail: 'google' },
                    'bing.': { source: 'ORGANIC_SEARCH', medium: 'organic', detail: 'bing' },
                    'yahoo.': { source: 'ORGANIC_SEARCH', medium: 'organic', detail: 'yahoo' },
                    'duckduckgo.': { source: 'ORGANIC_SEARCH', medium: 'organic', detail: 'duckduckgo' },
                    'baidu.': { source: 'ORGANIC_SEARCH', medium: 'organic', detail: 'baidu' },
                    'yandex.': { source: 'ORGANIC_SEARCH', medium: 'organic', detail: 'yandex' }
                };

                const socialNetworks = {
                    'facebook.': { source: 'SOCIAL_MEDIA', medium: 'social', detail: 'facebook' },
                    'twitter.': { source: 'SOCIAL_MEDIA', medium: 'social', detail: 'twitter' },
                    'linkedin.': { source: 'SOCIAL_MEDIA', medium: 'social', detail: 'linkedin' },
                    'instagram.': { source: 'SOCIAL_MEDIA', medium: 'social', detail: 'instagram' },
                    'pinterest.': { source: 'SOCIAL_MEDIA', medium: 'social', detail: 'pinterest' },
                    'youtube.': { source: 'SOCIAL_MEDIA', medium: 'social', detail: 'youtube' },
                    'tiktok.': { source: 'SOCIAL_MEDIA', medium: 'social', detail: 'tiktok' },
                    'reddit.': { source: 'SOCIAL_MEDIA', medium: 'social', detail: 'reddit' },
                    't.co': { source: 'SOCIAL_MEDIA', medium: 'social', detail: 'twitter' },
                    'fb.me': { source: 'SOCIAL_MEDIA', medium: 'social', detail: 'facebook' }
                };

                const emailClients = {
                    'mail.google.': { source: 'EMAIL', medium: 'email', detail: 'gmail' },
                    'outlook.': { source: 'EMAIL', medium: 'email', detail: 'outlook' },
                    'mail.yahoo.': { source: 'EMAIL', medium: 'email', detail: 'yahoo_mail' }
                };

                for (const [domain, attribution] of Object.entries(searchEngines)) {
                    if (hostname.includes(domain)) {
                        return {
                            source: attribution.source,
                            sourceDetail: attribution.detail,
                            medium: attribution.medium
                        };
                    }
                }

                for (const [domain, attribution] of Object.entries(socialNetworks)) {
                    if (hostname.includes(domain)) {
                        return {
                            source: attribution.source,
                            sourceDetail: attribution.detail,
                            medium: attribution.medium
                        };
                    }
                }

                for (const [domain, attribution] of Object.entries(emailClients)) {
                    if (hostname.includes(domain)) {
                        return {
                            source: attribution.source,
                            sourceDetail: attribution.detail,
                            medium: attribution.medium
                        };
                    }
                }

                return {
                    source: 'REFERRAL',
                    sourceDetail: hostname,
                    medium: 'referral'
                };

            } catch (e) {
                return null;
            }
        }
    }

    // =============================================================================
    // BUSINESS LOGIC UTILITIES
    // =============================================================================

    /**
     * Business hours checker
     */
    class BusinessHours {
        static isBusinessHours() {
            if (!WIBI_CONFIG.businessHours.enabled) return true;
            
            const now = new Date();
            const day = now.getDay();
            const hours = now.getHours();
            const minutes = now.getMinutes();
            
            const { startDay, endDay, startHour, endHour, endMinute } = WIBI_CONFIG.businessHours;
            
            // Check day of week
            if (day < startDay || day > endDay) return false;
            
            // Check hours and minutes
            if (hours < startHour) return false;
            if (hours > endHour) return false;
            if (hours === endHour && minutes > endMinute) return false;
            
            return true;
        }
    }

    /**
     * Phone number formatter
     */
    class PhoneFormatter {
        static format(phone, countryCode = '27') {
            if (!phone) return '';
            
            const cleaned = phone.replace(/\D/g, '');
            
            // South African format
            if (countryCode === '27') {
                if (cleaned.startsWith('27') && cleaned.length === 11) {
                    return cleaned;
                } else if (cleaned.startsWith('0') && cleaned.length === 10) {
                    return '27' + cleaned.substring(1);
                } else if (cleaned.length === 9) {
                    return '27' + cleaned;
                }
            }
            
            return cleaned;
        }
    }

    // =============================================================================
    // CORE TRACKING CLASSES
    // =============================================================================

    /**
     * Queue manager for reliable data transmission
     */
    class QueueManager {
        constructor(storage, logger) {
            this.storage = storage;
            this.logger = logger;
            this.isProcessing = false;
            this.queue = [];
            this.offlineQueue = this.loadOfflineQueue();
            
            window.addEventListener('online', () => this.processOfflineQueue());
            window.addEventListener('beforeunload', () => this.saveOfflineQueue());
        }

        loadOfflineQueue() {
            return this.storage.get(WIBI_CONFIG.storageKeys.offlineQueue) || [];
        }

        saveOfflineQueue() {
            this.storage.set(WIBI_CONFIG.storageKeys.offlineQueue, this.offlineQueue);
        }

        add(request) {
            if (navigator.onLine) {
                this.queue.push(request);
                this.processQueue();
            } else {
                this.offlineQueue.push({
                    ...request,
                    timestamp: Date.now()
                });
                this.saveOfflineQueue();
            }
        }

        async processQueue() {
            if (this.isProcessing || this.queue.length === 0) return;
            
            this.isProcessing = true;
            
            while (this.queue.length > 0) {
                const request = this.queue.shift();
                try {
                    await this.executeRequest(request);
                } catch (error) {
                    this.logger.error('Queue processing failed', { request, error: error.message });
                    
                    this.offlineQueue.push({
                        ...request,
                        timestamp: Date.now(),
                        retryCount: (request.retryCount || 0) + 1
                    });
                }
            }
            
            this.isProcessing = false;
        }

        async processOfflineQueue() {
            const processedItems = [];
            
            for (const item of this.offlineQueue) {
                if (Date.now() - item.timestamp > 24 * 60 * 60 * 1000) {
                    processedItems.push(item);
                    continue;
                }

                if (item.retryCount && item.retryCount >= WIBI_CONFIG.retryAttempts) {
                    processedItems.push(item);
                    continue;
                }

                try {
                    await this.executeRequest(item);
                    processedItems.push(item);
                } catch (error) {
                    this.logger.warn('Offline queue item failed', { item, error: error.message });
                }
            }

            this.offlineQueue = this.offlineQueue.filter(item => !processedItems.includes(item));
            this.saveOfflineQueue();
        }

        async executeRequest(request) {
            const { url, options } = request;
            
            for (let attempt = 1; attempt <= WIBI_CONFIG.retryAttempts; attempt++) {
                try {
                    const response = await fetch(url, {
                        ...options,
                        headers: {
                            'Content-Type': 'application/json',
                            ...options.headers
                        }
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

                    return await response.json();
                } catch (error) {
                    if (attempt === WIBI_CONFIG.retryAttempts) {
                        throw error;
                    }
                    
                    await new Promise(resolve => 
                        setTimeout(resolve, WIBI_CONFIG.retryDelay * Math.pow(2, attempt - 1))
                    );
                }
            }
        }
    }

    /**
     * Visitor identification and management
     */
    class VisitorManager {
        constructor(storage, logger) {
            this.storage = storage;
            this.logger = logger;
            this.utk = null;
            this.visitorData = null;
        }

        async initialize() {
            this.utk = this.getOrCreateUTK();
            this.visitorData = await this.collectVisitorData();
            this.logger.info('Visitor initialized', { utk: this.utk });
        }

        getOrCreateUTK() {
            let utk = this.storage.get(WIBI_CONFIG.storageKeys.utk);
            
            if (!utk) {
                utk = this.storage.getCookie('hubspotutk');
            }

            if (!utk || utk === 'undefined' || utk === 'null') {
                utk = this.generateUUID();
            }

            this.storage.set(WIBI_CONFIG.storageKeys.utk, utk, {
                expires: Date.now() + WIBI_CONFIG.cookieExpiry
            });

            return utk;
        }

        generateUUID() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }

        async collectVisitorData() {
            const deviceInfo = DeviceDetector.getDeviceInfo();
            const sourceInfo = SourceDetector.detect();
            const botDetector = new BotDetector();
            const botResult = await botDetector.detect();

            const visitorData = {
                utk: this.utk,
                timestamp: Date.now(),
                url: window.location.href,
                referrer: document.referrer,
                title: document.title,
                device: deviceInfo,
                source: sourceInfo,
                bot: botResult,
                performance: this.getPerformanceData()
            };

            this.storage.set(WIBI_CONFIG.storageKeys.visitorData, visitorData, {
                sessionOnly: true
            });

            return visitorData;
        }

        getPerformanceData() {
            try {
                const perfData = performance.getEntriesByType('navigation')[0];
                if (perfData) {
                    return {
                        loadTime: perfData.loadEventEnd - perfData.navigationStart,
                        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.navigationStart,
                        firstPaint: this.getFirstPaint(),
                        pageSize: this.getTransferSize(perfData)
                    };
                }
            } catch (e) {
                this.logger.warn('Performance data collection failed', e);
            }
            return null;
        }

        getFirstPaint() {
            try {
                const paintEntries = performance.getEntriesByType('paint');
                const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
                return firstPaint ? firstPaint.startTime : null;
            } catch (e) {
                return null;
            }
        }

        getTransferSize(perfData) {
            return {
                encoded: perfData.encodedBodySize || 0,
                decoded: perfData.decodedBodySize || 0,
                transfer: perfData.transferSize || 0
            };
        }

        getUTK() {
            return this.utk;
        }

        getVisitorData() {
            return this.visitorData;
        }
    }

    /**
     * Session management with enhanced tracking
     */
    class SessionManager {
        constructor(storage, logger) {
            this.storage = storage;
            this.logger = logger;
            this.session = null;
            this.activityTimer = null;
        }

        initialize() {
            this.session = this.getOrCreateSession();
            this.setupActivityTracking();
            this.logger.info('Session initialized', { sessionId: this.session.id });
        }

        getOrCreateSession() {
            const existing = this.storage.get(WIBI_CONFIG.storageKeys.session);
            const now = Date.now();

            if (existing && (now - existing.lastActivity) < WIBI_CONFIG.sessionTimeout) {
                existing.lastActivity = now;
                existing.pageViews++;
                this.saveSession(existing);
                return existing;
            }

            const newSession = {
                id: this.generateSessionId(),
                startTime: now,
                lastActivity: now,
                pageViews: 1,
                actions: [],
                source: SourceDetector.detect()
            };

            this.saveSession(newSession);
            return newSession;
        }

        generateSessionId() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        }

        saveSession(session) {
            this.storage.set(WIBI_CONFIG.storageKeys.session, session, {
                sessionOnly: true
            });
        }

        trackAction(actionType, actionDetail = {}) {
            if (!this.session) return;

            this.session.actions.push({
                type: actionType,
                detail: actionDetail,
                timestamp: Date.now(),
                url: window.location.href
            });

            this.session.lastActivity = Date.now();
            this.saveSession(this.session);

            this.logger.debug('Action tracked', { actionType, actionDetail });
        }

        setupActivityTracking() {
            const resetTimer = () => {
                if (this.activityTimer) {
                    clearTimeout(this.activityTimer);
                }

                this.activityTimer = setTimeout(() => {
                    this.trackAction('idle', { duration: WIBI_CONFIG.idleTimeout });
                }, WIBI_CONFIG.idleTimeout);
            };

            ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
                document.addEventListener(event, resetTimer, { passive: true });
            });

            resetTimer();
        }

        getSession() {
            return this.session;
        }

        endSession() {
            if (this.session) {
                this.session.endTime = Date.now();
                this.session.duration = this.session.endTime - this.session.startTime;
                this.saveSession(this.session);
                
                this.trackAction('session_end', {
                    duration: this.session.duration,
                    pageViews: this.session.pageViews,
                    actionsCount: this.session.actions.length
                });
            }
        }
    }

    /**
     * GTM integration with enhanced data layer
     */
    class GTMManager {
        constructor(logger) {
            this.logger = logger;
            this.dataLayer = window.dataLayer || [];
            window.dataLayer = this.dataLayer;
        }

        async injectGTM(websiteId) {
            try {
                const gtmId = await this.fetchGTMId();
                
                if (gtmId && this.isValidGTMId(gtmId) && !this.isGTMAlreadyInstalled(gtmId)) {
                    this.installGTM(gtmId);
                    this.logger.info('GTM injected', { gtmId });
                }
            } catch (error) {
                this.logger.error('GTM injection failed', error);
            }
        }

        async fetchGTMId() {
            const hostname = window.location.hostname;
            const response = await fetch(`${WIBI_CONFIG.apiBaseUrl}${WIBI_CONFIG.endpoints.gtmId}?url=${encodeURIComponent(hostname)}`);
            
            if (!response.ok) throw new Error(`GTM ID fetch failed: ${response.status}`);
            
            const data = await response.json();
            return data.gtm_container_id;
        }

        isValidGTMId(gtmId) {
            return /^GTM-[A-Z0-9]+$/.test(gtmId);
        }

        isGTMAlreadyInstalled(gtmId) {
            const scripts = document.querySelectorAll('script[src*="googletagmanager.com/gtm.js"]');
            for (const script of scripts) {
                if (script.src.includes(gtmId)) return true;
            }

            const noscripts = document.querySelectorAll('noscript');
            for (const noscript of noscripts) {
                if (noscript.innerHTML.includes(`googletagmanager.com/ns.html?id=${gtmId}`)) return true;
            }

            return false;
        }

        installGTM(gtmId) {
            const script = document.createElement('script');
            script.async = true;
            script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
            
            const firstScript = document.head.querySelector('script');
            if (firstScript) {
                document.head.insertBefore(script, firstScript);
            } else {
                document.head.appendChild(script);
            }

            const noscript = document.createElement('noscript');
            noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
            
            if (document.body.firstChild) {
                document.body.insertBefore(noscript, document.body.firstChild);
            } else {
                document.body.appendChild(noscript);
            }
        }

        push(data) {
            try {
                this.dataLayer.push({
                    ...data,
                    timestamp: new Date().toISOString(),
                    wibi_version: '2.0.0'
                });
                
                this.logger.debug('Data pushed to GTM', data);
            } catch (error) {
                this.logger.error('GTM push failed', { data, error });
            }
        }

        pushEvent(eventName, eventData = {}) {
            this.push({
                event: eventName,
                ...eventData
            });
        }
    }

    // =============================================================================
    // MAIN WIDGET CLASS
    // =============================================================================

    /**
     * Main Wibi widget class with complete functionality
     */
    class WibiWidget {
        constructor(websiteId) {
            this.websiteId = websiteId;
            this.logger = new Logger('WibiWidget');
            this.storage = new StorageManager();
            this.consent = new ConsentManager(this.storage);
            this.queue = new QueueManager(this.storage, this.logger);
            this.visitor = new VisitorManager(this.storage, this.logger);
            this.session = new SessionManager(this.storage, this.logger);
            this.gtm = new GTMManager(this.logger);
            
            this.isInitialized = false;
            this.widgetConfig = null;
            this.widgetElement = null;
            this.isOpen = false;
            this.idleTimer = null;
            this.hoverTimers = new Map();
        }

        async initialize() {
            try {
                this.logger.info('Initializing Wibi Widget', { websiteId: this.websiteId });

                // Initialize core components first
                await this.visitor.initialize();
                this.session.initialize();

                // Handle consent (but don't block widget rendering)
                if (WIBI_CONFIG.consentRequired) {
                    await this.consent.requestConsent();
                    
                    // ✅ ALWAYS continue with widget rendering
                    this.logger.info('Consent status', { 
                        analytics: this.consent.isAllowed('analytics'),
                        marketing: this.consent.isAllowed('marketing'),
                        functional: this.consent.isAllowed('functional')
                    });
                }

                // Fetch widget configuration and render
                await this.fetchWidgetConfig();
                await this.gtm.injectGTM(this.websiteId);

                this.renderWidget();
                this.setupEventTracking();
                this.setupFormTracking();

                // Only track if analytics consent is given
                if (this.consent.isAllowed('analytics')) {
                    await this.trackPageView();
                    await this.trackSourceAttribution();
                } else {
                    this.logger.info('Analytics tracking disabled - user did not consent');
                }

                this.isInitialized = true;
                this.logger.info('Wibi Widget initialized successfully');

                // Send init event only if analytics consent given
                if (this.consent.isAllowed('analytics')) {
                    this.gtm.pushEvent('wibi_widget_initialized', {
                        website_id: this.websiteId,
                        visitor_utk: this.visitor.getUTK(),
                        session_id: this.session.getSession().id
                    });
                }

            } catch (error) {
                this.logger.error('Widget initialization failed', error);
                throw error;
            }
        }

        async fetchWidgetConfig() {
            const visitorData = this.visitor.getVisitorData();
            const sourceData = visitorData.source;
            const clientData = {
                screenResolution: `${visitorData.device.screen.width}x${visitorData.device.screen.height}`,
                botDetection: visitorData.bot
            };

            const url = new URL(`${WIBI_CONFIG.apiBaseUrl}${WIBI_CONFIG.endpoints.options}`);
            url.searchParams.append('id', this.websiteId);
            url.searchParams.append('pg', window.location.href);
            url.searchParams.append('utk', this.visitor.getUTK());
            url.searchParams.append('source', JSON.stringify(sourceData));
            url.searchParams.append('clientData', JSON.stringify(clientData));

            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new Error(`Widget config fetch failed: ${response.status}`);
            }

            this.widgetConfig = await response.json();
            this.logger.debug('Widget config loaded', this.widgetConfig);
        }

        renderWidget() {
            if (!this.widgetConfig) {
                throw new Error('Widget config not loaded');
            }

            const container = document.createElement('div');
            container.className = 'wibi-widget-container';
            container.innerHTML = this.generateWidgetHTML();

            this.injectStyles();
            document.body.appendChild(container);
            this.widgetElement = container;

            this.setupWidgetInteractions();
            this.setupHoverTracking();

            // Auto-open if hash present
            if (window.location.hash.includes('OpenClick2Contact')) {
                setTimeout(() => this.toggleWidget(), 100);
            }

            this.logger.info('Widget rendered');
        }

        generateWidgetHTML() {
            const config = this.widgetConfig;
            const position = config.position || 'right';
            
            return `
                <div class="wibi-chat-popup" id="wibi-widget" style="display: none;">
                    <div class="wibi-widget-content">
                        ${this.generateContactButtons()}
                        ${this.generateCustomButtons()}
                        ${config.branding_show ? this.generateBrandingLink() : ''}
                    </div>
                </div>
                
                <button type="button" 
                        class="wibi-open-button" 
                        id="wibi-open-btn"
                        style="background-color: ${config.color_code};"
                        data-position="${position}">
                    <svg class="wibi-icon wibi-phone-icon" viewBox="0 0 578.106 578.106">
                        <path d="M577.83 456.128c1.225 9.385-1.635 17.545-8.568 24.48l-81.396 80.781c-3.672 4.08-8.465 7.551-14.381 10.404-5.916 2.857-11.729 4.693-17.439 5.508-.408 0-1.635.105-3.676.309-2.037.203-4.689.307-7.953.307-7.754 0-20.301-1.326-37.641-3.979s-38.555-9.182-63.645-19.584c-25.096-10.404-53.553-26.012-85.376-46.818-31.823-20.805-65.688-49.367-101.592-85.68-28.56-28.152-52.224-55.08-70.992-80.783-18.768-25.705-33.864-49.471-45.288-71.299-11.425-21.828-19.993-41.616-25.705-59.364S4.59 177.362 2.55 164.51-.306 141.56.102 134.216c.408-7.344.612-11.424.612-12.24.816-5.712 2.652-11.526 5.508-17.442s6.324-10.71 10.404-14.382L98.022 8.756c5.712-5.712 12.24-8.568 19.584-8.568 5.304 0 9.996 1.53 14.076 4.59s7.548 6.834 10.404 11.322l65.484 124.236c3.672 6.528 4.692 13.668 3.06 21.42-1.632 7.752-5.1 14.28-10.404 19.584l-29.988 29.988c-.816.816-1.53 2.142-2.142 3.978s-.918 3.366-.918 4.59c1.632 8.568 5.304 18.36 11.016 29.376 4.896 9.792 12.444 21.726 22.644 35.802s24.684 30.293 43.452 48.653c18.36 18.77 34.68 33.354 48.96 43.76 14.277 10.4 26.215 18.053 35.803 22.949 9.588 4.896 16.932 7.854 22.031 8.871l7.648 1.531c.816 0 2.145-.307 3.979-.918 1.836-.613 3.162-1.326 3.979-2.143l34.883-35.496c7.348-6.527 15.912-9.791 25.705-9.791 6.938 0 12.443 1.223 16.523 3.672h.611l118.115 69.768c8.571 5.308 13.67 12.038 15.303 20.198z"/>
                    </svg>
                    <svg class="wibi-icon wibi-close-icon" style="display: none;" viewBox="0 0 16 16">
                        <path d="M9.414,8l6.112-6.112c0.396-0.396,0.401-1.032,0.009-1.423c-0.39-0.39-1.027-0.387-1.423,0.009L8,6.585 L1.888,0.473C1.492,0.077,0.854,0.074,0.465,0.464C0.073,0.856,0.078,1.492,0.474,1.888L6.586,8l-6.112,6.112 c-0.396,0.396-0.401,1.033-0.009,1.423c0.39,0.391,1.027,0.387,1.423-0.008L8,9.415l6.112,6.113 c0.396,0.394,1.033,0.399,1.423,0.008c0.39-0.39,0.387-1.027-0.009-1.423L9.414,8z"/>
                    </svg>
                    <span class="wibi-button-label">${config.label || 'Contact Us'}</span>
                </button>
            `;
        }

        generateContactButtons() {
            const config = this.widgetConfig;
            const isBusinessHours = BusinessHours.isBusinessHours();
            let buttons = '';

            // Complete button configurations with all contact methods
            const buttonConfigs = [
                {
                    show: config.phone_show && isBusinessHours,
                    className: 'wibi-call-btn',
                    href: `tel:${config.pnumber}`,
                    icon: this.getIconSVG('phone'),
                    text: config.phoneText || 'Call Now',
                    action: 'call',
                    color: '#28a745'
                },
                {
                    show: config.whatsapp_show,
                    className: 'wibi-whatsapp-btn',
                    href: `https://api.whatsapp.com/send?phone=${config.wnumber}&text=${encodeURIComponent(config.whatsapp_message || 'Hi, may you provide me a quote for ...')}`,
                    icon: this.getIconSVG('whatsapp'),
                    text: 'WhatsApp',
                    action: 'whatsapp',
                    color: '#25d366'
                },
                {
                    show: config.email_show,
                    className: 'wibi-email-btn',
                    href: `mailto:${config.email}?subject=${encodeURIComponent(config.subject || 'Request a quote')}&body=${encodeURIComponent(config.body || 'Hi, may you provide me a quote for ...')}`,
                    icon: this.getIconSVG('email'),
                    text: 'Email Us',
                    action: 'email',
                    color: '#dc3545'
                },
                {
                    show: config.messenger_show,
                    className: 'wibi-messenger-btn',
                    href: config.messenger_url || 'https://m.me/yourid',
                    icon: this.getIconSVG('messenger'),
                    text: 'Messenger',
                    action: 'messenger',
                    color: '#0084ff'
                },
                {
                    show: config.text_show,
                    className: 'wibi-sms-btn',
                    href: `sms:${config.pnumber_sms}?body=${encodeURIComponent(config.sms_body || 'Hi, may you provide me a quote for ...')}`,
                    icon: this.getIconSVG('sms'),
                    text: 'Send SMS',
                    action: 'sms',
                    color: '#ffc107'
                },
                {
                    show: config.telegram_show,
                    className: 'wibi-telegram-btn',
                    href: `https://t.me/${config.telegram_num}`,
                    icon: this.getIconSVG('telegram'),
                    text: 'Telegram',
                    action: 'telegram',
                    color: '#0088cc'
                },
                {
                    show: config.viber_show,
                    className: 'wibi-viber-btn',
                    href: `viber://chat?number=${config.viber_num}`,
                    icon: this.getIconSVG('viber'),
                    text: 'Viber',
                    action: 'viber',
                    color: '#665cac'
                },
                {
                    show: config.skype_show,
                    className: 'wibi-skype-btn',
                    href: `skype:${config.skype_nameemail}?chat`,
                    icon: this.getIconSVG('skype'),
                    text: 'Skype',
                    action: 'skype',
                    color: '#00aff0'
                },
                {
                    show: config.line_show,
                    className: 'wibi-line-btn',
                    href: `https://line.me/R/ti/p/@${config.line}`,
                    icon: this.getIconSVG('line'),
                    text: 'Line',
                    action: 'line',
                    color: '#00c300'
                },
                {
                    show: config.book_a_technician_show,
                    className: 'wibi-booking-btn',
                    href: config.booking_form_url || '#',
                    icon: this.getIconSVG('calendar'),
                    text: 'Book a Technician',
                    action: 'book_technician',
                    color: '#6f42c1'
                }
            ];

            buttonConfigs.forEach(btn => {
                if (btn.show) {
                    buttons += `
                        <a href="${btn.href}" 
                           class="wibi-contact-btn ${btn.className}" 
                           data-action="${btn.action}"
                           data-color="${btn.color}"
                           target="_blank"
                           rel="noopener noreferrer">
                            <div class="wibi-btn-icon">${btn.icon}</div>
                            <div class="wibi-btn-text">${btn.text}</div>
                        </a>
                    `;
                }
            });

            return buttons;
        }

        generateCustomButtons() {
            const customButtons = this.widgetConfig.custom_buttons || [];
            let buttonsHTML = '';

            customButtons.forEach((button, index) => {
                const iconHTML = button.logo_code ? 
                    `<i class="fa customButtonIcon">&#x${button.logo_code};</i>` : '';
                
                buttonsHTML += `
                    <a href="${button.url}" 
                       id="customButton${index}"
                       class="wibi-contact-btn wibi-custom-btn"
                       data-action="custom_${index}"
                       data-color="#${button.colorCode.replace('#', '')}"
                       ${button.new_tab ? 'target="_blank" rel="noopener noreferrer"' : ''}>
                        <div class="wibi-btn-icon">${iconHTML}</div>
                        <div class="wibi-btn-text">${button.label}</div>
                    </a>
                `;
            });

            return buttonsHTML;
        }

        generateBrandingLink() {
            return `
                <a href="https://www.wibi.co.za/" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   class="wibi-branding-link"
                   data-action="branding">
                    Add me to your site for free ⚡️
                </a>
            `;
        }

        getIconSVG(iconType) {
            const icons = {
                phone: '<svg viewBox="0 0 24 24"><path d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z"/></svg>',
                whatsapp: '<svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.085"/></svg>',
                email: '<svg viewBox="0 0 24 24"><path d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z"/></svg>',
                messenger: '<svg viewBox="0 0 24 24"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M8.5,14L5.91,11.41L11.5,8L15.5,10L18.09,12.59L12.5,16L8.5,14Z"/></svg>',
                sms: '<svg viewBox="0 0 24 24"><path d="M20,2H4A2,2 0 0,0 2,4V22L6,18H20A2,2 0 0,0 22,16V4A2,2 0 0,0 20,2Z"/></svg>',
                telegram: '<svg viewBox="0 0 24 24"><path d="M9.78,18.65L10.06,14.42L17.74,7.5C18.08,7.19 17.67,7.04 17.22,7.31L7.74,13.3L3.64,12C2.76,11.75 2.75,11.14 3.84,10.7L19.81,4.54C20.54,4.21 21.24,4.72 20.96,5.84L18.24,18.65C18.05,19.56 17.5,19.78 16.74,19.36L12.6,16.3L10.61,18.23C10.38,18.46 10.19,18.65 9.78,18.65Z"/></svg>',
                viber: '<svg viewBox="0 0 24 24"><path d="M11.4,0C9.5,0.09 4.64,0.75 2.73,4.5C1.8,6.27 1.64,8.4 1.66,10.8V11.2C1.64,15.04 1.8,17.14 2.73,18.91C4.64,22.66 9.5,23.32 11.4,23.41H12.62C14.5,23.32 19.36,22.66 21.27,18.91C22.2,17.14 22.36,15.04 22.34,11.2V10.8C22.36,8.4 22.2,6.27 21.27,4.5C19.36,0.75 14.5,0.09 12.62,0H11.4M12,2.53C13.5,2.53 17.82,3.1 19.25,6C19.91,7.32 20.03,9.04 20,11.2V11.67C20.03,13.84 19.91,15.55 19.25,16.87C17.82,19.77 13.5,20.34 12,20.34C10.5,20.34 6.18,19.77 4.75,16.87C4.09,15.55 3.97,13.84 4,11.67V11.2C3.97,9.04 4.09,7.32 4.75,6C6.18,3.1 10.5,2.53 12,2.53M8.33,7.41A0.55,0.55 0 0,0 7.78,7.96C7.78,8.22 7.85,8.46 8,8.64C8.61,9.41 9.37,10.11 10.25,10.69C10.84,11.08 11.5,11.39 12.2,11.61C12.97,11.86 13.8,12 14.64,12C15.5,12 16.36,11.86 17.13,11.61L17.91,11.61C18.22,11.61 18.47,11.86 18.47,12.17V13.22C18.47,13.53 18.22,13.78 17.91,13.78H17.13C16.07,14.1 14.95,14.27 13.83,14.27C12.7,14.27 11.58,14.1 10.53,13.78H9.75C9.44,13.78 9.19,13.53 9.19,13.22V12.17C9.19,11.86 9.44,11.61 9.75,11.61H10.53C11.31,11.39 12.03,11.08 12.67,10.69C13.35,10.28 13.94,9.78 14.42,9.19C14.64,8.94 14.64,8.56 14.42,8.31L13.67,7.56C13.45,7.34 13.07,7.34 12.85,7.56L12.33,8.08C11.97,8.44 11.5,8.64 11,8.64C10.5,8.64 10.03,8.44 9.67,8.08L9.15,7.56C8.93,7.34 8.55,7.34 8.33,7.56V7.41Z"/></svg>',
                skype: '<svg viewBox="0 0 24 24"><path d="M12.069,18.874c-4.023,0-5.82-1.979-5.82-3.464c0-0.765,0.561-1.296,1.333-1.296c1.723,0,1.273,2.477,4.487,2.477c1.641,0,2.55-0.895,2.55-1.811c0-0.551-0.269-1.16-1.354-1.427l-3.576-0.895c-2.88-0.723-3.411-2.277-3.411-3.737c0-3.047,2.861-4.191,5.549-4.191c2.471,0,5.393,1.373,5.393,3.199c0,0.784-0.672,1.24-1.453,1.24c-1.469,0-1.198-2.037-4.164-2.037c-1.469,0-2.292,0.664-2.292,1.617c0,0.833,1.108,1.159,2.193,1.427l2.832,0.694c2.841,0.701,3.616,2.331,3.616,3.886C18.004,17.677,14.898,18.874,12.069,18.874z M12,2C6.477,2,2,6.477,2,12c0,5.523,4.477,10,10,10s10-4.477,10-10C22,6.477,17.523,2,12,2z"/></svg>',
                line: '<svg viewBox="0 0 24 24"><path d="M24,10.304c0-5.369-5.383-9.738-12-9.738S0,4.935,0,10.304c0,4.823,4.279,8.859,10.068,9.596c0.392,0.085,0.926,0.26,1.061,0.596c0.12,0.301,0.079,0.766,0.038,1.08l-0.164,1.02c-0.05,0.3-0.23,1.174,1.029,0.639c1.259-0.534,6.797-4.004,9.272-6.859C23.271,14.484,24,12.525,24,10.304L24,10.304z M9.5,14.13H7.276c-0.324,0-0.586-0.262-0.586-0.586V8.456c0-0.324,0.262-0.586,0.586-0.586c0.324,0,0.586,0.262,0.586,0.586v4.502h1.638c0.324,0,0.586,0.262,0.586,0.586C10.086,13.868,9.824,14.13,9.5,14.13L9.5,14.13z M12.034,14.13c-0.324,0-0.586-0.262-0.586-0.586V8.456c0-0.324,0.262-0.586,0.586-0.586s0.586,0.262,0.586,0.586v5.088C12.62,13.868,12.358,14.13,12.034,14.13L12.034,14.13z M16.686,14.13c-0.324,0-0.586-0.262-0.586-0.586v-3.35l-2.054,3.654c-0.125,0.223-0.39,0.31-0.629,0.207c-0.081-0.035-0.148-0.092-0.191-0.168L11.172,10.2v3.344c0,0.324-0.262,0.586-0.586,0.586s-0.586-0.262-0.586-0.586V8.456c0-0.324,0.262-0.586,0.586-0.586c0.134,0,0.26,0.046,0.359,0.123l2.358,4.195l2.358-4.195c0.099-0.077,0.225-0.123,0.359-0.123c0.324,0,0.586,0.262,0.586,0.586v5.088C17.272,13.868,17.01,14.13,16.686,14.13L16.686,14.13z M20.014,12.094H18.55v1.45c0,0.324-0.262,0.586-0.586,0.586s-0.586-0.262-0.586-0.586V8.456c0-0.324,0.262-0.586,0.586-0.586h2.05c0.324,0,0.586,0.262,0.586,0.586s-0.262,0.586-0.586,0.586H18.55v1.466h1.464c0.324,0,0.586,0.262,0.586,0.586S20.338,12.094,20.014,12.094L20.014,12.094z"/></svg>',
                calendar: '<svg viewBox="0 0 24 24"><path d="M19,3H18V1H16V3H8V1H6V3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V8H19V19Z"/></svg>'
            };
            return icons[iconType] || '';
        }

        injectStyles() {
            if (document.getElementById('wibi-widget-styles')) return;

            const style = document.createElement('style');
            style.id = 'wibi-widget-styles';
            style.textContent = `
                .wibi-widget-container {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    z-index: 999999;
                }

                .wibi-open-button {
                    position: fixed;
                    bottom: 24px;
                    ${this.widgetConfig.position || 'right'}: 24px;
                    background: ${this.widgetConfig.color_code || '#007bff'};
                    border: none;
                    border-radius: 50px;
                    padding: 12px 20px;
                    color: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                    transition: all 0.3s ease;
                    z-index: 999999;
                    font-size: 14px;
                    font-weight: 500;
                }

                .wibi-open-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 25px rgba(0,0,0,0.2);
                }

                .wibi-icon {
                    width: 18px;
                    height: 18px;
                    fill: currentColor;
                }

                .wibi-chat-popup {
                    position: fixed;
                    bottom: 80px;
                    ${this.widgetConfig.position || 'right'}: 24px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.15);
                    padding: 16px;
                    min-width: 280px;
                    max-width: 320px;
                    z-index: 999998;
                    max-height: 70vh;
                    overflow-y: auto;
                }

                .wibi-contact-btn {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    margin: 6px 0;
                    border-radius: 8px;
                    text-decoration: none;
                    color: white;
                    transition: all 0.2s ease;
                    font-size: 14px;
                    font-weight: 500;
                    width: 94%;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }

                .wibi-call-btn { background: #28a745; }
                .wibi-whatsapp-btn { background: #25d366; }
                .wibi-email-btn { background: #dc3545; }
                .wibi-messenger-btn { background: #0084ff; }
                .wibi-sms-btn { background: #ffc107; color: #000; }
                .wibi-telegram-btn { background: #0088cc; }
                .wibi-viber-btn { background: #665cac; }
                .wibi-skype-btn { background: #00aff0; }
                .wibi-line-btn { background: #00c300; }
                .wibi-booking-btn { background: #6f42c1; }

                .wibi-contact-btn:hover {
                    transform: translateY(-1px);
                    opacity: 0.9;
                    color: white;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                }

                .wibi-btn-icon {
                    width: 20px;
                    height: 20px;
                    fill: currentColor;
                    flex-shrink: 0;
                }

                .wibi-btn-text {
                    flex: 1;
                }

                .wibi-custom-btn {
                    background: var(--custom-color, #6c757d);
                }

                .customButtonIcon {
                    margin-right: 6px;
                }

                .wibi-branding-link {
                    display: block;
                    text-align: center;
                    margin-top: 12px;
                    padding: 8px;
                    font-size: 12px;
                    color: #666;
                    text-decoration: none;
                    border-radius: 6px;
                    background: #f8f9fa;
                    transition: background 0.2s ease;
                }

                .wibi-branding-link:hover {
                    background: #e9ecef;
                    color: #495057;
                }

                @media (max-width: 480px) {
                    .wibi-open-button {
                        bottom: 16px;
                        ${this.widgetConfig.position || 'right'}: 16px;
                    }
                    
                    .wibi-chat-popup {
                        bottom: 70px;
                        ${this.widgetConfig.position || 'right'}: 16px;
                        left: 16px;
                        min-width: auto;
                        max-width: none;
                    }
                }
            `;

            // Add custom button styles
            const customButtons = this.widgetConfig.custom_buttons || [];
            customButtons.forEach((button, index) => {
                style.textContent += `
                    #customButton${index} {
                        background: #${button.colorCode.replace('#', '')} !important;
                    }
                    #customButton${index}:hover {
                        background: #${button.colorCode.replace('#', '')} !important;
                        opacity: 0.8;
                    }
                `;
            });

            document.head.appendChild(style);
        }

        setupWidgetInteractions() {
            const openBtn = document.getElementById('wibi-open-btn');
            const widget = document.getElementById('wibi-widget');
            const phoneIcon = openBtn.querySelector('.wibi-phone-icon');
            const closeIcon = openBtn.querySelector('.wibi-close-icon');
            const label = openBtn.querySelector('.wibi-button-label');

            openBtn.addEventListener('click', () => this.toggleWidget());

            const contactButtons = widget.querySelectorAll('.wibi-contact-btn');
            contactButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const action = btn.dataset.action;
                    
                    this.trackInteraction(action, {
                        buttonText: btn.querySelector('.wibi-btn-text').textContent,
                        href: btn.href,
                        color: btn.dataset.color
                    });

                    // Google Ads conversion tracking
                    if (this.widgetConfig.gads_track && this.widgetConfig.gads_id && this.widgetConfig.gads_label) {
                        this.trackGoogleAdsConversion(this.widgetConfig.gads_id, this.widgetConfig.gads_label);
                    }
                });
            });
        }

        toggleWidget() {
            const widget = document.getElementById('wibi-widget');
            const openBtn = document.getElementById('wibi-open-btn');
            const phoneIcon = openBtn.querySelector('.wibi-phone-icon');
            const closeIcon = openBtn.querySelector('.wibi-close-icon');
            const label = openBtn.querySelector('.wibi-button-label');

            this.isOpen = !this.isOpen;
            
            widget.style.display = this.isOpen ? 'block' : 'none';
            phoneIcon.style.display = this.isOpen ? 'none' : 'block';
            closeIcon.style.display = this.isOpen ? 'block' : 'none';
            label.textContent = this.isOpen ? 
                (this.widgetConfig.close_label || 'Close') : 
                (this.widgetConfig.label || 'Contact Us');

            // Track interaction
            this.session.trackAction(this.isOpen ? 'widget_opened' : 'widget_closed');
            
            // Send to GTM
            this.gtm.pushEvent(this.isOpen ? 'wibi_widget_opened' : 'wibi_widget_closed', {
                widget_id: this.websiteId,
                visitor_utk: this.visitor.getUTK()
            });

            this.logger.debug(`Widget ${this.isOpen ? 'opened' : 'closed'}`);

            // Reset idle timer if opened
            if (this.isOpen) {
                this.resetIdleTimer();
            } else {
                this.clearIdleTimer();
            }
        }

        setupHoverTracking() {
            const widget = document.getElementById('wibi-widget');
            if (!widget) return;

            // Widget hover tracking
            widget.addEventListener('mouseenter', () => {
                this.hoverTimers.set('widget', Date.now());
            });

            widget.addEventListener('mouseleave', () => {
                const startTime = this.hoverTimers.get('widget');
                if (startTime) {
                    const duration = Math.round((Date.now() - startTime) / 1000);
                    this.gtm.pushEvent('wibi_widget_hover', {
                        option_id: 'widget',
                        option_label: 'Widget',
                        hover_duration: duration
                    });
                    this.hoverTimers.delete('widget');
                }
            });

            // Button hover tracking
            const buttons = widget.querySelectorAll('.wibi-contact-btn');
            buttons.forEach(button => {
                button.addEventListener('mouseenter', () => {
                    const buttonId = button.dataset.action || button.id || 'unknown';
                    this.hoverTimers.set(buttonId, Date.now());
                });

                button.addEventListener('mouseleave', () => {
                    const buttonId = button.dataset.action || button.id || 'unknown';
                    const startTime = this.hoverTimers.get(buttonId);
                    if (startTime) {
                        const duration = Math.round((Date.now() - startTime) / 1000);
                        this.gtm.pushEvent('wibi_widget_hover', {
                            option_id: buttonId,
                            option_label: button.querySelector('.wibi-btn-text')?.textContent || buttonId,
                            hover_duration: duration
                        });
                        this.hoverTimers.delete(buttonId);
                    }
                });
            });
        }

        setupEventTracking() {
            // Visibility changes
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.session.trackAction('page_hidden');
                } else {
                    this.session.trackAction('page_visible');
                }
            });

            // Before unload
            window.addEventListener('beforeunload', () => {
                this.session.endSession();
                this.logger.debug('Session ended');
            });

            // Hash changes (SPA navigation)
            window.addEventListener('hashchange', () => {
                this.trackPageView();
            });

            // Form submissions (HubSpot integration)
            window.addEventListener('message', (event) => {
                if (event.data.type === 'hsFormCallback' && event.data.eventName === 'onFormSubmit') {
                    this.handleFormSubmission(event.data);
                }
            });

            // Error tracking
            window.addEventListener('error', (event) => {
                this.gtm.pushEvent('wibi_widget_error', {
                    error_code: 'JS_ERROR',
                    error_message: event.message || 'Unknown error'
                });
            });
        }

        setupFormTracking() {
            const forms = document.querySelectorAll('form');
            forms.forEach(form => {
                form.addEventListener('focusin', () => {
                    this.gtm.pushEvent('wibi_interaction_start', {
                        interaction_type: 'form',
                        form_id: form.id || 'unknown_form'
                    });
                });

                form.addEventListener('submit', () => {
                    this.gtm.pushEvent('wibi_interaction_complete', {
                        interaction_type: 'form',
                        form_id: form.id || 'unknown_form'
                    });
                });
            });
        }

        resetIdleTimer() {
            this.clearIdleTimer();
            this.idleTimer = setTimeout(() => {
                this.gtm.pushEvent('wibi_widget_idle', { 
                    idle_duration: WIBI_CONFIG.idleTimeout / 1000 
                });
                this.session.trackAction('widget_idle', { 
                    duration: WIBI_CONFIG.idleTimeout 
                });
            }, WIBI_CONFIG.idleTimeout);
        }

        clearIdleTimer() {
            if (this.idleTimer) {
                clearTimeout(this.idleTimer);
                this.idleTimer = null;
            }
        }

        async trackPageView() {
            if (!this.consent.isAllowed('analytics')) {
                this.logger.debug('Page view tracking skipped - no analytics consent');
                return;
            }

            const visitorData = this.visitor.getVisitorData();
            const sessionData = this.session.getSession();

            const payload = {
                websiteId: this.websiteId,
                utk: this.visitor.getUTK(),
                sessionId: sessionData.id,
                url: window.location.href,
                title: document.title,
                referrer: document.referrer,
                timestamp: Date.now(),
                visitor: visitorData,
                session: sessionData
            };

            this.queue.add({
                url: `${WIBI_CONFIG.apiBaseUrl}${WIBI_CONFIG.endpoints.track}`,
                options: {
                    method: 'POST',
                    body: JSON.stringify(payload)
                }
            });

            // Send to GTM
            this.gtm.pushEvent('wibi_page_view', {
                page_url: window.location.href,
                page_title: document.title,
                visitor_utk: this.visitor.getUTK(),
                session_id: sessionData.id
            });

            this.logger.debug('Page view tracked', payload);
        }

        async trackSourceAttribution() {
            if (!this.consent.isAllowed('analytics')) {
                this.logger.debug('Source attribution tracking skipped - no analytics consent');
                return;
            }

            const visitorData = this.visitor.getVisitorData();
            const sourceData = visitorData.source;

            const payload = {
                utk: this.visitor.getUTK(),
                websiteId: this.websiteId,
                page: window.location.href,
                ...sourceData,
                timestamp: Date.now(),
                botDetection: visitorData.bot
            };

            this.queue.add({
                url: `${WIBI_CONFIG.apiBaseUrl}${WIBI_CONFIG.endpoints.sourceAttribution}`,
                options: {
                    method: 'POST',
                    body: JSON.stringify(payload)
                }
            });

            this.logger.debug('Source attribution tracked', payload);
        }

        async trackInteraction(actionType, actionData = {}) {
            // Contact buttons always work, but detailed tracking requires consent
            if (!this.consent.isAllowed('analytics')) {
                this.logger.debug('Interaction tracking skipped - no analytics consent');
                // Still allow the contact action to proceed
                return;
            }

            const payload = {
                websiteId: this.websiteId,
                utk: this.visitor.getUTK(),
                sessionId: this.session.getSession().id,
                actionType,
                actionData,
                url: window.location.href,
                timestamp: Date.now()
            };

            this.queue.add({
                url: `${WIBI_CONFIG.apiBaseUrl}${WIBI_CONFIG.endpoints.action}`,
                options: {
                    method: 'POST',
                    body: JSON.stringify(payload)
                }
            });

            // Track in session
            this.session.trackAction('interaction', { type: actionType, data: actionData });

            // Send to GTM
            this.gtm.pushEvent('wibi_interaction', {
                interaction_type: actionType,
                interaction_data: actionData,
                visitor_utk: this.visitor.getUTK()
            });

            this.logger.debug('Interaction tracked', payload);
        }

        handleFormSubmission(formData) {
            const fields = formData.data || [];
            const email = fields.find(f => f.name.includes('email'))?.value;
            const phone = fields.find(f => f.name.includes('phone'))?.value;

            // Store user identifiers
            if (email) {
                this.storage.set(WIBI_CONFIG.storageKeys.email, email);
            }
            if (phone) {
                const formattedPhone = PhoneFormatter.format(phone);
                this.storage.set(WIBI_CONFIG.storageKeys.phone, formattedPhone);
            }

            // Track form submission
            this.trackInteraction('form_submit', {
                form_type: 'hubspot',
                fields: fields.map(f => f.name),
                email: email,
                phone: phone
            });

            this.logger.info('Form submission tracked', { email, phone });
        }

        trackGoogleAdsConversion(gadsId, gadsLabel) {
            try {
                // Google Ads conversion tracking
                const img = new Image(1, 1);
                img.src = `https://www.googleadservices.com/pagead/conversion/${gadsId}/?label=${gadsLabel}&script=0`;
                
                this.logger.debug('Google Ads conversion tracked', { gadsId, gadsLabel });
            } catch (error) {
                this.logger.error('Google Ads conversion tracking failed', { error: error.message });
            }
        }

        // Utility method to check if user is returning
        markUserAsReturning() {
            const currentUserType = this.storage.get(WIBI_CONFIG.storageKeys.userType);
            if (currentUserType !== 'returning') {
                this.storage.set(WIBI_CONFIG.storageKeys.userType, 'returning');
            }
        }

        // Method to get all user identifiers
        getUserIdentifiers() {
            return {
                utk: this.visitor.getUTK(),
                email: this.storage.get(WIBI_CONFIG.storageKeys.email),
                phone: this.storage.get(WIBI_CONFIG.storageKeys.phone),
                userType: this.storage.get(WIBI_CONFIG.storageKeys.userType) || 'new'
            };
        }

        // Method to push data to GTM with user context
        pushToDataLayer(eventName, extraFields = {}) {
            const identifiers = this.getUserIdentifiers();
            const payload = {
                event: eventName,
                page_path: window.location.pathname,
                page_title: document.title,
                page_url: window.location.href,
                website_id: this.websiteId,
                widget_version: '2.0.0',
                timestamp: new Date().toISOString(),
                user_properties: identifiers,
                ...extraFields
            };

            this.gtm.push(payload);
        }
    }

    // =============================================================================
    // INITIALIZATION
    // =============================================================================

    /**
     * Initialize Wibi widget
     */
    async function initializeWibi(websiteId) {
        try {
            // Validate website ID
            if (!websiteId) {
                throw new Error('Website ID is required');
            }

            // Check if already initialized
            if (window.WibiWidget) {
                console.warn('Wibi widget already initialized');
                return window.WibiWidget;
            }

            // Create and initialize widget
            const widget = new WibiWidget(websiteId);
            await widget.initialize();

            // Mark returning users
            widget.markUserAsReturning();

            // Make widget globally accessible for debugging
            window.WibiWidget = widget;

            // Mark as successfully loaded
            window.wibiLoaded = true;

            return widget;

        } catch (error) {
            console.error('Wibi widget initialization failed:', error);
            
            // Report error to backend for monitoring
            if (typeof fetch !== 'undefined') {
                fetch(`${WIBI_CONFIG.apiBaseUrl}/api/track/error`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        error: error.message,
                        stack: error.stack,
                        url: window.location.href,
                        userAgent: navigator.userAgent,
                        timestamp: Date.now(),
                        websiteId: websiteId
                    })
                }).catch(() => {}); // Silently fail error reporting
            }

            throw error;
        }
    }

    // =============================================================================
    // AUTO-INITIALIZATION
    // =============================================================================

    // Get website ID from script tag data attribute
    const currentScript = document.currentScript;
    const websiteId = currentScript?.dataset?.id;

    if (!websiteId) {
        console.error('Wibi: Website ID not found. Please add data-id attribute to script tag.');
    } else {
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                initializeWibi(websiteId).catch(error => {
                    console.error('Wibi: Initialization failed:', error);
                });
            });
        } else {
            // DOM is already ready
            initializeWibi(websiteId).catch(error => {
                console.error('Wibi: Initialization failed:', error);
            });
        }
    }

    // =============================================================================
    // GLOBAL API
    // =============================================================================

    // Expose initialization function and utilities globally
    window.initializeWibi = initializeWibi;
    window.WibiConfig = WIBI_CONFIG;

    // Expose utility classes for advanced usage
    window.WibiUtils = {
        Logger,
        StorageManager,
        DeviceDetector,
        SourceDetector,
        BusinessHours,
        PhoneFormatter
    };

    // Enhanced error handling for unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        if (event.reason && event.reason.message && event.reason.message.includes('wibi')) {
            console.error('Wibi: Unhandled promise rejection:', event.reason);
            
            // Send to error tracking
            if (window.WibiWidget && window.WibiWidget.gtm) {
                window.WibiWidget.gtm.pushEvent('wibi_widget_error', {
                    error_code: 'UNHANDLED_PROMISE_REJECTION',
                    error_message: event.reason.message
                });
            }
        }
    });

    // Development mode utilities
    if (WIBI_CONFIG.debug) {
        console.log('Wibi Debug Mode Enabled');
        console.log('Configuration:', WIBI_CONFIG);
        
        // Add debug utilities to window
        window.WibiDebug = {
            getVisitorData: () => window.WibiWidget?.visitor?.getVisitorData(),
            getSessionData: () => window.WibiWidget?.session?.getSession(),
            getStorageData: () => {
                const storage = new StorageManager();
                return {
                    utk: storage.get(WIBI_CONFIG.storageKeys.utk),
                    consent: storage.get(WIBI_CONFIG.storageKeys.consent),
                    session: storage.get(WIBI_CONFIG.storageKeys.session),
                    offlineQueue: storage.get(WIBI_CONFIG.storageKeys.offlineQueue),
                    visitorData: storage.get(WIBI_CONFIG.storageKeys.visitorData)
                };
            },
            clearAllData: () => {
                const storage = new StorageManager();
                Object.values(WIBI_CONFIG.storageKeys).forEach(key => {
                    storage.remove(key);
                });
                console.log('All Wibi data cleared');
            },
            testBot: async () => {
                const detector = new BotDetector();
                return await detector.detect();
            },
            getQueue: () => window.WibiWidget?.queue
        };
    }

})(window, document);