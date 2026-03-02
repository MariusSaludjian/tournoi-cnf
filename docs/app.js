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
        
        // Alimenter matchsCNF3 dès le chargement
        if (data.matchs_cnf3) {
            matchsCNF3 = data.matchs_cnf3;
        }
        
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
    
    const rankMedals = ['🥇','🥈','🥉','4','5','6'];
    container.innerHTML = topJoueurs.map((joueur, index) => `
        <div class="player-card rank-${index + 1}" onclick="afficherProfilJoueur('${joueur.nom}')">
            <div class="player-card-top">
                <div class="player-photo-wrapper rank-${index + 1}-photo">
                    <img src="${joueur.photo || 'photos/default.svg'}" alt="${joueur.nom}" class="player-photo-circle" onerror="this.src='photos/default.svg'">
                    <div class="player-medal">${index < 3 ? rankMedals[index] : '<span class=\'rank-num\'>#' + (index+1) + '</span>'}</div>
                </div>
                <div class="player-name">${joueur.nom}</div>
                <div class="player-rank">#${index + 1}</div>
            </div>
            <div class="player-header">
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
                <td class="player-name-cell">
                    <div class="classement-name-with-photo">
                        <img src="${joueur.photo || 'photos/default.svg'}" alt="${joueur.nom}" class="classement-photo" onerror="this.src='photos/default.svg'">
                        <span>${joueur.nom}</span>
                    </div>
                </td>
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

function afficherPhotoPred(id, nomJoueur) {
    const img = document.getElementById('photo-' + id);
    if (!img) return;
    if (!nomJoueur) {
        img.src = '';
        img.classList.add('hidden');
        return;
    }
    const joueur = joueurs.find(j => j.nom === nomJoueur);
    const photo = joueur && joueur.photo ? joueur.photo : 'photos/default.jpg';
    img.src = photo;
    img.classList.remove('hidden');
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

// ============================================
// TABLEAU FINAL CNF 3 - SYSTÈME BRACKET
// ============================================

/**
 * Construit l'arbre des matchs du tableau final à partir de matchs_cnf3
 * Source unique : window.data.matchs_cnf3 (type = 'tableau')
 */
function getMatchsTableau() {
    const tableau = window.data && window.data.tableau_cnf3;

    const PHASE_MAP = {
        '32emes': '32èmes', '16emes': '16èmes', '8emes': '8èmes',
        'quarts': 'Quarts', 'demis': 'Demis', 'finale': 'Finale'
    };
    // Nombre de matchs attendus par phase dans un tableau de 32
    const EXPECTED = {
        '32èmes': 32, '16èmes': 16, '8èmes': 8,
        'Quarts': 4, 'Demis': 2, 'Finale': 1
    };

    if (tableau) {
        const result = [];
        for (const [key, matchsList] of Object.entries(tableau)) {
            const phase = PHASE_MAP[key] || key;
            // Ajouter les matchs existants
            matchsList.forEach(m => {
                result.push({
                    type: 'tableau', phase,
                    equipe1: m.equipe1 || null,
                    equipe2: m.equipe2 || null,
                    score1:  m.score1 !== undefined ? m.score1 : null,
                    score2:  m.score2 !== undefined ? m.score2 : null,
                    gagnant: m.gagnant || null,
                    seed1:   m.seed1 || null,
                    seed2:   m.seed2 || null,
                });
            });
            // Compléter avec des slots vides jusqu'au nombre attendu
            const expected = EXPECTED[phase] || 0;
            for (let i = matchsList.length; i < expected; i++) {
                result.push({
                    type: 'tableau', phase,
                    equipe1: null, equipe2: null,
                    score1: null, score2: null,
                    gagnant: null, seed1: null, seed2: null,
                });
            }
        }
        // Toujours afficher les 16èmes si les 32èmes existent mais 16èmes absents
        const has32 = result.some(m => m.phase === '32èmes');
        const has16 = result.some(m => m.phase === '16èmes');
        if (has32 && !has16) {
            for (let i = 0; i < 16; i++) {
                result.push({
                    type: 'tableau', phase: '16èmes',
                    equipe1: null, equipe2: null,
                    score1: null, score2: null,
                    gagnant: null, seed1: null, seed2: null,
                });
            }
        }
        return result;
    }

    // Fallback : matchs_cnf3 (ne contient que les joués)
    const source = (window.data && window.data.matchs_cnf3) ? window.data.matchs_cnf3 : [];
    return source.filter(m => m.type === 'tableau');
}


/**
 * Normalise le nom de phase pour la comparaison
 */
function normaliserPhase(p) {
    if (!p) return '';
    const map = {
        '32ème': '32èmes', '32èmes de finale': '32èmes',
        '16ème': '16èmes', '16èmes de finale': '16èmes',
        '8ème': '8èmes', 'huitièmes': '8èmes', 'huitièmes de finale': '8èmes',
        'quart': 'Quarts', 'quart de finale': 'Quarts', 'quarts de finale': 'Quarts',
        'demi': 'Demis', 'demi-finale': 'Demis', 'demi-finales': 'Demis',
        'finale': 'Finale'
    };
    return map[p.toLowerCase()] || p;
}

/**
 * Génère le HTML d'une carte match dans le bracket
 */
function renderBracketMatch(match, compact = false) {
    // Match null
    if (!match) {
        return `<div class="bracket-match bracket-match-tbd">
            <div class="bracket-team bracket-tbd"><span class="bt-seed">?</span><span class="bt-name">À déterminer</span><span class="bt-score">—</span></div>
            <div class="bt-divider"></div>
            <div class="bracket-team bracket-tbd"><span class="bt-seed">?</span><span class="bt-name">À déterminer</span><span class="bt-score">—</span></div>
        </div>`;
    }

    // Slot vide (qualifié inconnu — ex: 16èmes dont le 32ème n'est pas joué)
    if (!match.equipe1 && !match.equipe2) {
        return `<div class="bracket-match bracket-match-tbd">
            <div class="bracket-team bracket-tbd"><span class="bt-name">À déterminer</span><span class="bt-score">—</span></div>
            <div class="bt-divider"></div>
            <div class="bracket-team bracket-tbd"><span class="bt-name">À déterminer</span><span class="bt-score">—</span></div>
        </div>`;
    }

    const joue = match.score1 !== null && match.score1 !== undefined && match.score2 !== null;
    const w1 = joue && match.score1 > match.score2;
    const w2 = joue && match.score2 > match.score1;
    const s1 = joue ? match.score1 : '—';
    const s2 = joue ? match.score2 : '—';
    const seed1 = match.seed1 ? `<span class="bt-seed">${match.seed1}</span>` : '';
    const seed2 = match.seed2 ? `<span class="bt-seed">${match.seed2}</span>` : '';
    const maxLen = compact ? 16 : 22;
    const n1 = (match.equipe1 || 'TBD').length > maxLen ? (match.equipe1 || 'TBD').substring(0, maxLen) + '…' : (match.equipe1 || 'TBD');
    const n2 = (match.equipe2 || 'TBD').length > maxLen ? (match.equipe2 || 'TBD').substring(0, maxLen) + '…' : (match.equipe2 || 'TBD');

    return `<div class="bracket-match ${joue ? 'bracket-match-played' : 'bracket-match-pending'}">
        <div class="bracket-team ${w1 ? 'bt-winner' : joue ? 'bt-loser' : ''}" title="${match.equipe1 || ''}">
            ${seed1}<span class="bt-name">${n1}</span><span class="bt-score">${s1}</span>
        </div>
        <div class="bt-divider"></div>
        <div class="bracket-team ${w2 ? 'bt-winner' : joue ? 'bt-loser' : ''}" title="${match.equipe2 || ''}">
            ${seed2}<span class="bt-name">${n2}</span><span class="bt-score">${s2}</span>
        </div>
    </div>`;
}

/**
 * Affiche le tableau final dans l'onglet CNF 3 (vue complète scrollable)
 */
function afficherTableauCNF3() {
    const container = document.getElementById('tableau-cnf3');
    if (!container) return;

    const sourceData = window.data.tableau_cnf3;
    if (!sourceData) return;

    // 1. RECONSTRUCTION MATHÉMATIQUE DE L'ARBRE DU TOURNOI
    const ROUNDS = [
        { id: '32emes', label: '32èmes', count: 32 },
        { id: '16emes', label: '16èmes', count: 16 },
        { id: '8emes', label: '8èmes', count: 8 },
        { id: 'quarts', label: 'Quarts', count: 4 },
        { id: 'demis', label: 'Demis', count: 2 },
        { id: 'finale', label: 'Finale', count: 1 }
    ];

    const bracket = {};
    
    // Initialiser tous les emplacements (slots) du tournoi à vide
    ROUNDS.forEach(r => {
        bracket[r.id] = Array.from({ length: r.count }, (_, i) => ({
            match_num: i + 1,
            equipe1: null, equipe2: null,
            score1: null, score2: null, gagnant: null
        }));
    });

    // ÉTAPE A : Remplir la base (Les 32èmes) à partir du JSON
    if (sourceData['32emes']) {
        sourceData['32emes'].forEach(m => {
            if (m.match_num >= 1 && m.match_num <= 32) {
                bracket['32emes'][m.match_num - 1] = { 
                    match_num: m.match_num,
                    equipe1: m.equipe1, equipe2: m.equipe2,
                    score1: m.score1, score2: m.score2, gagnant: m.gagnant 
                };
            }
        });
    }

    // ÉTAPE B : Calculer la suite de l'arbre (Propagation des gagnants)
    for (let r = 1; r < ROUNDS.length; r++) {
        const currentRound = ROUNDS[r].id;
        const prevRound = ROUNDS[r-1].id;
        const jsonMatches = sourceData[currentRound] || []; // Les matchs joués dans le JSON

        for (let i = 0; i < ROUNDS[r].count; i++) {
            // Dans un arbre binaire, le match i du tour actuel provient des matchs i*2 et i*2+1 du tour précédent
            const matchPrecedent1 = bracket[prevRound][i * 2];
            const matchPrecedent2 = bracket[prevRound][i * 2 + 1];

            // Qui est censé jouer ici ? (Soit un gagnant, soit null si pas encore joué)
            const expectedEq1 = matchPrecedent1 ? matchPrecedent1.gagnant : null;
            const expectedEq2 = matchPrecedent2 ? matchPrecedent2.gagnant : null;

            let matchData = {
                match_num: i + 1,
                equipe1: expectedEq1,
                equipe2: expectedEq2,
                score1: null, score2: null, gagnant: null
            };

            // Si on connaît les 2 équipes, on cherche dans le JSON si elles se sont affrontées
            // Cela permet de retrouver leurs scores même si ton backend les a mal rangées
            if (expectedEq1 && expectedEq2) {
                const playedMatch = jsonMatches.find(m => 
                    (m.equipe1 === expectedEq1 && m.equipe2 === expectedEq2) ||
                    (m.equipe1 === expectedEq2 && m.equipe2 === expectedEq1)
                );
                
                if (playedMatch) {
                    // Mettre les scores dans le même ordre que notre arbre (Eq1 en haut, Eq2 en bas)
                    if (playedMatch.equipe1 === expectedEq1) {
                        matchData.score1 = playedMatch.score1;
                        matchData.score2 = playedMatch.score2;
                    } else {
                        matchData.score1 = playedMatch.score2;
                        matchData.score2 = playedMatch.score1;
                    }
                    matchData.gagnant = playedMatch.gagnant;
                }
            }
            bracket[currentRound][i] = matchData;
        }
    }

    // 2. GÉNÉRATION DU VISUEL (Le fameux miroir)
    let html = `<div class="wc-bracket-container">`;

    // Petite fonction locale pour dessiner proprement une carte match
    const renderMatch = (m) => {
        const eq1 = m.equipe1 || 'À déterminer';
        const eq2 = m.equipe2 || 'À déterminer';
        const s1 = m.score1 !== null ? m.score1 : '—';
        const s2 = m.score2 !== null ? m.score2 : '—';
        const w1 = m.gagnant && m.gagnant === m.equipe1;
        const w2 = m.gagnant && m.gagnant === m.equipe2;
        const played = m.score1 !== null && m.score2 !== null;

        return `
            <div class="bracket-match ${played ? 'bracket-match-played' : 'bracket-match-pending'}">
                <div class="bracket-team ${w1 ? 'bt-winner' : (played && !w1 ? 'bt-loser' : '')}">
                    <span class="bt-name" title="${eq1}">${eq1}</span>
                    <span class="bt-score">${s1}</span>
                </div>
                <div class="bt-divider"></div>
                <div class="bracket-team ${w2 ? 'bt-winner' : (played && !w2 ? 'bt-loser' : '')}">
                    <span class="bt-name" title="${eq2}">${eq2}</span>
                    <span class="bt-score">${s2}</span>
                </div>
            </div>
        `;
    };

    const PHASES_COTES = ROUNDS.slice(0, 5); // 32èmes jusqu'aux Demis

    // --- AILE GAUCHE ---
    html += `<div class="wc-bracket-half left-side">`;
    PHASES_COTES.forEach(phase => {
        const halfCount = phase.count / 2;
        html += `<div class="wc-round"><div class="bracket-round-label">${phase.label}</div><div class="wc-matches-column">`;
        for (let i = 0; i < halfCount; i++) {
            html += renderMatch(bracket[phase.id][i]);
        }
        html += `</div></div>`;
    });
    html += `</div>`;

    // --- CENTRE ---
    const finale = bracket['finale'][0];
    html += `<div class="wc-center">
        <div class="wc-trophy">🏆</div>
        <div class="bracket-round-label finale-label">FINALE</div>`;
    html += renderMatch(finale);
    if (finale.gagnant) html += `<div class="champion-card-bracket mt-3">👑 ${finale.gagnant}</div>`;
    html += `</div>`;

    // --- AILE DROITE ---
    html += `<div class="wc-bracket-half right-side">`;
    [...PHASES_COTES].reverse().forEach(phase => {
        const halfCount = phase.count / 2;
        html += `<div class="wc-round"><div class="bracket-round-label">${phase.label}</div><div class="wc-matches-column">`;
        // On récupère la seconde moitié du tableau calculé
        for (let i = halfCount; i < phase.count; i++) {
            html += renderMatch(bracket[phase.id][i]);
        }
        html += `</div></div>`;
    });
    html += `</div>`;

    html += `</div>`;

    
    // À AJOUTER À LA FIN de ta fonction afficherTableauCNF3(), juste avant "container.innerHTML = html;"
    // Ou mieux, juste après avoir injecté le HTML :
    function ajouterEvenementsHighlight() {
        const teams = document.querySelectorAll('.bracket-team');
        
        teams.forEach(team => {
            team.addEventListener('mouseenter', () => {
                const teamName = team.querySelector('.bt-name').textContent.trim();
                if (teamName === 'À déterminer' || teamName === '—') return;

                // On cherche tous les blocs qui ont le même nom d'équipe
                document.querySelectorAll('.bracket-team').forEach(el => {
                    if (el.querySelector('.bt-name').textContent.trim() === teamName) {
                        el.classList.add('highlight-path');
                    }
                });
            });

            team.addEventListener('mouseleave', () => {
                document.querySelectorAll('.highlight-path').forEach(el => {
                    el.classList.remove('highlight-path');
                });
            });
        });
    }

    container.innerHTML = html;
}

// Fonction pour aller directement à l'onglet "Tableau" de la page CNF 3
function ouvrirTableauFinal() {
    // 1. On clique sur le lien de navigation CNF 3
    const navCnf3 = document.querySelector('[data-page="cnf3"]');
    if (navCnf3) navCnf3.click();

    // 2. On attend un court instant que la page s'affiche, puis on clique sur l'onglet Tableau
    setTimeout(() => {
        const tabTableau = document.querySelector('[data-tab="tableau"]'); // Vérifie que ton bouton d'onglet a bien ce data-tab
        if (tabTableau) tabTableau.click();
        
        // Optionnel : Scroll fluide jusqu'au tableau
        document.getElementById('tableau-cnf3').scrollIntoView({ behavior: 'smooth' });
    }, 100);
}

// N'oublie pas d'appeler ajouterEvenementsHighlight() à la toute fin de afficherTableauCNF3() !

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
    
    // 1. Matchs simples (uniquement avec un gagnant)
    const formeSimples = matchs
        .filter(m => (m.joueur1 === nomJoueur || m.joueur2 === nomJoueur) && m.gagnant)
        .map(m => m.gagnant === nomJoueur);

    // 2. Matchs CNF 3 doubles (uniquement JOUÉS : gagnant non null)
    const sourceCNF3 = (window.data && window.data.matchs_cnf3) ? window.data.matchs_cnf3 : [];
    const formeDoubles = sourceCNF3
        .filter(m =>
            // Match joué uniquement
            m.gagnant !== null && m.gagnant !== undefined &&
            // Le joueur participe au match
            (m.joueur1_eq1 === nomJoueur || m.joueur2_eq1 === nomJoueur ||
             m.joueur1_eq2 === nomJoueur || m.joueur2_eq2 === nomJoueur)
        )
        .map(m => {
            const estDansEq1 = (m.joueur1_eq1 === nomJoueur || m.joueur2_eq1 === nomJoueur);
            return m.gagnant === (estDansEq1 ? m.equipe1 : m.equipe2);
        });

    // 3. Fusionner et garder les 5 derniers
    const historiqueTotal = [...formeSimples, ...formeDoubles].slice(-5);

    if (historiqueTotal.length === 0) return 'Aucun match';

    // 4. Générer les pastilles
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

// ============================================
// MODIFICATION POUR AFFICHER UNIQUEMENT LES MATCHS DU JOUR
// A remplacer dans app.js (ligne 1513-1591)
// ============================================

function afficherMatchsLive() {
    const container = document.getElementById('live-matchs-container');
    const noMatchs = document.getElementById('live-no-matchs');
    
    if (!container || !noMatchs) {
        console.log('Elements live-matchs-container ou live-no-matchs non trouves');
        return;
    }
    
    // Obtenir la date du jour (sans l'heure)
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    
    // Filtrer d'abord par date (seulement les matchs du jour)
    let matchsDuJour = matchsCNF3.filter(m => {
        const dateMatch = new Date(m.date);
        dateMatch.setHours(0, 0, 0, 0);
        return dateMatch.getTime() === aujourdhui.getTime();
    });
    
    // Puis appliquer le filtre type (poule/tableau)
    let matchsFiltres = matchsDuJour;
    if (filtreMatchsActuel === 'poule') {
        matchsFiltres = matchsDuJour.filter(m => m.type === 'poule');
    } else if (filtreMatchsActuel === 'tableau') {
        matchsFiltres = matchsDuJour.filter(m => m.type === 'tableau');
    }
    
    if (matchsFiltres.length === 0) {
        container.innerHTML = '';
        noMatchs.classList.remove('hidden');
        // Modifier le message pour indiquer qu'il n'y a pas de matchs aujourd'hui
        noMatchs.innerHTML = `
            <i class="fas fa-calendar-times"></i>
            <p>Aucun match aujourd'hui</p>
            <small>Les resultats d'aujourd'hui s'afficheront ici en temps reel</small>
        `;
        return;
    }
    
    noMatchs.classList.add('hidden');
    
    // Trier par heure (plus recent en premier) mais sans limiter a 4
    const matchsTries = [...matchsFiltres]
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    container.innerHTML = matchsTries.map(match => {
        const date = new Date(match.date);
        const dateStr = date.toLocaleDateString('fr-FR', { 
            day: '2-digit', 
            month: 'short'
        });
        
        // Afficher aussi l'heure si disponible
        const heureStr = date.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const estPoule = match.type === 'poule';
        const phaseLabel = estPoule ? `Poule ${match.poule}` : match.phase;
        const phaseClass = estPoule ? 'phase-poule' : 'phase-tableau';
        
        // Badge "NOUVEAU" pour les matchs recents (moins de 30 min)
        const maintenant = new Date();
        const diffMinutes = (maintenant - date) / 1000 / 60;
        const estNouveau = diffMinutes < 30 && match.live;
        
        return `
            <div class="live-match-card ${estNouveau ? 'match-nouveau' : ''}" data-type="${match.type}">
                <div class="live-match-header">
                    <span class="live-match-phase ${phaseClass}">${phaseLabel}</span>
                    <span class="live-match-date">${heureStr}</span>
                    ${estNouveau ? '<span class="badge-nouveau">NOUVEAU</span>' : ''}
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
    
    console.log(`Matchs d'aujourd'hui affiches: ${matchsFiltres.length}`);
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

// Ancienne fonction remplacée - redirige vers la nouvelle
function afficherTableauCNF3Complet() {
    afficherTableauCNF3();
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

// ============================================
// CALCULATEUR AVANCE DE FLECHETTES
// A ajouter dans app.js
// ============================================

// Configuration de la partie
let config = {
    nbJoueurs: 1,
    scoreDepart: 501,
    finishType: 'double' // 'double' ou 'simple'
};

// Joueurs
let joueursnom = [];
let joueurActifIndex = 0;

// Volée en cours
let voleeEnCours = {
    fleches: [],
    multiplicateur: 1
};

// Tables de finish optimales
const finishsDoubles = {
    170: ['T20', 'T20', 'D25'],
    167: ['T20', 'T19', 'D25'],
    164: ['T20', 'T18', 'D25'],
    161: ['T20', 'T17', 'D25'],
    160: ['T20', 'T20', 'D20'],
    158: ['T20', 'T20', 'D19'],
    157: ['T20', 'T19', 'D20'],
    156: ['T20', 'T20', 'D18'],
    155: ['T20', 'T19', 'D19'],
    154: ['T20', 'T18', 'D20'],
    153: ['T20', 'T19', 'D18'],
    152: ['T20', 'T20', 'D16'],
    151: ['T20', 'T17', 'D20'],
    150: ['T20', 'T18', 'D18'],
    149: ['T20', 'T19', 'D16'],
    148: ['T20', 'T16', 'D20'],
    147: ['T20', 'T17', 'D18'],
    146: ['T20', 'T18', 'D16'],
    145: ['T20', 'T15', 'D20'],
    144: ['T20', 'T20', 'D12'],
    143: ['T20', 'T17', 'D16'],
    142: ['T20', 'T14', 'D20'],
    141: ['T20', 'T19', 'D12'],
    140: ['T20', 'T20', 'D10'],
    139: ['T20', 'T13', 'D20'],
    138: ['T20', 'T18', 'D12'],
    137: ['T20', 'T19', 'D10'],
    136: ['T20', 'T20', 'D8'],
    135: ['T20', 'T17', 'D12'],
    134: ['T20', 'T14', 'D16'],
    133: ['T20', 'T19', 'D8'],
    132: ['T20', 'T16', 'D12'],
    131: ['T20', 'T13', 'D16'],
    130: ['T20', 'T18', 'D8'],
    129: ['T19', 'T16', 'D12'],
    128: ['T18', 'T14', 'D16'],
    127: ['T20', 'T17', 'D8'],
    126: ['T19', 'T19', 'D6'],
    125: ['T20', 'T15', 'D10'],
    124: ['T20', 'T16', 'D8'],
    123: ['T19', 'T16', 'D9'],
    122: ['T18', 'T18', 'D7'],
    121: ['T20', 'T11', 'D14'],
    120: ['T20', 'S20', 'D20'],
    119: ['T19', 'T12', 'D13'],
    118: ['T20', 'S18', 'D20'],
    117: ['T20', 'S17', 'D20'],
    116: ['T20', 'S16', 'D20'],
    115: ['T20', 'S15', 'D20'],
    114: ['T20', 'S14', 'D20'],
    113: ['T20', 'S13', 'D20'],
    112: ['T20', 'S12', 'D20'],
    111: ['T20', 'S19', 'D16'],
    110: ['T20', 'S10', 'D20'],
    109: ['T20', 'S9', 'D20'],
    108: ['T20', 'S16', 'D16'],
    107: ['T19', 'S10', 'D20'],
    106: ['T20', 'S10', 'D18'],
    105: ['T20', 'S5', 'D20'],
    104: ['T18', 'S10', 'D20'],
    103: ['T20', 'S3', 'D20'],
    102: ['T20', 'S10', 'D16'],
    101: ['T20', 'S1', 'D20'],
    100: ['T20', 'D20'],
    98: ['T20', 'D19'],
    96: ['T20', 'D18'],
    94: ['T18', 'D20'],
    92: ['T20', 'D16'],
    90: ['T18', 'D18'],
    88: ['T16', 'D20'],
    86: ['T18', 'D16'],
    84: ['T20', 'D12'],
    82: ['D25', 'D16'],
    80: ['T20', 'D10'],
    78: ['T18', 'D12'],
    76: ['T20', 'D8'],
    74: ['T14', 'D16'],
    72: ['T16', 'D12'],
    70: ['T10', 'D20'],
    68: ['T20', 'D4'],
    66: ['T10', 'D18'],
    64: ['T16', 'D8'],
    62: ['T10', 'D16'],
    60: ['S20', 'D20'],
    58: ['S18', 'D20'],
    56: ['T16', 'D4'],
    54: ['S14', 'D20'],
    52: ['S12', 'D20'],
    50: ['S10', 'D20'],
    48: ['S8', 'D20'],
    46: ['S6', 'D20'],
    44: ['S12', 'D16'],
    42: ['S10', 'D16'],
    40: ['D20'],
    38: ['D19'],
    36: ['D18'],
    34: ['D17'],
    32: ['D16'],
    30: ['D15'],
    28: ['D14'],
    26: ['D13'],
    24: ['D12'],
    22: ['D11'],
    20: ['D10'],
    18: ['D9'],
    16: ['D8'],
    14: ['D7'],
    12: ['D6'],
    10: ['D5'],
    8: ['D4'],
    6: ['D3'],
    4: ['D2'],
    2: ['D1']
};

// Finishs optimaux pour Simple Out (pas besoin de double)
const finishsSimples = {
    180: ['T20', 'T20', 'T20'],
    177: ['T20', 'T19', 'T20'],
    174: ['T20', 'T18', 'T20'],
    171: ['T20', 'T19', 'T18'],
    170: ['T20', 'T20', 'S10'],
    168: ['T20', 'T20', 'T16'],
    167: ['T20', 'T19', 'S10'],
    166: ['T20', 'T20', 'S6'],
    165: ['T20', 'T19', 'S8'],
    164: ['T20', 'T20', 'S4'],
    163: ['T20', 'T19', 'S6'],
    162: ['T20', 'T20', 'S2'],
    161: ['T20', 'T19', 'S4'],
    160: ['T20', 'T20', 'T20'],
    159: ['T20', 'T19', 'S2'],
    158: ['T20', 'T19', 'T20'],
    157: ['T20', 'T19', 'T20'],
    156: ['T20', 'T20', 'T12'],
    155: ['T20', 'T19', 'T18'],
    154: ['T20', 'T18', 'T18'],
    153: ['T20', 'T19', 'T16'],
    152: ['T20', 'T20', 'T12'],
    151: ['T20', 'T17', 'T20'],
    150: ['T20', 'T18', 'T18'],
    149: ['T20', 'T19', 'T10'],
    148: ['T20', 'T20', 'S8'],
    147: ['T20', 'T19', 'T10'],
    146: ['T20', 'T18', 'T10'],
    145: ['T20', 'T19', 'S8'],
    144: ['T20', 'T20', 'S4'],
    143: ['T20', 'T19', 'S6'],
    142: ['T20', 'T20', 'S2'],
    141: ['T20', 'T19', 'S4'],
    140: ['T20', 'T20', 'T20'],
    139: ['T20', 'T19', 'S2'],
    138: ['T20', 'T19', 'T20'],
    137: ['T19', 'T20', 'T20'],
    136: ['T20', 'T20', 'S16'],
    135: ['T20', 'T19', 'T18'],
    134: ['T20', 'T18', 'T18'],
    133: ['T20', 'T19', 'S16'],
    132: ['T20', 'T20', 'S12'],
    131: ['T20', 'T17', 'T20'],
    130: ['T20', 'T20', 'S10'],
    129: ['T19', 'T20', 'S12'],
    128: ['T20', 'T18', 'S10'],
    127: ['T20', 'T17', 'S10'],
    126: ['T19', 'T19', 'S12'],
    125: ['T20', 'S25', 'T20'],
    124: ['T20', 'T16', 'S8'],
    123: ['T19', 'T18', 'S12'],
    122: ['T20', 'T18', 'S8'],
    121: ['T20', 'T17', 'S10'],
    120: ['T20', 'S20', 'T20'],
    119: ['T19', 'T20', 'S2'],
    118: ['T20', 'S18', 'T20'],
    117: ['T20', 'S17', 'T20'],
    116: ['T20', 'S16', 'T20'],
    115: ['T20', 'S15', 'T20'],
    114: ['T20', 'S14', 'T20'],
    113: ['T20', 'S13', 'T20'],
    112: ['T20', 'S12', 'T20'],
    111: ['T20', 'S11', 'T20'],
    110: ['T20', 'S10', 'T20'],
    109: ['T20', 'S9', 'T20'],
    108: ['T20', 'S8', 'T20'],
    107: ['T20', 'S7', 'T20'],
    106: ['T20', 'S6', 'T20'],
    105: ['T20', 'S5', 'T20'],
    104: ['T20', 'S4', 'T20'],
    103: ['T20', 'S3', 'T20'],
    102: ['T20', 'S2', 'T20'],
    101: ['T20', 'S1', 'T20'],
    100: ['T20', 'T20'],
    99: ['T19', 'T20'],
    98: ['T20', 'S18', 'S20'],
    97: ['T19', 'S20', 'S20'],
    96: ['T20', 'T12'],
    95: ['T19', 'S18', 'S20'],
    94: ['T18', 'S20', 'S20'],
    93: ['T19', 'T12'],
    92: ['T20', 'S12', 'S20'],
    91: ['T17', 'S20', 'S20'],
    90: ['T20', 'T10'],
    89: ['T19', 'S12', 'S20'],
    88: ['T20', 'S8', 'S20'],
    87: ['T17', 'T12'],
    86: ['T18', 'S12', 'S20'],
    85: ['T15', 'S20', 'S20'],
    84: ['T20', 'S12', 'S12'],
    83: ['T17', 'S12', 'S20'],
    82: ['T20', 'S11', 'S11'],
    81: ['T19', 'S12', 'S12'],
    80: ['T20', 'S20'],
    79: ['T19', 'S11', 'S11'],
    78: ['T18', 'S12', 'S12'],
    77: ['T19', 'S20'],
    76: ['T20', 'S16'],
    75: ['T15', 'S15', 'S15'],
    74: ['T14', 'S16', 'S16'],
    73: ['T19', 'S16'],
    72: ['T20', 'S12'],
    71: ['T13', 'S16', 'S16'],
    70: ['T20', 'S10'],
    69: ['T19', 'S12'],
    68: ['T20', 'S8'],
    67: ['T17', 'S16'],
    66: ['T10', 'S18', 'S18'],
    65: ['T15', 'S20'],
    64: ['T16', 'S16'],
    63: ['T13', 'S12', 'S12'],
    62: ['T10', 'S16', 'S16'],
    61: ['T15', 'S16'],
    60: ['T20'],
    59: ['S19', 'S20', 'S20'],
    58: ['S18', 'S20', 'S20'],
    57: ['T19'],
    56: ['S16', 'S20', 'S20'],
    55: ['S15', 'S20', 'S20'],
    54: ['T18'],
    53: ['S13', 'S20', 'S20'],
    52: ['S12', 'S20', 'S20'],
    51: ['T17'],
    50: ['S10', 'S20', 'S20'],
    49: ['S9', 'S20', 'S20'],
    48: ['T16'],
    47: ['S7', 'S20', 'S20'],
    46: ['S6', 'S20', 'S20'],
    45: ['T15'],
    44: ['S4', 'S20', 'S20'],
    43: ['S3', 'S20', 'S20'],
    42: ['T14'],
    41: ['S1', 'S20', 'S20'],
    40: ['S20', 'S20'],
    39: ['T13'],
    38: ['S18', 'S20'],
    37: ['S17', 'S20'],
    36: ['T12'],
    35: ['S15', 'S20'],
    34: ['S14', 'S20'],
    33: ['T11'],
    32: ['S12', 'S20'],
    31: ['S11', 'S20'],
    30: ['T10'],
    29: ['S9', 'S20'],
    28: ['S8', 'S20'],
    27: ['T9'],
    26: ['S6', 'S20'],
    25: ['S25'],
    24: ['T8'],
    23: ['S3', 'S20'],
    22: ['S2', 'S20'],
    21: ['T7'],
    20: ['S20'],
    19: ['S19'],
    18: ['T6'],
    17: ['S17'],
    16: ['S16'],
    15: ['T5'],
    14: ['S14'],
    13: ['S13'],
    12: ['T4'],
    11: ['S11'],
    10: ['S10'],
    9: ['T3'],
    8: ['S8'],
    7: ['S7'],
    6: ['T2'],
    5: ['S5'],
    4: ['S4'],
    3: ['T1'],
    2: ['S2'],
    1: ['S1']
};

// ============================================
// INITIALISATION
// ============================================

function initialiserCalculateur() {
    creerJoueurs(config.nbJoueurs);
    afficherJoueurs();
    afficherJoueurActif();
    verifierSuggestionFinish();
}

function creerJoueurs(nb) {
    joueursnom = [];
    for (let i = 0; i < nb; i++) {
        joueursnom.push({
            nom: `Joueur ${i + 1}`,
            score: config.scoreDepart,
            historique: [],
            stats: {
                moyenne: 0,
                meilleure: 0,
                vollees: 0
            }
        });
    }
    joueurActifIndex = 0;
}

function afficherJoueurs() {
    const container = document.getElementById('zone-joueurs');
    
    container.innerHTML = joueursnom.map((joueur, index) => `
        <div class="joueur-card ${index === joueurActifIndex ? 'actif' : ''}">
            <div class="joueur-header">
                <span class="joueur-nom">${joueur.nom}</span>
                ${index === joueurActifIndex ? '<span class="badge-actif">En jeu</span>' : ''}
            </div>
            <div class="joueur-score">${joueur.score}</div>
            <div class="joueur-stats-mini">
                <span>Moy: ${joueur.stats.moyenne}</span>
                <span>Volées: ${joueur.stats.vollees}</span>
            </div>
        </div>
    `).join('');
}

// ============================================
// CONFIGURATION
// ============================================

function changerFinishType(type) {
    config.finishType = type;
    document.querySelectorAll('.finish-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-finish="${type}"]`).classList.add('active');
    verifierSuggestionFinish();
}

function changerNbJoueurs(nb) {
    config.nbJoueurs = nb;
    document.querySelectorAll('.player-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-players="${nb}"]`).classList.add('active');
    nouvellePartie();
}

function changerScoreDepart() {
    config.scoreDepart = parseInt(document.getElementById('score-depart').value);
    nouvellePartie();
}

function nouvellePartie() {
    if (joueursnom.length > 0 && joueursnom[0].historique.length > 0) {
        if (!confirm('Voulez-vous vraiment recommencer une nouvelle partie ?')) {
            return;
        }
    }
    
    initialiserCalculateur();
    resetVoleeEnCours();
}

// ============================================
// SAISIE DES SCORES
// ============================================

function selectionnerMultiplicateur(mult) {
    voleeEnCours.multiplicateur = mult;
    document.querySelectorAll('.mult-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-mult="${mult}"]`).classList.add('active');
}

function ajouterScore(base) {
    if (voleeEnCours.fleches.length >= 3) {
        return;
    }
    
    const mult = voleeEnCours.multiplicateur;
    const score = base * mult;
    
    // Vérifier validité
    if (!verifierScoreValide(base, mult)) {
        alert('Score invalide ! Le bull en triple n\'existe pas.');
        return;
    }
    
    // Ajouter la flèche
    voleeEnCours.fleches.push({
        base: base,
        multiplicateur: mult,
        score: score
    });
    
    afficherVoleeEnCours();
    verifierBoutonValider();
    
    // Reset multiplicateur à simple après chaque flèche
    selectionnerMultiplicateur(1);
}

function verifierScoreValide(base, mult) {
    // Le bull (25) ne peut être que simple ou double, pas triple
    if (base === 25 && mult === 3) {
        return false;
    }
    return true;
}

function annulerDernierScore() {
    if (voleeEnCours.fleches.length > 0) {
        voleeEnCours.fleches.pop();
        afficherVoleeEnCours();
        verifierBoutonValider();
    }
}

function afficherVoleeEnCours() {
    const fleches = voleeEnCours.fleches;
    
    // Afficher les flèches
    for (let i = 0; i < 3; i++) {
        const display = document.getElementById(`fleche-display-${i + 1}`);
        if (fleches[i]) {
            const f = fleches[i];
            let label = '';
            if (f.multiplicateur === 2) label = 'D';
            if (f.multiplicateur === 3) label = 'T';
            if (f.multiplicateur === 1) label = 'S';
            display.textContent = `${label}${f.base}`;
            display.classList.add('filled');
        } else {
            display.textContent = '-';
            display.classList.remove('filled');
        }
    }
    
    // Total de la volée
    const total = fleches.reduce((sum, f) => sum + f.score, 0);
    document.getElementById('volee-total').textContent = total;
    
    // Numéro de flèche actuelle
    document.getElementById('fleche-num').textContent = fleches.length + 1;
    
    // Valeur de la prochaine flèche
    if (fleches.length < 3) {
        const mult = voleeEnCours.multiplicateur;
        let label = mult === 1 ? 'S' : (mult === 2 ? 'D' : 'T');
        document.getElementById('fleche-value').textContent = `${label}?`;
    } else {
        document.getElementById('fleche-value').textContent = 'Complet';
    }
}

function verifierBoutonValider() {
    const btn = document.getElementById('btn-valider');
    // On peut valider dès qu'il y a au moins une flèche
    if (voleeEnCours.fleches.length > 0) {
        btn.disabled = false;
    } else {
        btn.disabled = true;
    }
}

function resetVoleeEnCours() {
    voleeEnCours = {
        fleches: [],
        multiplicateur: 1
    };
    selectionnerMultiplicateur(1);
    afficherVoleeEnCours();
    verifierBoutonValider();
}

// ============================================
// VALIDATION ET TOUR
// ============================================

function validerVolee() {
    const joueur = joueursnom[joueurActifIndex];
    const fleches = voleeEnCours.fleches;
    const total = fleches.reduce((sum, f) => sum + f.score, 0);
    
    // Vérifier si le score reste >= 0
    const nouveauScore = joueur.score - total;
    if (nouveauScore < 0) {
        alert('Bust ! Score impossible. Le score ne peut pas être négatif.');
        return;
    }
    
    // Vérifier la règle du finish
    if (nouveauScore === 0) {
        const derniereF = fleches[fleches.length - 1];
        
        if (config.finishType === 'double' && derniereF.multiplicateur !== 2) {
            alert('Bust ! Vous devez finir sur un double.');
            return;
        }
        
        // Victoire !
        joueur.score = 0;
        enregistrerVolee(joueur, fleches, total);
        afficherVictoire(joueur);
        return;
    }
    
    // Vérifier qu'on ne reste pas sur 1 (impossible de finir)
    if (nouveauScore === 1 && config.finishType === 'double') {
        alert('Bust ! Vous ne pouvez pas rester sur 1 point.');
        return;
    }
    
    // Mise à jour du score
    joueur.score = nouveauScore;
    enregistrerVolee(joueur, fleches, total);
    
    // Passer au joueur suivant
    passerAuJoueurSuivant();
}

function passerTour() {
    if (voleeEnCours.fleches.length > 0) {
        if (!confirm('Voulez-vous vraiment passer votre tour ? Les flèches saisies seront perdues.')) {
            return;
        }
    }
    passerAuJoueurSuivant();
}

function passerAuJoueurSuivant() {
    resetVoleeEnCours();
    joueurActifIndex = (joueurActifIndex + 1) % joueursnom.length;
    afficherJoueurs();
    afficherJoueurActif();
    verifierSuggestionFinish();
}

function enregistrerVolee(joueur, fleches, total) {
    joueur.historique.push({
        fleches: fleches.map(f => ({ ...f })),
        total: total,
        reste: joueur.score
    });
    
    // Mettre à jour les stats
    const totalFleches = joueur.historique.reduce((sum, v) => sum + v.fleches.length, 0);
    const totalPoints = joueur.historique.reduce((sum, v) => sum + v.total, 0);
    joueur.stats.moyenne = totalFleches > 0 ? (totalPoints / totalFleches * 3).toFixed(1) : 0;
    joueur.stats.meilleure = Math.max(...joueur.historique.map(v => v.total), 0);
    joueur.stats.vollees = joueur.historique.length;
}

// ============================================
// AFFICHAGE DU JOUEUR ACTIF
// ============================================

function afficherJoueurActif() {
    const joueur = joueursnom[joueurActifIndex];
    
    document.querySelector('.joueur-nom').textContent = joueur.nom;
    document.getElementById('score-actuel').textContent = joueur.score;
    
    // Historique
    afficherHistoriqueJoueur(joueur);
    
    // Stats rapides
    document.getElementById('stat-moyenne').textContent = joueur.stats.moyenne;
    document.getElementById('stat-meilleure').textContent = joueur.stats.meilleure;
    document.getElementById('stat-vollees').textContent = joueur.stats.vollees;
}

function afficherHistoriqueJoueur(joueur) {
    const container = document.getElementById('historique-actif');
    
    if (joueur.historique.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--gray);">Aucune volée</p>';
        return;
    }
    
    container.innerHTML = joueur.historique.map((v, index) => {
        const flechesText = v.fleches.map(f => {
            let label = f.multiplicateur === 1 ? 'S' : (f.multiplicateur === 2 ? 'D' : 'T');
            return `${label}${f.base}`;
        }).join(' + ');
        
        return `
            <div class="historique-item-calc">
                <div class="vol-num">#${index + 1}</div>
                <div class="vol-detail">${flechesText} = ${v.total}</div>
                <div class="vol-reste">Reste: ${v.reste}</div>
            </div>
        `;
    }).reverse().join('');
}

// ============================================
// SUGGESTION DE FINISH
// ============================================

function verifierSuggestionFinish() {
    const joueur = joueursnom[joueurActifIndex];
    const score = joueur.score;
    
    const suggestionDiv = document.getElementById('suggestion-finish');
    const content = document.getElementById('suggestion-content');
    
    let finish = null;
    let maxScore = 0;
    
    // Déterminer la base de données et le score max selon le type de finish
    if (config.finishType === 'double') {
        finish = finishsDoubles[score];
        maxScore = 170;
    } else {
        finish = finishsSimples[score];
        maxScore = 180;
    }
    
    // Vérifier si un finish est possible
    if (finish && score <= maxScore) {
        content.innerHTML = `
            <div class="finish-suggestion">
                ${finish.map(f => `<span class="finish-dart">${f}</span>`).join('<i class="fas fa-arrow-right"></i>')}
            </div>
            <div class="finish-info">
                Score: ${score} points - Finish en ${finish.length} fléchette${finish.length > 1 ? 's' : ''}
                ${config.finishType === 'simple' ? ' (Simple Out)' : ' (Double Out)'}
            </div>
        `;
        suggestionDiv.style.display = 'block';
    } else {
        suggestionDiv.style.display = 'none';
    }
}

// ============================================
// VICTOIRE ET STATISTIQUES
// ============================================

function afficherVictoire(joueur) {
    const modal = document.getElementById('modal-victoire');
    const titre = document.getElementById('victoire-titre');
    const stats = document.getElementById('victoire-stats');
    
    titre.textContent = `🏆 ${joueur.nom} a gagné !`;
    
    stats.innerHTML = `
        <div class="victoire-stat">
            <span class="label">Moyenne par volée</span>
            <span class="value">${joueur.stats.moyenne}</span>
        </div>
        <div class="victoire-stat">
            <span class="label">Meilleure volée</span>
            <span class="value">${joueur.stats.meilleure}</span>
        </div>
        <div class="victoire-stat">
            <span class="label">Nombre de volées</span>
            <span class="value">${joueur.stats.vollees}</span>
        </div>
    `;
    
    modal.style.display = 'flex';
}

function fermerVictoire() {
    document.getElementById('modal-victoire').style.display = 'none';
    nouvellePartie();
}

function afficherStatistiques() {
    const modal = document.getElementById('modal-stats');
    const content = document.getElementById('stats-detaillees');
    
    content.innerHTML = joueursnom.map((joueur, index) => `
        <div class="stats-joueur">
            <h3>${joueur.nom}</h3>
            <div class="stats-grid">
                <div class="stat-detail">
                    <span class="label">Score restant</span>
                    <span class="value">${joueur.score}</span>
                </div>
                <div class="stat-detail">
                    <span class="label">Moyenne</span>
                    <span class="value">${joueur.stats.moyenne}</span>
                </div>
                <div class="stat-detail">
                    <span class="label">Meilleure volée</span>
                    <span class="value">${joueur.stats.meilleure}</span>
                </div>
                <div class="stat-detail">
                    <span class="label">Volées jouées</span>
                    <span class="value">${joueur.stats.vollees}</span>
                </div>
            </div>
        </div>
    `).join('');
    
    modal.style.display = 'flex';
}

function fermerStats() {
    document.getElementById('modal-stats').style.display = 'none';
}

// ============================================
// INITIALISATION AU CHARGEMENT
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialiser quand on arrive sur la page calculateur
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (link.dataset.page === 'calculateur') {
                if (joueursnom.length === 0) {
                    initialiserCalculateur();
                }
            }
        });
    });
});