/**
 * Module d'auto-refresh pour le site CNF 3
 * Met à jour automatiquement les données depuis data.json
 * et notifie l'utilisateur des nouveaux matchs
 */

class CNFAutoRefresh {
    constructor(refreshInterval = 30000) {
        this.refreshInterval = refreshInterval; // 30 secondes par défaut
        this.data = null;
        this.previousDataHash = null;
        this.isActive = true;
        this.newMatchesCount = 0;
    }

    /**
     * Initialise l'auto-refresh
     */
    init(initialData) {
        this.data = initialData;
        this.previousDataHash = this.hashData(initialData);
        this.startAutoRefresh();
        console.log('🔄 Auto-refresh activé (intervalle:', this.refreshInterval / 1000, 'secondes)');
    }

    /**
     * Démarre le rafraîchissement automatique
     */
    startAutoRefresh() {
        this.refreshTimer = setInterval(() => {
            if (this.isActive) {
                this.checkForUpdates();
            }
        }, this.refreshInterval);
    }

    /**
     * Arrête le rafraîchissement automatique
     */
    stopAutoRefresh() {
        this.isActive = false;
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        console.log('⏸️ Auto-refresh désactivé');
    }

    /**
     * Reprend le rafraîchissement automatique
     */
    resumeAutoRefresh() {
        this.isActive = true;
        console.log('▶️ Auto-refresh repris');
    }

    /**
     * Crée un hash simple des données pour détecter les changements
     */
    hashData(data) {
        return JSON.stringify(data).length + '-' + data.matchs.length;
    }

    /**
     * Vérifie s'il y a des mises à jour
     */
    async checkForUpdates() {
        try {
            // Ajoute un timestamp pour éviter le cache
            const response = await fetch(`data.json?t=${Date.now()}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const newData = await response.json();
            const newHash = this.hashData(newData);

            // Vérifie si les données ont changé
            if (newHash !== this.previousDataHash) {
                console.log('✨ Nouvelles données détectées!');
                this.handleDataUpdate(newData);
                this.previousDataHash = newHash;
            }
        } catch (error) {
            console.error('❌ Erreur lors du refresh:', error);
        }
    }

    /**
     * Gère la mise à jour des données
     */
    handleDataUpdate(newData) {
        // Trouve les nouveaux matchs
        const newMatches = this.findNewMatches(newData);
        
        if (newMatches.length > 0) {
            this.newMatchesCount = newMatches.length;
            this.showNotification(newMatches);
            this.updateLiveBadge(newMatches.length);
        }

        // Met à jour les données globales
        this.data = newData;
        window.data = newData; // Met à jour la variable globale

        // Rafraîchit l'affichage si on est sur la page Live
        const currentPage = document.querySelector('.page.active');
        if (currentPage && currentPage.id === 'live') {
            this.refreshLivePage();
        }
    }

    /**
     * Trouve les nouveaux matchs
     */
    findNewMatches(newData) {
        if (!this.data) return [];

        const oldMatchIds = new Set(this.data.matchs.map(m => m.id));
        return newData.matchs.filter(m => !oldMatchIds.has(m.id));
    }

    /**
     * Affiche une notification pour les nouveaux matchs
     */
    showNotification(newMatches) {
        const count = newMatches.length;
        const message = count === 1 
            ? '🎯 1 nouveau match ajouté!'
            : `🎯 ${count} nouveaux matchs ajoutés!`;

        // Crée l'élément de notification
        const notification = document.createElement('div');
        notification.className = 'cnf-notification';
        notification.innerHTML = `
            <div class="cnf-notification-content">
                <span class="cnf-notification-icon">🎯</span>
                <div class="cnf-notification-text">
                    <strong>${message}</strong>
                    <small>Cliquez sur "Live" pour voir les détails</small>
                </div>
                <button class="cnf-notification-close">×</button>
            </div>
        `;

        // Ajoute les styles inline au cas où le CSS n'est pas chargé
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
            color: #000;
            padding: 15px 20px;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0, 255, 136, 0.3);
            z-index: 10000;
            animation: slideInRight 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            max-width: 400px;
            cursor: pointer;
            font-family: 'Work Sans', sans-serif;
        `;

        // Gère le clic pour aller à la page Live
        notification.addEventListener('click', (e) => {
            if (!e.target.classList.contains('cnf-notification-close')) {
                this.goToLivePage();
                this.removeNotification(notification);
            }
        });

        // Gère le bouton de fermeture
        const closeBtn = notification.querySelector('.cnf-notification-close');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeNotification(notification);
        });

        document.body.appendChild(notification);

        // Auto-suppression après 5 secondes
        setTimeout(() => this.removeNotification(notification), 5000);

        // Joue un son (optionnel)
        this.playNotificationSound();
    }

    /**
     * Supprime une notification avec animation
     */
    removeNotification(notification) {
        if (notification && notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }

    /**
     * Met à jour le badge sur l'onglet Live
     */
    updateLiveBadge(count) {
        const liveTab = document.querySelector('[data-page="live"]');
        if (!liveTab) return;

        let badge = liveTab.querySelector('.cnf-live-badge');
        
        if (count > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'cnf-live-badge';
                liveTab.appendChild(badge);
            }
            badge.textContent = count;
            badge.style.cssText = `
                background: #ff0044;
                color: white;
                border-radius: 50%;
                padding: 2px 7px;
                font-size: 11px;
                margin-left: 5px;
                font-weight: bold;
                animation: pulse 1s infinite;
            `;
        } else if (badge) {
            badge.remove();
        }
    }

    /**
     * Navigue vers la page Live
     */
    goToLivePage() {
        const liveLink = document.querySelector('[data-page="live"]');
        if (liveLink) {
            liveLink.click();
        }
    }

    /**
     * Rafraîchit l'affichage de la page Live
     */
    refreshLivePage() {
        // Si la fonction displayLiveMatches existe, on l'appelle
        if (typeof displayLiveMatches === 'function') {
            displayLiveMatches();
        }
        
        // Réinitialise le compteur de nouveaux matchs
        this.newMatchesCount = 0;
        this.updateLiveBadge(0);
    }

    /**
     * Joue un son de notification (optionnel)
     */
    playNotificationSound() {
        try {
            // Crée un son avec Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
            // Ignore les erreurs de son
        }
    }

    /**
     * Affiche le statut de la connexion
     */
    showConnectionStatus(isConnected) {
        const statusIndicator = document.querySelector('.cnf-connection-status');
        if (statusIndicator) {
            statusIndicator.className = `cnf-connection-status ${isConnected ? 'connected' : 'disconnected'}`;
            statusIndicator.textContent = isConnected ? '● En ligne' : '● Hors ligne';
        }
    }
}

// Crée l'instance globale
const cnfAutoRefresh = new CNFAutoRefresh(30000); // 30 secondes

// Exporte pour utilisation dans app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CNFAutoRefresh;
}
