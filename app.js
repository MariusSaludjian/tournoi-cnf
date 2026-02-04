// Configuration et variables globales
let joueurs = [];
let matchs = [];
let statsGlobales = {};

// Charger les données au démarrage
async function chargerDonnees() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        
        joueurs = data.joueurs;
        matchs = data.matchs;
        statsGlobales = data.stats_globales;
        
        initialiserSite();
    } catch (error) {
        console.error('Erreur chargement données:', error);
    }
}

// Initialiser le site
function initialiserSite() {
    afficherStatsGlobales();
    afficherTopJoueurs();
    afficherDerniersMatchs();
    afficherTousJoueurs();
    afficherTousMatchs();
    afficherClassement();
    initialiserPredictions();
    initialiserComparateur();
    initialiserNavigation();
    initialiserRecherche();
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
                    <div class="player-stat-value">${joueur.ratio_sets}</div>
                    <div class="player-stat-label">Ratio</div>
                </div>
            </div>
        </div>
    `).join('');
}

// Afficher les derniers matchs
function afficherDerniersMatchs() {
    const container = document.getElementById('recent-matches');
    const derniersMatchs = [...matchs].slice(-8).reverse();
    
    container.innerHTML = derniersMatchs.map(match => `
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
    `).join('');
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
    
    container.innerHTML = joueursAffiches.map(joueur => `
        <div class="player-card" onclick="afficherProfilJoueur('${joueur.nom}')">
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
                    <div class="player-stat-value">${joueur.ratio_sets}</div>
                    <div class="player-stat-label">Ratio</div>
                </div>
            </div>
        </div>
    `).join('');
}

// Afficher tous les matchs
function afficherTousMatchs(filtreTournoi = '', filtrePhase = '') {
    const container = document.getElementById('matches-list');
    
    let matchsAffiches = [...matchs];
    
    // Filtrer
    if (filtreTournoi) {
        matchsAffiches = matchsAffiches.filter(m => m.tournoi === filtreTournoi);
    }
    if (filtrePhase) {
        matchsAffiches = matchsAffiches.filter(m => m.phase === filtrePhase);
    }
    
    // Inverser pour avoir les plus récents en premier
    matchsAffiches.reverse();
    
    container.innerHTML = matchsAffiches.map(match => `
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
                <div style="font-size: 0.8rem; margin-top: 0.3rem;">${match.date}</div>
            </div>
        </div>
    `).join('');
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
                <td>${joueur.ratio_sets}</td>
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
    
    content.innerHTML = `
        <h2 style="font-family: 'Bebas Neue', sans-serif; font-size: 3rem; color: var(--primary); margin-bottom: 2rem; text-align: center;">
            ${joueur.nom}
        </h2>
        
        <div style="text-align: center; margin-bottom: 2rem;">
            <div style="display: inline-block; background: linear-gradient(135deg, var(--dark) 0%, var(--dark-light) 100%); padding: 1.5rem 3rem; border-radius: 12px; border: 2px solid var(--primary);">
                <div style="font-size: 0.9rem; color: var(--gray); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 0.5rem;">Classement ELO</div>
                <div style="font-family: 'Bebas Neue', sans-serif; font-size: 4rem; color: var(--accent); line-height: 1;">
                    ${Math.round(joueur.elo)}
                </div>
                <div style="font-size: 0.8rem; color: var(--gray); margin-top: 0.5rem;">
                    Max: ${Math.round(joueur.elo_max)} | Min: ${Math.round(joueur.elo_min)}
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
                <div class="player-stat-value">${joueur.ratio_sets}</div>
                <div class="player-stat-label">Ratio sets</div>
            </div>
            <div class="player-stat" style="background: var(--dark); padding: 1.5rem; border-radius: 8px;">
                <div class="player-stat-value">${joueur.matchs_joues}</div>
                <div class="player-stat-label">Matchs joués</div>
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
