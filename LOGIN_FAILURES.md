# 🚫 Login Failure Scenarios Documentation

## **Backend Authentication Failures**

### **1. Invalid Credentials**
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrongpassword"}'
```
**Response:**
```json
{"message": "Invalid email or password"}
```
**Status Code:** `401 Unauthorized`

### **2. Non-existent User**
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nonexistent@example.com","password":"Test123456"}'
```
**Response:**
```json
{"message": "Invalid email or password"}
```
**Status Code:** `401 Unauthorized`

### **3. Validation Errors**

#### Empty Email:
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"","password":"Test123456"}'
```
**Response:**
```json
{
  "message": "Validation failed",
  "errors": [
    {
      "type": "field",
      "value": "",
      "msg": "Please provide a valid email",
      "path": "email",
      "location": "body"
    }
  ]
}
```
**Status Code:** `400 Bad Request`

#### Empty Password:
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":""}'
```
**Response:**
```json
{
  "message": "Validation failed",
  "errors": [
    {
      "type": "field",
      "value": "",
      "msg": "Password is required",
      "path": "password",
      "location": "body"
    }
  ]
}
```
**Status Code:** `400 Bad Request`

#### Invalid Email Format:
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid-email","password":"Test123456"}'
```
**Response:**
```json
{
  "message": "Validation failed",
  "errors": [
    {
      "type": "field",
      "value": "invalid-email",
      "msg": "Please provide a valid email",
      "path": "email",
      "location": "body"
    }
  ]
}
```
**Status Code:** `400 Bad Request`

### **4. Malformed JSON**
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456"'
```
**Response:**
```json
{
  "message": "Expected ',' or '}' after property value in JSON at position 51 (line 1 column 52)",
  "stack": "SyntaxError: Expected ',' or '}' after property value in JSON..."
}
```
**Status Code:** `400 Bad Request`

### **5. Missing Content-Type Header**
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -d '{"email":"test@example.com","password":"Test123456"}'
```
**Response:**
```json
{
  "message": "Validation failed",
  "errors": [
    {
      "type": "field",
      "msg": "Please provide a valid email",
      "path": "email",
      "location": "body"
    },
    {
      "type": "field",
      "msg": "Password is required",
      "path": "password",
      "location": "body"
    }
  ]
}
```
**Status Code:** `400 Bad Request`

## **Authentication Middleware Failures**

### **1. No Authorization Header**
```bash
curl -X GET http://localhost:5001/api/auth/me
```
**Response:**
```json
{"message": "Access denied. No token provided or invalid format."}
```
**Status Code:** `401 Unauthorized`

### **2. Invalid Token Format**
```bash
curl -X GET http://localhost:5001/api/auth/me \
  -H "Authorization: InvalidTokenFormat"
```
**Response:**
```json
{"message": "Access denied. No token provided or invalid format."}
```
**Status Code:** `401 Unauthorized`

### **3. Invalid/Malformed JWT Token**
```bash
curl -X GET http://localhost:5001/api/auth/me \
  -H "Authorization: Bearer invalid-jwt-token"
```
**Response:**
```json
{"message": "Invalid token."}
```
**Status Code:** `401 Unauthorized`

### **4. Expired Token**
When using an expired JWT token:
**Response:**
```json
{"message": "Token expired."}
```
**Status Code:** `401 Unauthorized`

### **5. User No Longer Exists**
When using a valid token for a deleted user:
**Response:**
```json
{"message": "Token is no longer valid. User not found."}
```
**Status Code:** `401 Unauthorized`

## **Frontend Login Failures**

### **1. Frontend Form Validation**
The React form validates:
- **Email Required:** "Email is required"
- **Invalid Email:** "Invalid email address"
- **Password Required:** "Password is required"
- **Password Too Short:** "Password must be at least 6 characters"

### **2. Network Errors**
When backend is down:
```javascript
try {
  await login(data);
} catch (error) {
  // Network error or server down
  showError('Login failed. Please try again.');
}
```

### **3. Server Response Errors**
Frontend handles server errors:
```javascript
catch (error) {
  const message = error.response?.data?.message || 'Login failed. Please try again.';
  showError(message);
}
```

## **Common Login Failure Scenarios**

### **🔴 Most Common Failures:**

1. **Wrong Password** (401) - User enters incorrect password
2. **Invalid Email** (400) - Email format validation fails
3. **Missing Fields** (400) - Email or password not provided
4. **Account Not Found** (401) - User tries to login with unregistered email
5. **Token Expired** (401) - User session expired, needs to login again
6. **Server Down** (Network Error) - Backend not responding

### **🛡️ Security Features:**

- **Generic Error Messages** - "Invalid email or password" for both wrong email and wrong password
- **Input Validation** - Server-side validation with express-validator
- **JWT Token Security** - Tokens expire after 7 days by default
- **Password Hashing** - bcrypt with salt rounds for password security
- **CORS Protection** - Cross-origin requests controlled

### **🔧 Debugging Login Issues:**

1. **Check Backend Logs** - Server console shows detailed error messages
2. **Verify Database Connection** - Ensure MongoDB is running
3. **Test API Endpoints** - Use curl or Postman to test authentication
4. **Check Environment Variables** - JWT_SECRET must be set
5. **Validate User Exists** - Confirm user account is in database

### **✅ Successful Login Example:**
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test2@example.com","password":"Test123456"}'
```
**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "68cc1e399bd0ca93598b1dfb",
    "name": "Test User 2",
    "email": "test2@example.com"
  }
}
```
**Status Code:** `200 OK`