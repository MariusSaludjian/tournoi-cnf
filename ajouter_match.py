#!/usr/bin/env python3
"""
Script UNIFIÉ pour ajouter des matchs (individuels ET doubles CNF 3)
Usage: python ajouter_match.py
"""

import json
from datetime import datetime

# ============================================
# CONFIGURATION ELO
# ============================================

FACTEUR_DOUBLE = 0.75  # Les doubles comptent 75% d'un match individuel

# ============================================
# UTILITAIRES
# ============================================

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

def trouver_joueur(data, nom):
    """Trouve un joueur par son nom"""
    for joueur in data['joueurs']:
        if joueur['nom'] == nom:
            return joueur
    return None

# ============================================
# CALCUL ELO
# ============================================

def calculer_nouveau_elo(elo_joueur, elo_adversaire, victoire, k=32):
    """
    Formule ELO officielle :
    Nouveau ELO = Ancien ELO + K × (Résultat - Probabilité attendue)
    """
    # Probabilité attendue
    probabilite_attendue = 1 / (1 + 10 ** ((elo_adversaire - elo_joueur) / 400))
    
    # Résultat (1 = victoire, 0 = défaite)
    resultat = 1.0 if victoire else 0.0
    
    # Changement
    changement = k * (resultat - probabilite_attendue)
    nouveau_elo = elo_joueur + changement
    
    return round(nouveau_elo, 1), round(changement, 1)

# ============================================
# MISE À JOUR STATS JOUEUR
# ============================================

def mettre_a_jour_stats_joueur(data, joueur_nom, victoire, sets_pour, sets_contre, elo_adversaire, k=32):
    """
    Met à jour TOUTES les stats d'un joueur (matchs, victoires, défaites, sets, ELO)
    Utilisé pour matchs individuels ET doubles
    """
    joueur = trouver_joueur(data, joueur_nom)
    if not joueur:
        print(f"⚠️  Joueur {joueur_nom} non trouvé")
        return
    
    # Matchs
    joueur['matchs_joues'] = joueur.get('matchs_joues', 0) + 1
    
    # Victoires/Défaites
    if victoire:
        joueur['victoires'] = joueur.get('victoires', 0) + 1
    else:
        joueur['defaites'] = joueur.get('defaites', 0) + 1
    
    # Sets
    joueur['sets_gagnes'] = joueur.get('sets_gagnes', 0) + sets_pour
    joueur['sets_perdus'] = joueur.get('sets_perdus', 0) + sets_contre
    
    # Pourcentages
    if joueur['matchs_joues'] > 0:
        joueur['pourcentage_victoires'] = round((joueur['victoires'] / joueur['matchs_joues']) * 100, 1)
    
    if joueur['sets_perdus'] > 0:
        joueur['ratio_sets'] = round(joueur['sets_gagnes'] / joueur['sets_perdus'], 2)
    else:
        joueur['ratio_sets'] = float(joueur['sets_gagnes'])
    
    # ELO avec formule complète
    ancien_elo = joueur.get('elo', 1500.0)
    nouveau_elo, changement = calculer_nouveau_elo(ancien_elo, elo_adversaire, victoire, k)
    
    joueur['elo'] = nouveau_elo
    
    # ELO min/max
    if 'elo_min' not in joueur:
        joueur['elo_min'] = 1500.0
    if 'elo_max' not in joueur:
        joueur['elo_max'] = 1500.0
    
    if nouveau_elo > joueur['elo_max']:
        joueur['elo_max'] = nouveau_elo
    if nouveau_elo < joueur['elo_min']:
        joueur['elo_min'] = nouveau_elo
    
    # Affichage
    emoji = '✅' if victoire else '❌'
    v_d = f"{joueur['victoires']}V-{joueur['defaites']}D"
    sets = f"{joueur['sets_gagnes']}/{joueur['sets_perdus']}"
    signe = "+" if changement >= 0 else ""
    
    print(f"   {emoji} {joueur_nom}:")
    print(f"      Stats: {joueur['matchs_joues']} matchs | {v_d} ({joueur['pourcentage_victoires']}%)")
    print(f"      Sets: {sets} (ratio: {joueur['ratio_sets']})")
    print(f"      ELO: {ancien_elo:.1f} → {nouveau_elo:.1f} ({signe}{changement:.1f})")

# ============================================
# AFFICHAGE
# ============================================

def afficher_joueurs(data):
    """Affiche la liste des joueurs avec ELO"""
    joueurs = sorted([j['nom'] for j in data['joueurs']])
    print("\n📋 Liste des joueurs :")
    for i, nom in enumerate(joueurs, 1):
        joueur = next(j for j in data['joueurs'] if j['nom'] == nom)
        elo = joueur.get('elo', 1500)
        print(f"  {i:2}. {nom:30} (ELO: {elo:.0f})")
    return joueurs

def afficher_equipes(data):
    """Affiche la liste des équipes CNF 3"""
    if 'equipes' not in data or not data['equipes']:
        print("❌ Aucune équipe CNF 3 trouvée !")
        return []
    
    equipes = sorted([e['nom'] for e in data['equipes']])
    print("\n📋 Liste des équipes CNF 3 :")
    for i, nom in enumerate(equipes, 1):
        equipe_data = next(e for e in data['equipes'] if e['nom'] == nom)
        print(f"  {i:2}. {nom:30} ({equipe_data['joueur1']} / {equipe_data['joueur2']})")
    return equipes

def afficher_poules(data):
    """Affiche la liste des poules CNF 3"""
    if 'poules_cnf3' not in data or not data['poules_cnf3']:
        print("❌ Aucune poule CNF 3 trouvée !")
        return []
    
    print("\n🎯 Poules CNF 3 :")
    poules = []
    for i, poule in enumerate(data['poules_cnf3'], 1):
        print(f"  {i}. Poule {poule.get('numero', i)}")
        poules.append(poule)
    return poules

# ============================================
# NOUVEAU JOUEUR
# ============================================

def ajouter_joueur(data, nom):
    """Ajoute un nouveau joueur avec ELO initial de 1500"""
    nouveau_joueur = {
        "nom": nom,
        "matchs_joues": 0,
        "victoires": 0,
        "defaites": 0,
        "sets_gagnes": 0,
        "sets_perdus": 0,
        "points_moyens": 0,
        "pourcentage_victoires": 0,
        "ratio_sets": 0,
        "tournois": [],
        "elo": 1500.0,
        "elo_min": 1500.0,
        "elo_max": 1500.0
    }
    data['joueurs'].append(nouveau_joueur)
    print(f"✅ Joueur '{nom}' ajouté avec ELO initial de 1500 !")

# ============================================
# MATCH INDIVIDUEL
# ============================================

def ajouter_match_individuel(data):
    """Ajoute un match individuel (CNF 1, 2, autre)"""
    print("\n" + "="*80)
    print("🎯 AJOUTER UN MATCH INDIVIDUEL")
    print("="*80)
    
    joueurs_liste = afficher_joueurs(data)
    joueurs_dict = {j['nom']: j for j in data['joueurs']}
    
    # Joueur 1
    print("\n👤 Joueur 1 :")
    joueur1 = input("  Nom (ou numéro) : ").strip()
    if joueur1.isdigit() and 1 <= int(joueur1) <= len(joueurs_liste):
        joueur1 = joueurs_liste[int(joueur1) - 1]
    
    if joueur1 not in joueurs_dict:
        reponse = input(f"  '{joueur1}' n'existe pas. Ajouter ? (o/n) : ")
        if reponse.lower() == 'o':
            ajouter_joueur(data, joueur1)
            joueurs_dict[joueur1] = data['joueurs'][-1]
        else:
            print("❌ Match annulé")
            return
    
    # Joueur 2
    print("\n👤 Joueur 2 :")
    joueur2 = input("  Nom (ou numéro) : ").strip()
    if joueur2.isdigit() and 1 <= int(joueur2) <= len(joueurs_liste):
        joueur2 = joueurs_liste[int(joueur2) - 1]
    
    if joueur2 not in joueurs_dict:
        reponse = input(f"  '{joueur2}' n'existe pas. Ajouter ? (o/n) : ")
        if reponse.lower() == 'o':
            ajouter_joueur(data, joueur2)
            joueurs_dict[joueur2] = data['joueurs'][-1]
        else:
            print("❌ Match annulé")
            return
    
    if joueur1 == joueur2:
        print("❌ Les deux joueurs doivent être différents !")
        return
    
    # Score
    print("\n📊 Score :")
    try:
        score1 = int(input(f"  Sets gagnés par {joueur1} : "))
        score2 = int(input(f"  Sets gagnés par {joueur2} : "))
    except ValueError:
        print("❌ Score invalide !")
        return
    
    # Tournoi
    print("\n🏆 Tournoi :")
    print("  1. CNF 1")
    print("  2. CNF 2")
    print("  3. Autre")
    choix = input("  Choix (1/2/3) : ").strip()
    
    if choix == '1':
        tournoi = 'CNF 1'
    elif choix == '2':
        tournoi = 'CNF 2'
    else:
        tournoi = input("  Nom du tournoi : ").strip()
    
    # Phase
    print("\n📅 Phase :")
    print("  1. Poules")
    print("  2. 32èmes")
    print("  3. 16èmes")
    print("  4. 8èmes")
    print("  5. Quarts")
    print("  6. Demis")
    print("  7. Finale")
    print("  8. Autre")
    choix = input("  Choix (1-8) : ").strip()
    
    phases = {
        '1': 'Poules', '2': '32èmes', '3': '16èmes', '4': '8èmes',
        '5': 'Quarts', '6': 'Demis', '7': 'Finale'
    }
    
    phase = phases.get(choix, input("  Nom de la phase : ").strip())
    
    # Date
    date = input(f"\n📆 Date (YYYY-MM-DD) ou Enter pour aujourd'hui : ").strip()
    if not date:
        date = datetime.now().strftime('%Y-%m-%d')
    
    gagnant = joueur1 if score1 > score2 else joueur2
    
    nouveau_match = {
        "id": len(data['matchs']) + 1,
        "tournoi": tournoi,
        "phase": phase,
        "date": date,
        "joueur1": joueur1,
        "joueur2": joueur2,
        "score1": score1,
        "score2": score2,
        "gagnant": gagnant
    }
    
    # Récapitulatif
    print("\n" + "="*80)
    print("📋 RÉCAPITULATIF")
    print("="*80)
    print(f"🎯 Match individuel #{nouveau_match['id']}")
    print(f"🏆 {tournoi} - {phase}")
    print(f"📅 {date}")
    print(f"👤 {joueur1} vs {joueur2}")
    print(f"📊 Score : {score1} - {score2}")
    print(f"🏅 Gagnant : {gagnant}")
    print("="*80)
    
    confirmer = input("\n✅ Confirmer l'ajout ? (o/n) : ")
    if confirmer.lower() != 'o':
        print("❌ Match annulé")
        return
    
    # Ajouter le match
    data['matchs'].append(nouveau_match)
    
    # Ajouter tournoi aux joueurs
    j1 = joueurs_dict[joueur1]
    j2 = joueurs_dict[joueur2]
    
    if tournoi not in j1.get('tournois', []):
        if 'tournois' not in j1:
            j1['tournois'] = []
        j1['tournois'].append(tournoi)
    if tournoi not in j2.get('tournois', []):
        if 'tournois' not in j2:
            j2['tournois'] = []
        j2['tournois'].append(tournoi)
    
    # Mise à jour stats + ELO
    print("\n🎯 Mise à jour des statistiques complètes :")
    
    elo_j1 = j1.get('elo', 1500.0)
    elo_j2 = j2.get('elo', 1500.0)
    
    mettre_a_jour_stats_joueur(data, joueur1, score1 > score2, score1, score2, elo_j2, k=32)
    mettre_a_jour_stats_joueur(data, joueur2, score2 > score1, score2, score1, elo_j1, k=32)
    
    # Stats globales
    data['stats_globales']['total_matchs'] = len(data['matchs'])
    data['stats_globales']['total_sets'] = sum(m['score1'] + m['score2'] for m in data['matchs'])
    
    sauvegarder_donnees(data)
    print("\n✅ Match individuel ajouté avec succès !")

# ============================================
# MATCH DOUBLE - POULE CNF 3
# ============================================

def ajouter_match_double_poule(data):
    """Ajoute un match de poule CNF 3 - MAJ stats individuelles des 4 joueurs"""
    print("\n" + "="*80)
    print("👥 AJOUTER UN MATCH DE POULE CNF 3 (DOUBLES)")
    print("="*80)
    
    poules = afficher_poules(data)
    if not poules:
        return
    
    # Sélectionner poule
    choix_poule = input("\n📌 Numéro de la poule : ").strip()
    try:
        poule_index = int(choix_poule) - 1
        if not 0 <= poule_index < len(poules):
            print("❌ Numéro invalide !")
            return
    except ValueError:
        print("❌ Numéro invalide !")
        return
    
    poule = poules[poule_index]
    
    print(f"\n📋 Équipes de la Poule {poule.get('numero', poule_index + 1)} :")
    for i, equipe in enumerate(poule['equipes'], 1):
        print(f"  {i}. {equipe['nom']:30} ({equipe['joueur1']} / {equipe['joueur2']})")
    
    # Équipe 1
    try:
        eq1_index = int(input("\n🎯 Équipe 1 (numéro) : ").strip()) - 1
        eq2_index = int(input("🎯 Équipe 2 (numéro) : ").strip()) - 1
        
        if not (0 <= eq1_index < len(poule['equipes']) and 0 <= eq2_index < len(poule['equipes'])):
            print("❌ Numéro invalide !")
            return
        if eq1_index == eq2_index:
            print("❌ Les deux équipes doivent être différentes !")
            return
    except ValueError:
        print("❌ Numéro invalide !")
        return
    
    equipe1 = poule['equipes'][eq1_index]
    equipe2 = poule['equipes'][eq2_index]
    
    # Score
    print(f"\n📊 Score du match {equipe1['nom']} vs {equipe2['nom']} :")
    try:
        score1 = int(input(f"  Sets gagnés par {equipe1['nom']} : "))
        score2 = int(input(f"  Sets gagnés par {equipe2['nom']} : "))
    except ValueError:
        print("❌ Score invalide !")
        return
    
    # Date
    date = input(f"\n📆 Date (YYYY-MM-DD) ou Enter pour aujourd'hui : ").strip()
    if not date:
        date = datetime.now().strftime('%Y-%m-%d')
    
    gagnant = equipe1['nom'] if score1 > score2 else equipe2['nom']
    
    if 'matchs_cnf3' not in data:
        data['matchs_cnf3'] = []
    
    nouveau_match = {
        "id": len(data['matchs_cnf3']) + 1,
        "type": "poule",
        "tournoi": "CNF 3",
        "phase": "Poules",
        "poule": poule.get('numero', poule_index + 1),
        "date": date,
        "equipe1": equipe1['nom'],
        "equipe2": equipe2['nom'],
        "joueur1_eq1": equipe1['joueur1'],
        "joueur2_eq1": equipe1['joueur2'],
        "joueur1_eq2": equipe2['joueur1'],
        "joueur2_eq2": equipe2['joueur2'],
        "score1": score1,
        "score2": score2,
        "gagnant": gagnant
    }
    
    # Récapitulatif
    print("\n" + "="*80)
    print("📋 RÉCAPITULATIF")
    print("="*80)
    print(f"👥 Match de Poule CNF 3 #{nouveau_match['id']}")
    print(f"📌 Poule {poule.get('numero', poule_index + 1)}")
    print(f"📅 {date}")
    print(f"🏆 {equipe1['nom']} ({equipe1['joueur1']} / {equipe1['joueur2']})")
    print(f"   vs")
    print(f"🏆 {equipe2['nom']} ({equipe2['joueur1']} / {equipe2['joueur2']})")
    print(f"📊 Score : {score1} - {score2}")
    print(f"🏅 Gagnant : {gagnant}")
    print("="*80)
    
    confirmer = input("\n✅ Confirmer l'ajout ? (o/n) : ")
    if confirmer.lower() != 'o':
        print("❌ Match annulé")
        return
    
    # === MISE À JOUR STATS INDIVIDUELLES DES 4 JOUEURS ===
    
    print("\n🎯 Mise à jour des statistiques INDIVIDUELLES des 4 joueurs :")
    
    # Calculer ELO moyen de chaque équipe
    j1_eq1 = trouver_joueur(data, equipe1['joueur1'])
    j2_eq1 = trouver_joueur(data, equipe1['joueur2'])
    j1_eq2 = trouver_joueur(data, equipe2['joueur1'])
    j2_eq2 = trouver_joueur(data, equipe2['joueur2'])
    
    elo_equipe1 = (j1_eq1.get('elo', 1500) + j2_eq1.get('elo', 1500)) / 2
    elo_equipe2 = (j1_eq2.get('elo', 1500) + j2_eq2.get('elo', 1500)) / 2
    
    # K ajusté pour doubles (75%)
    k_double = 32 * FACTEUR_DOUBLE
    
    # Ajouter CNF 3 aux tournois
    for nom in [equipe1['joueur1'], equipe1['joueur2'], equipe2['joueur1'], equipe2['joueur2']]:
        joueur = trouver_joueur(data, nom)
        if joueur and 'CNF 3' not in joueur.get('tournois', []):
            if 'tournois' not in joueur:
                joueur['tournois'] = []
            joueur['tournois'].append('CNF 3')
    
    # Mettre à jour les stats individuelles
    if score1 > score2:
        mettre_a_jour_stats_joueur(data, equipe1['joueur1'], True, score1, score2, elo_equipe2, k_double)
        mettre_a_jour_stats_joueur(data, equipe1['joueur2'], True, score1, score2, elo_equipe2, k_double)
        mettre_a_jour_stats_joueur(data, equipe2['joueur1'], False, score2, score1, elo_equipe1, k_double)
        mettre_a_jour_stats_joueur(data, equipe2['joueur2'], False, score2, score1, elo_equipe1, k_double)
    else:
        mettre_a_jour_stats_joueur(data, equipe2['joueur1'], True, score2, score1, elo_equipe1, k_double)
        mettre_a_jour_stats_joueur(data, equipe2['joueur2'], True, score2, score1, elo_equipe1, k_double)
        mettre_a_jour_stats_joueur(data, equipe1['joueur1'], False, score1, score2, elo_equipe2, k_double)
        mettre_a_jour_stats_joueur(data, equipe1['joueur2'], False, score1, score2, elo_equipe2, k_double)
    
    data['matchs_cnf3'].append(nouveau_match)
    
    # Stats de la poule
    for eq in [equipe1, equipe2]:
        if 'matchs_joues' not in eq:
            eq['matchs_joues'] = 0
            eq['victoires'] = 0
            eq['defaites'] = 0
            eq['sets_pour'] = 0
            eq['sets_contre'] = 0
            eq['points'] = 0
    
    equipe1['matchs_joues'] += 1
    equipe2['matchs_joues'] += 1
    equipe1['sets_pour'] += score1
    equipe1['sets_contre'] += score2
    equipe2['sets_pour'] += score2
    equipe2['sets_contre'] += score1
    
    if score1 > score2:
        equipe1['victoires'] += 1
        equipe1['points'] += 2
        equipe2['defaites'] += 1
    else:
        equipe2['victoires'] += 1
        equipe2['points'] += 2
        equipe1['defaites'] += 1
    
    # Trier poule
    poule['equipes'].sort(key=lambda e: (-(e.get('points', 0)), -((e.get('sets_pour', 0)) - (e.get('sets_contre', 0)))))
    
    sauvegarder_donnees(data)
    
    print("\n✅ Match de poule CNF 3 ajouté avec succès !")
    print(f"\n📊 Classement Poule {poule.get('numero', poule_index + 1)} :")
    for i, eq in enumerate(poule['equipes'], 1):
        pts = eq.get('points', 0)
        v = eq.get('victoires', 0)
        d = eq.get('defaites', 0)
        diff = eq.get('sets_pour', 0) - eq.get('sets_contre', 0)
        print(f"  {i}. {eq['nom']:30} - {pts} pts ({v}V-{d}D, diff: {diff:+d})")

# ============================================
# MATCH DOUBLE - TABLEAU FINAL CNF 3
# ============================================

def ajouter_match_double_tableau(data):
    """Ajoute un match du tableau final CNF 3 - MAJ stats individuelles des 4 joueurs"""
    print("\n" + "="*80)
    print("🏆 AJOUTER UN MATCH DU TABLEAU FINAL CNF 3 (DOUBLES)")
    print("="*80)
    
    # Phase
    print("\n📌 Phase :")
    print("  1. 32èmes")
    print("  2. 16èmes")
    print("  3. 8èmes")
    print("  4. Quarts")
    print("  5. Demis")
    print("  6. Finale")
    
    phases = {'1': '32èmes', '2': '16èmes', '3': '8èmes', '4': 'Quarts', '5': 'Demis', '6': 'Finale'}
    choix_phase = input("\nChoix (1-6) : ").strip()
    
    if choix_phase not in phases:
        print("❌ Choix invalide !")
        return
    
    phase = phases[choix_phase]
    
    equipes_liste = afficher_equipes(data)
    if not equipes_liste:
        return
    
    # Équipes
    equipe1_nom = input("\n🎯 Équipe 1 (nom complet) : ").strip()
    equipe1 = next((e for e in data['equipes'] if e['nom'] == equipe1_nom), None)
    
    if not equipe1:
        print(f"❌ Équipe '{equipe1_nom}' non trouvée !")
        return
    
    equipe2_nom = input("🎯 Équipe 2 (nom complet) : ").strip()
    equipe2 = next((e for e in data['equipes'] if e['nom'] == equipe2_nom), None)
    
    if not equipe2:
        print(f"❌ Équipe '{equipe2_nom}' non trouvée !")
        return
    
    if equipe1_nom == equipe2_nom:
        print("❌ Les deux équipes doivent être différentes !")
        return
    
    # Score
    print(f"\n📊 Score du match {equipe1_nom} vs {equipe2_nom} :")
    try:
        score1 = int(input(f"  Sets gagnés par {equipe1_nom} : "))
        score2 = int(input(f"  Sets gagnés par {equipe2_nom} : "))
    except ValueError:
        print("❌ Score invalide !")
        return
    
    # Date
    date = input(f"\n📆 Date (YYYY-MM-DD) ou Enter pour aujourd'hui : ").strip()
    if not date:
        date = datetime.now().strftime('%Y-%m-%d')
    
    gagnant = equipe1_nom if score1 > score2 else equipe2_nom
    
    if 'matchs_cnf3' not in data:
        data['matchs_cnf3'] = []
    
    nouveau_match = {
        "id": len(data['matchs_cnf3']) + 1,
        "type": "tableau",
        "tournoi": "CNF 3",
        "phase": phase,
        "date": date,
        "equipe1": equipe1_nom,
        "equipe2": equipe2_nom,
        "joueur1_eq1": equipe1['joueur1'],
        "joueur2_eq1": equipe1['joueur2'],
        "joueur1_eq2": equipe2['joueur1'],
        "joueur2_eq2": equipe2['joueur2'],
        "score1": score1,
        "score2": score2,
        "gagnant": gagnant
    }
    
    # Récapitulatif
    print("\n" + "="*80)
    print("📋 RÉCAPITULATIF")
    print("="*80)
    print(f"🏆 Match de {phase} CNF 3 #{nouveau_match['id']}")
    print(f"📅 {date}")
    print(f"🎯 {equipe1_nom} ({equipe1['joueur1']} / {equipe1['joueur2']})")
    print(f"   vs")
    print(f"🎯 {equipe2_nom} ({equipe2['joueur1']} / {equipe2['joueur2']})")
    print(f"📊 Score : {score1} - {score2}")
    print(f"🏅 Gagnant : {gagnant}")
    print("="*80)
    
    confirmer = input("\n✅ Confirmer l'ajout ? (o/n) : ")
    if confirmer.lower() != 'o':
        print("❌ Match annulé")
        return
    
    # === MISE À JOUR STATS INDIVIDUELLES DES 4 JOUEURS ===
    
    print("\n🎯 Mise à jour des statistiques INDIVIDUELLES des 4 joueurs :")
    
    j1_eq1 = trouver_joueur(data, equipe1['joueur1'])
    j2_eq1 = trouver_joueur(data, equipe1['joueur2'])
    j1_eq2 = trouver_joueur(data, equipe2['joueur1'])
    j2_eq2 = trouver_joueur(data, equipe2['joueur2'])
    
    elo_equipe1 = (j1_eq1.get('elo', 1500) + j2_eq1.get('elo', 1500)) / 2
    elo_equipe2 = (j1_eq2.get('elo', 1500) + j2_eq2.get('elo', 1500)) / 2
    
    k_double = 32 * FACTEUR_DOUBLE
    
    # Ajouter CNF 3 aux tournois
    for nom in [equipe1['joueur1'], equipe1['joueur2'], equipe2['joueur1'], equipe2['joueur2']]:
        joueur = trouver_joueur(data, nom)
        if joueur and 'CNF 3' not in joueur.get('tournois', []):
            if 'tournois' not in joueur:
                joueur['tournois'] = []
            joueur['tournois'].append('CNF 3')
    
    # Mettre à jour les stats individuelles
    if score1 > score2:
        mettre_a_jour_stats_joueur(data, equipe1['joueur1'], True, score1, score2, elo_equipe2, k_double)
        mettre_a_jour_stats_joueur(data, equipe1['joueur2'], True, score1, score2, elo_equipe2, k_double)
        mettre_a_jour_stats_joueur(data, equipe2['joueur1'], False, score2, score1, elo_equipe1, k_double)
        mettre_a_jour_stats_joueur(data, equipe2['joueur2'], False, score2, score1, elo_equipe1, k_double)
    else:
        mettre_a_jour_stats_joueur(data, equipe2['joueur1'], True, score2, score1, elo_equipe1, k_double)
        mettre_a_jour_stats_joueur(data, equipe2['joueur2'], True, score2, score1, elo_equipe1, k_double)
        mettre_a_jour_stats_joueur(data, equipe1['joueur1'], False, score1, score2, elo_equipe2, k_double)
        mettre_a_jour_stats_joueur(data, equipe1['joueur2'], False, score1, score2, elo_equipe2, k_double)
    
    data['matchs_cnf3'].append(nouveau_match)
    
    sauvegarder_donnees(data)
    
    print(f"\n✅ Match de {phase} CNF 3 ajouté avec succès !")

# ============================================
# MENU PRINCIPAL
# ============================================

def menu_principal():
    """Menu principal unifié"""
    data = charger_donnees()
    if not data:
        return
    
    print("\n" + "="*80)
    print("⚙️  FORMULE ELO :")
    print("   Nouveau ELO = Ancien ELO + K × (Résultat - Probabilité attendue)")
    print(f"   - Matchs individuels : K = 32")
    print(f"   - Matchs en double : K = {32 * FACTEUR_DOUBLE:.0f} ({FACTEUR_DOUBLE*100:.0f}%)")
    print("="*80)
    
    while True:
        print("\n" + "="*80)
        print("🎯 GESTION DES MATCHS - CLUB NANTAIS DE FLÉCHETTES")
        print("="*80)
        
        nb_joueurs = len(data.get('joueurs', []))
        nb_matchs = len(data.get('matchs', []))
        nb_matchs_cnf3 = len(data.get('matchs_cnf3', []))
        
        print(f"📊 {nb_joueurs} joueurs | {nb_matchs} matchs individuels | {nb_matchs_cnf3} matchs doubles")
        
        print("\n1. ➕ Match INDIVIDUEL (CNF 1, 2...)")
        print("2. 👥 Match DOUBLE CNF 3 - Poule")
        print("3. 🏆 Match DOUBLE CNF 3 - Tableau final")
        print("4. 📋 Voir les joueurs")
        print("5. 🚪 Quitter")
        
        choix = input("\n👉 Votre choix : ").strip()
        
        if choix == '1':
            ajouter_match_individuel(data)
        elif choix == '2':
            ajouter_match_double_poule(data)
        elif choix == '3':
            ajouter_match_double_tableau(data)
        elif choix == '4':
            afficher_joueurs(data)
            input("\nAppuyez sur Enter pour continuer...")
        elif choix == '5':
            print("\n👋 À bientôt !")
            break
        else:
            print("❌ Choix invalide !")

if __name__ == '__main__':
    try:
        menu_principal()
    except KeyboardInterrupt:
        print("\n\n👋 Programme interrompu. À bientôt !")
    except Exception as e:
        print(f"\n❌ Erreur : {e}")
        import traceback
        traceback.print_exc()