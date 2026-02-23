#!/usr/bin/env python3
"""
Script de surveillance continue pour la synchronisation Google Sheets
Lance la synchronisation à intervalles réguliers
"""

import time
import schedule
import subprocess
from datetime import datetime
import os


def run_sync():
    """Exécute le script de synchronisation"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"\n{'='*60}")
    print(f"[{timestamp}] [SYNC] Lancement de la synchronisation...")
    print(f"{'='*60}")
    
    try:
        # Exécute le script de synchronisation
        result = subprocess.run(
            ['python3', 'sync_google_sheets.py'],
            capture_output=True,
            text=True,
            timeout=300  # 5 minutes max
        )
        
        # Affiche la sortie
        if result.stdout:
            print(result.stdout)
        if result.stderr:
            print("[ATTENTION] Erreurs:", result.stderr)
        
        if result.returncode == 0:
            print(f"[{timestamp}] [OK] Synchronisation terminée avec succès")
        else:
            print(f"[{timestamp}] [ERREUR] Erreur lors de la synchronisation (code {result.returncode})")
            
    except subprocess.TimeoutExpired:
        print(f"[{timestamp}] [TIMEOUT] Timeout: la synchronisation a pris trop de temps")
    except Exception as e:
        print(f"[{timestamp}] [ERREUR] Erreur inattendue: {e}")


def main():
    """Fonction principale"""
    print("[CNF3] Démarrage du service de surveillance CNF 3")
    print("="*60)
    print("Configuration:")
    print("  - Intervalle: toutes les 5 minutes")
    print("  - Script: sync_google_sheets.py")
    print("  - Dossier:", os.getcwd())
    print("="*60)
    print("\n⏳ En attente de la première exécution...")
    print("   (Appuyez sur Ctrl+C pour arrêter)\n")
    
    # Programme l'exécution toutes les 5 minutes
    schedule.every(5).minutes.do(run_sync)
    
    # Exécution immédiate au démarrage
    run_sync()
    
    # Boucle principale
    try:
        while True:
            schedule.run_pending()
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\n🛑 Arrêt du service de surveillance")
        print("[BYE] À bientôt !")


if __name__ == "__main__":
    main()
