"""
Debug script to investigate login bug
"""
import asyncio
from app.database.supabase_client import get_supabase_client
from app.services.password_service import get_password_service
from loguru import logger

async def debug_login():
    """Debug login issue"""
    client = get_supabase_client()
    password_service = get_password_service()

    # Email to test
    test_email = "logintest@example.com"
    test_password = "MyP@ssw0rd!SecureXYZ"

    # Get user from database
    logger.info(f"Fetching user: {test_email}")
    result = await client.select(
        table="users",
        columns="id,email,password_hash",
        filters={"email": f"eq.{test_email}"}
    )

    if not result or len(result) == 0:
        logger.error(f"User not found: {test_email}")
        return

    user = result[0]
    logger.info(f"User found: {user['email']}")
    logger.info(f"User ID: {user['id']}")
    logger.info(f"Password hash (first 50 chars): {user['password_hash'][:50]}...")
    logger.info(f"Password hash length: {len(user['password_hash'])}")
    logger.info(f"Password hash starts with: {user['password_hash'][:4]}")

    # Test password verification
    logger.info(f"\nTesting password verification...")
    logger.info(f"Test password: {test_password}")

    is_valid = password_service.verify_password(test_password, user['password_hash'])
    logger.info(f"Password verification result: {is_valid}")

    if not is_valid:
        logger.error("PASSWORD VERIFICATION FAILED!")
        logger.error("This is the bug - password should be valid")

        # Try manual bcrypt check
        import bcrypt
        try:
            manual_check = bcrypt.checkpw(
                test_password.encode('utf-8'),
                user['password_hash'].encode('utf-8')
            )
            logger.info(f"Manual bcrypt check result: {manual_check}")
        except Exception as e:
            logger.error(f"Manual bcrypt check error: {e}")
    else:
        logger.success("Password verification PASSED!")

if __name__ == "__main__":
    asyncio.run(debug_login())
