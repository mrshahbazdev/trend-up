#!/bin/bash

# Phase 3 Complete Registration Flow Test
# Run: bash backend/src/modules/auth/test/test-phase3.sh

BASE_URL="http://localhost:5000/api/v1/auth"
EMAIL="testuser@example.com"
NAME="Test User"
USERNAME="testuser"
PASSWORD="Test123!@#"

echo "==================================================="
echo "PHASE 3 - REGISTRATION FLOW TEST"
echo "==================================================="
echo ""

# Step 1: Request Verification
echo "STEP 1: Requesting email verification..."
VERIFICATION_RESPONSE=$(curl -s -X POST ${BASE_URL}/request-verification \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\"}")

echo "Response: $VERIFICATION_RESPONSE"
echo ""
echo "CHECK YOUR BACKEND LOGS FOR THE VERIFICATION CODE"
echo "Enter the 6-digit code: "
read CODE
echo ""

# Step 2: Verify Email
echo "STEP 2: Verifying email with code ${CODE}..."
VERIFY_RESPONSE=$(curl -s -X POST ${BASE_URL}/verify-email \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"code\":\"${CODE}\"}")

echo "Response: $VERIFY_RESPONSE"
echo ""

# Step 3: Register
echo "STEP 3: Completing registration..."
REGISTER_RESPONSE=$(curl -s -X POST ${BASE_URL}/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"name\":\"${NAME}\",\"username\":\"${USERNAME}\",\"password\":\"${PASSWORD}\",\"passwordConfirm\":\"${PASSWORD}\"}")

echo "Response: $REGISTER_RESPONSE"
echo ""

# Extract tokens
ACCESS_TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
REFRESH_TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"refreshToken":"[^"]*"' | cut -d'"' -f4)

echo "Access Token: $ACCESS_TOKEN"
echo ""

# Step 4: Get Current User
echo "STEP 4: Getting current user with access token..."
USER_RESPONSE=$(curl -s -X GET ${BASE_URL}/me \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

echo "Response: $USER_RESPONSE"
echo ""

# Step 5: Login
echo "STEP 5: Testing login with same credentials..."
LOGIN_RESPONSE=$(curl -s -X POST ${BASE_URL}/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")

echo "Response: $LOGIN_RESPONSE"
echo ""

# Step 6: Refresh Token
echo "STEP 6: Refreshing access token..."
REFRESH_RESPONSE=$(curl -s -X POST ${BASE_URL}/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"${REFRESH_TOKEN}\"}")

echo "Response: $REFRESH_RESPONSE"
echo ""

echo "==================================================="
echo "ALL TESTS COMPLETED!"
echo "==================================================="

