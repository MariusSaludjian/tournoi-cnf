#!/usr/bin/env python3
"""
Script pour ajouter les chemins des photos aux joueurs
Usage: python ajouter_photos.py
"""

import json
import os

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

def normaliser_nom_fichier(nom):
    """Convertit un nom en nom de fichier (minuscules, sans accents, avec tirets)"""
    import unicodedata
    # Enlever les accents
    nom = unicodedata.normalize('NFKD', nom).encode('ASCII', 'ignore').decode('utf-8')
    # Remplacer espaces par tirets et mettre en minuscules
    nom = nom.lower().replace(' ', '-').replace("'", '-')
    return nom

def lister_photos_disponibles():
    """Liste toutes les photos dans le dossier photos/"""
    if not os.path.exists('photos'):
        print("⚠️  Le dossier 'photos' n'existe pas encore.")
        print("   Créez-le et ajoutez-y vos photos de joueurs.")
        return []
    
    photos = [f for f in os.listdir('photos') if f.endswith(('.jpg', '.jpeg', '.png', '.webp'))]
    return photos

def ajouter_photos_automatique(data):
    """Ajoute automatiquement les chemins des photos basés sur les noms"""
    photos_disponibles = lister_photos_disponibles()
    
    if not photos_disponibles:
        return 0
    
    count = 0
    for joueur in data['joueurs']:
        nom_fichier = normaliser_nom_fichier(joueur['nom'])
        
        # Chercher une photo correspondante
        for ext in ['.jpg', '.jpeg', '.png', '.webp']:
            if f"{nom_fichier}{ext}" in photos_disponibles:
                joueur['photo'] = f"photos/{nom_fichier}{ext}"
                count += 1
                break
        else:
            # Pas de photo trouvée, utiliser default
            if 'photo' not in joueur:
                joueur['photo'] = 'photos/default.jpg'
    
    return count

def ajouter_photo_manuelle(data):
    """Ajoute une photo manuellement pour un joueur"""
    print("\n📋 Liste des joueurs :")
    for i, joueur in enumerate(data['joueurs'], 1):
        photo_actuelle = joueur.get('photo', 'Aucune')
        print(f"  {i:3}. {joueur['nom']:30} → {photo_actuelle}")
    
    choix = input("\n👉 Numéro du joueur (ou Enter pour annuler) : ").strip()
    if not choix:
        return False
    
    try:
        idx = int(choix) - 1
        if idx < 0 or idx >= len(data['joueurs']):
            print("❌ Numéro invalide !")
            return False
    except ValueError:
        print("❌ Numéro invalide !")
        return False
    
    joueur = data['joueurs'][idx]
    
    print(f"\n📸 Ajouter une photo pour : {joueur['nom']}")
    print("\nFormat du chemin : photos/nom-du-fichier.jpg")
    print("Exemple : photos/clement-ricaud.jpg")
    
    # Proposer un nom automatique
    nom_suggere = normaliser_nom_fichier(joueur['nom'])
    print(f"\n💡 Suggestion : photos/{nom_suggere}.jpg")
    
    chemin = input("\nChemin de la photo (ou Enter pour suggestion) : ").strip()
    
    if not chemin:
        chemin = f"photos/{nom_suggere}.jpg"
    
    joueur['photo'] = chemin
    print(f"✅ Photo ajoutée : {chemin}")
    return True

def menu_principal():
    """Menu principal"""
    data = charger_donnees()
    if not data:
        return
    
    print("\n" + "="*60)
    print("📸 GESTION DES PHOTOS - CLUB NANTAIS DE FLÉCHETTES")
    print("="*60)
    
    # Vérifier le dossier photos
    if not os.path.exists('photos'):
        print("\n⚠️  Le dossier 'photos' n'existe pas.")
        reponse = input("   Voulez-vous le créer ? (o/n) : ")
        if reponse.lower() == 'o':
            os.makedirs('photos')
            print("✅ Dossier 'photos' créé !")
            print("\nℹ️  Ajoutez vos photos dedans avec le format :")
            print("   - clement-ricaud.jpg")
            print("   - maxime-trepant.jpg")
            print("   - default.jpg (photo par défaut)")
            input("\nAppuyez sur Enter quand c'est fait...")
    
    while True:
        photos_disponibles = lister_photos_disponibles()
        joueurs_avec_photo = sum(1 for j in data['joueurs'] if j.get('photo') and j['photo'] != 'photos/default.jpg')
        
        print("\n" + "="*60)
        print(f"📊 Photos : {len(photos_disponibles)} dans le dossier | {joueurs_avec_photo}/{len(data['joueurs'])} joueurs avec photo")
        print("\n1. 🤖 Ajouter automatiquement (match nom de fichier)")
        print("2. ✍️  Ajouter manuellement pour un joueur")
        print("3. 📋 Voir les joueurs sans photo")
        print("4. 💾 Sauvegarder et quitter")
        print("5. 🚪 Quitter sans sauvegarder")
        
        choix = input("\n👉 Votre choix : ").strip()
        
        if choix == '1':
            print("\n🤖 Recherche automatique des photos...")
            count = ajouter_photos_automatique(data)
            print(f"✅ {count} photos ajoutées automatiquement !")
            
        elif choix == '2':
            ajouter_photo_manuelle(data)
            
        elif choix == '3':
            print("\n📋 Joueurs sans photo personnalisée :")
            sans_photo = [j for j in data['joueurs'] if not j.get('photo') or j['photo'] == 'photos/default.jpg']
            for i, joueur in enumerate(sans_photo, 1):
                nom_suggere = normaliser_nom_fichier(joueur['nom'])
                print(f"  {i:3}. {joueur['nom']:30} → Besoin de : photos/{nom_suggere}.jpg")
            input("\nAppuyez sur Enter pour continuer...")
            
        elif choix == '4':
            sauvegarder_donnees(data)
            print("\n✅ Données sauvegardées !")
            print("👋 À bientôt !")
            break
            
        elif choix == '5':
            print("\n👋 Modifications non sauvegardées. À bientôt !")
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
