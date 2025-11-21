"""
Create permissions for the 'permissions' module and assign them to admin role
"""
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from urllib.parse import urlparse
from dotenv import load_dotenv
from uuid import uuid4

# Load environment variables
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
env_path = os.path.join(root_dir, 'packages', 'backend', '.env')

if os.path.exists(env_path):
    load_dotenv(env_path)
    print(f"[OK] Loaded .env from {env_path}")
else:
    print(f"[WARN] .env not found at {env_path}")

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("[ERROR] DATABASE_URL not found")
    exit(1)

# Parse DATABASE_URL
result = urlparse(DATABASE_URL)

conn = psycopg2.connect(
    host=result.hostname,
    port=result.port or 5432,
    database=result.path[1:],
    user=result.username,
    password=result.password,
    sslmode='require'
)

cursor = conn.cursor(cursor_factory=RealDictCursor)

print("[INFO] Connected to database")

# Define permissions for the permissions module
permissions_to_create = [
    {
        'name': 'permissions.view',
        'resource': 'permissions',
        'action': 'view',
        'module_name': 'permissions',
        'description': 'View permissions list and details',
        'is_critical': False
    },
    {
        'name': 'permissions.create',
        'resource': 'permissions',
        'action': 'create',
        'module_name': 'permissions',
        'description': 'Create new permissions',
        'is_critical': True
    },
    {
        'name': 'permissions.update',
        'resource': 'permissions',
        'action': 'update',
        'module_name': 'permissions',
        'description': 'Update existing permissions',
        'is_critical': True
    },
    {
        'name': 'permissions.delete',
        'resource': 'permissions',
        'action': 'delete',
        'module_name': 'permissions',
        'description': 'Delete permissions',
        'is_critical': True
    },
    {
        'name': 'roles.view',
        'resource': 'roles',
        'action': 'view',
        'module_name': 'permissions',
        'description': 'View roles list and details',
        'is_critical': False
    },
    {
        'name': 'roles.create',
        'resource': 'roles',
        'action': 'create',
        'module_name': 'permissions',
        'description': 'Create new roles',
        'is_critical': True
    },
    {
        'name': 'roles.update',
        'resource': 'roles',
        'action': 'update',
        'module_name': 'permissions',
        'description': 'Update existing roles',
        'is_critical': True
    },
    {
        'name': 'roles.delete',
        'resource': 'roles',
        'action': 'delete',
        'module_name': 'permissions',
        'description': 'Delete roles (only custom roles)',
        'is_critical': True
    },
    {
        'name': 'roles.assign_permissions',
        'resource': 'roles',
        'action': 'assign_permissions',
        'module_name': 'permissions',
        'description': 'Assign permissions to roles',
        'is_critical': True
    },
    {
        'name': 'user_permissions.view',
        'resource': 'user_permissions',
        'action': 'view',
        'module_name': 'permissions',
        'description': 'View user permissions',
        'is_critical': False
    },
    {
        'name': 'user_permissions.grant',
        'resource': 'user_permissions',
        'action': 'grant',
        'module_name': 'permissions',
        'description': 'Grant permissions to users',
        'is_critical': True
    },
    {
        'name': 'user_permissions.revoke',
        'resource': 'user_permissions',
        'action': 'revoke',
        'module_name': 'permissions',
        'description': 'Revoke permissions from users',
        'is_critical': True
    },
]

print(f"\n[INFO] Creating {len(permissions_to_create)} permissions...")

created_permissions = []

for perm_data in permissions_to_create:
    # Check if permission already exists
    cursor.execute("""
        SELECT id FROM permissions WHERE name = %s
    """, (perm_data['name'],))

    existing = cursor.fetchone()

    if existing:
        print(f"  [SKIP] {perm_data['name']} already exists")
        created_permissions.append(existing['id'])
    else:
        # Create permission
        perm_id = str(uuid4())
        cursor.execute("""
            INSERT INTO permissions (id, name, resource, action, module_name, description, is_critical)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            perm_id,
            perm_data['name'],
            perm_data['resource'],
            perm_data['action'],
            perm_data['module_name'],
            perm_data['description'],
            perm_data['is_critical']
        ))

        result = cursor.fetchone()
        created_permissions.append(result['id'])
        print(f"  [OK] Created {perm_data['name']}")

conn.commit()

# Assign all these permissions to admin role
cursor.execute("""
    SELECT id FROM roles WHERE code = 'admin'
""")

admin_role = cursor.fetchone()

if admin_role:
    print(f"\n[INFO] Assigning permissions to admin role...")

    for perm_id in created_permissions:
        # Check if already assigned
        cursor.execute("""
            SELECT 1 FROM role_permissions
            WHERE role_id = %s AND permission_id = %s
        """, (admin_role['id'], perm_id))

        if cursor.fetchone():
            continue

        # Assign permission
        cursor.execute("""
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (%s, %s)
            ON CONFLICT DO NOTHING
        """, (admin_role['id'], perm_id))

    conn.commit()
    print(f"[SUCCESS] Assigned {len(created_permissions)} permissions to admin role")
else:
    print("[WARN] Admin role not found, permissions created but not assigned")

cursor.close()
conn.close()

print("\n[SUCCESS] Permissions module setup complete!")
