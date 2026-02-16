/**
 * SNIPPET D'INTÉGRATION POUR APP.JS
 * 
 * Ajoutez ce code dans votre fichier app.js existant pour activer
 * l'auto-refresh et les notifications de nouveaux matchs
 */

// ============================================================
// À AJOUTER AU DÉBUT DU FICHIER (après les imports)
// ============================================================

// Variable globale pour stocker les données
let data = null;

// ============================================================
// MODIFIER LA FONCTION DE CHARGEMENT DES DONNÉES
// ============================================================

// AVANT (votre code actuel):
/*
fetch('data.json')
    .then(response => response.json())
    .then(loadedData => {
        data = loadedData;
        // ... votre code d'initialisation
    });
*/

// APRÈS (avec auto-refresh):
async function loadData() {
    try {
        const response = await fetch('data.json?t=' + Date.now());
        data = await response.json();
        
        // Initialiser l'auto-refresh une seule fois
        if (!window.cnfAutoRefreshInitialized) {
            cnfAutoRefresh.init(data);
            window.cnfAutoRefreshInitialized = true;
        }
        
        // Votre code d'initialisation existant
        initializeApp();
        
    } catch (error) {
        console.error('Erreur de chargement:', error);
    }
}

// Charger les données au démarrage
loadData();

// ============================================================
// AJOUTER CES NOUVELLES FONCTIONS
// ============================================================

/**
 * Fonction d'initialisation de votre app (à créer si nécessaire)
 * Regroupez tout votre code d'initialisation ici
 */
function initializeApp() {
    // Exemple: vos fonctions d'affichage actuelles
    displayTopPlayers();
    displayRecentMatches();
    displayStats();
    // etc...
}

/**
 * Gestion du changement de page
 * Modifiez votre gestionnaire de navigation existant
 */
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        const page = link.dataset.page;
        
        // Masquer toutes les pages
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        
        // Afficher la page sélectionnée
        document.getElementById(page).classList.add('active');
        link.classList.add('active');
        
        // Si on arrive sur la page Live, rafraîchir et retirer le badge
        if (page === 'live') {
            displayLiveMatches();
            
            // Retirer le badge de notification
            const badge = link.querySelector('.cnf-live-badge');
            if (badge) {
                badge.remove();
            }
        }
    });
});

/**
 * Fonction pour afficher les matchs en live
 * ADAPTER SELON VOTRE CODE EXISTANT
 */
function displayLiveMatches() {
    const container = document.getElementById('live-matches-container');
    if (!container) return;
    
    // Filtrer les matchs du tournoi CNF 3
    const cnf3Matches = data.matchs.filter(m => m.tournoi === 'CNF 3');
    
    // Trier par date (plus récent en premier)
    cnf3Matches.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Générer le HTML
    container.innerHTML = cnf3Matches.map(match => `
        <div class="match-card ${match.live ? 'live-new' : ''}">
            <div class="match-header">
                <span class="match-phase">${match.phase} - Poule ${match.poule}</span>
                ${match.live ? '<span class="live-badge">NOUVEAU</span>' : ''}
            </div>
            <div class="match-body">
                <div class="team ${match.gagnant === match.equipe1 ? 'winner' : ''}">
                    <div class="team-name">${match.equipe1}</div>
                    <div class="team-players">${match.joueur1_eq1} & ${match.joueur2_eq1}</div>
                </div>
                <div class="match-score">
                    <span class="score">${match.score1} - ${match.score2}</span>
                </div>
                <div class="team ${match.gagnant === match.equipe2 ? 'winner' : ''}">
                    <div class="team-name">${match.equipe2}</div>
                    <div class="team-players">${match.joueur1_eq2} & ${match.joueur2_eq2}</div>
                </div>
            </div>
            <div class="match-footer">
                <span class="match-date">${formatDate(match.date)}</span>
            </div>
        </div>
    `).join('');
}

/**
 * Fonction helper pour formater les dates
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('fr-FR', options);
}

// ============================================================
// AJOUTER UN BOUTON DE RAFRAÎCHISSEMENT MANUEL (OPTIONNEL)
// ============================================================

/**
 * HTML à ajouter dans votre page Live:
 * 
 * <div class="live-controls">
 *     <button id="refresh-button" class="cnf-refresh-button">
 *         🔄 Rafraîchir
 *     </button>
 *     <span class="cnf-last-update">
 *         Dernière mise à jour: <span id="last-update-time">-</span>
 *     </span>
 * </div>
 */

// Code JavaScript pour le bouton
const refreshButton = document.getElementById('refresh-button');
if (refreshButton) {
    refreshButton.addEventListener('click', async () => {
        refreshButton.disabled = true;
        refreshButton.textContent = '⏳ Chargement...';
        
        try {
            await loadData();
            displayLiveMatches();
            
            // Met à jour l'heure de dernière mise à jour
            const timeElement = document.getElementById('last-update-time');
            if (timeElement) {
                timeElement.textContent = new Date().toLocaleTimeString('fr-FR');
            }
            
            refreshButton.textContent = '✅ À jour !';
            setTimeout(() => {
                refreshButton.textContent = '🔄 Rafraîchir';
            }, 2000);
        } catch (error) {
            refreshButton.textContent = '❌ Erreur';
            setTimeout(() => {
                refreshButton.textContent = '🔄 Rafraîchir';
            }, 2000);
        } finally {
            refreshButton.disabled = false;
        }
    });
}

// ============================================================
// INDICATEUR DE STATUT EN BAS DE PAGE (OPTIONNEL)
// ============================================================

/**
 * Ajoute un indicateur de connexion en bas à droite
 * HTML à ajouter avant </body>:
 * 
 * <div class="cnf-connection-status connected">● En ligne</div>
 */

// Vérifier la connexion toutes les 30 secondes
setInterval(() => {
    fetch('data.json', { method: 'HEAD' })
        .then(() => {
            const status = document.querySelector('.cnf-connection-status');
            if (status) {
                status.className = 'cnf-connection-status connected';
                status.textContent = '● En ligne';
            }
        })
        .catch(() => {
            const status = document.querySelector('.cnf-connection-status');
            if (status) {
                status.className = 'cnf-connection-status disconnected';
                status.textContent = '● Hors ligne';
            }
        });
}, 30000);

// ============================================================
// CONFIGURATION DE L'AUTO-REFRESH
// ============================================================

/**
 * Pour ajuster la fréquence de rafraîchissement:
 * 
 * const cnfAutoRefresh = new CNFAutoRefresh(60000); // 60 secondes
 * 
 * Pour désactiver temporairement:
 * cnfAutoRefresh.stopAutoRefresh();
 * 
 * Pour réactiver:
 * cnfAutoRefresh.resumeAutoRefresh();
 */

// ============================================================
// NOTES IMPORTANTES
// ============================================================

/**
 * 1. Assurez-vous d'avoir inclus les fichiers dans index.html:
 *    <link rel="stylesheet" href="cnf-auto-refresh.css">
 *    <script src="cnf-auto-refresh.js"></script>
 * 
 * 2. Chargez ce code APRÈS avoir chargé cnf-auto-refresh.js
 * 
 * 3. Adaptez les sélecteurs CSS et les IDs selon votre HTML
 * 
 * 4. La fonction displayLiveMatches() est un exemple,
 *    adaptez-la selon votre structure HTML existante
 * 
 * 5. Pour déboguer, ouvrez la console (F12) et surveillez les messages
 */

console.log('🎯 CNF Auto-refresh activé!');
