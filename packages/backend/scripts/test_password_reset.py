"""
Test script to diagnose password reset email issue
"""
import asyncio
import sys
from loguru import logger

# Configure loguru to output to console
logger.remove()
logger.add(sys.stderr, level="DEBUG")

async def test_password_reset():
    """Test password reset email sending"""
    from app.services.auth_service import get_auth_service

    # Test email (replace with a real test email)
    test_email = "libressai@gmail.com"  # Your SMTP email for testing

    logger.info(f"Testing password reset for email: {test_email}")

    try:
        auth_service = get_auth_service()
        result = await auth_service.request_password_reset(email=test_email)

        logger.info(f"Password reset result: {result}")

        if result:
            logger.success("✅ Password reset email sent successfully!")
        else:
            logger.error("❌ Password reset email FAILED to send")

    except Exception as e:
        logger.error(f"❌ Exception occurred: {str(e)}")
        logger.exception(e)

if __name__ == "__main__":
    asyncio.run(test_password_reset())
