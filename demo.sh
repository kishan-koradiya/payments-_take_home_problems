#!/bin/bash
# Demo script for Payment Gateway Proxy & Subscription Billing Simulator

echo "🚀 Payment Gateway Proxy & Subscription Billing Simulator Demo"
echo "================================================================="

BASE_URL="http://localhost:3000"

echo ""
echo "📊 Health Check:"
curl -s $BASE_URL/health | jq '.' 2>/dev/null || curl -s $BASE_URL/health

echo ""
echo ""
echo "💳 Testing Payment Processing:"
echo "-------------------------------"

echo "1. Low-risk payment (small amount, good domain):"
curl -s -X POST $BASE_URL/api/v1/charge \
  -H "Content-Type: application/json" \
  -d '{"amount": 500, "currency": "USD", "source": "tok_visa", "email": "user@gmail.com"}' | \
  jq '.' 2>/dev/null || curl -s -X POST $BASE_URL/api/v1/charge \
  -H "Content-Type: application/json" \
  -d '{"amount": 500, "currency": "USD", "source": "tok_visa", "email": "user@gmail.com"}'

echo ""
echo "2. High-risk payment (large amount, suspicious domain):"
curl -s -X POST $BASE_URL/api/v1/charge \
  -H "Content-Type: application/json" \
  -d '{"amount": 100000, "currency": "USD", "source": "tok_test", "email": "user@test.com"}' | \
  jq '.' 2>/dev/null || curl -s -X POST $BASE_URL/api/v1/charge \
  -H "Content-Type: application/json" \
  -d '{"amount": 100000, "currency": "USD", "source": "tok_test", "email": "user@test.com"}'

echo ""
echo ""
echo "📋 Subscription Creation:"
echo "-------------------------"

echo "1. Creating disaster relief subscription:"
curl -s -X POST $BASE_URL/api/v1/subscriptions \
  -H "Content-Type: application/json" \
  -d '{"donorId": "donor001", "amount": 2500, "currency": "USD", "interval": "monthly", "campaignDescription": "Emergency food and clean water for earthquake victims in Nepal"}' | \
  jq '.' 2>/dev/null || curl -s -X POST $BASE_URL/api/v1/subscriptions \
  -H "Content-Type: application/json" \
  -d '{"donorId": "donor001", "amount": 2500, "currency": "USD", "interval": "monthly", "campaignDescription": "Emergency food and clean water for earthquake victims in Nepal"}'

echo ""
echo "2. Creating education subscription:"
curl -s -X POST $BASE_URL/api/v1/subscriptions \
  -H "Content-Type: application/json" \
  -d '{"donorId": "donor002", "amount": 1000, "currency": "USD", "interval": "weekly", "campaignDescription": "Building schools and providing educational materials for children in rural communities"}' | \
  jq '.' 2>/dev/null || curl -s -X POST $BASE_URL/api/v1/subscriptions \
  -H "Content-Type: application/json" \
  -d '{"donorId": "donor002", "amount": 1000, "currency": "USD", "interval": "weekly", "campaignDescription": "Building schools and providing educational materials for children in rural communities"}'

echo ""
echo ""
echo "📈 Statistics:"
echo "--------------"

echo "Transaction Statistics:"
curl -s $BASE_URL/api/v1/transactions/stats | \
  jq '.' 2>/dev/null || curl -s $BASE_URL/api/v1/transactions/stats

echo ""
echo "Subscription Statistics:"
curl -s $BASE_URL/api/v1/subscriptions/stats | \
  jq '.' 2>/dev/null || curl -s $BASE_URL/api/v1/subscriptions/stats

echo ""
echo ""
echo "✅ Demo completed! Check the logs above to see:"
echo "   - Fraud detection in action"
echo "   - Provider routing decisions"
echo "   - LLM-powered explanations (if enabled)"
echo "   - Campaign analysis and tagging"
echo "   - Real-time statistics"
echo ""
echo "For more endpoints, visit: $BASE_URL/"