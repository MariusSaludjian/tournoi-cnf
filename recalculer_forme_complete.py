#!/usr/bin/env python3
"""
Script pour recalculer la forme récente à partir de TOUS les matchs
(Matchs individuels + Matchs CNF3)
Usage: python recalculer_forme_complete.py
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

def trouver_joueur(data, nom):
    """Trouve un joueur par son nom"""
    for joueur in data['joueurs']:
        if joueur['nom'] == nom:
            return joueur
    return None

def recalculer_forme_complete():
    """Recalcule la forme récente à partir de TOUS les matchs"""
    
    print("\n" + "="*70)
    print("🔄 RECALCUL COMPLET DE LA FORME RÉCENTE")
    print("   (Matchs individuels + Matchs CNF3)")
    print("="*70)
    
    # Charger les données
    data = charger_donnees()
    if not data:
        return
    
    matchs_individuels = data.get('matchs', [])
    matchs_cnf3 = data.get('matchs_cnf3', [])
    
    print(f"\n📊 Données chargées :")
    print(f"   • {len(matchs_individuels)} matchs individuels")
    print(f"   • {len(matchs_cnf3)} matchs CNF3")
    print(f"   • {len(data['joueurs'])} joueurs")
    
    if not matchs_individuels and not matchs_cnf3:
        print("\n❌ Aucun match trouvé !")
        return
    
    # Créer une sauvegarde
    import shutil
    backup_name = f"data_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    shutil.copy('data.json', backup_name)
    print(f"\n💾 Sauvegarde créée : {backup_name}")
    
    # Initialiser forme_recente à vide pour tous les joueurs
    print("\n🔄 Réinitialisation de la forme récente...")
    for joueur in data['joueurs']:
        joueur['forme_recente'] = []
    
    # Créer une liste unifiée de tous les matchs avec leur type
    tous_matchs = []
    
    # Ajouter les matchs individuels
    for match in matchs_individuels:
        tous_matchs.append({
            'date': match.get('date', ''),
            'type': 'individuel',
            'data': match
        })
    
    # Ajouter les matchs CNF3
    for match in matchs_cnf3:
        tous_matchs.append({
            'date': match.get('date', ''),
            'type': 'cnf3',
            'data': match
        })
    
    # Trier tous les matchs par date
    tous_matchs.sort(key=lambda m: m['date'])
    
    print(f"\n📅 Traitement de {len(tous_matchs)} matchs par ordre chronologique...")
    
    # Dictionnaire pour tracker les joueurs
    stats_joueurs = {}
    
    # Parcourir tous les matchs
    for i, match_wrapper in enumerate(tous_matchs, 1):
        match = match_wrapper['data']
        type_match = match_wrapper['type']
        
        if type_match == 'individuel':
            # Match individuel : 2 joueurs
            j1_nom = match.get('joueur1')
            j2_nom = match.get('joueur2')
            gagnant = match.get('gagnant')
            
            if not all([j1_nom, j2_nom, gagnant]):
                continue
            
            j1 = trouver_joueur(data, j1_nom)
            j2 = trouver_joueur(data, j2_nom)
            
            if not all([j1, j2]):
                continue
            
            # Mettre à jour la forme
            for joueur, nom in [(j1, j1_nom), (j2, j2_nom)]:
                if 'forme_recente' not in joueur:
                    joueur['forme_recente'] = []
                
                resultat = 'V' if nom == gagnant else 'D'
                joueur['forme_recente'].append(resultat)
                joueur['forme_recente'] = joueur['forme_recente'][-5:]
                
                # Stats
                if nom not in stats_joueurs:
                    stats_joueurs[nom] = {'individuels': 0, 'cnf3': 0}
                stats_joueurs[nom]['individuels'] += 1
        
        elif type_match == 'cnf3':
            # Match CNF3 : 4 joueurs
            j1_nom = match.get('joueur1_eq1')
            j2_nom = match.get('joueur2_eq1')
            j3_nom = match.get('joueur1_eq2')
            j4_nom = match.get('joueur2_eq2')
            
            if not all([j1_nom, j2_nom, j3_nom, j4_nom]):
                continue
            
            j1 = trouver_joueur(data, j1_nom)
            j2 = trouver_joueur(data, j2_nom)
            j3 = trouver_joueur(data, j3_nom)
            j4 = trouver_joueur(data, j4_nom)
            
            if not all([j1, j2, j3, j4]):
                continue
            
            score1 = match.get('score1', 0)
            score2 = match.get('score2', 0)
            equipe1_gagne = score1 > score2
            
            # Équipe 1
            for joueur, nom in [(j1, j1_nom), (j2, j2_nom)]:
                if 'forme_recente' not in joueur:
                    joueur['forme_recente'] = []
                joueur['forme_recente'].append('V' if equipe1_gagne else 'D')
                joueur['forme_recente'] = joueur['forme_recente'][-5:]
                
                if nom not in stats_joueurs:
                    stats_joueurs[nom] = {'individuels': 0, 'cnf3': 0}
                stats_joueurs[nom]['cnf3'] += 1
            
            # Équipe 2
            for joueur, nom in [(j3, j3_nom), (j4, j4_nom)]:
                if 'forme_recente' not in joueur:
                    joueur['forme_recente'] = []
                joueur['forme_recente'].append('D' if equipe1_gagne else 'V')
                joueur['forme_recente'] = joueur['forme_recente'][-5:]
                
                if nom not in stats_joueurs:
                    stats_joueurs[nom] = {'individuels': 0, 'cnf3': 0}
                stats_joueurs[nom]['cnf3'] += 1
        
        # Affichage progressif
        if i % 10 == 0 or i == len(tous_matchs):
            print(f"   ✅ {i}/{len(tous_matchs)} matchs traités...")
    
    # Sauvegarder
    sauvegarder_donnees(data)
    
    # Résumé
    print("\n" + "="*70)
    print("✅ RECALCUL COMPLET TERMINÉ")
    print("="*70)
    print(f"\n📊 Résumé :")
    print(f"   • {len(matchs_individuels)} matchs individuels traités")
    print(f"   • {len(matchs_cnf3)} matchs CNF3 traités")
    print(f"   • {len(stats_joueurs)} joueurs concernés")
    
    # Afficher les joueurs avec le plus de matchs
    print(f"\n🎯 Top 10 joueurs par nombre de matchs :")
    joueurs_tries = sorted(stats_joueurs.items(), 
                          key=lambda x: x[1]['individuels'] + x[1]['cnf3'], 
                          reverse=True)
    
    for i, (nom, stats) in enumerate(joueurs_tries[:10], 1):
        joueur = trouver_joueur(data, nom)
        forme = ' '.join(joueur.get('forme_recente', []))
        total = stats['individuels'] + stats['cnf3']
        print(f"   {i:2}. {nom:25} [{forme:13}] ({total:3} matchs : {stats['individuels']} ind. + {stats['cnf3']} CNF3)")
    
    print(f"\n💾 Fichier data.json mis à jour !")
    print(f"💾 Backup disponible : {backup_name}")
    print("\n✅ La forme récente est maintenant à jour pour tous les joueurs !")
    print("   Elle sera mise à jour automatiquement pour les prochains matchs.")

if __name__ == '__main__':
    try:
        recalculer_forme_complete()
    except KeyboardInterrupt:
        print("\n\n👋 Opération annulée.")
    except Exception as e:
        print(f"\n❌ Erreur : {e}")
        import traceback
        traceback.print_exc()
