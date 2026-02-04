#!/usr/bin/env python3
"""
Script pour ajouter facilement des nouveaux matchs au site CNF
Usage: python ajouter_match.py
"""

import json
from datetime import datetime

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

def afficher_joueurs(data):
    """Affiche la liste des joueurs"""
    joueurs = sorted([j['nom'] for j in data['joueurs']])
    print("\n📋 Liste des joueurs :")
    for i, nom in enumerate(joueurs, 1):
        print(f"  {i:2}. {nom}")
    return joueurs

def ajouter_joueur(data, nom):
    """Ajoute un nouveau joueur"""
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
        "tournois": []
    }
    data['joueurs'].append(nouveau_joueur)
    print(f"✅ Joueur '{nom}' ajouté !")

def ajouter_match(data):
    """Ajoute un nouveau match"""
    print("\n" + "="*60)
    print("🎯 AJOUTER UN NOUVEAU MATCH")
    print("="*60)
    
    # Afficher les joueurs
    joueurs_liste = afficher_joueurs(data)
    joueurs_dict = {j['nom']: j for j in data['joueurs']}
    
    # Saisir joueur 1
    print("\n👤 Joueur 1 :")
    joueur1 = input("  Nom (ou numéro de la liste) : ").strip()
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
    
    # Saisir joueur 2
    print("\n👤 Joueur 2 :")
    joueur2 = input("  Nom (ou numéro de la liste) : ").strip()
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
    
    # Saisir le score
    print("\n📊 Score :")
    try:
        score1 = int(input(f"  Sets gagnés par {joueur1} : "))
        score2 = int(input(f"  Sets gagnés par {joueur2} : "))
    except ValueError:
        print("❌ Score invalide !")
        return
    
    if score1 == score2:
        print("⚠️  Match nul détecté - on continue quand même")
    
    # Saisir le tournoi
    print("\n🏆 Tournoi :")
    print("  1. CNF 1")
    print("  2. CNF 2")
    print("  3. CNF 3")
    print("  4. Autre")
    choix = input("  Choix (1/2/3/4) : ").strip()
    
    if choix == '1':
        tournoi = 'CNF 1'
    elif choix == '2':
        tournoi = 'CNF 2'
    elif choix == '3':
        tournoi = 'CNF 3'
    else:
        tournoi = input("  Nom du tournoi : ").strip()
    
    # Saisir la phase
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
    
    if choix in phases:
        phase = phases[choix]
    else:
        phase = input("  Nom de la phase : ").strip()
    
    # Date
    date = input(f"\n📆 Date (YYYY-MM-DD) ou Enter pour aujourd'hui : ").strip()
    if not date:
        date = datetime.now().strftime('%Y-%m-%d')
    
    # Créer le match
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
    
    # Afficher le récapitulatif
    print("\n" + "="*60)
    print("📋 RÉCAPITULATIF")
    print("="*60)
    print(f"🎯 Match #{nouveau_match['id']}")
    print(f"🏆 {tournoi} - {phase}")
    print(f"📅 {date}")
    print(f"👤 {joueur1} vs {joueur2}")
    print(f"📊 Score : {score1} - {score2}")
    print(f"🏅 Gagnant : {gagnant}")
    print("="*60)
    
    confirmer = input("\n✅ Confirmer l'ajout ? (o/n) : ")
    
    if confirmer.lower() != 'o':
        print("❌ Match annulé")
        return
    
    # Ajouter le match
    data['matchs'].append(nouveau_match)
    
    # Mettre à jour les statistiques des joueurs
    j1 = joueurs_dict[joueur1]
    j2 = joueurs_dict[joueur2]
    
    j1['matchs_joues'] += 1
    j2['matchs_joues'] += 1
    
    j1['sets_gagnes'] += score1
    j1['sets_perdus'] += score2
    j2['sets_gagnes'] += score2
    j2['sets_perdus'] += score1
    
    if tournoi not in j1['tournois']:
        j1['tournois'].append(tournoi)
    if tournoi not in j2['tournois']:
        j2['tournois'].append(tournoi)
    
    if score1 > score2:
        j1['victoires'] += 1
        j2['defaites'] += 1
    else:
        j2['victoires'] += 1
        j1['defaites'] += 1
    
    # Recalculer les pourcentages
    if j1['matchs_joues'] > 0:
        j1['pourcentage_victoires'] = round((j1['victoires'] / j1['matchs_joues']) * 100, 1)
        j1['ratio_sets'] = round(j1['sets_gagnes'] / max(j1['sets_perdus'], 1), 2)
    
    if j2['matchs_joues'] > 0:
        j2['pourcentage_victoires'] = round((j2['victoires'] / j2['matchs_joues']) * 100, 1)
        j2['ratio_sets'] = round(j2['sets_gagnes'] / max(j2['sets_perdus'], 1), 2)
    
    # Mettre à jour les stats globales
    data['stats_globales']['total_matchs'] = len(data['matchs'])
    data['stats_globales']['total_sets'] = sum(m['score1'] + m['score2'] for m in data['matchs'])
    
    # Sauvegarder
    sauvegarder_donnees(data)
    
    print("\n✅ Match ajouté avec succès !")
    print(f"📊 Nouvelles stats {joueur1} : {j1['victoires']}V-{j1['defaites']}D ({j1['pourcentage_victoires']}%)")
    print(f"📊 Nouvelles stats {joueur2} : {j2['victoires']}V-{j2['defaites']}D ({j2['pourcentage_victoires']}%)")

def menu_principal():
    """Menu principal"""
    data = charger_donnees()
    if not data:
        return
    
    while True:
        print("\n" + "="*60)
        print("🎯 GESTION DES MATCHS - CLUB NANTAIS DE FLÉCHETTES")
        print("="*60)
        print(f"📊 Total : {data['stats_globales']['total_joueurs']} joueurs, {data['stats_globales']['total_matchs']} matchs")
        print("\n1. ➕ Ajouter un match")
        print("2. 📋 Voir les joueurs")
        print("3. 🚪 Quitter")
        
        choix = input("\n👉 Votre choix : ").strip()
        
        if choix == '1':
            ajouter_match(data)
        elif choix == '2':
            afficher_joueurs(data)
            input("\nAppuyez sur Enter pour continuer...")
        elif choix == '3':
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
