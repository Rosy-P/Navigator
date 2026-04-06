const CACHE_NAME = 'mcc-navigator-v1';
const POLLING_INTERVAL = 120000; // 2 minutes
const API_URL = "/backend";

// Polling interval reference
let pollInterval;

self.addEventListener('install', (event) => {
    console.log('SW: Installed');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('SW: Activated');
    event.waitUntil(self.clients.claim());
    startPolling();
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) {
                        client = clientList[i];
                    }
                }
                return client.focus();
            }
            return clients.openWindow('/');
        })
    );
});

// Start background polling
function startPolling() {
    if (pollInterval) clearInterval(pollInterval);
    
    // Initial check
    checkNewEvents();
    
    pollInterval = setInterval(checkNewEvents, POLLING_INTERVAL);
}

async function checkNewEvents() {
    try {
        console.log('SW: Checking for new events...');
        const response = await fetch(`${API_URL}/get-events.php`);
        const data = await response.json();
        
        if (data.status === 'success' && data.events && data.events.length > 0) {
            const latestEvent = data.events[data.events.length - 1]; // Assuming sorted by creation
            
            // Check if this is a new event using IndexedDB or simple Cache
            const isNew = await isEventNew(latestEvent.id);
            
            if (isNew) {
                showEventNotification(latestEvent);
                await markEventAsSeen(latestEvent.id);
            }
        }
    } catch (error) {
        console.error('SW: Polling failed', error);
    }
}

function showEventNotification(event) {
    const title = 'New Campus Event! 🎫';
    const options = {
        body: `${event.title} at ${event.location}\nDate: ${event.event_date}`,
        icon: '/images/facilities/chapel.png', // Generic icon
        badge: '/thumbnails/voyager.png',
        vibrate: [100, 50, 100],
        data: {
            url: '/?open=events'
        }
    };
    
    self.registration.showNotification(title, options);
}

// Simple logic to track seen events in the Service Worker context
// Using a simple array/set because SW can be terminated
// For better persistence, IndexedDB should be used, but let's start with a simpler version
let seenEventIds = new Set();

async function isEventNew(id) {
    // On first load, we don't want to spam notifications for old events
    if (seenEventIds.size === 0) {
        seenEventIds.add(id);
        return false;
    }
    return !seenEventIds.has(id);
}

async function markEventAsSeen(id) {
    seenEventIds.add(id);
}
