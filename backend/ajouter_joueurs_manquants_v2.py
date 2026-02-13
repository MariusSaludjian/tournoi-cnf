#!/usr/bin/env python3
"""
Script pour ajouter les joueurs manquants depuis les POULES CNF3
Cherche dans matchs_cnf3, equipes ET poules_cnf3

Usage: python ajouter_joueurs_manquants_v2.py
"""

import json
import shutil
from datetime import datetime

def charger_donnees():
    """Charge le fichier data.json"""
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

def creer_nouveau_joueur(nom):
    """Crée un nouveau joueur avec des statistiques par défaut"""
    return {
        "nom": nom,
        "matchs_joues": 0,
        "victoires": 0,
        "defaites": 0,
        "sets_gagnes": 0,
        "sets_perdus": 0,
        "tournois": ["CNF 3"],
        "pourcentage_victoires": 0,
        "ratio_sets": 0,
        "elo": 1500.0,
        "elo_max": 1500.0,
        "elo_min": 1500.0,
        "photo": "photos/default.jpg",
        "forme_recente": []
    }

def trouver_joueurs_manquants(data):
    """
    Trouve tous les joueurs présents dans :
    - matchs_cnf3
    - equipes
    - poules_cnf3
    mais absents de la liste joueurs
    """
    # Récupérer tous les noms de joueurs existants
    joueurs_existants = {joueur['nom'] for joueur in data['joueurs']}
    
    # Récupérer tous les noms dans les différentes sources
    tous_joueurs = set()
    
    # 1. Matchs CNF3
    for match in data.get('matchs_cnf3', []):
        for key in ['joueur1_eq1', 'joueur2_eq1', 'joueur1_eq2', 'joueur2_eq2']:
            nom = match.get(key)
            if nom:
                tous_joueurs.add(nom)
    
    # 2. Équipes
    for equipe in data.get('equipes', []):
        j1 = equipe.get('joueur1')
        j2 = equipe.get('joueur2')
        if j1:
            tous_joueurs.add(j1)
        if j2:
            tous_joueurs.add(j2)
    
    # 3. Poules CNF3
    for poule in data.get('poules_cnf3', []):
        for equipe in poule.get('equipes', []):
            j1 = equipe.get('joueur1')
            j2 = equipe.get('joueur2')
            if j1:
                tous_joueurs.add(j1)
            if j2:
                tous_joueurs.add(j2)
    
    # Trouver les joueurs manquants
    joueurs_manquants = tous_joueurs - joueurs_existants
    
    return joueurs_manquants, joueurs_existants, tous_joueurs

def main():
    print("\n" + "="*70)
    print("🔍 RECHERCHE ET AJOUT DES JOUEURS MANQUANTS (VERSION COMPLÈTE)")
    print("="*70)
    
    # Charger les données
    data = charger_donnees()
    if not data:
        return
    
    # Statistiques initiales
    print(f"\n📊 Statistiques actuelles :")
    print(f"   • {len(data['joueurs'])} joueurs dans la base")
    print(f"   • {len(data.get('matchs_cnf3', []))} matchs CNF3")
    print(f"   • {len(data.get('equipes', []))} équipes")
    print(f"   • {len(data.get('poules_cnf3', []))} poules CNF3")
    
    # Trouver les joueurs manquants
    joueurs_manquants, joueurs_existants, tous_joueurs = trouver_joueurs_manquants(data)
    
    print(f"\n📋 Analyse :")
    print(f"   • {len(tous_joueurs)} joueurs uniques trouvés (matchs + équipes + poules)")
    print(f"   • {len(joueurs_existants)} joueurs déjà enregistrés")
    print(f"   • {len(joueurs_manquants)} joueurs manquants")
    
    # Si aucun joueur manquant
    if not joueurs_manquants:
        print("\n✅ Tous les joueurs sont déjà dans la base !")
        print("   Rien à faire 🎉")
        return
    
    # Afficher les joueurs manquants
    print(f"\n❌ Joueurs manquants trouvés :")
    for i, nom in enumerate(sorted(joueurs_manquants), 1):
        print(f"   {i}. {nom}")
    
    # Demander confirmation
    print(f"\n⚠️  Ces {len(joueurs_manquants)} joueurs vont être ajoutés avec :")
    print("   • ELO : 1500")
    print("   • Tournois : [CNF 3]")
    print("   • Stats : 0 partout")
    print("   • Photo : default.jpg")
    
    reponse = input("\n❓ Continuer ? (o/n) : ").strip().lower()
    
    if reponse != 'o':
        print("\n❌ Opération annulée.")
        return
    
    # Créer une sauvegarde
    backup_name = f"data_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    shutil.copy('data.json', backup_name)
    print(f"\n💾 Sauvegarde créée : {backup_name}")
    
    # Ajouter les joueurs manquants
    print(f"\n➕ Ajout des joueurs...")
    joueurs_ajoutes = []
    
    for nom in sorted(joueurs_manquants):
        nouveau_joueur = creer_nouveau_joueur(nom)
        data['joueurs'].append(nouveau_joueur)
        joueurs_ajoutes.append(nom)
        print(f"   ✅ Ajouté : {nom}")
    
    # Trier les joueurs par nom
    data['joueurs'].sort(key=lambda j: j['nom'])
    
    # Sauvegarder
    sauvegarder_donnees(data)
    
    # Résumé
    print("\n" + "="*70)
    print("✅ OPÉRATION TERMINÉE")
    print("="*70)
    print(f"\n📊 Résumé :")
    print(f"   • {len(joueurs_ajoutes)} joueurs ajoutés")
    print(f"   • {len(data['joueurs'])} joueurs au total maintenant")
    print(f"\n💾 Fichier data.json mis à jour !")
    print(f"💾 Backup : {backup_name}")
    
    print(f"\n⚠️  IMPORTANT : Ces joueurs ont été ajoutés avec des stats à 0.")
    print(f"   Pour mettre à jour leurs stats si ils ont joué :")
    print(f"   • python recalculer_forme_complete.py")
    
    print("\n🎉 Les joueurs sont maintenant dans la base !")

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Opération annulée par l'utilisateur.")
    except Exception as e:
        print(f"\n❌ Erreur : {e}")
        import traceback
        traceback.print_exc()
