# Authentication Setup Guide

This guide will help you set up MySQL and configure authentication for DocuMind.

## Prerequisites

1. **MySQL Server** - Install and start MySQL server
2. **Python 3.11+** - Already installed
3. **Virtual Environment** - Already created

## Step 1: Install MySQL Server

### On Fedora/RHEL:
```bash
sudo dnf install mysql-server
sudo systemctl start mysqld
sudo systemctl enable mysqld
```

### On Ubuntu/Debian:
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

### On macOS (with Homebrew):
```bash
brew install mysql
brew services start mysql
```

## Step 2: Secure MySQL Installation

```bash
sudo mysql_secure_installation
```

Follow the prompts to set a root password and secure the installation.

## Step 3: Create Database

```bash
sudo mysql -u root -p
```

Enter your root password when prompted, then run:

```sql
CREATE DATABASE documind;
CREATE USER IF NOT EXISTS 'documind_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON documind.* TO 'documind_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Replace `your_secure_password` with a strong password.

## Step 4: Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` with your actual database credentials:
```env
DATABASE_URL=mysql+pymysql://documind_user:your_secure_password@localhost:3306/documind
SECRET_KEY=your-generated-secret-key
```

3. Generate a secure SECRET_KEY:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

4. Update `app/alembic.ini` with your database URL:
```ini
sqlalchemy.url = mysql+pymysql://documind_user:your_secure_password@localhost:3306/documind
```

## Step 5: Run Database Migrations

```bash
cd app
alembic revision --autogenerate -m "Add users, documents, and refresh_tokens tables"
alembic upgrade head
```

This will create the following tables:
- `users` - User accounts
- `documents` - Document metadata
- `refresh_tokens` - Refresh token storage

## Step 6: Start the API

```bash
cd app
uvicorn main:app --reload --host 0.0.0.0 --port 8080
```

## Step 7: Test Authentication

### Register a User
```bash
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "securepassword123",
    "full_name": "Test User"
  }'
```

### Login
```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "securepassword123"
  }'
```

Save the `access_token` and `refresh_token` from the response.

### Upload a Document (Protected Endpoint)
```bash
curl -X POST http://localhost:8080/documents \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@/path/to/your/document.pdf"
```

### Search Documents (Protected Endpoint)
```bash
curl -X POST http://localhost:8080/search \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is this document about?",
    "k": 5
  }'
```

## API Endpoints

### Authentication Endpoints
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login and get tokens
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout (revoke refresh token)
- `GET /auth/me` - Get current user info

### Protected Endpoints (Require Authentication)
- `POST /documents` - Upload and index a PDF
- `POST /search` - Search documents
- `POST /ask` - Ask questions about documents

### Public Endpoints
- `GET /` - Health check
- `DELETE /reset_db` - Reset ChromaDB (not recommended in production)

## Troubleshooting

### MySQL Connection Error
If you get "Access denied" error:
1. Verify MySQL is running: `sudo systemctl status mysql`
2. Check credentials in `.env` file
3. Ensure database exists: `sudo mysql -u root -p -e "SHOW DATABASES;"`

### Migration Error
If alembic fails:
1. Check DATABASE_URL in both `.env` and `app/alembic.ini`
2. Ensure MySQL user has proper privileges
3. Try: `alembic current` to check migration status

### Token Validation Error
If you get 401 errors:
1. Ensure you're sending the token in the `Authorization` header
2. Format: `Authorization: Bearer <token>`
3. Check token hasn't expired (30 minutes for access tokens)

## Security Notes

1. **Never commit `.env` file** to version control
2. **Use strong passwords** for MySQL and SECRET_KEY
3. **Change default credentials** before production deployment
4. **Use HTTPS** in production (not HTTP)
5. **Implement rate limiting** to prevent brute-force attacks
6. **Consider adding email verification** for registration

## Next Steps

After authentication is working:
1. Update the frontend to handle authentication
2. Add token refresh logic
3. Implement role-based access control
4. Add user profile management
5. Implement document sharing between users
