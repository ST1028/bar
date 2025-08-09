#!/bin/bash

# Bar Order System API Test Script

set -e

# Configuration
API_URL="${1:-https://your-api-id.execute-api.ap-northeast-1.amazonaws.com/prod}"
JWT_TOKEN="${2:-your-jwt-token}"

echo "🍺 Bar Order System API Test"
echo "API URL: $API_URL"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    echo -e "\n${YELLOW}Testing: $description${NC}"
    echo "Method: $method $endpoint"
    
    if [ -n "$data" ]; then
        echo "Data: $data"
        response=$(curl -s -w "\n%{http_code}" -X $method \
            -H "Authorization: Bearer $JWT_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$API_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method \
            -H "Authorization: Bearer $JWT_TOKEN" \
            "$API_URL$endpoint")
    fi
    
    # Extract status code (last line)
    status_code=$(echo "$response" | tail -n1)
    # Extract response body (all except last line)
    body=$(echo "$response" | head -n -1)
    
    if [ "$status_code" -ge 200 ] && [ "$status_code" -lt 300 ]; then
        echo -e "${GREEN}✅ SUCCESS (HTTP $status_code)${NC}"
        echo "Response: $body"
    else
        echo -e "${RED}❌ FAILED (HTTP $status_code)${NC}"
        echo "Response: $body"
    fi
}

# Check if API URL and JWT token are provided
if [ "$API_URL" = "https://your-api-id.execute-api.ap-northeast-1.amazonaws.com/prod" ] || [ "$JWT_TOKEN" = "your-jwt-token" ]; then
    echo -e "${YELLOW}⚠️  Please provide API URL and JWT token:${NC}"
    echo "Usage: $0 <API_URL> <JWT_TOKEN>"
    echo ""
    echo "Example:"
    echo "$0 https://abc123.execute-api.ap-northeast-1.amazonaws.com/prod eyJhbGciOiJSUzI1NiI..."
    echo ""
    exit 1
fi

# Test endpoints
test_endpoint "GET" "/menus" "Get menu categories and items"

test_endpoint "GET" "/patrons" "Get user's patrons"

test_endpoint "POST" "/patrons" "Create a new patron" '{"name":"テスト太郎"}'

test_endpoint "GET" "/orders" "Get order history"

# Note: This will fail without a valid patron ID
# test_endpoint "POST" "/orders" "Create a new order" '{"patronId":"test-patron-id","items":[{"menuId":"1","quantity":1}]}'

echo -e "\n${GREEN}🎉 API Test Complete!${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Create a patron using the frontend or API"
echo "2. Test order creation with a valid patron ID"
echo "3. Check Slack notifications"
echo "4. Verify order history display"