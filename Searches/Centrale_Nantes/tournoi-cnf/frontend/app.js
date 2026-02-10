// Configuration et variables globales
let joueurs = [];
let matchs = [];
let equipes = [];
let poulesCNF3 = [];
let statsGlobales = {};

// Charger les données au démarrage
async function chargerDonnees() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        
        joueurs = data.joueurs;
        matchs = data.matchs;
        equipes = data.equipes || [];
        poulesCNF3 = data.poules_cnf3 || [];
        statsGlobales = data.stats_globales;
        
        window.data = data; 
        
        initialiserSite();
    } catch (error) {
        console.error('Erreur chargement données:', error);
    }
}

// Initialiser le site
function initialiserSite() {
    afficherStatsGlobales();
    afficherPageAccueilDynamique();
    afficherTopJoueurs();
    afficherDerniersMatchs();
    afficherTousJoueurs();
    afficherTousMatchs();
    afficherClassement();
    afficherEquipesCNF3();
    afficherPoulesCNF3();
    afficherTableauCNF3();
    initialiserOngletsCNF3();
    initialiserPredictions();
    initialiserComparateur();
    initialiserNavigation();
    initialiserRecherche();
    initialiserLiveScoring();
    initialiserPalmares();
    remplirSelecteursLive();
}

// Navigation entre pages
function initialiserNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            const pageId = link.dataset.page;
            
            // Mettre à jour les liens actifs
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Afficher la bonne page
            pages.forEach(p => p.classList.remove('active'));
            document.getElementById(pageId).classList.add('active');
            
            // Scroll en haut
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

// Afficher les stats globales
function afficherStatsGlobales() {
    document.getElementById('total-joueurs').textContent = statsGlobales.total_joueurs;
    document.getElementById('total-matchs').textContent = statsGlobales.total_matchs;
    document.getElementById('total-sets').textContent = statsGlobales.total_sets;
    
    // Animation compteur
    animerCompteurs();
}

function animerCompteurs() {
    const compteurs = document.querySelectorAll('.stat-number');
    
    compteurs.forEach(compteur => {
        const target = parseInt(compteur.textContent);
        let current = 0;
        const increment = target / 50;
        const duration = 1000;
        
        compteur.textContent = '0';
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                compteur.textContent = target;
                clearInterval(timer);
            } else {
                compteur.textContent = Math.floor(current);
            }
        }, duration / 50);
    });
}

// Afficher les top joueurs
function afficherTopJoueurs() {
    const container = document.getElementById('top-players');
    const topJoueurs = [...joueurs]
        .sort((a, b) => {
            // Tri par ELO
            return b.elo - a.elo;
        })
        .slice(0, 6);
    
    container.innerHTML = topJoueurs.map((joueur, index) => `
        <div class="player-card rank-${index + 1}" onclick="afficherProfilJoueur('${joueur.nom}')">
            <div class="player-header">
                <div class="player-name">${joueur.nom}</div>
                <div class="player-rank">#${index + 1}</div>
            </div>
            <div class="player-stats">
                <div class="player-stat">
                    <div class="player-stat-value">${Math.round(joueur.elo)}</div>
                    <div class="player-stat-label">ELO</div>
                </div>
                <div class="player-stat">
                    <div class="player-stat-value">${joueur.victoires}</div>
                    <div class="player-stat-label">Victoires</div>
                </div>
                <div class="player-stat">
                    <div class="player-stat-value">${joueur.pourcentage_victoires}%</div>
                    <div class="player-stat-label">Taux</div>
                </div>
                <div class="player-stat">
                    <div class="player-record">${joueur.victoires}V - ${joueur.defaites}D</div>
                    ${afficherFormeRecente(joueur.nom)}</div>
                </div>
            </div>
        </div>
    `).join('');
}

// Afficher les derniers matchs (CNF 1, 2 ET 3)
function afficherDerniersMatchs() {
    const container = document.getElementById('recent-matches');
    if (!container) return;
    
    // Fusionner matchs individuels ET matchs CNF3
    const tousLesMatchs = [];
    
    // Ajouter les matchs individuels (CNF 1 et 2)
    matchs.forEach(match => {
        tousLesMatchs.push({
            ...match,
            type: 'individuel',
            dateObj: match.date ? new Date(match.date) : new Date(0)
        });
    });
    
    // Ajouter les matchs CNF3 (doubles) si disponibles
    if (window.data && window.data.matchs_cnf3) {
        window.data.matchs_cnf3.forEach(match => {
            tousLesMatchs.push({
                ...match,
                type: 'double',
                dateObj: match.date ? new Date(match.date) : new Date(0)
            });
        });
    }
    
    // Trier par date (plus récent en premier)
    tousLesMatchs.sort((a, b) => b.dateObj - a.dateObj);
    
    // Prendre les 8 derniers
    const derniersMatchs = tousLesMatchs.slice(0, 8);
    
    // Afficher
    container.innerHTML = derniersMatchs.map(match => {
        if (match.type === 'double') {
            // Affichage pour match CNF3 (doubles)
            const estPoule = match.type_match === 'poule' || match.phase === 'Poules';
            const phaseLabel = estPoule ? `Poule ${match.poule || '?'}` : match.phase;
            
            return `
                <div class="match-card match-card-double">
                    <div class="match-header-tag">
                        <span class="match-tag-cnf3">CNF 3</span>
                        <span class="match-tag-phase">${phaseLabel}</span>
                    </div>
                    <div class="match-player ${match.gagnant === match.equipe1 ? 'winner' : ''}">
                        <div class="match-player-name">${match.equipe1}</div>
                        ${match.joueur1_eq1 ? `
                            <div class="match-player-duo">${match.joueur1_eq1} / ${match.joueur2_eq1}</div>
                        ` : ''}
                    </div>
                    <div class="match-score">${match.score1} - ${match.score2}</div>
                    <div class="match-player ${match.gagnant === match.equipe2 ? 'winner' : ''}">
                        <div class="match-player-name">${match.equipe2}</div>
                        ${match.joueur1_eq2 ? `
                            <div class="match-player-duo">${match.joueur1_eq2} / ${match.joueur2_eq2}</div>
                        ` : ''}
                    </div>
                </div>
            `;
        } else {
            // Affichage pour match individuel (CNF 1 et 2)
            return `
                <div class="match-card">
                    <div class="match-player ${match.gagnant === match.joueur1 ? 'winner' : ''}">
                        <div class="match-player-name">${match.joueur1}</div>
                    </div>
                    <div class="match-score">${match.score1} - ${match.score2}</div>
                    <div class="match-player ${match.gagnant === match.joueur2 ? 'winner' : ''}">
                        <div class="match-player-name">${match.joueur2}</div>
                    </div>
                    <div class="match-info">
                        <div class="match-tournoi">${match.tournoi}</div>
                        <div>${match.phase}</div>
                    </div>
                </div>
            `;
        }
    }).join('');
}

// Afficher tous les joueurs
function afficherTousJoueurs(filtreNom = '', triPar = 'elo') {
    const container = document.getElementById('all-players');
    
    let joueursAffiches = [...joueurs];
    
    // Filtrer par nom
    if (filtreNom) {
        joueursAffiches = joueursAffiches.filter(j => 
            j.nom.toLowerCase().includes(filtreNom.toLowerCase())
        );
    }
    
    // Trier
    joueursAffiches.sort((a, b) => {
        switch(triPar) {
            case 'elo':
                return b.elo - a.elo;
            case 'victoires':
                return b.victoires - a.victoires;
            case 'pourcentage':
                return b.pourcentage_victoires - a.pourcentage_victoires;
            case 'sets':
                return b.sets_gagnes - a.sets_gagnes;
            case 'nom':
                return a.nom.localeCompare(b.nom);
            default:
                return 0;
        }
    });
    
    container.innerHTML = joueursAffiches.map(joueur => {
        const photoUrl = joueur.photo || 'photos/default.jpg';
        
        return `
            <div class="player-card" onclick="afficherProfilJoueur('${joueur.nom}')">
                <div class="player-card-photo">
                    <img src="${photoUrl}" alt="${joueur.nom}" onerror="this.src='photos/default.jpg'">
                </div>
                <div class="player-card-content">
                    <div class="player-header">
                        <div class="player-name">${joueur.nom}</div>
                        <div style="font-family: 'Bebas Neue', sans-serif; font-size: 1.5rem; color: var(--primary);">
                            ${Math.round(joueur.elo)}
                        </div>
                    </div>
                    <div class="player-stats">
                        <div class="player-stat">
                            <div class="player-stat-value">${joueur.victoires}</div>
                            <div class="player-stat-label">Victoires</div>
                        </div>
                        <div class="player-stat">
                            <div class="player-stat-value">${joueur.defaites}</div>
                            <div class="player-stat-label">Défaites</div>
                        </div>
                        <div class="player-stat">
                            <div class="player-stat-value">${joueur.pourcentage_victoires}%</div>
                            <div class="player-stat-label">Taux</div>
                        </div>
                        <div class="player-stat">
                            <div class="player-record">${joueur.victoires}V - ${joueur.defaites}D</div>
                            ${afficherFormeRecente(joueur.nom)}</div>
                        </div>
                        </div>
                </div>
            </div>
        `;
    }).join('');
}

// Afficher tous les matchs (CNF 1, 2 ET 3)
function afficherTousMatchs(filtreTournoi = '', filtrePhase = '') {
    const container = document.getElementById('matches-list');
    if (!container) return;
    
    // Fusionner matchs individuels ET matchs CNF3
    const tousLesMatchs = [];
    
    // Ajouter les matchs individuels (CNF 1 et 2)
    matchs.forEach(match => {
        tousLesMatchs.push({
            ...match,
            type: 'individuel',
            dateObj: match.date ? new Date(match.date) : new Date(0)
        });
    });
    
    // Ajouter les matchs CNF3 (doubles) si disponibles
    if (window.data && window.data.matchs_cnf3) {
        window.data.matchs_cnf3.forEach(match => {
            tousLesMatchs.push({
                ...match,
                type: 'double',
                dateObj: match.date ? new Date(match.date) : new Date(0)
            });
        });
    }
    
    // Filtrer par tournoi
    let matchsAffiches = tousLesMatchs;
    if (filtreTournoi) {
        matchsAffiches = matchsAffiches.filter(m => m.tournoi === filtreTournoi);
    }
    
    // Filtrer par phase
    if (filtrePhase) {
        matchsAffiches = matchsAffiches.filter(m => m.phase === filtrePhase);
    }
    
    // Trier par date (plus récent en premier)
    matchsAffiches.sort((a, b) => b.dateObj - a.dateObj);
    
    // Afficher
    container.innerHTML = matchsAffiches.map(match => {
    if (match.type === 'double') {
        // ============================================
        // AFFICHAGE MATCH CNF 3 (DOUBLES)
        // ============================================
        const estPoule = match.type_match === 'poule' || match.phase === 'Poules';
        const phaseLabel = estPoule && match.poule ? `Poule ${match.poule}` : match.phase;
        
        return `
            <div class="match-card match-card-cnf3">
                <!-- En-tête CNF3 -->
                <div class="match-header">
                    <span class="match-badge match-badge-cnf3">CNF 3</span>
                    <span class="match-badge match-badge-phase">${phaseLabel}</span>
                    <span class="match-date">${match.date || 'Date inconnue'}</span>
                </div>
                
                <!-- Contenu du match -->
                <div class="match-content">
                    <!-- Équipe 1 -->
                    <div class="match-side ${match.gagnant === match.equipe1 ? 'winner' : 'loser'}">
                        <div class="match-team-name">${match.equipe1}</div>
                        ${match.joueur1_eq1 ? `
                            <div class="match-players">
                                <i class="fas fa-users"></i>
                                <span>${match.joueur1_eq1}</span>
                                <span class="separator">/</span>
                                <span>${match.joueur2_eq1}</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <!-- Score -->
                    <div class="match-score">
                        <span class="score-number">${match.score1}</span>
                        <span class="score-separator">-</span>
                        <span class="score-number">${match.score2}</span>
                    </div>
                    
                    <!-- Équipe 2 -->
                    <div class="match-side ${match.gagnant === match.equipe2 ? 'winner' : 'loser'}">
                        <div class="match-team-name">${match.equipe2}</div>
                        ${match.joueur1_eq2 ? `
                            <div class="match-players">
                                <i class="fas fa-users"></i>
                                <span>${match.joueur1_eq2}</span>
                                <span class="separator">/</span>
                                <span>${match.joueur2_eq2}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    } else {
        // ============================================
        // AFFICHAGE MATCH CNF 1 et 2 (INDIVIDUELS)
        // ============================================
        return `
            <div class="match-card match-card-individual">
                <!-- En-tête CNF1/2 -->
                <div class="match-header">
                    <span class="match-badge match-badge-individual">${match.tournoi}</span>
                    <span class="match-badge match-badge-phase">${match.phase}</span>
                    <span class="match-date">${match.date || 'Date inconnue'}</span>
                </div>
                
                <!-- Contenu du match -->
                <div class="match-content">
                    <!-- Joueur 1 -->
                    <div class="match-side ${match.gagnant === match.joueur1 ? 'winner' : 'loser'}">
                        <div class="match-player-name">${match.joueur1}</div>
                    </div>
                    
                    <!-- Score -->
                    <div class="match-score">
                        <span class="score-number">${match.score1}</span>
                        <span class="score-separator">-</span>
                        <span class="score-number">${match.score2}</span>
                    </div>
                    
                    <!-- Joueur 2 -->
                    <div class="match-side ${match.gagnant === match.joueur2 ? 'winner' : 'loser'}">
                        <div class="match-player-name">${match.joueur2}</div>
                    </div>
                </div>
            </div>
        `;
    }
}).join('');
    
    // Afficher le nombre de résultats
    const compteur = document.getElementById('match-count');
    if (compteur) {
        compteur.textContent = `${matchsAffiches.length} match${matchsAffiches.length > 1 ? 's' : ''} trouvé${matchsAffiches.length > 1 ? 's' : ''}`;
    }
}

// Afficher le classement
function afficherClassement() {
    const tbody = document.getElementById('ranking-tbody');
    
    const classement = [...joueurs]
        .sort((a, b) => {
            // Tri par ELO d'abord
            if (b.elo !== a.elo) {
                return b.elo - a.elo;
            }
            // Puis par % de victoires
            if (b.pourcentage_victoires !== a.pourcentage_victoires) {
                return b.pourcentage_victoires - a.pourcentage_victoires;
            }
            // Puis par nombre de victoires
            if (b.victoires !== a.victoires) {
                return b.victoires - a.victoires;
            }
            return b.sets_gagnes - a.sets_gagnes;
        });
    
    tbody.innerHTML = classement.map((joueur, index) => {
        const diffSets = joueur.sets_gagnes - joueur.sets_perdus;
        const classeDiff = diffSets > 0 ? 'positive' : diffSets < 0 ? 'negative' : '';
        
        // Indicateur de niveau ELO
        let eloClass = '';
        if (joueur.elo >= 1600) eloClass = 'elo-master';
        else if (joueur.elo >= 1550) eloClass = 'elo-expert';
        else if (joueur.elo >= 1500) eloClass = 'elo-advanced';
        
        // Tendance ELO
        let eloTrend = '';
        if (joueur.elo > 1500) eloTrend = '↗';
        else if (joueur.elo < 1500) eloTrend = '↘';
        else eloTrend = '=';
        
        return `
            <tr onclick="afficherProfilJoueur('${joueur.nom}')" style="cursor: pointer;">
                <td><span class="rank-cell ${index < 3 ? 'top-3' : ''}">${index + 1}</span></td>
                <td class="player-name-cell">${joueur.nom}</td>
                <td><span class="${eloClass}" style="font-weight: 700; font-size: 1.1rem;">${Math.round(joueur.elo)} <span style="font-size: 0.8rem;">${eloTrend}</span></span></td>
                <td>${joueur.matchs_joues}</td>
                <td class="positive">${joueur.victoires}</td>
                <td class="negative">${joueur.defaites}</td>
                <td><strong>${joueur.pourcentage_victoires}%</strong></td>
                <td class="${classeDiff}">${diffSets > 0 ? '+' : ''}${diffSets}</td>
            </tr>
        `;
    }).join('');
}

// Initialiser les prédictions
function initialiserPredictions() {
    const selects = [
        'team-a-player1', 'team-a-player2',
        'team-b-player1', 'team-b-player2'
    ];
    
    // Remplir les selects
    const options = joueurs
        .sort((a, b) => a.nom.localeCompare(b.nom))
        .map(j => `<option value="${j.nom}">${j.nom}</option>`)
        .join('');
    
    selects.forEach(id => {
        document.getElementById(id).innerHTML = '<option value="">Sélectionner...</option>' + options;
    });
    
    // Bouton calculer
    document.getElementById('calculate-prediction').addEventListener('click', calculerPrediction);
}

function calculerPrediction() {
    const teamA = [
        document.getElementById('team-a-player1').value,
        document.getElementById('team-a-player2').value
    ];
    const teamB = [
        document.getElementById('team-b-player1').value,
        document.getElementById('team-b-player2').value
    ];
    
    if (!teamA[0] || !teamA[1] || !teamB[0] || !teamB[1]) {
        alert('Veuillez sélectionner tous les joueurs');
        return;
    }
    
    // Récupérer les joueurs
    const joueursA = teamA.map(nom => joueurs.find(j => j.nom === nom));
    const joueursB = teamB.map(nom => joueurs.find(j => j.nom === nom));
    
    // Calculer l'ELO moyen de chaque équipe
    const eloA = (joueursA[0].elo + joueursA[1].elo) / 2;
    const eloB = (joueursB[0].elo + joueursB[1].elo) / 2;
    
    // Calculer la probabilité de victoire selon la formule ELO
    const probaA = 1 / (1 + Math.pow(10, (eloB - eloA) / 400));
    const probaB = 1 - probaA;
    
    // Convertir en pourcentages
    const pctA = (probaA * 100).toFixed(1);
    const pctB = (probaB * 100).toFixed(1);
    
    // Calculer les cotes (format décimal européen)
    const coteA = (1 / probaA).toFixed(2);
    const coteB = (1 / probaB).toFixed(2);
    
    // Stats moyennes des équipes
    const statsA = {
        moyVictoires: (joueursA[0].victoires + joueursA[1].victoires) / 2,
        moyPct: (joueursA[0].pourcentage_victoires + joueursA[1].pourcentage_victoires) / 2,
        moyElo: eloA
    };
    
    const statsB = {
        moyVictoires: (joueursB[0].victoires + joueursB[1].victoires) / 2,
        moyPct: (joueursB[0].pourcentage_victoires + joueursB[1].pourcentage_victoires) / 2,
        moyElo: eloB
    };
    
    // Afficher les résultats
    const resultContainer = document.getElementById('prediction-result');
    resultContainer.classList.remove('hidden');
    resultContainer.innerHTML = `
        <div style="text-align: center; margin-bottom: 2rem;">
            <div style="font-size: 0.9rem; color: var(--gray); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 1rem;">
                Prédiction basée sur le système ELO
            </div>
        </div>
        
        <div class="prediction-teams">
            <div class="prediction-team">
                <h3>${teamA[0]} & ${teamA[1]}</h3>
                <div class="prediction-odds">${coteA}</div>
                <div class="prediction-percentage">${pctA}%</div>
                <div style="font-size: 0.9rem; color: var(--gray); margin-top: 1rem;">
                    ELO moyen: ${Math.round(eloA)}
                </div>
            </div>
            <div class="prediction-separator">VS</div>
            <div class="prediction-team">
                <h3>${teamB[0]} & ${teamB[1]}</h3>
                <div class="prediction-odds">${coteB}</div>
                <div class="prediction-percentage">${pctB}%</div>
                <div style="font-size: 0.9rem; color: var(--gray); margin-top: 1rem;">
                    ELO moyen: ${Math.round(eloB)}
                </div>
            </div>
        </div>
        
        <div class="prediction-details">
            <h3 style="text-align: center; margin-bottom: 1.5rem; color: var(--gray);">Détails de l'analyse</h3>
            <div class="prediction-detail-grid">
                <div class="prediction-detail">
                    <div class="prediction-detail-label">Équipe A - Moy. ELO</div>
                    <div class="prediction-detail-value">${Math.round(statsA.moyElo)}</div>
                </div>
                <div class="prediction-detail">
                    <div class="prediction-detail-label">Équipe A - Moy. Victoires</div>
                    <div class="prediction-detail-value">${statsA.moyVictoires.toFixed(1)}</div>
                </div>
                <div class="prediction-detail">
                    <div class="prediction-detail-label">Équipe B - Moy. ELO</div>
                    <div class="prediction-detail-value">${Math.round(statsB.moyElo)}</div>
                </div>
                <div class="prediction-detail">
                    <div class="prediction-detail-label">Équipe B - Moy. Victoires</div>
                    <div class="prediction-detail-value">${statsB.moyVictoires.toFixed(1)}</div>
                </div>
                <div class="prediction-detail">
                    <div class="prediction-detail-label">Différence ELO</div>
                    <div class="prediction-detail-value">${Math.abs(Math.round(eloA - eloB))}</div>
                </div>
                <div class="prediction-detail">
                    <div class="prediction-detail-label">Probabilité A</div>
                    <div class="prediction-detail-value">${pctA}%</div>
                </div>
            </div>
        </div>
    `;
    
    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function calculerStatsEquipe(joueurNoms) {
    const joueursEquipe = joueurNoms.map(nom => 
        joueurs.find(j => j.nom === nom)
    );
    
    const moyVictoires = joueursEquipe.reduce((sum, j) => sum + j.victoires, 0) / 2;
    const moySets = joueursEquipe.reduce((sum, j) => sum + j.sets_gagnes, 0) / 2;
    const moyPourcentage = joueursEquipe.reduce((sum, j) => sum + j.pourcentage_victoires, 0) / 2;
    const moyRatio = joueursEquipe.reduce((sum, j) => sum + j.ratio_sets, 0) / 2;
    
    // Formule de force combinée (pondérée)
    const force = (moyPourcentage * 0.4) + (moyVictoires * 0.3) + (moyRatio * 15) + (moySets * 0.5);
    
    return { moyVictoires, moySets, moyPourcentage, moyRatio, force };
}

// Initialiser le comparateur
function initialiserComparateur() {
    const options = joueurs
        .sort((a, b) => a.nom.localeCompare(b.nom))
        .map(j => `<option value="${j.nom}">${j.nom}</option>`)
        .join('');
    
    document.getElementById('compare-player1').innerHTML = '<option value="">Sélectionner joueur 1</option>' + options;
    document.getElementById('compare-player2').innerHTML = '<option value="">Sélectionner joueur 2</option>' + options;
    
    document.getElementById('compare-player1').addEventListener('change', afficherComparaison);
    document.getElementById('compare-player2').addEventListener('change', afficherComparaison);
}

function afficherComparaison() {
    const nom1 = document.getElementById('compare-player1').value;
    const nom2 = document.getElementById('compare-player2').value;
    
    if (!nom1 || !nom2) return;
    
    const j1 = joueurs.find(j => j.nom === nom1);
    const j2 = joueurs.find(j => j.nom === nom2);
    
    const container = document.getElementById('comparison-result');
    
    container.innerHTML = `
        <div class="comparison-header">
            <div class="comparison-player">
                <h2>${j1.nom}</h2>
            </div>
            <div class="comparison-vs">VS</div>
            <div class="comparison-player">
                <h2>${j2.nom}</h2>
            </div>
        </div>
        
        <div class="comparison-stats">
            ${creerLigneComparaison('Victoires', j1.victoires, j2.victoires)}
            ${creerLigneComparaison('Défaites', j1.defaites, j2.defaites, true)}
            ${creerLigneComparaison('Pourcentage', j1.pourcentage_victoires + '%', j2.pourcentage_victoires + '%', false, j1.pourcentage_victoires, j2.pourcentage_victoires)}
            ${creerLigneComparaison('Sets gagnés', j1.sets_gagnes, j2.sets_gagnes)}
            ${creerLigneComparaison('Sets perdus', j1.sets_perdus, j2.sets_perdus, true)}
            ${creerLigneComparaison('Ratio sets', j1.ratio_sets, j2.ratio_sets)}
            ${creerLigneComparaison('Matchs joués', j1.matchs_joues, j2.matchs_joues)}
        </div>
    `;
}

function creerLigneComparaison(label, val1, val2, inversé = false, comp1, comp2) {
    // Si pas de valeurs de comparaison fournies, utiliser val1 et val2
    if (comp1 === undefined) comp1 = val1;
    if (comp2 === undefined) comp2 = val2;
    
    let meilleur1 = inversé ? comp1 < comp2 : comp1 > comp2;
    let meilleur2 = inversé ? comp2 < comp1 : comp2 > comp1;
    
    return `
        <div class="comparison-stat-row">
            <div class="comparison-stat-value ${meilleur1 ? 'better' : ''}">${val1}</div>
            <div class="comparison-stat-label">${label}</div>
            <div class="comparison-stat-value ${meilleur2 ? 'better' : ''}">${val2}</div>
        </div>
    `;
}

// Initialiser la recherche
function initialiserRecherche() {
    const searchInput = document.getElementById('search-player');
    const sortSelect = document.getElementById('sort-players');
    const tournoiFilter = document.getElementById('filter-tournoi');
    const phaseFilter = document.getElementById('filter-phase');
    const searchTeam = document.getElementById('search-team');
    const filterChapeau = document.getElementById('filter-chapeau');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            afficherTousJoueurs(e.target.value, sortSelect.value);
        });
    }
    
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            afficherTousJoueurs(searchInput.value, e.target.value);
        });
    }
    
    if (tournoiFilter) {
        tournoiFilter.addEventListener('change', (e) => {
            afficherTousMatchs(e.target.value, phaseFilter.value);
        });
    }
    
    if (phaseFilter) {
        phaseFilter.addEventListener('change', (e) => {
            afficherTousMatchs(tournoiFilter.value, e.target.value);
        });
    }
    
    if (searchTeam) {
        searchTeam.addEventListener('input', (e) => {
            afficherEquipesCNF3(e.target.value, filterChapeau.value);
        });
    }
    
    if (filterChapeau) {
        filterChapeau.addEventListener('change', (e) => {
            afficherEquipesCNF3(searchTeam.value, e.target.value);
        });
    }
}

// Afficher les équipes CNF 3
function afficherEquipesCNF3(filtreTexte = '', filtreChapeau = '') {
    const container = document.getElementById('teams-cnf3');
    if (!container) return;
    
    let equipesAffichees = equipes.filter(e => e.tournoi === 'CNF 3');
    
    // Filtrer par texte (nom équipe ou joueurs)
    if (filtreTexte) {
        const texte = filtreTexte.toLowerCase();
        equipesAffichees = equipesAffichees.filter(e => 
            e.nom.toLowerCase().includes(texte) ||
            e.joueur1.toLowerCase().includes(texte) ||
            e.joueur2.toLowerCase().includes(texte)
        );
    }
    
    // Filtrer par chapeau
    if (filtreChapeau) {
        equipesAffichees = equipesAffichees.filter(e => e.chapeau === parseInt(filtreChapeau));
    }
    
    // Trier par chapeau puis nom
    equipesAffichees.sort((a, b) => {
        if (a.chapeau !== b.chapeau) return a.chapeau - b.chapeau;
        return a.nom.localeCompare(b.nom);
    });
    
    if (equipesAffichees.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 3rem; color: var(--gray);">Aucune équipe trouvée</div>';
        return;
    }
    
    container.innerHTML = equipesAffichees.map(equipe => {
        // Récupérer les ELO des joueurs
        const j1 = joueurs.find(j => j.nom === equipe.joueur1);
        const j2 = joueurs.find(j => j.nom === equipe.joueur2);
        
        const elo1 = j1 ? Math.round(j1.elo) : 1500;
        const elo2 = j2 ? Math.round(j2.elo) : 1500;
        const eloMoyen = Math.round((elo1 + elo2) / 2);
        
        // Badge de chapeau
        let chapeauColor = '';
        let chapeauText = '';
        if (equipe.chapeau === 1) {
            chapeauColor = 'var(--accent)';
            chapeauText = '🥇 Chapeau 1';
        } else if (equipe.chapeau === 2) {
            chapeauColor = '#FFB347';
            chapeauText = '🥈 Chapeau 2';
        } else {
            chapeauColor = 'var(--success)';
            chapeauText = '🥉 Chapeau 3';
        }
        
        return `
            <div class="team-card">
                <div class="team-header">
                    <div class="team-name">${equipe.nom}</div>
                    <div class="team-chapeau" style="color: ${chapeauColor};">${chapeauText}</div>
                </div>
                <div class="team-players">
                    <div class="team-player">
                        <div class="team-player-name">${equipe.joueur1}</div>
                        <div class="team-player-elo">ELO: ${elo1}</div>
                    </div>
                    <div class="team-vs">+</div>
                    <div class="team-player">
                        <div class="team-player-name">${equipe.joueur2}</div>
                        <div class="team-player-elo">ELO: ${elo2}</div>
                    </div>
                </div>
                <div class="team-elo-moyen">
                    <span style="color: var(--gray); font-size: 0.9rem;">ELO Moyen:</span>
                    <span style="font-family: 'Bebas Neue', sans-serif; font-size: 1.8rem; color: var(--primary); margin-left: 0.5rem;">${eloMoyen}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Initialiser la recherche
function initialiserRecherche() {
    const searchInput = document.getElementById('search-player');
    const sortSelect = document.getElementById('sort-players');
    const tournoiFilter = document.getElementById('filter-tournoi');
    const phaseFilter = document.getElementById('filter-phase');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            afficherTousJoueurs(e.target.value, sortSelect.value);
        });
    }
    
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            afficherTousJoueurs(searchInput.value, e.target.value);
        });
    }
    
    if (tournoiFilter) {
        tournoiFilter.addEventListener('change', (e) => {
            afficherTousMatchs(e.target.value, phaseFilter.value);
        });
    }
    
    if (phaseFilter) {
        phaseFilter.addEventListener('change', (e) => {
            afficherTousMatchs(tournoiFilter.value, e.target.value);
        });
    }
}

// Afficher le profil d'un joueur
function afficherProfilJoueur(nomJoueur) {
    const joueur = joueurs.find(j => j.nom === nomJoueur);
    if (!joueur) return;
    
    const matchsJoueur = matchs.filter(m => 
        m.joueur1 === nomJoueur || m.joueur2 === nomJoueur
    );
    
    const modal = document.getElementById('player-modal');
    const content = document.getElementById('player-modal-content');
    
    const victoires = matchsJoueur.filter(m => m.gagnant === nomJoueur).length;
    const defaites = matchsJoueur.length - victoires;
    const photoUrl = joueur.photo || 'photos/default.jpg';
    
    // Calculer le rang
    const classement = [...joueurs].sort((a, b) => b.elo - a.elo);
    const rang = classement.findIndex(j => j.nom === nomJoueur) + 1;
    
    // Déterminer les prix du joueur
    const prix = [];
    
    // Champions
    const finalesCNF1 = matchs.filter(m => m.tournoi === 'CNF 1' && m.phase === 'Finale');
    const finalesCNF2 = matchs.filter(m => m.tournoi === 'CNF 2' && m.phase === 'Finale');
    
    if (finalesCNF1.length > 0 && finalesCNF1[0].gagnant === nomJoueur) {
        prix.push({ nom: '🏆 Champion CNF 1', tournoi: 'CNF 1' });
    }
    if (finalesCNF2.length > 0 && finalesCNF2[0].gagnant === nomJoueur) {
        prix.push({ nom: '🏆 Champion CNF 2', tournoi: 'CNF 2' });
    }
    
    // Prix spéciaux CNF 2
    const prixSpeciauxCNF2 = {
        'Yassine Aloui': '🎖️ Prix de l\'émargement',
        'Mathias Joly': '🌟 Prix du meilleur espoir',
        'Lilou Frezzato': '⚽ Prix Mitroglou',
        'Théophile Watremez': '🎯 Prix du meilleur check-out',
        'Paul Dauboin': '🚀 Prix de la meilleure volée',
        'Stanislas Bruyere': '✨ Prix du plus beau tir'
    };
    
    if (prixSpeciauxCNF2[nomJoueur]) {
        prix.push({ nom: prixSpeciauxCNF2[nomJoueur], tournoi: 'CNF 2' });
    }
    
    content.innerHTML = `
        <div style="display: flex; align-items: center; gap: 2rem; margin-bottom: 2rem;">
            <div class="player-profile-photo">
                <img src="${photoUrl}" alt="${joueur.nom}" onerror="this.src='photos/default.jpg'">
            </div>
            <div style="flex: 1;">
                <h2 style="font-family: 'Bebas Neue', sans-serif; font-size: 3rem; color: var(--primary); margin: 0;">
                    ${joueur.nom}
                </h2>
                <div style="font-size: 1.2rem; color: var(--gray); margin-top: 0.5rem;">
                    ${joueur.tournois.join(' • ')}
                </div>
                ${prix.length > 0 ? `
                    <div style="margin-top: 1rem; display: flex; flex-wrap: wrap; gap: 0.5rem;">
                        ${prix.map(p => `
                            <span style="background: linear-gradient(135deg, var(--accent) 0%, #FFB347 100%); 
                                         color: var(--dark); padding: 0.5rem 1rem; border-radius: 20px; 
                                         font-size: 0.9rem; font-weight: 700;">
                                ${p.nom}
                            </span>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 2rem; margin-bottom: 2rem;">
            <div style="text-align: center;">
                <div style="display: inline-block; background: linear-gradient(135deg, var(--dark) 0%, var(--dark-light) 100%); padding: 1.5rem 3rem; border-radius: 12px; border: 2px solid var(--primary); width: 100%;">
                    <div style="font-size: 0.9rem; color: var(--gray); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 0.5rem;">Classement ELO</div>
                    <div style="font-family: 'Bebas Neue', sans-serif; font-size: 4rem; color: var(--accent); line-height: 1;">
                        ${Math.round(joueur.elo)}
                    </div>
                    <div style="font-size: 0.8rem; color: var(--gray); margin-top: 0.5rem;">
                        Max: ${Math.round(joueur.elo_max)} | Min: ${Math.round(joueur.elo_min)}
                    </div>
                </div>
            </div>
            <div style="text-align: center;">
                <div style="display: inline-block; background: linear-gradient(135deg, var(--dark) 0%, var(--dark-light) 100%); padding: 1.5rem 3rem; border-radius: 12px; border: 2px solid var(--primary); width: 100%;">
                    <div style="font-size: 0.9rem; color: var(--gray); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 0.5rem;">Rang Général</div>
                    <div style="font-family: 'Bebas Neue', sans-serif; font-size: 4rem; color: var(--primary); line-height: 1;">
                        #${rang}
                    </div>
                    <div style="font-size: 0.8rem; color: var(--gray); margin-top: 0.5rem;">
                        Sur ${joueurs.length} joueurs
                    </div>
                </div>
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 3rem;">
            <div class="player-stat" style="background: var(--dark); padding: 1.5rem; border-radius: 8px;">
                <div class="player-stat-value">${joueur.victoires}</div>
                <div class="player-stat-label">Victoires</div>
            </div>
            <div class="player-stat" style="background: var(--dark); padding: 1.5rem; border-radius: 8px;">
                <div class="player-stat-value">${joueur.defaites}</div>
                <div class="player-stat-label">Défaites</div>
            </div>
            <div class="player-stat" style="background: var(--dark); padding: 1.5rem; border-radius: 8px;">
                <div class="player-stat-value">${joueur.pourcentage_victoires}%</div>
                <div class="player-stat-label">Taux victoire</div>
            </div>
            <div class="player-stat" style="background: var(--dark); padding: 1.5rem; border-radius: 8px;">
                <div class="player-stat-value">${joueur.sets_gagnes}</div>
                <div class="player-stat-label">Sets gagnés</div>
            </div>
            <div class="player-stat" style="background: var(--dark); padding: 1.5rem; border-radius: 8px;">
                <div class="player-stat-value">${joueur.matchs_joues}</div>
                <div class="player-stat-label">Matchs joués</div>
            </div>
            <div class="player-stat" style="background: var(--dark); padding: 1.5rem; border-radius: 8px;">
                <div class="player-record">${joueur.victoires}V - ${joueur.defaites}D</div>
                ${afficherFormeRecente(joueur.nom)}</div>
            </div>
        </div>
        
        <h3 style="font-family: 'Bebas Neue', sans-serif; font-size: 2rem; margin-bottom: 1.5rem; color: var(--light);">
            Historique des matchs
        </h3>
        
        <div style="display: flex; flex-direction: column; gap: 1rem; max-height: 400px; overflow-y: auto;">
            ${matchsJoueur.reverse().map(match => {
                const adversaire = match.joueur1 === nomJoueur ? match.joueur2 : match.joueur1;
                const scoreJoueur = match.joueur1 === nomJoueur ? match.score1 : match.score2;
                const scoreAdversaire = match.joueur1 === nomJoueur ? match.score2 : match.score1;
                const victoire = match.gagnant === nomJoueur;
                
                return `
                    <div style="background: var(--dark); padding: 1rem; border-radius: 8px; border-left: 4px solid ${victoire ? 'var(--success)' : 'var(--danger)'};">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong style="color: ${victoire ? 'var(--success)' : 'var(--danger)'};">
                                    ${victoire ? 'VICTOIRE' : 'DÉFAITE'}
                                </strong>
                                vs ${adversaire}
                            </div>
                            <div style="font-family: 'Bebas Neue', sans-serif; font-size: 1.5rem; color: var(--primary);">
                                ${scoreJoueur} - ${scoreAdversaire}
                            </div>
                        </div>
                        <div style="font-size: 0.85rem; color: var(--gray); margin-top: 0.5rem;">
                            ${match.tournoi} - ${match.phase}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    modal.classList.add('active');
}

// Fermer le modal
document.querySelector('.modal-close').addEventListener('click', () => {
    document.getElementById('player-modal').classList.remove('active');
});

document.getElementById('player-modal').addEventListener('click', (e) => {
    if (e.target.id === 'player-modal') {
        document.getElementById('player-modal').classList.remove('active');
    }
});

// Démarrer l'application
document.addEventListener('DOMContentLoaded', chargerDonnees);

// Afficher les poules CNF 3
function afficherPoulesCNF3() {
    const container = document.getElementById('poules-cnf3');
    if (!container || !poulesCNF3 || poulesCNF3.length === 0) return;
    
    container.innerHTML = poulesCNF3.map(poule => {
        const equipesHTML = poule.equipes.map(equipe => {
            // Récupérer les ELO
            const j1 = joueurs.find(j => j.nom === equipe.joueur1);
            const j2 = joueurs.find(j => j.nom === equipe.joueur2);
            
            const elo1 = j1 ? Math.round(j1.elo) : 1500;
            const elo2 = j2 ? Math.round(j2.elo) : 1500;
            const eloMoyen = Math.round((elo1 + elo2) / 2);
            
            return `
                <div class="poule-equipe">
                    <div class="poule-equipe-nom">${equipe.nom}</div>
                    <div class="poule-equipe-joueurs">
                        <span>${equipe.joueur1 || '?'}</span> & <span>${equipe.joueur2 || '?'}</span>
                    </div>
                    <div class="poule-equipe-elo">ELO: ${eloMoyen}</div>
                </div>
            `;
        }).join('');
        
        return `
            <div class="poule-card">
                <div class="poule-header">
                    <h3>Poule ${poule.numero}</h3>
                    <div class="poule-equipes-count">${poule.equipes.length} équipes</div>
                </div>
                <div class="poule-equipes">
                    ${equipesHTML}
                </div>
            </div>
        `;
    }).join('');
}

// Initialiser les onglets CNF 3
function initialiserOngletsCNF3() {
    const tabs = document.querySelectorAll('.cnf3-tab');
    const views = document.querySelectorAll('.cnf3-view');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetView = tab.dataset.tab;
            
            // Mettre à jour les onglets actifs
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Afficher la bonne vue
            views.forEach(v => v.classList.remove('active'));
            document.getElementById(`cnf3-${targetView}`).classList.add('active');
        });
    });
}

// Afficher le tableau final CNF 3
function afficherTableauCNF3() {
    const container = document.getElementById('tableau-cnf3');
    if (!container) return;
    
    // Récupérer les matchs du CNF 3 dans les phases finales
    const matchsCNF3 = matchs.filter(m => m.tournoi === 'CNF 3' && m.phase !== 'Poules');
    
    // Organiser par phase
    const phases = {
        '32èmes': matchsCNF3.filter(m => m.phase === '32èmes' || m.phase === '32ème'),
        '16èmes': matchsCNF3.filter(m => m.phase === '16èmes' || m.phase === '16ème'),
        '8èmes': matchsCNF3.filter(m => m.phase === '8èmes' || m.phase === '8ème'),
        'Quarts': matchsCNF3.filter(m => m.phase === 'Quarts' || m.phase === 'Quart'),
        'Demis': matchsCNF3.filter(m => m.phase === 'Demis' || m.phase === 'Demi'),
        'Finale': matchsCNF3.filter(m => m.phase === 'Finale')
    };
    
    // Si aucun match n'est joué
    if (matchsCNF3.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 4rem; color: var(--gray);">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🏆</div>
                <h3 style="color: var(--light); margin-bottom: 1rem;">Tableau final à venir</h3>
                <p>Les phases finales commenceront après les matchs de poules.</p>
                <p style="margin-top: 1rem; font-size: 0.9rem;">
                    Les 32 premiers de chaque poule s'affronteront en 32èmes de finale.
                </p>
            </div>
        `;
        return;
    }
    
    // Afficher les phases avec matchs
    let html = '<div class="phases-finales">';
    
    const phaseOrder = ['32èmes', '16èmes', '8èmes', 'Quarts', 'Demis', 'Finale'];
    
    for (const phaseName of phaseOrder) {
        const phaseMatches = phases[phaseName];
        
        if (phaseMatches.length > 0) {
            html += `
                <div class="phase-section">
                    <h3 class="phase-title">${phaseName} de finale</h3>
                    <div class="phase-matches">
            `;
            
            phaseMatches.forEach(match => {
                const winner = match.gagnant;
                const isJ1Winner = match.joueur1 === winner;
                const isJ2Winner = match.joueur2 === winner;
                
                html += `
                    <div class="bracket-match">
                        <div class="bracket-team ${isJ1Winner ? 'winner' : ''}">
                            <span class="bracket-team-name">${match.joueur1}</span>
                            <span class="bracket-team-score">${match.score1}</span>
                        </div>
                        <div class="bracket-team ${isJ2Winner ? 'winner' : ''}">
                            <span class="bracket-team-name">${match.joueur2}</span>
                            <span class="bracket-team-score">${match.score2}</span>
                        </div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        }
    }
    
    html += '</div>';
    
    // Si on a un champion (finale jouée)
    const finale = phases['Finale'][0];
    if (finale) {
        html += `
            <div class="champion-section">
                <div class="champion-trophy">🏆</div>
                <div class="champion-title">Champion CNF 3</div>
                <div class="champion-name">${finale.gagnant}</div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

// Rendre les noms de champions et prix cliquables sur la page Palmarès
function initialiserPalmares() {
    // Tous les éléments avec data-player
    document.querySelectorAll('[data-player]').forEach(element => {
        const playerName = element.dataset.player;
        if (playerName && playerName !== '[NOM_CHAMPION_CNF1]' && playerName !== '[NOM_CHAMPION_CNF2]') {
            element.style.cursor = 'pointer';
            element.addEventListener('click', () => {
                afficherProfilJoueur(playerName);
            });
        }
    });
}

// Appeler initialiserPalmares quand on charge la page
setTimeout(initialiserPalmares, 500);

// Toggle menu déroulant des prix
function togglePrix(element) {
    const toggle = element.closest('.prix-toggle');
    const list = toggle.nextElementSibling;
    
    // Toggle classes
    toggle.classList.toggle('active');
    
    if (list.classList.contains('collapsed')) {
        list.classList.remove('collapsed');
        list.classList.add('expanded');
    } else {
        list.classList.remove('expanded');
        list.classList.add('collapsed');
    }
}

// ============================================
// AMÉLIORATIONS CNF - À AJOUTER À app.js
// ============================================

// ============================================
// 1. FORME RÉCENTE (5 derniers matchs)
// ============================================

function afficherFormeRecente(nomJoueur) {
    if (!nomJoueur) return '';
    
    // 1. On récupère les résultats des matchs simples (Vrai/Faux)
    const formeSimples = matchs
        .filter(m => m.joueur1 === nomJoueur || m.joueur2 === nomJoueur)
        .map(m => m.gagnant === nomJoueur);

    // 2. On récupère les résultats du CNF 3 (Vrai/Faux)
    const sourceCNF3 = (window.data && window.data.matchs_cnf3) ? window.data.matchs_cnf3 : [];
    const formeDoubles = sourceCNF3
        .filter(m => m.joueur1_eq1 === nomJoueur || m.joueur2_eq1 === nomJoueur || 
                     m.joueur1_eq2 === nomJoueur || m.joueur2_eq2 === nomJoueur)
        .map(m => {
            const estDansEq1 = (m.joueur1_eq1 === nomJoueur || m.joueur2_eq1 === nomJoueur);
            return m.gagnant === (estDansEq1 ? m.equipe1 : m.equipe2);
        });

    // 3. On fusionne (Simples d'abord, CNF3 après) et on garde les 5 derniers
    const historiqueTotal = [...formeSimples, ...formeDoubles].slice(-5);

    if (historiqueTotal.length === 0) return 'Aucun match';

    // 4. On génère les pastilles
    return `
        <div class="forme-recent">
            ${historiqueTotal.map(victoire => `
                <span class="forme-dot ${victoire ? 'win' : 'loss'}"></span>
            `).join('')}
        </div>
    `;
}

// ============================================
// 2. PAGE D'ACCUEIL DYNAMIQUE
// ============================================

function afficherPageAccueilDynamique() {
    const container = document.getElementById('dynamic-home-stats');
    if (!container) return;
    
    const joueursActifs = [...joueurs].sort((a, b) => b.elo - a.elo);
    const top3 = joueursActifs.slice(0, 3);
    
    const progressions = joueurs.map(j => ({
        nom: j.nom,
        progression: j.elo - (j.elo_min || 1500),
        elo: j.elo
    })).sort((a, b) => b.progression - a.progression);
    
    const joueursEnForme = joueurs.map(j => {
        const matchsJoueur = matchs.filter(m => m.joueur1 === j.nom || m.joueur2 === j.nom).slice(-5);
        const victoires = matchsJoueur.filter(m => m.gagnant === j.nom).length;
        return { nom: j.nom, victoires, total: matchsJoueur.length };
    }).filter(j => j.total >= 3).sort((a, b) => b.victoires - a.victoires);
    
    const dernierMatch = matchs.length > 0 ? matchs[matchs.length - 1] : null;
    
    container.innerHTML = `
        <div class="home-dynamic-grid">
            <div class="dynamic-card podium-card">
                <h3><i class="fas fa-trophy"></i> Podium Actuel</h3>
                <div class="podium">
                    <div class="podium-item second" onclick="afficherProfilJoueur('${top3[1]?.nom || ''}')">
                        <div class="podium-rank">#2</div>
                        <div class="podium-name">${top3[1]?.nom || '-'}</div>
                        <div class="podium-elo">${Math.round(top3[1]?.elo || 0)}</div>
                    </div>
                    <div class="podium-item first" onclick="afficherProfilJoueur('${top3[0]?.nom || ''}')">
                        <div class="podium-trophy">🏆</div>
                        <div class="podium-rank">#1</div>
                        <div class="podium-name">${top3[0]?.nom || '-'}</div>
                        <div class="podium-elo">${Math.round(top3[0]?.elo || 0)}</div>
                    </div>
                    <div class="podium-item third" onclick="afficherProfilJoueur('${top3[2]?.nom || ''}')">
                        <div class="podium-rank">#3</div>
                        <div class="podium-name">${top3[2]?.nom || '-'}</div>
                        <div class="podium-elo">${Math.round(top3[2]?.elo || 0)}</div>
                    </div>
                </div>
            </div>
            
            <div class="dynamic-card progression-card" onclick="afficherProfilJoueur('${progressions[0]?.nom || ''}')">
                <h3><i class="fas fa-chart-line"></i> Plus Grosse Progression</h3>
                <div class="progression-content">
                    <div class="progression-player">${progressions[0]?.nom || '-'}</div>
                    <div class="progression-value">+${Math.round(progressions[0]?.progression || 0)} ELO</div>
                    <div class="progression-bar-container">
                        <div class="progression-bar" style="width: ${Math.min(100, (progressions[0]?.progression || 0) / 3)}%"></div>
                    </div>
                </div>
            </div>
            
            <div class="dynamic-card forme-card" onclick="afficherProfilJoueur('${joueursEnForme[0]?.nom || ''}')">
                <h3><i class="fas fa-fire"></i> Joueur en Forme</h3>
                <div class="forme-content">
                    <div class="forme-player">${joueursEnForme[0]?.nom || '-'}</div>
                    <div class="forme-stats">${joueursEnForme[0]?.victoires || 0}/${joueursEnForme[0]?.total || 0} victoires</div>
                    ${afficherFormeRecente(joueursEnForme[0]?.nom || '')}
                </div>
            </div>
            
            ${dernierMatch ? `
            <div class="dynamic-card match-card">
                <h3><i class="fas fa-bolt"></i> Dernier Match</h3>
                <div class="match-content">
                    <div class="match-players-home">
                        <div class="match-player-home ${dernierMatch.gagnant === dernierMatch.joueur1 ? 'winner' : ''}" onclick="afficherProfilJoueur('${dernierMatch.joueur1}')">
                            <span>${dernierMatch.joueur1}</span>
                            <span class="match-score-home">${dernierMatch.score1}</span>
                        </div>
                        <div class="match-vs-home">VS</div>
                        <div class="match-player-home ${dernierMatch.gagnant === dernierMatch.joueur2 ? 'winner' : ''}" onclick="afficherProfilJoueur('${dernierMatch.joueur2}')">
                            <span>${dernierMatch.joueur2}</span>
                            <span class="match-score-home">${dernierMatch.score2}</span>
                        </div>
                    </div>
                    <div class="match-info-home">${dernierMatch.tournoi} - ${dernierMatch.phase}</div>
                </div>
            </div>
            ` : ''}
        </div>
    `;
}

// ============================================
// 4. MODE LIVE SCORING
// ============================================

function initialiserLiveScoring() {
    remplirSelecteursLive();
    afficherDerniersMatchsLive();
}

function remplirSelecteursLive() {
    const selectJ1 = document.getElementById('live-j1');
    const selectJ2 = document.getElementById('live-j2');
    
    if (!selectJ1 || !selectJ2) return;
    
    const options = joueurs
        .sort((a, b) => a.nom.localeCompare(b.nom))
        .map(j => `<option value="${j.nom}">${j.nom}</option>`)
        .join('');
    
    selectJ1.innerHTML = '<option value="">Sélectionner</option>' + options;
    selectJ2.innerHTML = '<option value="">Sélectionner</option>' + options;
}

function sauvegarderMatchLive(event) {
    event.preventDefault();
    
    const j1 = document.getElementById('live-j1').value;
    const j2 = document.getElementById('live-j2').value;
    const score1 = parseInt(document.getElementById('live-score1').value);
    const score2 = parseInt(document.getElementById('live-score2').value);
    const tournoi = document.getElementById('live-tournoi').value;
    const phase = document.getElementById('live-phase').value;
    
    if (j1 === j2) {
        alert('Les deux joueurs doivent être différents');
        return;
    }
    
    const gagnant = score1 > score2 ? j1 : j2;
    
    const nouveauMatch = {
        id: matchs.length + 1,
        tournoi,
        phase,
        date: new Date().toISOString().split('T')[0],
        joueur1: j1,
        joueur2: j2,
        score1,
        score2,
        gagnant,
        live: true
    };
    
    matchs.push(nouveauMatch);
    
    // Notification succès
    const notification = document.createElement('div');
    notification.className = 'notification-success';
    notification.innerHTML = `<i class="fas fa-check-circle"></i> Match enregistré ! ${gagnant} bat ${gagnant === j1 ? j2 : j1} (${score1}-${score2})`;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 3000);
    
    afficherDerniersMatchsLive();
    document.getElementById('live-form').reset();
    
    // Mettre à jour les autres vues
    afficherDerniersMatchs();
    afficherPageAccueilDynamique();
}

function afficherDerniersMatchsLive() {
    const container = document.getElementById('live-recent-matches');
    if (!container) return;
    
    const derniersMatchs = matchs.slice(-10).reverse();
    
    if (derniersMatchs.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--gray); padding: 2rem;">Aucun match enregistré</p>';
        return;
    }
    
    container.innerHTML = derniersMatchs.map(m => `
        <div class="live-match-item ${m.live ? 'live-new' : ''}">
            <div class="live-match-players">
                <span class="live-player ${m.gagnant === m.joueur1 ? 'winner' : ''}">${m.joueur1}</span>
                <span class="live-match-score">${m.score1} - ${m.score2}</span>
                <span class="live-player ${m.gagnant === m.joueur2 ? 'winner' : ''}">${m.joueur2}</span>
            </div>
            <div class="live-match-info">
                ${m.tournoi} - ${m.phase}
                ${m.live ? '<span class="live-badge">NOUVEAU</span>' : ''}
            </div>
        </div>
    `).join('');
}

// ============================================
// CHARGEMENT DES MATCHS CNF3
// ============================================

let matchsCNF3 = [];
let filtreMatchsActuel = 'all';

// Charger les matchs CNF3 au démarrage
function chargerMatchsCNF3() {
    // Vérifier si data est chargé et contient matchs_cnf3
    if (window.data && window.data.matchs_cnf3) {
        matchsCNF3 = window.data.matchs_cnf3;
        console.log('✅ Matchs CNF3 chargés:', matchsCNF3.length);
    } else {
        matchsCNF3 = [];
        console.log('⚠️ Aucun match CNF3 trouvé dans data.json');
    }
}

// ============================================
// AFFICHAGE PAGE LIVE
// ============================================

function initialiserLive() {
    chargerMatchsCNF3();
    afficherMatchsLive();
    afficherStatsLive();
}

function afficherStatsLive() {
    const totalMatchs = matchsCNF3.length;
    const dernierMatch = matchsCNF3.length > 0 ? matchsCNF3[matchsCNF3.length - 1] : null;
    
    const totalElement = document.getElementById('live-total-matchs');
    const updateElement = document.getElementById('live-dernier-update');
    const phaseElement = document.getElementById('live-phase-actuelle');
    
    if (totalElement) totalElement.textContent = totalMatchs;
    
    if (dernierMatch && updateElement) {
        const date = new Date(dernierMatch.date);
        updateElement.textContent = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    }
    
    if (phaseElement) {
        const matchsTableau = matchsCNF3.filter(m => m.type === 'tableau');
        if (matchsTableau.length > 0) {
            const dernierePhase = matchsTableau[matchsTableau.length - 1].phase;
            phaseElement.textContent = dernierePhase;
        } else {
            phaseElement.textContent = 'Poules';
        }
    }
}

function afficherMatchsLive() {
    const container = document.getElementById('live-matchs-container');
    const noMatchs = document.getElementById('live-no-matchs');
    
    if (!container || !noMatchs) {
        console.log('⚠️ Éléments live-matchs-container ou live-no-matchs non trouvés');
        return;
    }
    
    // Filtrer les matchs
    let matchsFiltres = matchsCNF3;
    if (filtreMatchsActuel === 'poule') {
        matchsFiltres = matchsCNF3.filter(m => m.type === 'poule');
    } else if (filtreMatchsActuel === 'tableau') {
        matchsFiltres = matchsCNF3.filter(m => m.type === 'tableau');
    }
    
    if (matchsFiltres.length === 0) {
        container.innerHTML = '';
        noMatchs.classList.remove('hidden');
        return;
    }
    
    noMatchs.classList.add('hidden');
    
    // Trier par date (plus récent en premier) + limiter à 4
    const matchsTries = [...matchsFiltres]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 4);
    
    container.innerHTML = matchsTries.map(match => {
        const date = new Date(match.date);
        const dateStr = date.toLocaleDateString('fr-FR', { 
            day: '2-digit', 
            month: 'short'
        });
        
        const estPoule = match.type === 'poule';
        const phaseLabel = estPoule ? `Poule ${match.poule}` : match.phase;
        const phaseClass = estPoule ? 'phase-poule' : 'phase-tableau';
        
        return `
            <div class="live-match-card" data-type="${match.type}">
                <div class="live-match-header">
                    <span class="live-match-phase ${phaseClass}">${phaseLabel}</span>
                    <span class="live-match-date">${dateStr}</span>
                </div>
                
                <div class="live-match-content">
                    <div class="live-match-team ${match.gagnant === match.equipe1 ? 'winner' : ''}">
                        <div class="team-name">${match.equipe1}</div>
                        ${estPoule && match.joueur1_eq1 ? `
                            <div class="team-players">${match.joueur1_eq1} / ${match.joueur2_eq1}</div>
                        ` : ''}
                        <div class="team-score">${match.score1}</div>
                    </div>
                    
                    <div class="live-match-vs">VS</div>
                    
                    <div class="live-match-team ${match.gagnant === match.equipe2 ? 'winner' : ''}">
                        <div class="team-name">${match.equipe2}</div>
                        ${estPoule && match.joueur1_eq2 ? `
                            <div class="team-players">${match.joueur1_eq2} / ${match.joueur2_eq2}</div>
                        ` : ''}
                        <div class="team-score">${match.score2}</div>
                    </div>
                </div>
                
                ${match.gagnant ? `
                    <div class="live-match-winner">
                        <i class="fas fa-trophy"></i> ${match.gagnant}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
    
    console.log('✅ Matchs affichés:', matchsFiltres.length);
}

function filtrerMatchsLive(filtre) {
    filtreMatchsActuel = filtre;
    
    // Mettre à jour les boutons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filtre) {
            btn.classList.add('active');
        }
    });
    
    afficherMatchsLive();
}

// ============================================
// TABLEAU FINAL CNF3
// ============================================

function afficherTableauCNF3Complet() {
    const container = document.getElementById('tableau-cnf3');
    if (!container) {
        console.log('⚠️ Élément tableau-cnf3 non trouvé');
        return;
    }
    
    // Récupérer les matchs du tableau
    const matchsTableau = matchsCNF3.filter(m => m.type === 'tableau');
    
    if (matchsTableau.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--gray);">
                <i class="fas fa-hourglass-half" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <p>Le tableau final sera disponible après les phases de poules</p>
            </div>
        `;
        return;
    }
    
    // Grouper par phase
    const phases = ['32èmes', '16èmes', '8èmes', 'Quarts', 'Demis', 'Finale'];
    const matchsParPhase = {};
    
    phases.forEach(phase => {
        matchsParPhase[phase] = matchsTableau.filter(m => m.phase === phase);
    });
    
    // Afficher le tableau
    container.innerHTML = `
        <div class="tableau-final-container">
            ${phases.filter(phase => matchsParPhase[phase].length > 0).map(phase => `
                <div class="phase-section">
                    <h3 class="phase-title">${phase}</h3>
                    <div class="phase-matchs">
                        ${matchsParPhase[phase].map(match => `
                            <div class="tableau-match">
                                <div class="tableau-team ${match.gagnant === match.equipe1 ? 'qualified' : 'eliminated'}">
                                    <span class="team-name-tableau">${match.equipe1}</span>
                                    <span class="team-score-tableau">${match.score1}</span>
                                </div>
                                <div class="tableau-separator"></div>
                                <div class="tableau-team ${match.gagnant === match.equipe2 ? 'qualified' : 'eliminated'}">
                                    <span class="team-name-tableau">${match.equipe2}</span>
                                    <span class="team-score-tableau">${match.score2}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
        
        ${matchsParPhase['Finale'] && matchsParPhase['Finale'].length > 0 ? `
            <div class="champion-section-cnf3">
                <div class="champion-trophy">🏆</div>
                <div class="champion-title">Champions CNF 3</div>
                <div class="champion-name-cnf3">${matchsParPhase['Finale'][0].gagnant}</div>
            </div>
        ` : ''}
    `;
    
    console.log('✅ Tableau final affiché avec', matchsTableau.length, 'matchs');
}

// ============================================
// INITIALISATION
// ============================================


// Initialiser le Live au chargement
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (typeof initialiserLive === 'function') {
            initialiserLive();
        }
        if (typeof afficherTableauCNF3Complet === 'function') {
            afficherTableauCNF3Complet();
        }
    }, 1000);
});