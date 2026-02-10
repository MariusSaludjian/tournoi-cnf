#!/usr/bin/env python3
"""
Script unifié pour gérer les matchs CNF (Simples et Doubles/CNF3)
✨ AVEC MISE À JOUR DE LA FORME RÉCENTE ✨
Usage: python ajouter_match.py
"""

import json
from datetime import datetime

# ============================================
# CONFIGURATION
# ============================================
K_FACTOR_SIMPLE = 32
K_FACTOR_DOUBLE = 24  # 32 * 0.75 (Impact réduit pour les doubles)

# Importance de la phase (Multiplicateur de K)
PHASE_MULTIPLIERS = {
    "Poules": 1.0,
    "32èmes": 1.2,
    "16èmes": 1.4,
    "8èmes":  1.6,
    "Quarts": 1.8,
    "Demis":  2.2,
    "Finale": 3.0,
    "Tableau": 1.5 # Par défaut si phase non reconnue
}

def charger_donnees():
    """Charge les données depuis data.json"""
    try:
        with open('data.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print("❌ Fichier data.json non trouvé !")
        return None

def sauvegarder_donnees(data):
    """Sauvegarde les données dans data.json"""
    with open('data.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def sauvegarder_stats(data):
    with open("data.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    # Calcul simple demandé
    nb_joueurs = len(data["joueurs"])
    nb_matchs_simples = len(data["matchs"])
    nb_matchs_doubles = len(data.get("matchs_cnf3", []))

    total_matchs = nb_matchs_simples + nb_matchs_doubles

    # Total sets (optionnel mais cohérent avec ton JSON)
    total_sets = 0
    for m in data["matchs"]:
        total_sets += m.get("score1", 0) + m.get("score2", 0)

    for m in data.get("matchs_cnf3", []):
        total_sets += m.get("score1", 0) + m.get("score2", 0)

    # Mise à jour JSON
    data["derniere_maj"] = datetime.now().strftime("%Y-%m-%d")

    data["stats_globales"] = {
        "total_joueurs": nb_joueurs,
        "total_matchs": total_matchs,
        "total_sets": total_sets
    }

    # Sauvegarde
    with open("data.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)



# ============================================
# LOGIQUE ELO & STATS
# ============================================

def calculer_nouveau_elo_complexe(elo_joueur, elo_adversaire, s_gagnes, s_perdus, phase, type_match="simple"):
    """
    Formule : Change = K * PhaseMult * ScoreMult * (Résultat - Proba)
    """
    est_victoire = s_gagnes > s_perdus
    score_reel = 1.0 if est_victoire else 0.0
    
    # 1. Probabilité attendue
    probabilite = 1.0 / (1.0 + 10.0 ** ((elo_adversaire - elo_joueur) / 400.0))
    
    # 2. Multiplicateur de Phase
    # On cherche dans le dictionnaire, sinon 1.0 par défaut
    phase_mult = PHASE_MULTIPLIERS.get(phase, 1.0)
    
    # 3. Multiplicateur de Score (Ratio de sets)
    # Exemple : 2-0 (diff 2) impacte plus que 2-1 (diff 1)
    total_sets = s_gagnes + s_perdus
    if total_sets > 0:
        # Formule : 1 + (différence / total)
        # 2-0 => 1 + (2/2) = 2.0x | 2-1 => 1 + (1/3) = 1.33x
        # On adoucit avec une racine carrée pour ne pas être trop punitif
        diff = abs(s_gagnes - s_perdus)
        score_mult = 1.0 + (diff / total_sets) * 0.5 
    else:
        score_mult = 1.0

    # 4. Facteur K ajusté par le type (Double réduit l'impact individuel)
    k_base = K_FACTOR_SIMPLE if type_match == "simple" else K_FACTOR_DOUBLE * 0.75
    
    # Calcul final
    changement = k_base * phase_mult * score_mult * (score_reel - probabilite)
    nouveau_elo = elo_joueur + changement
    
    return round(nouveau_elo, 1), changement

def mettre_a_jour_joueur_stats(joueur_data, sets_gagnes, sets_perdus, tournoi, nouveau_elo):
    est_victoire = sets_gagnes > sets_perdus
    joueur_data['matchs_joues'] += 1
    joueur_data['sets_gagnes'] += sets_gagnes
    joueur_data['sets_perdus'] += sets_perdus
    
    if est_victoire:
        joueur_data['victoires'] += 1
    else:
        joueur_data['defaites'] += 1
        
    if tournoi not in joueur_data.get('tournois', []):
        joueur_data.setdefault('tournois', []).append(tournoi)
    
    # Forme récente
    joueur_data.setdefault('forme_recente', [])
    joueur_data['forme_recente'].append('V' if est_victoire else 'D')
    joueur_data['forme_recente'] = joueur_data['forme_recente'][-5:]
        
    # ELO
    joueur_data['elo'] = nouveau_elo
    joueur_data['elo_max'] = max(joueur_data.get('elo_max', 1500), nouveau_elo)
    joueur_data['elo_min'] = min(joueur_data.get('elo_min', 1500), nouveau_elo)
    
    # Ratios
    total = joueur_data['matchs_joues']
    if total > 0:
        joueur_data['pourcentage_victoires'] = round((joueur_data['victoires'] / total) * 100, 1)
        denom = max(joueur_data['sets_perdus'], 1)
        joueur_data['ratio_sets'] = round(joueur_data['sets_gagnes'] / denom, 2)
    
# ============================================
# ✨ MISE À JOUR DE LA FORME RÉCENTE (5 derniers matchs)
# ============================================
    if 'forme_recente' not in joueur_data:
        joueur_data['forme_recente'] = []
    
    # Ajouter le résultat ('V' ou 'D')
    joueur_data['forme_recente'].append('V' if est_victoire else 'D')
    
    # Garder seulement les 5 derniers résultats
    joueur_data['forme_recente'] = joueur_data['forme_recente'][-5:]
    # ============================================
        
    # Mise à jour ELO
    if nouveau_elo is not None:
        joueur_data['elo'] = nouveau_elo
        joueur_data['elo_max'] = max(joueur_data.get('elo_max', 1500), nouveau_elo)
        joueur_data['elo_min'] = min(joueur_data.get('elo_min', 1500), nouveau_elo)
    
    # Recalculer les ratios
    total = joueur_data['matchs_joues']
    if total > 0:
        joueur_data['pourcentage_victoires'] = round((joueur_data['victoires'] / total) * 100, 1)
        denom = max(joueur_data['sets_perdus'], 1)
        joueur_data['ratio_sets'] = round(joueur_data['sets_gagnes'] / denom, 2)

# ============================================
# UTILITAIRES DE RECHERCHE
# ============================================

def trouver_joueur(data, nom):
    for j in data['joueurs']:
        if j['nom'] == nom:
            return j
    return None

def ajouter_nouveau_joueur(data, nom):
    nouveau = {
        "nom": nom,
        "matchs_joues": 0,
        "victoires": 0,
        "defaites": 0,
        "sets_gagnes": 0,
        "sets_perdus": 0,
        "pourcentage_victoires": 0.0,
        "ratio_sets": 0.0,
        "elo": 1500.0,
        "elo_max": 1500.0,
        "elo_min": 1500.0,
        "tournois": [],
        "forme_recente": [],  # ✨ AJOUT : Initialiser la forme
        "photo": "photos/default.jpg"
    }
    data['joueurs'].append(nouveau)
    return nouveau

def choisir_joueur(data, label):
    joueurs = sorted([j['nom'] for j in data['joueurs']])
    print(f"\n👤 {label} :")
    entree = input("  Nom (ou Enter pour voir la liste) : ").strip()
    
    if not entree:
        for i, nom in enumerate(joueurs, 1):
            print(f"  {i:3}. {nom}")
        choix = input("  Numéro ou Nom : ").strip()
    else:
        choix = entree

    if choix.isdigit() and 1 <= int(choix) <= len(joueurs):
        return joueurs[int(choix) - 1]
    
    # Vérification existence
    if choix not in [j['nom'] for j in data['joueurs']]:
        rep = input(f"  ⚠️ '{choix}' inconnu. Créer ce joueur ? (o/n) : ")
        if rep.lower() == 'o':
            ajouter_nouveau_joueur(data, choix)
            return choix
        return None
    return choix

# ============================================
# GESTION MATCH INDIVIDUEL (CNF 1 & 2)
# ============================================

def traiter_match_individuel(data):
    print("\n" + "="*50)
    print("🎾 AJOUT MATCH INDIVIDUEL (CNF 1, CNF 2)")
    print("="*50)

    j1_nom = choisir_joueur(data, "Joueur 1")
    if not j1_nom: return
    j2_nom = choisir_joueur(data, "Joueur 2")
    if not j2_nom: return

    if j1_nom == j2_nom:
        print("❌ Impossible de jouer contre soi-même.")
        return

    try:
        s1 = int(input(f"  Sets {j1_nom} : "))
        s2 = int(input(f"  Sets {j2_nom} : "))
    except ValueError:
        print("❌ Score invalide.")
        return

    # Tournoi et Phase
    print("\n🏆 Tournoi : 1. CNF 1 | 2. CNF 2 | 3. Autre")
    t_choix = input("  Choix : ").strip()
    tournoi = "CNF 1" if t_choix == '1' else "CNF 2" if t_choix == '2' else input("  Nom : ")

    print("\n📅 Phase : 1. Poules | 2. 32èmes | 3. 16èmes | 4. 8èmes | 5. Quarts | 6. Demis | 7. Finale")
    p_map = {'1': 'Poules', '2': '32èmes', '3': '16èmes', '4': '8èmes', '5': 'Quarts', '6': 'Demis', '7': 'Finale'}
    p_choix = input("  Choix : ").strip()
    phase = p_map.get(p_choix, input("  Phase : "))

    date = input("📆 Date (YYYY-MM-DD, défaut auj.) : ").strip() or datetime.now().strftime('%Y-%m-%d')

    # Confirmation
    gagnant_nom = j1_nom if s1 > s2 else j2_nom
    print(f"\n📋 Résumé : {tournoi} - {phase}")
    print(f"   {j1_nom} {s1} - {s2} {j2_nom} (Vainqueur: {gagnant_nom})")
    if input("✅ Confirmer ? (o/n) : ").lower() != 'o': return

    # --- TRAITEMENT ---
    j1_data = trouver_joueur(data, j1_nom)
    j2_data = trouver_joueur(data, j2_nom)

    # Calcul ELO
    elo1_new, diff1 = calculer_nouveau_elo_complexe(j1_data['elo'], j2_data['elo'], s1 > s2, K_FACTOR_SIMPLE)
    elo2_new, diff2 = calculer_nouveau_elo_complexe(j2_data['elo'], j1_data['elo'], s2 > s1, K_FACTOR_SIMPLE)

    # Mise à jour Stats Joueurs (+ FORME)
    mettre_a_jour_joueur_stats(j1_data, s1, s2, s1 > s2, tournoi, elo1_new)
    mettre_a_jour_joueur_stats(j2_data, s2, s1, s2 > s1, tournoi, elo2_new)

    # Ajout du Match
    match = {
        "id": len(data['matchs']) + 1,
        "tournoi": tournoi,
        "phase": phase,
        "date": date,
        "joueur1": j1_nom,
        "joueur2": j2_nom,
        "score1": s1,
        "score2": s2,
        "gagnant": gagnant_nom
    }
    data['matchs'].append(match)

    # Stats globales
    data['stats_globales']['total_matchs'] += 1
    data['stats_globales']['total_sets'] += (s1 + s2)

    sauvegarder_donnees(data)
    sauvegarder_stats(data)

    # ✨ Affichage de la forme mise à jour
    print(f"\n✅ Match ajouté ! ELO: {j1_nom} ({diff1:+.1f}), {j2_nom} ({diff2:+.1f})")
    print(f"📊 Forme {j1_nom}: {' '.join(j1_data.get('forme_recente', []))}")
    print(f"📊 Forme {j2_nom}: {' '.join(j2_data.get('forme_recente', []))}")

# ============================================
# GESTION MATCH DOUBLE (CNF 3)
# ============================================

def afficher_poules_cnf3(data):
    if not data.get('poules_cnf3'): return []
    print("\n🎯 Poules CNF 3 :")
    poules = []
    for i, p in enumerate(data['poules_cnf3'], 1):
        print(f"  {i}. Poule {p.get('numero', i)}")
        poules.append(p)
    return poules

def choisir_equipe(liste_equipes, label):
    print(f"\n🛡️ {label} (Entrez le numéro) :")
    entree = input("  Numéro : ").strip()
    try:
        idx = int(entree) - 1
        if 0 <= idx < len(liste_equipes):
            return liste_equipes[idx]
    except ValueError:
        pass
    print("❌ Sélection invalide")
    return None

def traiter_match_cnf3(data):
    print("\n" + "="*50)
    print("🎯 AJOUT MATCH DOUBLE (CNF 3)")
    print("="*50)

    # 1. Sélection du contexte (Poule ou Tableau)
    print("1. Match de Poule")
    print("2. Tableau Final (32èmes, 16èmes...)")
    mode = input("👉 Choix : ").strip()

    equipe1_data = None
    equipe2_data = None
    info_phase = ""
    num_poule = None

    if mode == '1':
        # Mode Poule
        poules = afficher_poules_cnf3(data)
        if not poules: return
        try:
            p_idx = int(input("📌 Choix Poule : ")) - 1
            poule = poules[p_idx]
            num_poule = poule.get('numero', p_idx + 1)
            info_phase = "Poules"
            
            print(f"\n📋 Équipes Poule {num_poule} :")
            for i, eq in enumerate(poule['equipes'], 1):
                print(f"  {i}. {eq['nom']:25} ({eq['joueur1']} / {eq['joueur2']})")
            
            equipe1_data = choisir_equipe(poule['equipes'], "Équipe 1")
            if not equipe1_data: return
            equipe2_data = choisir_equipe(poule['equipes'], "Équipe 2")
            if not equipe2_data: return

        except (ValueError, IndexError):
            print("❌ Erreur de sélection")
            return

    elif mode == '2':
        # Mode Tableau
        print("\n📅 Phase : 1. 32èmes | 2. 16èmes | 3. 8èmes | 4. Quarts | 5. Demis | 6. Finale")
        p_map = {'1': '32èmes', '2': '16èmes', '3': '8èmes', '4': 'Quarts', '5': 'Demis', '6': 'Finale'}
        info_phase = p_map.get(input("  Choix : "), "Tableau")

        # Affichage simplifié des équipes (toutes les équipes)
        all_teams = sorted(data['equipes'], key=lambda x: x['nom'])
        print("\n📋 Recherche Équipe :")
        rech = input("  Début du nom (ou Enter pour tout voir) : ").lower()
        
        candidats = [e for e in all_teams if rech in e['nom'].lower()] if rech else all_teams
        
        for i, eq in enumerate(candidats, 1):
            print(f"  {i}. {eq['nom']:25} ({eq['joueur1']} / {eq['joueur2']})")
        
        equipe1_data = choisir_equipe(candidats, "Équipe 1")
        if not equipe1_data: return
        
        # Pour l'équipe 2, on réaffiche ou on demande
        equipe2_data = choisir_equipe(candidats, "Équipe 2")
        if not equipe2_data: return
    else:
        return

    if equipe1_data['nom'] == equipe2_data['nom']:
        print("❌ Les équipes doivent être différentes.")
        return

    # 2. Score
    try:
        s1 = int(input(f"  Sets {equipe1_data['nom']} : "))
        s2 = int(input(f"  Sets {equipe2_data['nom']} : "))
    except ValueError:
        return

    date = input("📆 Date (YYYY-MM-DD, défaut auj.) : ").strip() or datetime.now().strftime('%Y-%m-%d')
    gagnant_nom = equipe1_data['nom'] if s1 > s2 else equipe2_data['nom']

    # 3. Confirmation
    print(f"\n📋 Résumé CNF 3 : {info_phase}")
    print(f"   {equipe1_data['nom']} vs {equipe2_data['nom']}")
    print(f"   Score: {s1} - {s2}")
    if input("✅ Confirmer ? (o/n) : ").lower() != 'o': return

    # --- TRAITEMENT ---

    # A. Récupération des 4 joueurs
    j1 = trouver_joueur(data, equipe1_data['joueur1'])
    j2 = trouver_joueur(data, equipe1_data['joueur2'])
    j3 = trouver_joueur(data, equipe2_data['joueur1'])
    j4 = trouver_joueur(data, equipe2_data['joueur2'])

    if not all([j1, j2, j3, j4]):
        print("❌ Erreur critique : Un des joueurs de l'équipe est introuvable dans la base.")
        return

    # B. Calcul ELO (Equipe vs Equipe)
    # ELO Equipe = Moyenne des joueurs
    elo_eq1 = (j1['elo'] + j2['elo']) / 2
    elo_eq2 = (j3['elo'] + j4['elo']) / 2

    # On calcule la variation pour l'équipe 1
    # On utilise K_FACTOR_DOUBLE (24) car c'est du double
    _, delta_eq1 = calculer_nouveau_elo_complexe(elo_eq1, elo_eq2, s1 > s2, K_FACTOR_DOUBLE)
    delta_eq2 = -delta_eq1 # Jeu à somme nulle pour l'ELO échangé

    # C. Mise à jour des stats individuelles (ELO + Victoires/Défaites + Sets + FORME)
    # Note : On applique le delta calculé sur la moyenne à chaque joueur individuellement
    
    # Equipe 1
    mettre_a_jour_joueur_stats(j1, s1, s2, s1 > s2, "CNF 3", j1['elo'] + delta_eq1)
    mettre_a_jour_joueur_stats(j2, s1, s2, s1 > s2, "CNF 3", j2['elo'] + delta_eq1)
    
    # Equipe 2
    mettre_a_jour_joueur_stats(j3, s2, s1, s2 > s1, "CNF 3", j3['elo'] + delta_eq2)
    mettre_a_jour_joueur_stats(j4, s2, s1, s2 > s1, "CNF 3", j4['elo'] + delta_eq2)

    # D. Enregistrement du match dans matchs_cnf3
    if 'matchs_cnf3' not in data: data['matchs_cnf3'] = []
    
    match_obj = {
        "id": len(data['matchs_cnf3']) + 1,
        "type": "poule" if mode == '1' else "tableau",
        "tournoi": "CNF 3",
        "phase": info_phase,
        "date": date,
        "equipe1": equipe1_data['nom'],
        "equipe2": equipe2_data['nom'],
        "joueur1_eq1": j1['nom'],
        "joueur2_eq1": j2['nom'],
        "joueur1_eq2": j3['nom'],
        "joueur2_eq2": j4['nom'],
        "score1": s1,
        "score2": s2,
        "gagnant": gagnant_nom
    }
    
    if num_poule:
        match_obj['poule'] = num_poule

    data['matchs_cnf3'].append(match_obj)

    # E. Mise à jour stats Poule (si mode poule)
    if mode == '1':
        # On doit mettre à jour les objets dans data['poules_cnf3']
        # equipe1_data est une référence à l'objet dans la liste, donc on peut modifier directement
        for eq in [equipe1_data, equipe2_data]:
            if 'matchs_joues' not in eq: 
                eq.update({'matchs_joues':0, 'victoires':0, 'defaites':0, 'sets_pour':0, 'sets_contre':0, 'points':0})
        
        # Stats EQ 1
        equipe1_data['matchs_joues'] += 1
        equipe1_data['sets_pour'] += s1
        equipe1_data['sets_contre'] += s2
        if s1 > s2:
            equipe1_data['victoires'] += 1
            equipe1_data['points'] += 2 # 2 pts la victoire
        else:
            equipe1_data['defaites'] += 1
            
        # Stats EQ 2
        equipe2_data['matchs_joues'] += 1
        equipe2_data['sets_pour'] += s2
        equipe2_data['sets_contre'] += s1
        if s2 > s1:
            equipe2_data['victoires'] += 1
            equipe2_data['points'] += 2
        else:
            equipe2_data['defaites'] += 1
            
        # Retrier la poule (Points > Diff Sets)
        poule_concernee = next(p for p in data['poules_cnf3'] if p.get('numero') == num_poule)
        poule_concernee['equipes'].sort(key=lambda x: (-x.get('points',0), -(x.get('sets_pour',0)-x.get('sets_contre',0))))

    sauvegarder_donnees(data)
    sauvegarder_stats(data)
    
    # ✨ Affichage de la forme mise à jour
    print(f"\n✅ Match CNF 3 enregistré !")
    print(f"📊 Impact ELO : {delta_eq1:+.1f} pts par joueur")
    print(f"📊 Forme {j1['nom']}: {' '.join(j1.get('forme_recente', []))}")
    print(f"📊 Forme {j2['nom']}: {' '.join(j2.get('forme_recente', []))}")
    print(f"📊 Forme {j3['nom']}: {' '.join(j3.get('forme_recente', []))}")
    print(f"📊 Forme {j4['nom']}: {' '.join(j4.get('forme_recente', []))}")

# ============================================
# MENU PRINCIPAL
# ============================================

def menu():
    data = charger_donnees()
    if not data: return

    while True:
        print("\n" + "█"*50)
        print("   GESTIONNAIRE MATCHS CNF")
        print("█"*50)
        print(f"Joueurs: {len(data['joueurs'])} | Matchs Simples: {len(data['matchs'])} | Matchs Doubles: {len(data.get('matchs_cnf3', []))}")
        print("-" * 50)
        print("1. ➕ Ajouter Match Individuel (CNF 1 & 2)")
        print("2. 🎯 Ajouter Match Double (CNF 3)")
        print("3. 📋 Voir Classement ELO")
        print("4. 🚪 Quitter")
        
        choix = input("\n👉 Votre choix : ").strip()

        if choix == '1':
            traiter_match_individuel(data)
        elif choix == '2':
            traiter_match_cnf3(data)
        elif choix == '3':
            joueurs = sorted(data['joueurs'], key=lambda x: x['elo'], reverse=True)
            print("\n🏆 TOP 10 ELO :")
            for i, j in enumerate(joueurs[:10], 1):
                forme = ' '.join(j.get('forme_recente', []))
                print(f"{i}. {j['nom']:20} {j['elo']:.1f}  [{forme}]")
            input("\nAppuyer sur Enter...")
        elif choix == '4':
            print("👋 Bye !")
            break
        else:
            print("❌ Choix invalide")

if __name__ == "__main__":
    try:
        menu()
    except KeyboardInterrupt:
        print("\nArrêt.")
    except Exception as e:
        print(f"\n❌ Erreur: {e}")  