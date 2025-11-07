"""
Test script for two-step registration flow
Tests with email: user@odoolab.site
"""
import requests
import json
import time
from datetime import datetime

BASE_URL = "https://taxasge-backend-staging-xrlbgdr5eq-uc.a.run.app/api/v1/auth"
TEST_EMAIL = "user@odoolab.site"

def print_separator():
    print("\n" + "="*80 + "\n")

def test_request_verification_code():
    """Test Step 1: Request verification code"""
    print_separator()
    print(f"TEST 1: Request Verification Code for {TEST_EMAIL}")
    print_separator()

    url = f"{BASE_URL}/request-verification-code"
    payload = {"email": TEST_EMAIL}

    print(f"POST {url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")

    try:
        response = requests.post(url, json=payload, timeout=10)

        print(f"\nStatus Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")

        if response.status_code == 200:
            print("\n[OK] SUCCESS: Verification code sent!")
            print(f"[TIME] Expires in: {response.json().get('expires_in')} seconds (15 minutes)")
            print(f"[EMAIL] Check email: {TEST_EMAIL}")
            print("\n[IMPORTANT] Check your email and get the 6-digit code")
            return True
        else:
            print(f"\n[FAIL] {response.json().get('detail')}")
            return False

    except Exception as e:
        print(f"\n[ERROR] {str(e)}")
        return False

def test_register_with_code(verification_code):
    """Test Step 2: Register with verification code"""
    print_separator()
    print(f"TEST 2: Register User with Code")
    print_separator()

    url = f"{BASE_URL}/register"
    payload = {
        "email": TEST_EMAIL,
        "verification_code": verification_code,
        "password": "Test@12345",
        "first_name": "Test",
        "last_name": "User",
        "phone": "222123456",
        "role": "citizen"
    }

    print(f"POST {url}")
    print(f"Payload: {json.dumps({**payload, 'password': '***'}, indent=2)}")

    try:
        response = requests.post(url, json=payload, timeout=10)

        print(f"\nStatus Code: {response.status_code}")

        if response.status_code == 201:
            data = response.json()
            print("\n[OK] SUCCESS: User registered!")
            print(f"Access Token: {data.get('access_token', '')[:50]}...")
            print(f"User Email: {data.get('user', {}).get('email')}")
            print(f"Email Verified: {data.get('user', {}).get('email_verified')}")
            return True
        else:
            print(f"Response: {json.dumps(response.json(), indent=2)}")
            print(f"\n[FAIL] FAILED: {response.json().get('detail')}")
            return False

    except Exception as e:
        print(f"\n[FAIL] ERROR: {str(e)}")
        return False

def test_invalid_email():
    """Test with invalid email"""
    print_separator()
    print("TEST 3: Request Code with Invalid Email")
    print_separator()

    url = f"{BASE_URL}/request-verification-code"
    payload = {"email": "invalid@"}

    print(f"POST {url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")

    try:
        response = requests.post(url, json=payload, timeout=10)

        print(f"\nStatus Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")

        if response.status_code == 400:
            print("\n[OK] SUCCESS: Invalid email correctly rejected")
            return True
        else:
            print("\n[FAIL] FAILED: Should have returned 400")
            return False

    except Exception as e:
        print(f"\n[FAIL] ERROR: {str(e)}")
        return False

def test_wrong_code():
    """Test with wrong verification code"""
    print_separator()
    print("TEST 4: Register with Wrong Code")
    print_separator()

    url = f"{BASE_URL}/register"
    payload = {
        "email": TEST_EMAIL,
        "verification_code": "999999",  # Wrong code
        "password": "Test@12345",
        "first_name": "Test",
        "last_name": "User",
        "phone": "222123456",
        "role": "citizen"
    }

    print(f"POST {url}")
    print(f"Payload: {json.dumps({**payload, 'password': '***'}, indent=2)}")

    try:
        response = requests.post(url, json=payload, timeout=10)

        print(f"\nStatus Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")

        if response.status_code == 400:
            print("\n[OK] SUCCESS: Wrong code correctly rejected")
            return True
        else:
            print("\n[FAIL] FAILED: Should have returned 400")
            return False

    except Exception as e:
        print(f"\n[FAIL] ERROR: {str(e)}")
        return False

def check_endpoint_available():
    """Check if new endpoint is available"""
    print_separator()
    print("CHECKING: Endpoint Availability")
    print_separator()

    url = f"{BASE_URL}/request-verification-code"

    try:
        response = requests.post(url, json={"email": "test@example.com"}, timeout=5)

        if response.status_code == 404:
            print("[FAIL] Endpoint not found (404)")
            print("[WARN]  New code not yet deployed")
            return False
        else:
            print("[OK] Endpoint is available")
            return True

    except Exception as e:
        print(f"[FAIL] ERROR: {str(e)}")
        return False

if __name__ == "__main__":
    print(f"\n{'='*80}")
    print(f"TWO-STEP REGISTRATION FLOW TEST")
    print(f"Test Email: {TEST_EMAIL}")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*80}\n")

    # Check if endpoint is deployed
    if not check_endpoint_available():
        print("\n[WAIT] Waiting for deployment to complete...")
        print("Run this script again once the build is finished.")
        exit(0)

    # Run tests
    print("\n[NOTE] Starting tests...\n")

    # Test 1: Request verification code
    success = test_request_verification_code()

    if success:
        # Ask user to input the code from email
        print_separator()
        code = input("Enter the 6-digit verification code from your email: ").strip()

        if len(code) == 6 and code.isdigit():
            # Test 2: Register with code
            test_register_with_code(code)
        else:
            print("[FAIL] Invalid code format (must be 6 digits)")

    # Test 3: Invalid email
    test_invalid_email()

    # Test 4: Wrong code (only if we requested a code)
    if success:
        test_wrong_code()

    print_separator()
    print("[OK] Tests completed!")
    print_separator()
