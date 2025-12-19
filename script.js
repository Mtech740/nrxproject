// ---------- CONFIG ----------
const BACKEND_URL = window.NRX_CONFIG?.BACKEND_URL || "https://nrx-backend-2.onrender.com";
const SESSION_STORAGE_KEY = window.NRX_CONFIG?.SESSION_KEY || "nrx_session_id";

// ---------- STATE ----------
let sessionId = null;
let launchDate = null;

// ---------- BACKEND API FUNCTIONS ----------
async function apiRequest(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };
        
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(`${BACKEND_URL}${endpoint}`, options);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Request failed:', error);
        throw error;
    }
}

// Initialize session with backend
async function initializeSession() {
    // Check for existing session
    const savedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    
    if (savedSessionId) {
        try {
            // Try to restore existing session
            const state = await apiRequest(`/api/session/${savedSessionId}/state`);
            sessionId = savedSessionId;
            console.log("✅ Existing session restored:", sessionId);
            return sessionId;
        } catch (error) {
            console.log('Existing session not found, creating new one');
        }
    }
    
    // Create new session
    try {
        const response = await apiRequest('/api/session', 'POST', {
            ua: navigator.userAgent,
            startedAt: new Date().toISOString(),
            page: 'main-website',
            referrer: document.referrer
        });
        
        sessionId = response.sessionId;
        localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
        console.log("✅ New session created:", sessionId);
        return sessionId;
    } catch (error) {
        console.error('Failed to create session:', error);
        // Fallback: create local session ID
        sessionId = `web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
        return sessionId;
    }
}

// Send page view analytics to backend
async function trackPageView() {
    if (!sessionId) return;
    
    try {
        await apiRequest('/api/analytics/pageview', 'POST', {
            sessionId,
            page: 'index.html',
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            screenSize: `${window.innerWidth}x${window.innerHeight}`
        });
    } catch (error) {
        console.warn('Failed to send analytics:', error);
    }
}

// ---------- COUNTDOWN TIMER ----------
function initializeCountdown() {
    // Set launch date to 22 days from now
    launchDate = new Date();
    launchDate.setDate(launchDate.getDate() + 22);
    launchDate.setHours(12, 0, 0, 0); // Set to 12:00 PM
    
    function updateCountdown() {
        const now = new Date().getTime();
        const distance = launchDate - now;
        
        if (distance < 0) {
            // Countdown finished - launch time!
            document.getElementById('days').textContent = '00';
            document.getElementById('hours').textContent = '00';
            document.getElementById('minutes').textContent = '00';
            document.getElementById('seconds').textContent = '00';
            
            // Update price section for launch
            const priceNote = document.querySelector('.price-note');
            if (priceNote) {
                priceNote.textContent = 'Token launched! Price live on DexScreener';
                priceNote.style.color = 'var(--success)';
            }
            
            // Update status
            showToast("🚀 Token launched successfully!");
            return;
        }
        
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        document.getElementById('days').textContent = days.toString().padStart(2, '0');
        document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
    }
    
    // Update immediately and then every second
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// ---------- PRICE TRACKING ----------
function initializePriceTracking() {
    // Static placeholder during presale
    const priceElement = document.querySelector('.current-price');
    const changeElement = document.querySelector('.price-change');
    const volumeElements = document.querySelectorAll('.stat-value');
    
    // Set initial placeholder values
    if (priceElement) priceElement.textContent = '$0.0000';
    if (changeElement) changeElement.textContent = '+0.00%';
    
    if (volumeElements.length >= 3) {
        volumeElements[0].textContent = '$0';
        volumeElements[1].textContent = '$0';
        volumeElements[2].textContent = '$0';
    }
    
    console.log("📊 Price tracking initialized (placeholder mode)");
    console.log("💡 After launch: Real DexScreener widget will be added");
}

// ---------- TOAST NOTIFICATION ----------
function showToast(message, duration = 3000) {
    const toastModal = document.getElementById('toast-modal');
    const toastMessage = document.getElementById('toast-message');
    
    if (!toastModal || !toastMessage) return;
    
    toastMessage.textContent = message;
    toastModal.style.display = 'block';
    
    setTimeout(() => {
        toastModal.style.display = 'none';
    }, duration);
}

// ---------- COPY ADDRESS FUNCTION ----------
function setupCopyAddress() {
    const copyBtn = document.getElementById('copy-address');
    const contractAddress = '0x843359Fc72AB9C741c88EA32a224005f9AED5eD7';
    
    if (copyBtn) {
        copyBtn.addEventListener('click', function() {
            navigator.clipboard.writeText(contractAddress).then(() => {
                showToast('Contract address copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy:', err);
                
                // Fallback method
                const textArea = document.createElement('textarea');
                textArea.value = contractAddress;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                
                showToast('Contract address copied!');
            });
        });
    }
}

// ---------- SMOOTH SCROLLING ----------
function setupSmoothScrolling() {
    document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
                
                // Update active nav link
                document.querySelectorAll('nav a').forEach(link => {
                    link.classList.remove('active');
                });
                this.classList.add('active');
            }
        });
    });
}

// ---------- FEATURE CARDS INTERACTION ----------
function setupFeatureCards() {
    const featureCards = document.querySelectorAll('.feature-card');
    
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.transition = 'transform 0.3s ease';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

// ---------- PRICE SECTION UPDATES ----------
function updatePriceSection() {
    // This function will be called periodically to update the price section
    // During presale, we keep static values
    // After launch, this would fetch real data from DexScreener
    
    const now = new Date();
    
    // Check if launch time has passed
    if (launchDate && now > launchDate) {
        // Launch has happened - update UI
        const priceNote = document.querySelector('.price-note');
        if (priceNote) {
            priceNote.textContent = 'Token launched! Live price coming soon...';
            priceNote.style.color = 'var(--accent)';
        }
    }
}

// ---------- INITIALIZE APPLICATION ----------
async function initializeApp() {
    console.log("🚀 Initializing Neura Token Website...");
    console.log("📊 Backend URL:", BACKEND_URL);
    
    try {
        // Initialize session with backend
        await initializeSession();
        
        // Track page view
        await trackPageView();
        
        // Setup all UI interactions
        setupCopyAddress();
        setupSmoothScrolling();
        setupFeatureCards();
        
        // Initialize countdown timer
        initializeCountdown();
        
        // Initialize price tracking
        initializePriceTracking();
        
        // Start periodic updates
        setInterval(updatePriceSection, 60000); // Update every minute
        
        // Add hover effects to price card
        const priceCard = document.querySelector('.price-card');
        if (priceCard) {
            priceCard.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-5px)';
                this.style.transition = 'transform 0.3s ease';
            });
            
            priceCard.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
            });
        }
        
        console.log("✅ Neura Token Website initialized successfully!");
        console.log("🎯 Session ID:", sessionId);
        console.log("🕒 Countdown timer: ACTIVE");
        console.log("💰 Live price tracking: READY (placeholder)");
        
        // Show welcome message
        setTimeout(() => {
            console.log("🌐 Website ready! All mining activities removed.");
            console.log("📈 Live price tracking infrastructure in place.");
            console.log("🎯 Twitter updated to: twitter.com/nrx_info");
        }, 1000);
        
    } catch (error) {
        console.error("❌ Failed to initialize app:", error);
        
        // Fallback initialization
        setTimeout(() => {
            console.log("🔄 Attempting fallback initialization...");
            initializeCountdown();
            setupCopyAddress();
            showToast("Website loaded successfully!");
        }, 1000);
    }
}

// ---------- START APPLICATION ----------
// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log("📄 DOM fully loaded, initializing app...");
        initializeApp();
    });
} else {
    // DOM already loaded
    console.log("📄 DOM already loaded, initializing app...");
    initializeApp();
}

// ---------- ADDITIONAL STYLES FOR NEW ELEMENTS ----------
// Add these styles to your existing style.css
const additionalStyles = `
/* Price Section */
.price-section {
    background: rgba(255,255,255,0.1);
    backdrop-filter: blur(10px);
    border-radius: 10px;
    padding: 1.5rem;
    max-width: 600px;
    margin: 0 auto 2rem;
}

.price-section h3 {
    margin-bottom: 1rem;
    font-size: 1.5rem;
    color: white;
    display: flex;
    align-items: center;
    gap: 10px;
}

.price-card {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.price-header {
    border-bottom: 1px solid #eee;
    padding-bottom: 1rem;
    margin-bottom: 1rem;
}

.price-pair {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.pair-symbol {
    font-weight: bold;
    color: var(--dark);
    font-size: 1.1rem;
}

.price-change {
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 0.9rem;
    font-weight: bold;
}

.price-change.neutral {
    background: #e0e0e0;
    color: #666;
}

.current-price {
    font-size: 2.5rem;
    font-weight: bold;
    color: var(--primary);
    margin: 0.5rem 0;
}

.price-note {
    color: #666;
    font-size: 0.9rem;
}

.price-stats {
    display: flex;
    justify-content: space-between;
    margin: 1rem 0;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e9ecef;
}

.stat-item {
    text-align: center;
    flex: 1;
}

.stat-label {
    font-size: 0.8rem;
    color: #666;
    margin-bottom: 0.25rem;
}

.stat-value {
    font-size: 1.1rem;
    font-weight: bold;
    color: var(--dark);
}

.price-info {
    background: #fff3cd;
    border: 1px solid #ffeaa7;
    color: #856404;
    padding: 12px;
    border-radius: 8px;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 1rem;
}

/* Countdown Section */
.countdown-section {
    padding: 2rem 0;
    background: white;
}

.countdown-note {
    color: #666;
    font-size: 0.9rem;
    margin-top: 1rem;
    text-align: center;
}

/* Features Section */
.features-section {
    padding: 4rem 0;
    background: var(--light);
}

.section-title {
    text-align: center;
    color: var(--primary);
    margin-bottom: 2rem;
    font-size: 2rem;
}

.features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    max-width: 1000px;
    margin: 0 auto;
}

.feature-card {
    background: white;
    padding: 2rem;
    border-radius: 10px;
    text-align: center;
    box-shadow: 0 5px 15px rgba(0,0,0,0.05);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
}

.feature-card i {
    font-size: 2.5rem;
    color: var(--primary);
    margin-bottom: 1rem;
}

.feature-card h4 {
    color: var(--dark);
    margin-bottom: 0.5rem;
    font-size: 1.2rem;
}

.feature-card p {
    color: #666;
    font-size: 0.9rem;
    line-height: 1.5;
}

/* Network BSC badge */
.network-bsc {
    color: #f0b90b;
    font-weight: bold;
}

/* Active nav link */
nav a.active {
    color: var(--accent);
    font-weight: bold;
}

/* Toast Modal */
#toast-modal .modal-content {
    animation: slideIn 0.3s ease;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .price-stats {
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .stat-item {
        display: flex;
        justify-content: space-between;
    }
    
    .features-grid {
        grid-template-columns: 1fr;
        max-width: 400px;
    }
}
`;

// Add the additional styles to the document
document.addEventListener('DOMContentLoaded', function() {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = additionalStyles;
    document.head.appendChild(styleSheet);
});

// ---------- UTILITY FUNCTIONS ----------
// Function to simulate launch (for testing only)
window.simulateLaunch = function() {
    if (confirm("This will simulate token launch for testing. Continue?")) {
        launchDate = new Date();
        launchDate.setSeconds(launchDate.getSeconds() - 1); // Set to 1 second ago
        showToast("🚀 Simulation: Token launched successfully!");
        
        // Update UI
        const priceNote = document.querySelector('.price-note');
        if (priceNote) {
            priceNote.textContent = '🚀 TOKEN LAUNCHED!';
            priceNote.style.color = 'var(--success)';
            priceNote.style.fontWeight = 'bold';
        }
    }
};

// Function to show developer info
window.showDevInfo = function() {
    console.group("🔧 Developer Information");
    console.log("Session ID:", sessionId);
    console.log("Backend URL:", BACKEND_URL);
    console.log("Launch Date:", launchDate);
    console.log("Current Time:", new Date());
    console.log("User Agent:", navigator.userAgent);
    console.groupEnd();
};
