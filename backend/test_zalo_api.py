#!/usr/bin/env python3
"""
Test script for Zalo phone resolution API
"""

import requests
import json

# Test data
test_data = {
    "token": "test_token_123",
    "access_token": "test_access_token_456"
}

# API endpoint
url = "http://localhost:8000/api/v1/zalo/phone"

def test_zalo_phone_api():
    """Test the Zalo phone resolution API"""
    print("🧪 Testing Zalo Phone Resolution API")
    print(f"📍 Endpoint: {url}")
    print(f"📤 Request data: {json.dumps(test_data, indent=2)}")
    
    try:
        response = requests.post(url, json=test_data, timeout=10)
        
        print(f"📥 Response status: {response.status_code}")
        print(f"📥 Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            response_json = response.json()
            print(f"✅ Success response: {json.dumps(response_json, indent=2)}")
        else:
            print(f"❌ Error response: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {str(e)}")

if __name__ == "__main__":
    test_zalo_phone_api()
