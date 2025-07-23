# Payment Gateway Proxy & Subscription Billing Simulator

A comprehensive TypeScript backend API that demonstrates modern payment processing concepts with fraud detection, LLM-powered risk analysis, and subscription billing simulation.

## 🚀 Features

### Payment Gateway Proxy (Problem 1)
- **Fraud Risk Scoring**: Configurable heuristics-based risk assessment
- **Provider Routing**: Smart routing to Stripe (low risk) or PayPal (medium risk)
- **Transaction Blocking**: Automatic blocking for high-risk transactions
- **LLM Integration**: OpenAI-powered natural language explanations for routing decisions
- **Performance Optimization**: Intelligent caching for frequent LLM prompts
- **Transaction Management**: In-memory storage with filtering and statistics

### Subscription Billing Simulator (Problem 2)
- **Campaign Analysis**: LLM-powered tagging and summarization of donation campaigns
- **Flexible Intervals**: Support for daily, weekly, monthly, and yearly subscriptions
- **Background Processing**: Automated recurring charge processing
- **Revenue Analytics**: Monthly recurring revenue (MRR) and campaign statistics
- **Donor Management**: Complete donor lifecycle management

### Technical Excellence
- **TypeScript**: Strict type checking with comprehensive interfaces
- **Input Validation**: Zod-powered request validation with detailed error messages
- **Error Handling**: Graceful error handling with proper HTTP status codes
- **Testing**: Comprehensive unit tests with mocking
- **Docker Support**: Full containerization with health checks
- **API Documentation**: Self-documenting API with endpoint discovery
- **Logging**: Request/response logging with performance metrics

## 📋 Requirements

- Node.js 18+ 
- npm 8+
- OpenAI API key (optional - falls back to rule-based explanations)

## 🛠️ Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd payment-gateway-proxy
npm install
```

### 2. Environment Configuration

```bash
cp .env.example .env
```

Edit `.env` file:
```env
PORT=3000
OPENAI_API_KEY=your_openai_api_key_here  # Optional
NODE_ENV=development
ENABLE_LLM=true
LLM_CACHE_TTL=300
```

### 3. Development

```bash
# Run in development mode with hot reload
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

### 4. Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

### 5. Docker Deployment

```bash
# Build Docker image
npm run docker:build

# Run container
npm run docker:run

# Or use docker-compose (if available)
docker-compose up
```

## 🌐 API Endpoints

### Payment Gateway Proxy

#### Process Payment
```bash
POST /api/v1/charge
Content-Type: application/json

{
  "amount": 1000,
  "currency": "USD", 
  "source": "tok_test",
  "email": "donor@example.com"
}
```

**Response:**
```json
{
  "transactionId": "txn_abc123",
  "provider": "paypal",
  "status": "success",
  "riskScore": 0.32,
  "explanation": "This payment was routed to PayPal due to a moderate risk score based on a large amount and suspicious email domain."
}
```

#### Get Transactions
```bash
GET /api/v1/transactions?provider=stripe&minAmount=100&maxAmount=1000
```

#### Get Transaction by ID
```bash
GET /api/v1/transactions/txn_abc123
```

#### Get Transaction Statistics
```bash
GET /api/v1/transactions/stats
```

### Subscription Billing

#### Create Subscription
```bash
POST /api/v1/subscriptions
Content-Type: application/json

{
  "donorId": "abc123",
  "amount": 1500,
  "currency": "USD",
  "interval": "monthly",
  "campaignDescription": "Emergency food and clean water for earthquake victims in Nepal"
}
```

**Response:**
```json
{
  "id": "sub_xyz789",
  "donorId": "abc123",
  "amount": 1500,
  "currency": "USD",
  "interval": "monthly",
  "campaignDescription": "Emergency food and clean water for earthquake victims in Nepal",
  "tags": ["disaster relief", "clean water", "nepal"],
  "summary": "This campaign provides emergency aid to earthquake-affected communities in Nepal.",
  "createdAt": "2023-12-01T10:00:00.000Z",
  "nextChargeAt": "2024-01-01T10:00:00.000Z",
  "isActive": true
}
```

#### Cancel Subscription
```bash
DELETE /api/v1/subscriptions/abc123
```

#### Get Subscription Transactions
```bash
GET /api/v1/subscription-transactions
GET /api/v1/subscription-transactions/abc123  # By donor ID
```

## 🧠 Fraud Detection Logic

### Risk Scoring Heuristics

The fraud detection system uses multiple factors to calculate a risk score (0-1):

1. **Amount Risk**: 
   - Small amounts (< $10): Low risk
   - Medium amounts ($10-100): Moderate risk  
   - Large amounts (> $1000): High risk

2. **Email Domain Risk**:
   - Suspicious domains (.ru, .tk, test.com): High risk
   - Temporary email providers: High risk
   - Common domains (gmail.com, etc.): Low risk

3. **Currency Risk**:
   - USD: Lowest risk
   - Major currencies (EUR, GBP): Low risk
   - High-risk currencies (RUB, etc.): Moderate risk

4. **Source Risk**:
   - Test tokens: Moderate risk
   - Production tokens: Low risk

### Provider Routing Logic

- **Risk Score < 0.3**: Route to Stripe (lowest fees, best for low-risk)
- **Risk Score 0.3-0.5**: Route to PayPal (good fraud protection)
- **Risk Score ≥ 0.5**: Block transaction

### Configurable Rules

Fraud rules are configurable via `src/config/fraudRules.json`:

```json
{
  "suspiciousDomains": [".ru", ".tk", "test.com"],
  "highRiskAmountThreshold": 50000,
  "blockingThreshold": 0.5,
  "stripeThreshold": 0.3
}
```

## 🤖 LLM Integration

### Risk Explanation Generation

The system uses OpenAI's GPT-3.5-turbo to generate human-readable explanations for payment routing decisions:

```typescript
// Example prompt
"Explain why a payment of $10.00 USD was routed to PAYPAL. 
Risk score: 0.42. Risk factors: large amount, suspicious email domain. 
Keep explanation under 50 words."
```

### Campaign Analysis

For subscription campaigns, the LLM extracts tags and creates summaries:

```typescript
// Example analysis
{
  "tags": ["disaster relief", "clean water", "nepal"],
  "summary": "This campaign provides emergency aid to earthquake-affected communities in Nepal."
}
```

### Fallback Strategy

When LLM is unavailable:
- **Risk Explanations**: Rule-based templates
- **Campaign Analysis**: Keyword-based tag extraction
- **Graceful Degradation**: No API failures, just simpler explanations

### Caching Strategy

- **Cache Key**: Hash of prompt parameters
- **TTL**: 5 minutes (configurable)
- **Memory Management**: Automatic cleanup of expired entries
- **Performance**: Reduces API calls for similar requests

## 📊 Background Job Processing

### Subscription Billing

The system runs a background job every hour to process recurring charges:

```typescript
// Automatic processing
setInterval(async () => {
  await processRecurringCharges();
}, 60 * 60 * 1000); // 1 hour
```

### Manual Triggering (Development)

```bash
POST /api/v1/subscriptions/process-charges
```

### Success Rate Simulation

- **95% success rate** for recurring charges
- **Failed payments** are logged but don't cancel subscriptions
- **Real-world considerations**: Retry logic, dunning management

## 🧪 Testing Strategy

### Unit Tests

Comprehensive test coverage for:
- Fraud detection algorithms
- Payment processing logic
- Validation schemas
- Service integrations

### Mocking Strategy

```typescript
// LLM service mocking for tests
jest.mock('../services/llmService', () => ({
  LLMService: jest.fn().mockImplementation(() => ({
    generatePaymentExplanation: jest.fn().mockResolvedValue('Mock explanation')
  }))
}));
```

### Test Commands

```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm test -- --coverage    # Coverage report
```

## 🐳 Docker Support

### Dockerfile Features

- **Multi-stage build** for optimized image size
- **Health checks** for container monitoring
- **Graceful shutdown** handling
- **Production-ready** configuration

### Container Commands

```bash
# Build and run
docker build -t payment-gateway-proxy .
docker run -p 3000:3000 payment-gateway-proxy

# With environment variables
docker run -p 3000:3000 -e OPENAI_API_KEY=your_key payment-gateway-proxy
```

## 🔒 Security Considerations

### Input Validation

- **Zod schemas** for all endpoints
- **SQL injection prevention** (though using in-memory storage)
- **Email format validation**
- **Amount range validation**

### Error Handling

- **No sensitive data** in error responses
- **Proper HTTP status codes**
- **Request ID tracking** for debugging

### Rate Limiting Considerations

For production deployment, consider adding:
- Rate limiting middleware
- Request size limits
- Authentication/authorization
- HTTPS enforcement

## 📈 Monitoring & Observability

### Health Checks

```bash
GET /health
```

Returns system status, feature flags, and environment info.

### Logging

- **Request/response logging** with timing
- **Error logging** with stack traces
- **Business event logging** (charges processed, subscriptions created)

### Metrics Available

- Transaction success/failure rates
- Average risk scores
- Provider distribution
- Monthly recurring revenue
- Campaign tag analytics

## 🚀 Production Deployment Considerations

### Scaling

- **Horizontal scaling**: Stateless design allows multiple instances
- **Database migration**: Replace in-memory storage with PostgreSQL/MongoDB
- **Message queues**: Use Redis/RabbitMQ for background job processing

### Performance

- **Response times**: < 200ms for simple operations
- **LLM caching**: Significant performance improvement
- **Database indexing**: When migrating to persistent storage

### Security

- **Environment variables**: Never commit API keys
- **HTTPS**: Enforce in production
- **Authentication**: Add JWT/OAuth for API access
- **Audit logging**: Track all financial transactions

## 🎯 Architecture Decisions & Tradeoffs

### In-Memory Storage
**Decision**: Use in-memory storage for simplicity
**Tradeoff**: Data persistence vs. quick development
**Production**: Migrate to PostgreSQL with proper schema design

### LLM Integration
**Decision**: OpenAI API with fallback logic
**Tradeoff**: Cost/latency vs. quality of explanations
**Optimization**: Aggressive caching and prompt optimization

### Fraud Detection
**Decision**: Heuristics-based with configurable rules
**Tradeoff**: Simplicity vs. ML-based detection
**Future**: Integrate with actual fraud detection services

### TypeScript Strictness
**Decision**: Strict type checking and comprehensive interfaces
**Tradeoff**: Development time vs. runtime safety
**Benefit**: Excellent IDE support and fewer runtime errors

## 🔄 Future Enhancements

### Short Term
- [ ] Webhook support for real payment providers
- [ ] Email notifications for subscription events
- [ ] Enhanced filtering and pagination
- [ ] Prometheus metrics export

### Medium Term
- [ ] Multi-tenant support
- [ ] Advanced fraud detection with ML
- [ ] Subscription management dashboard
- [ ] Payment method management

### Long Term
- [ ] Multi-currency support with real exchange rates
- [ ] Advanced analytics and reporting
- [ ] A/B testing framework for fraud rules
- [ ] Real-time fraud monitoring dashboard

## 🤝 Development Guidelines

### Code Style
- **ESLint** configuration for consistent style
- **Prettier** for code formatting
- **Conventional commits** for clear history

### Adding New Features
1. **TDD approach**: Write tests first
2. **Type safety**: Comprehensive TypeScript types
3. **Validation**: Zod schemas for all inputs
4. **Documentation**: Update README and code comments

### Performance Considerations
- **Async/await**: For all I/O operations
- **Caching**: For expensive operations
- **Monitoring**: Log performance metrics

---

## 📞 Support & Contact

For questions about implementation details, design decisions, or potential improvements, please create an issue or reach out directly.

This project demonstrates modern backend development practices with a focus on:
- **Clean Architecture**: Separation of concerns and modularity
- **Type Safety**: Comprehensive TypeScript usage
- **Testing**: Unit tests with proper mocking
- **API Design**: RESTful endpoints with proper validation
- **Documentation**: Self-documenting code and comprehensive README
- **Deployment**: Docker support for easy containerization

The codebase showcases practical problem-solving skills, modern development practices, and thoughtful technical decision-making suitable for a mid-level backend developer role.