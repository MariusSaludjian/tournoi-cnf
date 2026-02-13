#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script d'initialisation et de test pour la synchronisation CNF 3
Vérifie que tout est correctement configuré
"""

import os
import sys
import json


def print_header(text):
    """Affiche un en-tête formaté"""
    print("\n" + "=" * 60)
    print(f"  {text}")
    print("=" * 60)


def check_file(filepath, description, required=True):
    """Vérifie l'existence d'un fichier"""
    exists = os.path.exists(filepath)
    status = "OK" if exists else ("ERREUR" if required else "ATTENTION")
    print(f"[{status}] {description}: {filepath}")
    return exists


def check_json_valid(filepath):
    """Vérifie que le JSON est valide"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        print(f"   OK - Fichier JSON valide ({len(data.get('matchs', []))} matchs)")
        return True
    except json.JSONDecodeError as e:
        print(f"   ERREUR - Erreur JSON: {e}")
        return False
    except Exception as e:
        print(f"   ERREUR: {e}")
        return False


def check_credentials():
    """Vérifie le fichier credentials.json"""
    if not os.path.exists('credentials.json'):
        return False
    
    try:
        with open('credentials.json', 'r', encoding='utf-8') as f:
            creds = json.load(f)
        
        required_fields = ['type', 'project_id', 'client_email', 'private_key']
        missing = [field for field in required_fields if field not in creds]
        
        if missing:
            print(f"   ATTENTION - Champs manquants: {', '.join(missing)}")
            return False
        
        print(f"   OK - Service account: {creds['client_email']}")
        print(f"   OK - Projet: {creds['project_id']}")
        return True
    except Exception as e:
        print(f"   ERREUR: {e}")
        return False


def check_python_packages():
    """Vérifie l'installation des packages Python"""
    packages = ['gspread', 'google.auth']
    all_installed = True
    
    for package in packages:
        try:
            __import__(package)
            print(f"   OK - {package}")
        except ImportError:
            print(f"   ERREUR - {package} non installe")
            all_installed = False
    
    return all_installed


def check_sheet_id():
    """Vérifie que le SPREADSHEET_ID est configuré"""
    
    # Liste des scripts à vérifier (par ordre de priorité)
    scripts_to_check = [
        'sync_cnf3_complet.py',
        'sync_cnf3_structure.py',
        'sync_multi_sheets.py',
        'sync_google_sheets.py'
    ]
    
    for script_name in scripts_to_check:
        if not os.path.exists(script_name):
            continue
            
        try:
            with open(script_name, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Cherche SPREADSHEET_ID = 'VOTRE_SHEET_ID'
            if "SPREADSHEET_ID = 'VOTRE_SHEET_ID'" in content:
                print(f"   ATTENTION - SPREADSHEET_ID non configure dans {script_name}")
                print(f"   INFO - Editez {script_name} et remplacez VOTRE_SHEET_ID")
                return False
            
            # Trouve la ligne avec SPREADSHEET_ID
            for line in content.split('\n'):
                if 'SPREADSHEET_ID' in line and '=' in line and not line.strip().startswith('#'):
                    sheet_id = line.split('=')[1].strip().strip("'\"")
                    if sheet_id and sheet_id != 'VOTRE_SHEET_ID':
                        print(f"   OK - SPREADSHEET_ID configure dans {script_name}")
                        print(f"      ID: {sheet_id[:20]}...")
                        return True
            
            print(f"   ATTENTION - SPREADSHEET_ID introuvable dans {script_name}")
            
        except Exception as e:
            print(f"   ATTENTION - Erreur lecture {script_name}: {e}")
            continue
    
    print(f"   ERREUR - Aucun script de synchronisation trouve")
    return False


def run_test_sync():
    """Exécute un test de synchronisation"""
    print("\nTest de synchronisation ? (y/n): ", end='')
    response = input().lower().strip()
    
    if response != 'y':
        print("   Test ignore")
        return
    
    # Trouve le bon script à exécuter
    scripts = [
        'sync_cnf3_complet.py',
        'sync_cnf3_structure.py',
        'sync_multi_sheets.py',
        'sync_google_sheets.py'
    ]
    
    script_to_run = None
    for script in scripts:
        if os.path.exists(script):
            script_to_run = script
            break
    
    if not script_to_run:
        print("   ERREUR - Aucun script de synchronisation trouve")
        return
    
    print(f"\nLancement du test avec {script_to_run}...")
    try:
        import subprocess
        result = subprocess.run(
            ['python', script_to_run],
            capture_output=True,
            text=True,
            timeout=60,
            encoding='utf-8',
            errors='replace'
        )
        
        if result.returncode == 0:
            print("   OK - Test reussi!")
            if result.stdout:
                print("\n" + result.stdout)
        else:
            print("   ERREUR - Test echoue")
            if result.stderr:
                print("\n" + result.stderr)
    except subprocess.TimeoutExpired:
        print("   TIMEOUT - Le test a pris trop de temps")
    except Exception as e:
        print(f"   ERREUR: {e}")


def main():
    """Fonction principale"""
    print("\n" + "="*60)
    print("  CNF 3 - Verification de la configuration")
    print("="*60)
    
    # Vérification des fichiers
    print("\n1. FICHIERS REQUIS")
    print("-"*60)
    
    # Cherche le script de sync principal
    sync_files = [
        ('sync_cnf3_complet.py', 'Script complet (RECOMMANDE)'),
        ('sync_cnf3_structure.py', 'Script structure CNF3'),
        ('sync_multi_sheets.py', 'Script multi-feuilles'),
        ('sync_google_sheets.py', 'Script de base')
    ]
    
    has_sync = False
    for filename, description in sync_files:
        if os.path.exists(filename):
            print(f"[OK] {description}: {filename}")
            has_sync = True
            break
    
    if not has_sync:
        print("[ERREUR] Aucun script de synchronisation trouve")
        for filename, description in sync_files:
            print(f"   Manquant: {filename}")
    
    has_data = check_file('data.json', 'Fichier de donnees')
    has_creds = check_file('credentials.json', 'Credentials Google Cloud')
    check_file('requirements.txt', 'Dependances Python', required=False)
    
    # Vérification du data.json
    if has_data:
        print("\n2. VALIDATION DE DATA.JSON")
        print("-"*60)
        check_json_valid('data.json')
    
    # Vérification des credentials
    if has_creds:
        print("\n3. VALIDATION DES CREDENTIALS")
        print("-"*60)
        creds_ok = check_credentials()
    else:
        creds_ok = False
        print("\n[ERREUR] Credentials manquants")
        print("   Consultez le GUIDE_SYNCHRONISATION.md, section 1")
    
    # Vérification des packages Python
    print("\n4. PACKAGES PYTHON")
    print("-"*60)
    packages_ok = check_python_packages()
    
    if not packages_ok:
        print("\nPour installer les dependances:")
        print("   pip install -r requirements.txt")
    
    # Vérification de la configuration
    print("\n5. CONFIGURATION")
    print("-"*60)
    sheet_ok = check_sheet_id()
    
    # Résumé
    print("\n" + "="*60)
    print("  RESUME")
    print("="*60)
    
    checks = {
        "Fichiers": has_sync and has_data,
        "Credentials": has_creds and creds_ok,
        "Packages Python": packages_ok,
        "Configuration": sheet_ok
    }
    
    all_ok = all(checks.values())
    
    for name, status in checks.items():
        icon = "OK" if status else "ERREUR"
        print(f"[{icon}] {name}")
    
    if all_ok:
        print("\nTout est pret! Vous pouvez lancer la synchronisation.")
        print("\nCommandes disponibles:")
        
        if os.path.exists('sync_cnf3_complet.py'):
            print("   python sync_cnf3_complet.py      - Sync complete avec ELO (RECOMMANDE)")
        if os.path.exists('sync_cnf3_structure.py'):
            print("   python sync_cnf3_structure.py    - Sync structure CNF3")
        if os.path.exists('watch_sync.py'):
            print("   python watch_sync.py              - Surveillance continue")
        
        run_test_sync()
    else:
        print("\nConfiguration incomplete")
        print("Consultez le GUIDE_SYNCHRONISATION.md pour plus d'aide")
    
    print("\n" + "="*60)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nArret du script")
    except Exception as e:
        print(f"\nERREUR inattendue: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
