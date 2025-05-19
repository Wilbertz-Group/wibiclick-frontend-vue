async function createWidget(n) {
	var e, t, o, a, i, c, p, l, s, r, d, h, u, g, x, m = "",
			f = "",
			_ = "",
			y = "",
			b = "",
			w = "",
			v = [];
	
	// Cookie getter utility (moved to top-level for consistent access)
	function getCookie(name) {
		var value = "; " + document.cookie;
		var parts = value.split("; " + name + "=");
		if (parts.length == 2) return parts.pop().split(";").shift();
	}

	// Device and browser detection functions
	function detectDeviceType() {
		const ua = navigator.userAgent;
		if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
		if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(ua)) return 'mobile';
		return 'desktop';
	}

	function detectBrowser() {
		const ua = navigator.userAgent;
		let browser = 'Unknown';
		let version = '';
		
		if (ua.indexOf('Firefox') > -1) {
			browser = 'Firefox';
			version = ua.match(/Firefox\/([0-9.]+)/)?.[1] || '';
		} else if (ua.indexOf('SamsungBrowser') > -1) {
			browser = 'Samsung Browser';
			version = ua.match(/SamsungBrowser\/([0-9.]+)/)?.[1] || '';
		} else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) {
			browser = 'Opera';
			version = ua.match(/(?:Opera|OPR)\/([0-9.]+)/)?.[1] || '';
		} else if (ua.indexOf('Trident') > -1) {
			browser = 'Internet Explorer';
			version = ua.match(/rv:([0-9.]+)/)?.[1] || '';
		} else if (ua.indexOf('Edge') > -1) {
			browser = 'Edge';
			version = ua.match(/Edge\/([0-9.]+)/)?.[1] || '';
		} else if (ua.indexOf('Chrome') > -1) {
			browser = 'Chrome';
			version = ua.match(/Chrome\/([0-9.]+)/)?.[1] || '';
		} else if (ua.indexOf('Safari') > -1) {
			browser = 'Safari';
			version = ua.match(/Version\/([0-9.]+)/)?.[1] || '';
		}
		
		return { browser, version };
	}

	function detectOS() {
		const ua = navigator.userAgent;
		let os = 'Unknown';
		let version = '';
		
		if (ua.indexOf('Windows NT 10.0') > -1) {
			os = 'Windows';
			version = '10';
		} else if (ua.indexOf('Windows NT 6.3') > -1) {
			os = 'Windows';
			version = '8.1';
		} else if (ua.indexOf('Windows NT 6.2') > -1) {
			os = 'Windows';
			version = '8';
		} else if (ua.indexOf('Windows NT 6.1') > -1) {
			os = 'Windows';
			version = '7';
		} else if (ua.indexOf('Windows NT 6.0') > -1) {
			os = 'Windows';
			version = 'Vista';
		} else if (ua.indexOf('Windows NT 5.1') > -1) {
			os = 'Windows';
			version = 'XP';
		} else if (ua.indexOf('Mac OS X') > -1) {
			os = 'macOS';
			version = ua.match(/Mac OS X ([0-9_]+)/)?.[1]?.replace(/_/g, '.') || '';
		} else if (ua.indexOf('Android') > -1) {
			os = 'Android';
			version = ua.match(/Android ([0-9.]+)/)?.[1] || '';
		} else if (ua.indexOf('iOS') > -1) {
			os = 'iOS';
			version = ua.match(/OS ([0-9_]+)/)?.[1]?.replace(/_/g, '.') || '';
		} else if (ua.indexOf('Linux') > -1) {
			os = 'Linux';
		}
		
		return { os, version };
	}

	// --- Bot Detection Logic Start ---
	function detectBot() {
		let botScore = 0;
		let reasons = [];

		// 1. WebDriver/Automation detection
		if (navigator.webdriver) {
			botScore += 2;
			reasons.push('navigator.webdriver');
		}
		if (window.document.documentElement.getAttribute('webdriver')) {
			botScore += 2;
			reasons.push('documentElement.webdriver');
		}
		if (window.callPhantom || window._phantom) {
			botScore += 2;
			reasons.push('PhantomJS');
		}
		if (window.__nightmare) {
			botScore += 2;
			reasons.push('Nightmare.js');
		}
		if (window.navigator && window.navigator.languages === '') {
			botScore += 1;
			reasons.push('navigator.languages empty');
		}
		if (window.chrome && window.chrome.runtime && !window.chrome.runtime.id) {
			botScore += 1;
			reasons.push('chrome.runtime.id missing');
		}
		// 2. Headless browser detection
		if (navigator.userAgent.match(/HeadlessChrome/)) {
			botScore += 2;
			reasons.push('HeadlessChrome');
		}
		if (navigator.plugins && navigator.plugins.length === 0) {
			botScore += 1;
			reasons.push('No plugins');
		}
		if (navigator.languages && navigator.languages.length === 0) {
			botScore += 1;
			reasons.push('No languages');
		}
		// 3. Known bot user agent patterns
		const botUserAgents = [
			'bot', 'spider', 'crawl', 'slurp', 'curl', 'wget', 'python', 'phantom', 'headless', 'selenium', 'scrapy', 'httpclient', 'facebookexternalhit', 'pingdom', 'monitor', 'datadog'
		];
		const ua = navigator.userAgent.toLowerCase();
		if (botUserAgents.some(b => ua.includes(b))) {
			botScore += 2;
			reasons.push('Known bot UA');
		}
		// 4. Fingerprinting: missing or inconsistent properties
		if (!navigator.hardwareConcurrency || navigator.hardwareConcurrency < 2) {
			botScore += 1;
			reasons.push('Low hardwareConcurrency');
		}
		if (!navigator.deviceMemory) {
			botScore += 1;
			reasons.push('No deviceMemory');
		}
		if (!window.screen || window.screen.width === 0 || window.screen.height === 0) {
			botScore += 1;
			reasons.push('Screen size 0');
		}
		// 5. Permissions API (headless browsers often fail this)
		if (navigator.permissions && navigator.permissions.query) {
			try {
				navigator.permissions.query({ name: 'notifications' }).then(function (result) {
					if (result.state === 'denied') {
						botScore += 1;
						reasons.push('Notifications denied');
					}
				});
			} catch (e) {}
		}
		// 6. Behavior analysis (basic: no mouse movement/scroll in first 2s)
		let behaviorBot = false;
		let behaviorChecked = false;
		function setupBehaviorCheck(cb) {
			let moved = false, scrolled = false, clicked = false;
			function mark() { moved = true; }
			function markScroll() { scrolled = true; }
			function markClick() { clicked = true; }
			window.addEventListener('mousemove', mark, { once: true });
			window.addEventListener('scroll', markScroll, { once: true });
			window.addEventListener('click', markClick, { once: true });
			setTimeout(() => {
				if (!moved && !scrolled && !clicked) {
					behaviorBot = true;
					botScore += 1;
					reasons.push('No interaction in 2s');
				}
				behaviorChecked = true;
				if (cb) cb();
			}, 2000);
		}
		return new Promise(resolve => {
			setupBehaviorCheck(() => {
				resolve({
					isBot: botScore >= 3 || behaviorBot,
					botScore,
					reasons
				});
			});
		});
	}
	// --- Bot Detection Logic End ---

	// Collect all visitor data
	async function collectVisitorData() {
		const browserInfo = detectBrowser();
		const osInfo = detectOS();

		const botDetection = await detectBot();

		const data = {
			device: {
				type: detectDeviceType(),
				browser: browserInfo.browser,
				browserVersion: browserInfo.version,
				os: osInfo.os,
				osVersion: osInfo.version,
				screenResolution: `${window.screen.width}x${window.screen.height}`,
				language: navigator.language || navigator.userLanguage,
				timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
			},
			botDetection
		};

		return data;
	}

	// Tracking queue system
	const trackingQueue = {
		queue: [],
		processing: false,
		
		add(request) {
			this.queue.push(request);
			this.process();
		},
		
		async process() {
			if (this.processing || this.queue.length === 0) return;
			
			this.processing = true;
			
			while (this.queue.length > 0) {
				const request = this.queue.shift();
				try {
					await request();
				} catch (error) {
					console.error('Queue processing error:', error);
				}
			}
			
			this.processing = false;
		}
	};
	
	// Offline queue system
	const offlineQueue = {
		key: 'wibi_offline_queue',
		
		add(data) {
			const queue = JSON.parse(localStorage.getItem(this.key) || '[]');
			queue.push({
				...data,
				timestamp: Date.now()
			});
			localStorage.setItem(this.key, JSON.stringify(queue));
		},
		
		async process() {
			const queue = JSON.parse(localStorage.getItem(this.key) || '[]');
			if (queue.length === 0) return;
			
			const processedItems = [];
			
			for (const item of queue) {
				try {
					await fetch(item.url, {
						method: item.method,
						headers: item.headers,
						body: JSON.stringify(item.body)
					});
					processedItems.push(item);
				} catch (error) {
					console.error('Failed to process offline item:', error);
				}
			}
			
			// Remove processed items
			const remainingQueue = queue.filter(item => !processedItems.includes(item));
			localStorage.setItem(this.key, JSON.stringify(remainingQueue));
		}
	};
	
	// Check online status
	window.addEventListener('online', () => {
		offlineQueue.process();
		processStoredSourceData();
	});
	
	// Enhanced fetch wrapper
	async function trackingFetch(url, options, retries = 3) {
		for (let attempt = 1; attempt <= retries; attempt++) {
			try {
				if (!navigator.onLine) {
					throw new Error('Offline');
				}
				
				const response = await fetch(url, options);
				
				if (!response.ok && attempt < retries) {
					await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
					continue;
				}
				
				return response;
			} catch (error) {
				if (error.message === 'Offline' || attempt === retries) {
					// Save to offline queue
					offlineQueue.add({
						url,
						method: options.method,
						headers: options.headers,
						body: options.body
					});
					throw error;
				}
				
				await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
			}
		}
	}

	// Source Attribution Tracking with Enhanced Error Recovery
	async function trackPageVisit(websiteId, utk, retries = 3, delay = 1000) {
		const { source, sourceDetail, medium } = detectSource();

		// Extract UTM parameters for additional tracking
		const urlParams = new URLSearchParams(window.location.search);
		const utmCampaign = urlParams.get('utm_campaign');
		const utmContent = urlParams.get('utm_content');
		const utmTerm = urlParams.get('utm_term');

		// Collect bot detection for this visit
		let botDetection = null;
		try {
			const visitorData = await collectVisitorData();
			botDetection = visitorData.botDetection;
		} catch (e) {
			botDetection = null;
		}

		// Store in local storage as backup
		const sourceKey = `wibi_source_${utk}`;
		const sourceData = {
			utk,
			websiteId,
			source,
			sourceDetail,
			referrer: document.referrer,
			campaign: utmCampaign,
			content: utmContent,
			medium: medium,
			term: utmTerm,
			timestamp: Date.now(),
			botDetection
		};

		localStorage.setItem(sourceKey, JSON.stringify(sourceData));

		// Send to backend with retry logic
		for (let attempt = 1; attempt <= retries; attempt++) {
			try {
				const response = await trackingFetch('https://wibi.wilbertzgroup.com/api/track/track-source', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(sourceData)
				});

				if (response.ok) {
					// Remove from local storage on success
					localStorage.removeItem(sourceKey);
					// Track success
					window.dataLayer = window.dataLayer || [];
					window.dataLayer.push({
						event: "wibi_source_attribution",
						success: true,
						status: response.status,
						utk: utk,
						source: source
					});
					return; // Success
				}

				if (response.status === 404 && attempt < retries) {
					// Visitor not found, wait and retry
					await new Promise(resolve => setTimeout(resolve, delay * attempt));
					continue;
				}

				throw new Error(`HTTP error! status: ${response.status}`);
			} catch (error) {
				if (attempt === retries) {
					console.error('Error tracking source after all retries:', error);
					// Track failure
					window.dataLayer = window.dataLayer || [];
					window.dataLayer.push({
						event: "wibi_source_attribution",
						success: false,
						status: error.status || 'error',
						utk: utk,
						source: source,
						error: error.message
					});
				}
			}
		}
	}

	// Process stored source data
	function processStoredSourceData() {
		const keys = Object.keys(localStorage).filter(key => key.startsWith('wibi_source_'));
		
		keys.forEach(async (key) => {
			try {
				const data = JSON.parse(localStorage.getItem(key));
				
				// Only process if data is less than 24 hours old
				if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
					const response = await trackingFetch('https://wibi.wilbertzgroup.com/api/track/track-source', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify(data)
					});
					
					if (response.ok) {
						localStorage.removeItem(key);
					}
				} else {
					// Remove old data
					localStorage.removeItem(key);
				}
			} catch (e) {
				console.error('Error processing stored source data:', e);
			}
		});
	}

	// Utility: Push to dataLayer with new schema
	function pushToDataLayer(eventName, extraFields = {}) {
		// Get all available identifiers
		var utk = localStorage.getItem("wibi_utk") || getCookie("wibi_utk") || "";
		var email = localStorage.getItem("wibi_email") || "";
		var phone = localStorage.getItem("wibi_phone") || "";
		var websiteId = n || "";
		var pageUrl = window.location.href;
		var pageTitle = document.title;
		var widgetVersion = "1.0.0";
		var userType = localStorage.getItem("wibi_user_type") || "new";
		var payload = {
			event: eventName,
			page_path: window.location.pathname,
			page_title: pageTitle,
			page_url: pageUrl,
			website_id: websiteId,
			widget_version: widgetVersion,
			timestamp: new Date().toISOString(),
			user_properties: {
				utk: utk,
				email: email,
				phone: phone,
				user_type: userType
			},
			...extraFields
		};
		// TODO: Check user consent before pushing to dataLayer
		window.dataLayer = window.dataLayer || [];
		window.dataLayer.push(payload);
	}

	// Generate UUID fallback if no UTK exists
	function generateUUID() {
		return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
			(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
		);
	}
	
	// Session Management
	function initSessionTracking() {
		const sessionKey = 'wibi_session';
		const sessionTimeout = 30 * 60 * 1000; // 30 minutes
		
		let session = JSON.parse(sessionStorage.getItem(sessionKey) || '{}');
		const now = Date.now();
		
		if (!session.id || now - session.lastActivity > sessionTimeout) {
			// New session
			session = {
				id: generateUUID(),
				startTime: now,
				lastActivity: now,
				pageViews: 1,
				actions: []
			};
		} else {
			// Existing session
			session.lastActivity = now;
			session.pageViews++;
		}
		
		sessionStorage.setItem(sessionKey, JSON.stringify(session));
		return session;
	}
	
	// Track session actions
	function trackSessionAction(actionType, actionDetail) {
		const sessionKey = 'wibi_session';
		let session = JSON.parse(sessionStorage.getItem(sessionKey) || '{}');
		
		if (session.id) {
			session.actions.push({
				type: actionType,
				detail: actionDetail,
				timestamp: Date.now()
			});
			session.lastActivity = Date.now();
			sessionStorage.setItem(sessionKey, JSON.stringify(session));
		}
	}
	
	// Idle timer state
	let idleTimer = null;
	let idleStart = null;
	const IDLE_TIMEOUT = 60; // seconds
	// Hover state
	let hoverStart = null;
	let hoverTimer = null;
	let lastHoveredOption = null;
	
	// Enhanced UTK Management
	function getConsistentUTK() {
		// Try localStorage first
		let utk = localStorage.getItem("wibi_utk");
		if (utk && utk !== 'undefined' && utk !== 'null') return utk;
		
		// Try cookies
		utk = getCookie("wibi_utk");
		if (utk && utk !== 'undefined' && utk !== 'null') return utk;
		
		// Check if cookies are enabled
		if (!navigator.cookieEnabled) {
			console.warn('Cookies are disabled, using sessionStorage as fallback');
			utk = sessionStorage.getItem("wibi_utk");
			if (utk) return utk;
		}
		
		// Try HubSpot cookie
		utk = getCookie("hubspotutk");
		if (utk && utk !== 'undefined' && utk !== 'null') {
			localStorage.setItem("wibi_utk", utk);
			sessionStorage.setItem("wibi_utk", utk);
			return utk;
		}
		
		// Generate new UUID
		utk = generateUUID();
		
		// Store in all available storage methods
		try {
			localStorage.setItem("wibi_utk", utk);
		} catch (e) {
			console.warn('localStorage not available');
		}
		
		try {
			sessionStorage.setItem("wibi_utk", utk);
		} catch (e) {
			console.warn('sessionStorage not available');
		}
		
		try {
			var cookieExpiry = new Date();
			cookieExpiry.setFullYear(cookieExpiry.getFullYear() + 1);
			document.cookie = `wibi_utk=${utk}; expires=${cookieExpiry.toUTCString()}; path=/; SameSite=Lax`;
		} catch (e) {
			console.warn('cookies not available');
		}
		
		return utk;
	}
	
	async function run() {
			var c_utk = localStorage.getItem("wibi_utk") || getCookie("wibi_utk");
			!c_utk ? c_utk = false : ''
			function checkTime() { var d = new Date(); var hours = d.getHours(); var mins = d.getMinutes(); var day = d.getDay(); return day >= 1 && day <= 5 && hours >= 9 && (hours < 13 || hours === 13 && mins <= 30); }
			
			// Initialize session tracking
			const session = initSessionTracking();
			
			var utk = getConsistentUTK();
			// Store UTK in first-party cookie with 1 year expiration
			var cookieExpiry = new Date();
			cookieExpiry.setFullYear(cookieExpiry.getFullYear() + 1);
			document.cookie = `wibi_utk=${utk}; expires=${cookieExpiry.toUTCString()}; path=/; SameSite=Lax`;
			
			// Get source attribution immediately
			const { source, sourceDetail, medium } = detectSource();
			const urlParams = new URLSearchParams(window.location.search);
			
			// Include source data in initial request
			const sourceData = {
				source,
				sourceDetail,
				referrer: document.referrer,
				campaign: urlParams.get('utm_campaign'),
				content: urlParams.get('utm_content'),
				medium: medium,
				term: urlParams.get('utm_term')
			};
			
			// Collect enhanced visitor data
			const visitorData = await collectVisitorData();
			
			// Include client data in the request
			const clientData = {
				screenResolution: visitorData.device.screenResolution,
				botDetection: visitorData.botDetection
			};

			pg = window.location.href,
			P = await fetch(`https://wibi.wilbertzgroup.com/wibi-options?id=${n}&c=0&pg=${pg}&utk=${utk}&source=${encodeURIComponent(JSON.stringify(sourceData))}&clientData=${encodeURIComponent(JSON.stringify(clientData))}`),
			B = await P.json();
			localStorage.setItem("wibi_utk", utk);
			
			// Still track source as fallback in case the initial request didn't process it
			await new Promise(resolve => setTimeout(resolve, 500));
			trackingQueue.add(() => trackPageVisit(n, utk));
			
			// Mark user as returning if already had utk
			if (localStorage.getItem("wibi_user_type") !== "returning" && c_utk) {
				localStorage.setItem("wibi_user_type", "returning");
			}
			
			m = B.name, f = B.designation, e = B.pnumber, pn = B.phoneText, t = B.wnumber, o = B.message, _ = B.messenger_url, y = B.color_code, b = B.profile_imgUrl, w = B.email, a = B.subject, i = B.body, c = B.whatsapp_message, p = B.telegram_num, l = B.viber_num, s = B.skype_nameemail, r = B.pnumber_sms, d = B.sms_body, h = B.label, g = B.position, v = B.custom_buttons, x = B.line, u = B.close_label, bfu = B.booking_form_url, void 0 === h && (h = "Contact Us"), void 0 !== g && "" !== g || (g = "right");

			// --- GTM ID Fetching Logic Start ---
			async function fetchGtmId() {
				try {
					let currentUrl = window.location.href;
					const urlObj = new URL(currentUrl);
					let cleanUrl = urlObj.hostname;
					const apiUrl = `https://wibi.wilbertzgroup.com/api/public/gtm-id?url=${encodeURIComponent(cleanUrl)}`;
					
					const response = await fetch(apiUrl);
					if (!response.ok) {
						console.error('Failed to fetch GTM ID:', response.status);
						return null;
					}
					
					const data = await response.json();
					if (!data.gtm_container_id) {
						console.error('No GTM ID in response');
						return null;
					}
					
					return data.gtm_container_id;
				} catch (error) {
					console.error('Error fetching GTM ID:', error);
					return null;
				}
			}

			// --- GTM Injection Logic Start ---
			function gtmAlreadyInstalled(gtmId) {
				// Check <head> for GTM script
				var headScripts = document.head.querySelectorAll('script[src^="https://www.googletagmanager.com/gtm.js?id="]');
				for (var i = 0; i < headScripts.length; i++) {
					if (headScripts[i].src.indexOf(gtmId) !== -1) return true;
				}
				// Check <body> for GTM noscript iframe
				var bodyNoscripts = document.body.querySelectorAll('noscript');
				for (var j = 0; j < bodyNoscripts.length; j++) {
					var ns = bodyNoscripts[j];
					if (ns.innerHTML.indexOf('https://www.googletagmanager.com/ns.html?id=' + gtmId) !== -1) return true;
				}
				return false;
			}

			function injectGTM(gtmId) {
				// Inject <script> in <head>
				var gtmScript = document.createElement('script');
				gtmScript.async = true;
				gtmScript.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(gtmId);
				// Insert as high as possible in <head>
				if (document.head.firstChild) {
					document.head.insertBefore(gtmScript, document.head.firstChild);
				} else {
					document.head.appendChild(gtmScript);
				}
				// Inject <noscript> in <body> (immediately after <body> open)
				var gtmNoscript = document.createElement('noscript');
				gtmNoscript.innerHTML = '<iframe src="https://www.googletagmanager.com/ns.html?id=' + encodeURIComponent(gtmId) + '" height="0" width="0" style="display:none;visibility:hidden"></iframe>';
				if (document.body.firstChild) {
					document.body.insertBefore(gtmNoscript, document.body.firstChild);
				} else {
					document.body.appendChild(gtmNoscript);
				}
			}

			// Try to get GTM ID from both sources
			var gtm_container_id = B.gtm_container_id || B.gtm_container_id || await fetchGtmId();
			if (
				gtm_container_id &&
				/^GTM-[A-Z0-9]+$/.test(gtm_container_id) &&
				!gtmAlreadyInstalled(gtm_container_id)
			) {
				injectGTM(gtm_container_id);
				
				// Push enhanced visitor data to dataLayer
				window.dataLayer = window.dataLayer || [];
				window.dataLayer.push({
					event: 'wibi_visitor_data',
					visitor_info: {
						device_type: visitorData.device.type,
						browser: visitorData.device.browser,
						browser_version: visitorData.device.browserVersion,
						os: visitorData.device.os,
						os_version: visitorData.device.osVersion,
						screen_resolution: visitorData.device.screenResolution,
						language: visitorData.device.language,
						timezone: visitorData.device.timezone
					},
					source_info: {
						source: sourceData.source,
						source_detail: sourceData.sourceDetail,
						medium: sourceData.medium,
						campaign: sourceData.campaign,
						referrer: sourceData.referrer
					}
				});
			}
			// --- GTM Injection Logic End ---

			var k = document.createElement("div");

			var htmlButtons = {
					"messenger_show": `<a target="_blank" href="${_}" class="chatPopup__messengerNow"  id="chatPopup__messengerNow">                <div class="chatPopup__messengerIcon"><svg aria-hidden="true" focusable="false" data-prefix="fab"                        data-icon="facebook-messenger" class="svg-inline--fa fa-facebook-messenger fa-w-16" role="img"                        xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">                        <path fill="currentColor"                            d="M256.55 8C116.52 8 8 110.34 8 248.57c0 72.3 29.71 134.78 78.07 177.94 8.35 7.51 6.63 11.86 8.05 58.23A19.92 19.92 0 0 0 122 502.31c52.91-23.3 53.59-25.14 62.56-22.7C337.85 521.8 504 423.7 504 248.57 504 110.34 396.59 8 256.55 8zm149.24 185.13l-73 115.57a37.37 37.37 0 0 1-53.91 9.93l-58.08-43.47a15 15 0 0 0-18 0l-78.37 59.44c-10.46 7.93-24.16-4.6-17.11-15.67l73-115.57a37.36 37.36 0 0 1 53.91-9.93l58.06 43.46a15 15 0 0 0 18 0l78.41-59.38c10.44-7.98 24.14 4.54 17.09 15.62z">                        </path>                    </svg></div>                <div class="chatPopup__phoneText">Messenger</div>            </a>`,

					"line_show": `<a target="_blank" href="https://line.me/R/ti/p/@${x}" class="chatPopup__line"  id="chatPopup__line">                <div class="chatPopup__messengerIcon"><svg aria-hidden="true" focusable="false" data-prefix="fab" data-icon="line" class="svg-inline--fa fa-line fa-w-14" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M272.1 204.2v71.1c0 1.8-1.4 3.2-3.2 3.2h-11.4c-1.1 0-2.1-.6-2.6-1.3l-32.6-44v42.2c0 1.8-1.4 3.2-3.2 3.2h-11.4c-1.8 0-3.2-1.4-3.2-3.2v-71.1c0-1.8 1.4-3.2 3.2-3.2H219c1 0 2.1.5 2.6 1.4l32.6 44v-42.2c0-1.8 1.4-3.2 3.2-3.2h11.4c1.8-.1 3.3 1.4 3.3 3.1zm-82-3.2h-11.4c-1.8 0-3.2 1.4-3.2 3.2v71.1c0 1.8 1.4 3.2 3.2 3.2h11.4c1.8 0 3.2-1.4 3.2-3.2v-71.1c0-1.7-1.4-3.2-3.2-3.2zm-27.5 59.6h-31.1v-56.4c0-1.8-1.4-3.2-3.2-3.2h-11.4c-1.8 0-3.2 1.4-3.2 3.2v71.1c0 .9.3 1.6.9 2.2.6.5 1.3.9 2.2.9h45.7c1.8 0 3.2-1.4 3.2-3.2v-11.4c0-1.7-1.4-3.2-3.1-3.2zM332.1 201h-45.7c-1.7 0-3.2 1.4-3.2 3.2v71.1c0 1.7 1.4 3.2 3.2 3.2h45.7c1.8 0 3.2-1.4 3.2-3.2v-11.4c0-1.8-1.4-3.2-3.2-3.2H301v-12h31.1c1.8 0 3.2-1.4 3.2-3.2V234c0-1.8-1.4-3.2-3.2-3.2H301v-12h31.1c1.8 0 3.2-1.4 3.2-3.2v-11.4c-.1-1.7-1.5-3.2-3.2-3.2zM448 113.7V399c-.1 44.8-36.8 81.1-81.7 81H81c-44.8-.1-81.1-36.9-81-81.7V113c.1-44.8 36.9-81.1 81.7-81H367c44.8.1 81.1 36.8 81 81.7zm-61.6 122.6c0-73-73.2-132.4-163.1-132.4-89.9 0-163.1 59.4-163.1 132.4 0 65.4 58 120.2 136.4 130.6 19.1 4.1 16.9 11.1 12.6 36.8-.7 4.1-3.3 16.1 14.1 8.8 17.4-7.3 93.9-55.3 128.2-94.7 23.6-26 34.9-52.3 34.9-81.5z"></path></svg></div>                <div class="chatPopup__phoneText">Line</div>            </a>`,

					"viber_show": `<a target="_blank" href="viber://chat?number=${l}" class="chatPopup__viber"  id="chatPopup__viber">                <div class="chatPopup__messengerIcon"><svg aria-hidden="true" focusable="false" data-prefix="fab" data-icon="viber" class="svg-inline--fa fa-viber fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M444 49.9C431.3 38.2 379.9.9 265.3.4c0 0-135.1-8.1-200.9 52.3C27.8 89.3 14.9 143 13.5 209.5c-1.4 66.5-3.1 191.1 117 224.9h.1l-.1 51.6s-.8 20.9 13 25.1c16.6 5.2 26.4-10.7 42.3-27.8 8.7-9.4 20.7-23.2 29.8-33.7 82.2 6.9 145.3-8.9 152.5-11.2 16.6-5.4 110.5-17.4 125.7-142 15.8-128.6-7.6-209.8-49.8-246.5zM457.9 287c-12.9 104-89 110.6-103 115.1-6 1.9-61.5 15.7-131.2 11.2 0 0-52 62.7-68.2 79-5.3 5.3-11.1 4.8-11-5.7 0-6.9.4-85.7.4-85.7-.1 0-.1 0 0 0-101.8-28.2-95.8-134.3-94.7-189.8 1.1-55.5 11.6-101 42.6-131.6 55.7-50.5 170.4-43 170.4-43 96.9.4 143.3 29.6 154.1 39.4 35.7 30.6 53.9 103.8 40.6 211.1zm-139-80.8c.4 8.6-12.5 9.2-12.9.6-1.1-22-11.4-32.7-32.6-33.9-8.6-.5-7.8-13.4.7-12.9 27.9 1.5 43.4 17.5 44.8 46.2zm20.3 11.3c1-42.4-25.5-75.6-75.8-79.3-8.5-.6-7.6-13.5.9-12.9 58 4.2 88.9 44.1 87.8 92.5-.1 8.6-13.1 8.2-12.9-.3zm47 13.4c.1 8.6-12.9 8.7-12.9.1-.6-81.5-54.9-125.9-120.8-126.4-8.5-.1-8.5-12.9 0-12.9 73.7.5 133 51.4 133.7 139.2zM374.9 329v.2c-10.8 19-31 40-51.8 33.3l-.2-.3c-21.1-5.9-70.8-31.5-102.2-56.5-16.2-12.8-31-27.9-42.4-42.4-10.3-12.9-20.7-28.2-30.8-46.6-21.3-38.5-26-55.7-26-55.7-6.7-20.8 14.2-41 33.3-51.8h.2c9.2-4.8 18-3.2 23.9 3.9 0 0 12.4 14.8 17.7 22.1 5 6.8 11.7 17.7 15.2 23.8 6.1 10.9 2.3 22-3.7 26.6l-12 9.6c-6.1 4.9-5.3 14-5.3 14s17.8 67.3 84.3 84.3c0 0 9.1.8 14-5.3l9.6-12c4.6-6 15.7-9.8 26.6-3.7 14.7 8.3 33.4 21.2 45.8 32.9 7 5.7 8.6 14.4 3.8 23.6z"></path></svg></div>                <div class="chatPopup__phoneText">Viber</div>            </a>`,

					"phone_show": `<a target="_blank" href="tel:${e}" class="chatPopup__callNow" id="chatPopup__callNow">                <div class="chatPopup__phoneIcon"><svg viewBox="0 0 578.106 578.106">                        <path                            d="M577.83 456.128c1.225 9.385-1.635 17.545-8.568 24.48l-81.396 80.781c-3.672 4.08-8.465 7.551-14.381 10.404-5.916 2.857-11.729 4.693-17.439 5.508-.408 0-1.635.105-3.676.309-2.037.203-4.689.307-7.953.307-7.754 0-20.301-1.326-37.641-3.979s-38.555-9.182-63.645-19.584c-25.096-10.404-53.553-26.012-85.376-46.818-31.823-20.805-65.688-49.367-101.592-85.68-28.56-28.152-52.224-55.08-70.992-80.783-18.768-25.705-33.864-49.471-45.288-71.299-11.425-21.828-19.993-41.616-25.705-59.364S4.59 177.362 2.55 164.51-.306 141.56.102 134.216c.408-7.344.612-11.424.612-12.24.816-5.712 2.652-11.526 5.508-17.442s6.324-10.71 10.404-14.382L98.022 8.756c5.712-5.712 12.24-8.568 19.584-8.568 5.304 0 9.996 1.53 14.076 4.59s7.548 6.834 10.404 11.322l65.484 124.236c3.672 6.528 4.692 13.668 3.06 21.42-1.632 7.752-5.1 14.28-10.404 19.584l-29.988 29.988c-.816.816-1.53 2.142-2.142 3.978s-.918 3.366-.918 4.59c1.632 8.568 5.304 18.36 11.016 29.376 4.896 9.792 12.444 21.726 22.644 35.802s24.684 30.293 43.452 48.653c18.36 18.77 34.68 33.354 48.96 43.76 14.277 10.4 26.215 18.053 35.803 22.949 9.588 4.896 16.932 7.854 22.031 8.871l7.648 1.531c.816 0 2.145-.307 3.979-.918 1.836-.613 3.162-1.326 3.979-2.143l34.883-35.496c7.348-6.527 15.912-9.791 25.705-9.791 6.938 0 12.443 1.223 16.523 3.672h.611l118.115 69.768c8.571 5.308 13.67 12.038 15.303 20.198z">                        </path>                    </svg></div>                <div class="chatPopup__phoneText">${pn}</div>            </a>         `,

					"telegram_show": `<a target="_blank" href="https://t.me/${p}" class="chatPopup__telegram"  id="chatPopup__telegram">                <div class="chatPopup__messengerIcon"><svg aria-hidden="true" focusable="false" data-prefix="fab" data-icon="telegram-plane" class="svg-inline--fa fa-telegram-plane fa-w-14" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M446.7 98.6l-67.6 318.8c-5.1 22.5-18.4 28.1-37.3 17.5l-103-75.9-49.7 47.8c-5.5 5.5-10.1 10.1-20.7 10.1l7.4-104.9 190.9-172.5c8.3-7.4-1.8-11.5-12.9-4.1L117.8 284 16.2 252.2c-22.1-6.9-22.5-22.1 4.6-32.7L418.2 66.4c18.4-6.9 34.5 4.1 28.5 32.2z"></path></svg></div>                <div class="chatPopup__phoneText">Telegram</div>            </a>`,

					"text_show": `<a target="_blank" href="sms://${r};?&body=${d}" class="chatPopup__messageNow" id="chatPopup__messageNow">                <div class="chatPopup__whatsappIcon"><svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="comment" class="svg-inline--fa fa-comment fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 32C114.6 32 0 125.1 0 240c0 49.6 21.4 95 57 130.7C44.5 421.1 2.7 466 2.2 466.5c-2.2 2.3-2.8 5.7-1.5 8.7S4.8 480 8 480c66.3 0 116-31.8 140.6-51.4 32.7 12.3 69 19.4 107.4 19.4 141.4 0 256-93.1 256-208S397.4 32 256 32z"></path></svg></div>                <div class="chatPopup__phoneText">Send a message</div>            </a>`,

					"email_show": `<a target="_blank" href="mailto:${w}?subject=${encodeURIComponent(a)}&body=${encodeURIComponent(i)}" class="chatPopup__mailNow"  id="chatPopup__mailNow">                <div class="chatPopup__mailIcon"><svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="envelope" class="svg-inline--fa fa-envelope fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M502.3 190.8c3.9-3.1 9.7-.2 9.7 4.7V400c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V195.6c0-5 5.7-7.8 9.7-4.7 22.4 17.4 52.1 39.5 154.1 113.6 21.1 15.4 56.7 47.8 92.2 47.6 35.7.3 72-32.8 92.3-47.6 102-74.1 131.6-96.3 154-113.7zM256 320c23.2.4 56.6-29.2 73.4-41.4 132.7-96.3 142.8-104.7 173.4-128.7 5.8-4.5 9.2-11.5 9.2-18.9v-19c0-26.5-21.5-48-48-48H48C21.5 64 0 85.5 0 112v19c0 7.4 3.4 14.3 9.2 18.9 30.6 23.9 40.7 32.4 173.4 128.7 16.8 12.2 50.2 41.8 73.4 41.4z"></path></svg></div>                <div class="chatPopup__phoneText">Email Us</div>            </a>`,

					"whatsapp_show": `<a target="_blank" href="https://api.whatsapp.com/send?phone=${t}&text=${encodeURIComponent(c)}" class="chatPopup__whatsappNow" id="chatPopup__whatsappNow">                <div class="chatPopup__whatsappIcon"><svg aria-hidden="true" focusable="false" data-prefix="fab"                        data-icon="whatsapp" class="svg-inline--fa fa-whatsapp fa-w-14" role="img"                        xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">                        <path fill="currentColor"                            d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z">                        </path>                    </svg></div>                <div class="chatPopup__phoneText">Whatsapp</div>            </a>`,

					"skype_show": `<a target="_blank" href="skype:${s}?chat" class="chatPopup__skype"  id="chatPopup__skype">                <div class="chatPopup__messengerIcon"><svg aria-hidden="true" focusable="false" data-prefix="fab" data-icon="skype" class="svg-inline--fa fa-skype fa-w-14" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M424.7 299.8c2.9-14 4.7-28.9 4.7-43.8 0-113.5-91.9-205.3-205.3-205.3-14.9 0-29.7 1.7-43.8 4.7C161.3 40.7 137.7 32 112 32 50.2 32 0 82.2 0 144c0 25.7 8.7 49.3 23.3 68.2-2.9 14-4.7 28.9-4.7 43.8 0 113.5 91.9 205.3 205.3 205.3 14.9 0 29.7-1.7 43.8-4.7 19 14.6 42.6 23.3 68.2 23.3 61.8 0 112-50.2 112-112 .1-25.6-8.6-49.2-23.2-68.1zm-194.6 91.5c-65.6 0-120.5-29.2-120.5-65 0-16 9-30.6 29.5-30.6 31.2 0 34.1 44.9 88.1 44.9 25.7 0 42.3-11.4 42.3-26.3 0-18.7-16-21.6-42-28-62.5-15.4-117.8-22-117.8-87.2 0-59.2 58.6-81.1 109.1-81.1 55.1 0 110.8 21.9 110.8 55.4 0 16.9-11.4 31.8-30.3 31.8-28.3 0-29.2-33.5-75-33.5-25.7 0-42 7-42 22.5 0 19.8 20.8 21.8 69.1 33 41.4 9.3 90.7 26.8 90.7 77.6 0 59.1-57.1 86.5-112 86.5z"></path></svg></div>                <div class="chatPopup__phoneText">Skype</div>            </a>`,

					"book_a_technician_show": `<a target="_blank" href="${bfu}" class="chatPopup__book_a_technician" id="chatPopup__book_a_technician">Book a Technician</a>`,

					"branding_show": `<a href="https://www.wibi.co.za/" target="_blank" id="branding">Add me to you site for free⚡️</a>`,
			}

			k.className = "wibiclickcss", k.innerHTML = `  <div class="chat-popup" id="myForm"  style="display: none;"> <div class="div-container" id="divContainer">  ${ B.phone_show && checkTime() ? htmlButtons.phone_show : '' } ${ B.text_show ? htmlButtons.text_show : '' } ${ B.whatsapp_show ? htmlButtons.whatsapp_show : '' } ${ B.messenger_show ? htmlButtons.messenger_show : '' } ${ B.telegram_show ? htmlButtons.telegram_show : '' } ${ B.viber_show ? htmlButtons.viber_show : '' } ${ B.skype_show ? htmlButtons.skype_show : '' } ${ B.line_show ? htmlButtons.line_show : '' } ${ B.email_show ? htmlButtons.email_show : '' }  ${ B.branding_show ? htmlButtons.branding_show : '' } ${B.book_a_technician_show ? htmlButtons.book_a_technician_show : ''}      </div>       </div>     <button type="button" class="openButton" id="openButton" style="background-color: ${y};">                     <svg id="openButton__phoneIcon" viewBox="0 0 578.106 578.106">            <path                d="M577.83 456.128c1.225 9.385-1.635 17.545-8.568 24.48l-81.396 80.781c-3.672 4.08-8.465 7.551-14.381 10.404-5.916 2.857-11.729 4.693-17.439 5.508-.408 0-1.635.105-3.676.309-2.037.203-4.689.307-7.953.307-7.754 0-20.301-1.326-37.641-3.979s-38.555-9.182-63.645-19.584c-25.096-10.404-53.553-26.012-85.376-46.818-31.823-20.805-65.688-49.367-101.592-85.68-28.56-28.152-52.224-55.08-70.992-80.783-18.768-25.705-33.864-49.471-45.288-71.299-11.425-21.828-19.993-41.616-25.705-59.364S4.59 177.362 2.55 164.51-.306 141.56.102 134.216c.408-7.344.612-11.424.612-12.24.816-5.712 2.652-11.526 5.508-17.442s6.324-10.71 10.404-14.382L98.022 8.756c5.712-5.712 12.24-8.568 19.584-8.568 5.304 0 9.996 1.53 14.076 4.59s7.548 6.834 10.404 11.322l65.484 124.236c3.672 6.528 4.692 13.668 3.06 21.42-1.632 7.752-5.1 14.28-10.404 19.584l-29.988 29.988c-.816.816-1.53 2.142-2.142 3.978s-.918 3.366-.918 4.59c1.632 8.568 5.304 18.36 11.016 29.376 4.896 9.792 12.444 21.726 22.644 35.802s24.684 30.293 43.452 48.653c18.36 18.77 34.68 33.354 48.96 43.76 14.277 10.4 26.215 18.053 35.803 22.949 9.588 4.896 16.932 7.854 22.031 8.871l7.648 1.531c.816 0 2.145-.307 3.979-.918 1.836-.613 3.162-1.326 3.979-2.143l34.883-35.496c7.348-6.527 15.912-9.791 25.705-9.791 6.938 0 12.443 1.223 16.523 3.672h.611l118.115 69.768c8.571 5.308 13.67 12.038 15.303 20.198z">            </path>        </svg>              <svg id="openButton__closeIcon" style=" display: none; " viewBox="0 0 16 16" focusable="false"            class="jsx-1895484302 eactc-button-closeIcon eactc-button-show">            <path                d="M9.414,8l6.112-6.112c0.396-0.396,0.401-1.032,0.009-1.423c-0.39-0.39-1.027-0.387-1.423,0.009L8,6.585 L1.888,0.473C1.492,0.077,0.854,0.074,0.465,0.464C0.073,0.856,0.078,1.492,0.474,1.888L6.586,8l-6.112,6.112 c-0.396,0.396-0.401,1.033-0.009,1.423c0.39,0.391,1.027,0.387,1.423-0.008L8,9.415l6.112,6.113 c0.396,0.394,1.033,0.399,1.423,0.008c0.39-0.39,0.387-1.027-0.009-1.423L9.414,8z"                class="jsx-1895484302"></path>        </svg>        <span id="openButton__label">${h}</span></button>`, document.querySelector("body").appendChild(k);

			var I = document.createElement("style");
			I.innerHTML = `@import url(https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap); .wibiclickcss #branding { font-size: 10px !important; color: #fff; cursor: pointer; border-radius: 20px; background-color: #18374d; border: 2px solid white; } #myForm{display:none;font-family:Poppins,sans-serif}.openButton{display:flex;justify-content:center;align-items:center;color:#fff;border:none;cursor:pointer;position:fixed;bottom:23px;${g}: 88px; height: 45px; padding: 0px 24px; border-radius: 40px; fill: rgb(255, 255, 255); box-shadow: rgba(17, 12, 46, 0.15) 0px 20px 16px 0px; z-index: 9999;}#openButton__label{margin-left:8px;font-size:16px;font-family:Poppins,sans-serif;margin-bottom:0}.form-popup{display:none;position:fixed;bottom:0;right:15px;border:3px solid #f1f1f1;z-index:9}.div-container{box-sizing:border-box;text-align:center;position:fixed;bottom:67px;${g}: 28px; max-width: 300px; background-color: transparent; box-shadow: none; border-radius: 8px; padding: 16px 24px; z-index: 1000; display: flex; flex-direction: column; justify-content: center; align-items: center; min-width: 250px;}.chatPopup__name{font-size:13px;margin-bottom:0}.chatPopup__designation{font-size:12px;opacity:.8;margin:0}.chatPopup__message{font-size:14px;opacity:.9;margin-top:8px;margin-bottom:0!important}.chatPopup__callNow,.chatPopup__book_a_technician{background-color:#0f130f;color:#fff;display:flex;border-radius:24px;padding:8px 16px;fill:#fff;text-decoration:none;justify-content:center;margin-top:6px}.chatPopup__line{background-color:#53c645;color:#fff;display:flex;justify-content:center;align-items:center;border-radius:24px;padding:8px 16px;fill:#fff;text-decoration:none;margin-top:6px}.chatPopup__phoneIcon{height:15px;width:15px;display:flex;justify-content:center;align-items:center}.chatPopup__phoneText{margin-left:8px;font-size:16px;font-weight:500}.chatPopup__messageNow{background-color:#ffb714;color:#fff;display:flex;border-radius:24px;padding:8px 16px;fill:#fff;text-decoration:none;justify-content:center;align-items:center;margin-top:6px}.chatPopup__whatsappNow{background-color:#53c645;color:#fff;display:flex;border-radius:24px;padding:8px 16px;fill:#fff;text-decoration:none;justify-content:center;align-items:center;margin-top:6px}.chatPopup__whatsappIcon{height:17px;width:17px;display:flex;justify-content:center;align-items:center}.chatPopup__messengerNow{background-color:#006aff;color:#fff;display:flex;justify-content:center;align-items:center;border-radius:24px;padding:8px 16px;fill:#fff;text-decoration:none;margin-top:6px}.chatPopup__skype{background-color:#02aff0;color:#fff;display:flex;justify-content:center;align-items:center;border-radius:24px;padding:8px 16px;fill:#fff;text-decoration:none;margin-top:6px}.chatPopup__viber{background-color:#754da0;color:#fff;display:flex;justify-content:center;align-items:center;border-radius:24px;padding:8px 16px;fill:#fff;text-decoration:none;margin-top:6px}.chatPopup__telegram{background-color:#15a4ee;color:#fff;display:flex;justify-content:center;align-items:center;border-radius:24px;padding:8px 16px;fill:#fff;text-decoration:none;margin-top:6px}.chatPopup__messengerIcon{height:17px;width:17px;display:flex;justify-content:center;align-items:center}.chatPopup__mailNow{background-color:#ea4335;color:#fff;display:flex;justify-content:center;align-items:center;border-radius:24px;padding:8px 16px;fill:#fff;text-decoration:none;margin-top:6px}.chatPopup__mailIcon{height:17px;width:17px;display:flex;justify-content:center;align-items:center}#openButton__phoneIcon{height:15px;width:15px;display:flex;justify-content:center;align-items:center}#openButton__closeIcon{height:15px;width:15px}.chatPopup__poweredBy{font-size:11px;margin-top:24px;margin-bottom:8px;text-decoration:none;color:gray}#customButton{background-color:rgba(60,169,52,.068);color:#3ba934;display:flex;border-radius:24px;padding:8px 16px;fill:#3ba934;text-decoration:none;justify-content:center;margin-top:6px;width:100%}#customButton:hover{background-color:#3ba934;color:#fff;display:flex;border-radius:24px;padding:8px 16px;fill:#fff;text-decoration:none;justify-content:center;margin-top:6px}.code__wrapperTextArea{background-color:#182439;border:none;color:#fff;resize:none;overflow:hidden;background-color:#20314e;padding:8px 16px;border-radius:8px;border:1px solid #304c7c}.wibiclickcss div#divContainer>a{width: 94%; -webkit-box-shadow: 0 5px 10px 2px rgba(88,103,221,.19)!important; box-shadow: 0 5px 10px 2px rgba(88,103,221,.3)!important; padding: 11px 16px; font-size: 13px; line-height: 16px; fill: #fff; text-decoration: none; margin-top: 9px;}.wibiclickcss div#divContainer>a:hover { color: #fff; opacity: 0.8; }`, k.appendChild(I);
			try {
					v.map((n, e) => {
							var t = document.createElement("a");
							t.href = n.url, n.new_tab && (t.target = "_blank");
							var o = "";
							n.logo_code && (o = `<i class="fa customButtonIcon">&#x${n.logo_code};</i>`), t.id = `customButton${e}`, t.innerHTML = `              <div class="chatPopup__phoneText">${o}${n.label}</div>`;
							var a = document.createElement("style");
							a.innerHTML = `.customButtonIcon{            margin-right: 6px;          }           #customButton${e} {              background-color: #${n.colorCode.replace("#","")}0D;              color: #${n.colorCode};              display: flex;              border-radius: 24px;              padding: 8px 16px;              fill: #${n.colorCode.replace("#","")};              text-decoration: none;              justify-content: center;              margin-top: 16px;              width: 100%;            }                        #customButton${e}:hover {              background-color: #${n.colorCode.replace("#","")};              color: white;              display: flex;              border-radius: 24px;              padding: 8px 16px;              fill: white;              text-decoration: none;              justify-content: center;              margin-top: 16px;            }`, k.appendChild(a), document.getElementById("divContainer").appendChild(t)
					})
			} catch (n) {}

			// Widget open/close handler with tracking
			async function C() {
				const wasClosed = document.getElementById("myForm").style.display === "none";
				if (wasClosed) {
					document.getElementById("myForm").style.display = "block";
					document.getElementById("openButton__closeIcon").style.display = "block";
					document.getElementById("openButton__phoneIcon").style.display = "none";
					document.getElementById("openButton__label").innerText = `${u}`;
					// Track widget opened
					pushToDataLayer("wibi_widget_opened", {
						visitor_device: visitorData.device.type,
						visitor_browser: visitorData.device.browser
					});
					trackSessionAction("widget_opened", {});
					// Start idle timer
					resetIdleTimer();
				} else {
					document.getElementById("myForm").style.display = "none";
					document.getElementById("openButton__closeIcon").style.display = "none";
					document.getElementById("openButton__phoneIcon").style.display = "block";
					document.getElementById("openButton__label").innerText = `${h}`;
					// Track widget closed
					pushToDataLayer("wibi_widget_closed", {
						visitor_device: visitorData.device.type,
						visitor_browser: visitorData.device.browser
					});
					trackSessionAction("widget_closed", {});
					clearIdleTimer();
				}
			}
			// Idle timer logic
			function resetIdleTimer() {
				clearIdleTimer();
				idleStart = Date.now();
				idleTimer = setTimeout(() => {
					const idleDuration = Math.round((Date.now() - idleStart) / 1000);
					pushToDataLayer("wibi_widget_idle", { idle_duration: idleDuration });
					trackSessionAction("widget_idle", { duration: idleDuration });
				}, IDLE_TIMEOUT * 1000);
			}
			function clearIdleTimer() {
				if (idleTimer) clearTimeout(idleTimer);
				idleTimer = null;
				idleStart = null;
			}

			// Enhanced form tracking
			window.addEventListener('message', async event => {
				if(event.data.type === 'hsFormCallback' && event.data.eventName === 'onFormSubmit') {
					let msgtxt = "form_submit";
					let formData = event.data?.data || [];
					let phone = formData.filter(a => a.name.includes('phone'))[0]?.value || '';
					let email = formData.filter(a => a.name.includes('email'))[0]?.value || '';
					
					// Store identifiers if available
					if (email) localStorage.setItem("wibi_email", email);
					if (phone) localStorage.setItem("wibi_phone", phone);
					
					// Track form submission with all identifiers
					pushToDataLayer("wibi_form_submit", {
						form_type: "hubspot",
						form_fields: formData.map(f => f.name)
					});
					trackSessionAction("form_submit", { form_type: "hubspot" });
					
					trackingQueue.add(async () => {
						var Q = await trackingFetch(`https://wibi.wilbertzgroup.com/wibi-action?id=${n}&c=3&ic=${msgtxt}&pg=${pg}&utk=${utk}&ph=${phone}&msg=${c}`, {
							method: 'GET'
						});
						var Y = await Q.json();
					});
				}
			});

			// Button click handler with granular tracking
			async function F(e) {
				try {
					var target = e.target || e.srcElement;
					var text = target.getAttribute("class") || target.innerText;
					var label = target.innerText || target.getAttribute("aria-label") || text;
					var contactMethod = "";
					if (target.tagName != "A") {
						var closestA = target.closest("a");
						if (closestA) {
							text = closestA.getAttribute("class");
							label = closestA.innerText || closestA.getAttribute("aria-label") || text;
							target = closestA;
						}
					}
					// Infer contact method from class or id
					if (text && text.indexOf("whatsapp") !== -1) contactMethod = "whatsapp";
					else if (text && text.indexOf("messenger") !== -1) contactMethod = "messenger";
					else if (text && text.indexOf("telegram") !== -1) contactMethod = "telegram";
					else if (text && text.indexOf("viber") !== -1) contactMethod = "viber";
					else if (text && text.indexOf("skype") !== -1) contactMethod = "skype";
					else if (text && text.indexOf("mail") !== -1) contactMethod = "email";
					else if (text && text.indexOf("call") !== -1) contactMethod = "phone";
					else if (text && text.indexOf("book_a_technician") !== -1) contactMethod = "book_a_technician";
					else if (text && text.indexOf("messageNow") !== -1) contactMethod = "sms";
					else contactMethod = "custom";
					
					// GTM granular event
					pushToDataLayer("wibi_contact_click", {
						button_label: label,
						contact_method: contactMethod
					});
					// Track interaction start/complete for click
					pushToDataLayer("wibi_interaction_start", {
						interaction_type: contactMethod
					});
					trackSessionAction("interaction_start", { type: contactMethod });
					
					// Backend call with queue
					trackingQueue.add(async () => {
						var Q = await trackingFetch(`https://wibi.wilbertzgroup.com/wibi-action?id=${n}&c=3&ic=${text}&pg=${pg}&utk=${utk}`, {
							method: 'GET'
						});
						var Y = await Q.json();
					});
					
					pushToDataLayer("wibi_interaction_complete", {
						interaction_type: contactMethod
					});
					trackSessionAction("interaction_complete", { type: contactMethod });
					
					// Google Ads Conversion Tracking
					B.gads_track ? trackGoogleAdsConversion(B.gads_id, B.gads_label) : "";
					function trackGoogleAdsConversion(id, label) {
						// Google Ads Conversion script
						var image = new Image(1, 1);
						image.src = "https://www.googleadservices.com/pagead/conversion/" + id + "/?label=" + label + "&script=0";
					}
				} catch (err) {
					pushToDataLayer("wibi_widget_error", {
						error_code: "BTN_CLICK_ERROR",
						error_message: err && err.message ? err.message : "Unknown error"
					});
				}
			}

			// Hover tracking for widget and options
			function setupHoverTracking() {
				const widget = document.getElementById("myForm");
				if (widget) {
					widget.addEventListener("mouseenter", () => {
						hoverStart = Date.now();
						lastHoveredOption = "widget";
					});
					widget.addEventListener("mouseleave", () => {
						if (hoverStart) {
							const duration = Math.round((Date.now() - hoverStart) / 1000);
							pushToDataLayer("wibi_widget_hover", {
								option_id: "widget",
								option_label: "Widget",
								hover_duration: duration
							});
							hoverStart = null;
							lastHoveredOption = null;
						}
					});
				}
				// Option/button hover
				document.querySelectorAll('.wibiclickcss div#divContainer a').forEach(button => {
					button.addEventListener("mouseenter", function() {
						hoverStart = Date.now();
						lastHoveredOption = button.id || button.className || button.innerText;
					});
					button.addEventListener("mouseleave", function() {
						if (hoverStart) {
							const duration = Math.round((Date.now() - hoverStart) / 1000);
							pushToDataLayer("wibi_widget_hover", {
								option_id: button.id || button.className || "option",
								option_label: button.innerText || button.id || "Option",
								hover_duration: duration
							});
							hoverStart = null;
							lastHoveredOption = null;
						}
					});
				});
			}
			// Interaction start/complete for forms (if any)
			function setupFormTracking() {
				const forms = document.querySelectorAll("form");
				forms.forEach(form => {
					form.addEventListener("focusin", function(e) {
						pushToDataLayer("wibi_interaction_start", {
							interaction_type: "form",
							form_id: form.id || "unknown_form"
						});
					});
					form.addEventListener("submit", function(e) {
						pushToDataLayer("wibi_interaction_complete", {
							interaction_type: "form",
							form_id: form.id || "unknown_form"
						});
					});
					form.addEventListener("error", function(e) {
						pushToDataLayer("wibi_widget_error", {
							error_code: "FORM_ERROR",
							error_message: e && e.message ? e.message : "Unknown form error",
							form_id: form.id || "unknown_form"
						});
					});
				});
			}
			// Error tracking for widget
			window.addEventListener("error", function(e) {
				pushToDataLayer("wibi_widget_error", {
					error_code: "JS_ERROR",
					error_message: e && e.message ? e.message : "Unknown JS error"
				});
			});
			// Run all setup after DOM is ready
			setTimeout(() => {
				setupHoverTracking();
				setupFormTracking();
			}, 500);
			// Open widget if hash present
			v && v.length, window.location.href.search("#OpenClick2Contact") >= 0 && C();
			// Open/close button
			document.getElementById("openButton").onclick = function() { C(); };
			// Button click tracking
			document.querySelectorAll('.wibiclickcss div#divContainer a').forEach(button => button.onclick = function(e) { F(e); });
			// Idle timer reset on interaction
			document.getElementById("myForm").addEventListener("mousemove", resetIdleTimer);
			document.getElementById("myForm").addEventListener("keydown", resetIdleTimer);

			// Process stored source data on load
			window.addEventListener('load', processStoredSourceData);
		}
	run();
	
	// Process stored source data on load
	window.addEventListener('load', processStoredSourceData);
}
createWidget(document.currentScript.dataset.id)

// Enhanced Source Detection (remains the same)
function detectSource() {
	const urlParams = new URLSearchParams(window.location.search);
	const referrer = document.referrer;
	
	// Default values
	let source = 'DIRECT_TRAFFIC';
	let sourceDetail = window.location.hostname;
	let medium = 'none';
	
	// UTM Parameters take precedence
	if (urlParams.has('utm_source')) {
		source = urlParams.get('utm_source').toUpperCase();
		sourceDetail = urlParams.get('utm_source');
		medium = urlParams.get('utm_medium') || 'campaign';
		return { source, sourceDetail, medium };
	}
	
	// Check paid search
	if (urlParams.has('gclid') || urlParams.has('fbclid') || urlParams.has('msclkid')) {
		source = 'PAID_SEARCH';
		sourceDetail = urlParams.has('gclid') ? 'google' : 
						 urlParams.has('fbclid') ? 'facebook' : 'bing';
		medium = 'cpc';
		return { source, sourceDetail, medium };
	}
	
	// Parse referrer
	if (referrer) {
		try {
			const referrerUrl = new URL(referrer);
			const referrerHost = referrerUrl.hostname.toLowerCase();
			
			// Enhanced search engine detection
			const searchEngines = {
				'google.': 'ORGANIC_SEARCH',
				'bing.': 'ORGANIC_SEARCH',
				'yahoo.': 'ORGANIC_SEARCH',
				'duckduckgo.': 'ORGANIC_SEARCH',
				'baidu.': 'ORGANIC_SEARCH',
				'yandex.': 'ORGANIC_SEARCH',
				'ecosia.': 'ORGANIC_SEARCH'
			};
			
			// Enhanced social media detection
			const socialNetworks = {
				'facebook.': 'SOCIAL_MEDIA',
				'twitter.': 'SOCIAL_MEDIA',
				'linkedin.': 'SOCIAL_MEDIA',
				'instagram.': 'SOCIAL_MEDIA',
				'pinterest.': 'SOCIAL_MEDIA',
				'youtube.': 'SOCIAL_MEDIA',
				'tiktok.': 'SOCIAL_MEDIA',
				'reddit.': 'SOCIAL_MEDIA',
				'whatsapp.': 'SOCIAL_MEDIA',
				't.co': 'SOCIAL_MEDIA', // Twitter shortlinks
				'fb.me': 'SOCIAL_MEDIA' // Facebook shortlinks
			};
			
			// Email clients
			const emailClients = {
				'mail.google.': 'EMAIL',
				'mail.yahoo.': 'EMAIL',
				'outlook.': 'EMAIL',
				'mail.': 'EMAIL' // Generic mail domains
			};
			
			// Check each category
			for (const [domain, src] of Object.entries(searchEngines)) {
				if (referrerHost.includes(domain)) {
					source = src;
					sourceDetail = referrerHost;
					medium = 'organic';
					return { source, sourceDetail, medium };
				}
			}
			
			for (const [domain, src] of Object.entries(socialNetworks)) {
				if (referrerHost.includes(domain)) {
					source = src;
					sourceDetail = referrerHost;
					medium = 'social';
					return { source, sourceDetail, medium };
				}
			}
			
			for (const [domain, src] of Object.entries(emailClients)) {
				if (referrerHost.includes(domain)) {
					source = src;
					sourceDetail = referrerHost;
					medium = 'email';
					return { source, sourceDetail, medium };
				}
			}
			
			// Default referral
			source = 'REFERRAL';
			sourceDetail = referrerHost;
			medium = 'referral';
			
		} catch (e) {
			console.warn('Invalid referrer URL:', referrer);
		}
	}
	
	return { source, sourceDetail, medium };
}