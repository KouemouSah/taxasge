#!/usr/bin/env python3
"""
Sync Assignment Permissions to Database
Registers the 18 new permissions added to permissions.py

This script manually syncs the permissions that were added to
app/modules/assignment/permissions.py but haven't been registered yet
in the database.

Date: 2025-11-17
Author: Claude Code
"""

import sys
import psycopg2

# Database connection
DATABASE_URL = "postgresql://postgres:taxasge-db25@db.bpdzfkymgydjxxwlctam.supabase.co:5432/postgres"

# 18 new permissions to add (from permissions.py)
NEW_PERMISSIONS = [
    # RULES MANAGEMENT (6)
    ("rules.view", "rules", "view", "Ver reglas de asignación", False, "assignment"),
    ("rules.create", "rules", "create", "Crear reglas de asignación", False, "assignment"),
    ("rules.edit", "rules", "edit", "Editar reglas de asignación", False, "assignment"),
    ("rules.activate", "rules", "activate", "Activar/desactivar reglas", False, "assignment"),
    ("rules.delete", "rules", "delete", "Eliminar reglas de asignación", True, "assignment"),  # CRITICAL
    ("rules.view_effectiveness", "rules", "view_effectiveness", "Ver reporte de eficacia de reglas", False, "assignment"),

    # REPORTS (5)
    ("reports.view", "reports", "view", "Ver reportes de asignación", False, "assignment"),
    ("reports.generate", "reports", "generate", "Generar reportes", False, "assignment"),
    ("reports.edit", "reports", "edit", "Editar reportes generados", True, "assignment"),  # CRITICAL
    ("reports.export_pdf", "reports", "export_pdf", "Exportar reporte en PDF", False, "assignment"),
    ("reports.export_excel", "reports", "export_excel", "Exportar reporte en Excel", False, "assignment"),

    # DASHBOARD (3)
    ("dashboard.view", "dashboard", "view", "Ver dashboard de supervisor", False, "assignment"),
    ("dashboard.team_stats", "dashboard", "team_stats", "Ver estadísticas de equipo", False, "assignment"),
    ("dashboard.agent_stats", "dashboard", "agent_stats", "Ver estadísticas de agente específico", False, "assignment"),

    # AGENT MANAGEMENT (4) - Note: agents.view was already in original permissions, so we skip it
    ("agents.view", "agents", "view", "Ver lista de agentes", False, "assignment"),
    ("agents.view_workload", "agents", "view_workload", "Ver carga de trabajo de agentes", False, "assignment"),
    ("agents.view_performance", "agents", "view_performance", "Ver rendimiento de agentes", False, "assignment"),
]

def sync_permissions():
    """Sync new permissions to database"""

    print("=" * 80)
    print("SYNC ASSIGNMENT PERMISSIONS TO DATABASE")
    print("=" * 80)
    print(f"Permissions to add: {len(NEW_PERMISSIONS)}")
    print("=" * 80)

    try:
        # Connect
        print("\nConnecting to Supabase...")
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        print("[OK] Connected")

        # Insert permissions
        print("\nInserting new permissions...")
        inserted_count = 0
        skipped_count = 0

        for perm in NEW_PERMISSIONS:
            name, resource, action, description, is_critical, module_name = perm

            try:
                cursor.execute("""
                    INSERT INTO permissions (name, resource, action, description, is_critical, module_name)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON CONFLICT (name) DO NOTHING
                    RETURNING id;
                """, (name, resource, action, description, is_critical, module_name))

                result = cursor.fetchone()
                if result:
                    inserted_count += 1
                    critical_flag = " [CRITICAL]" if is_critical else ""
                    print(f"  [+] {name:40s} {critical_flag}")
                else:
                    skipped_count += 1
                    print(f"  [SKIP] {name:40s} (already exists)")

            except Exception as e:
                print(f"  [ERROR] {name}: {e}")

        # Commit
        conn.commit()

        print("\n" + "=" * 80)
        print("SYNC COMPLETE")
        print("=" * 80)
        print(f"Inserted: {inserted_count}")
        print(f"Skipped:  {skipped_count}")
        print(f"Total:    {len(NEW_PERMISSIONS)}")

        # Verify total count
        cursor.execute("""
            SELECT COUNT(*) FROM permissions WHERE module_name = 'assignment';
        """)
        total = cursor.fetchone()[0]
        print(f"\nTotal Assignment permissions in DB: {total}")

        # Show all assignment permissions
        cursor.execute("""
            SELECT name, resource, action, is_critical
            FROM permissions
            WHERE module_name = 'assignment'
            ORDER BY resource, action;
        """)

        print("\n" + "=" * 80)
        print("ALL ASSIGNMENT PERMISSIONS")
        print("=" * 80)
        for row in cursor.fetchall():
            critical_flag = " [CRITICAL]" if row[3] else ""
            print(f"  {row[0]:50s} | {row[1]:15s}.{row[2]:20s} {critical_flag}")

        cursor.close()
        conn.close()
        print("\n[OK] Connection closed")

    except Exception as e:
        print(f"\n[ERROR] {e}")
        sys.exit(1)

if __name__ == "__main__":
    sync_permissions()
