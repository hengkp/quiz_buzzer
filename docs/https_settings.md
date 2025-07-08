# 🔒 HTTPS Settings Guide

## Quick Start

### 1. Generate SSL Certificate (OpenSSL)
```bash
# Create ssl directory and generate certificate
cd web
mkdir -p ssl
openssl req -x509 -newkey rsa:2048 -keyout ssl/server.key -out ssl/server.crt -days 365 -nodes -subj "/CN=localhost"
```

### 2. Start HTTPS Server
```bash
# Use default certificate (ssl/server.crt and ssl/server.key)
python dev_server.py --https

# Or specify custom certificate paths
python dev_server.py --https --cert mycert.crt --key mykey.key
```

### 3. Access Your Server
- **Main UI**: https://localhost:8000
- **Admin Panel**: https://localhost:8000/admin

**Note**: Arduino now uses **9600 baud** for reliable communication (changed from 115200)

## 📋 Certificate Generation

### Default OpenSSL Command
```bash
cd web
mkdir -p ssl
openssl req -x509 -newkey rsa:2048 -keyout ssl/server.key -out ssl/server.crt -days 365 -nodes -subj "/CN=localhost"
```

**What this does:**
- Creates `web/ssl/` directory
- Generates 2048-bit RSA private key (`ssl/server.key`)
- Creates self-signed certificate (`ssl/server.crt`)
- Valid for 365 days
- No password protection (`-nodes`)
- Common Name set to "localhost"

### Custom Certificate Details
```bash
# Interactive certificate generation (prompts for details)
cd web
mkdir -p ssl
openssl req -x509 -newkey rsa:2048 -keyout ssl/server.key -out ssl/server.crt -days 365 -nodes
```

**You'll be prompted for:**
- Country Name (2 letter code)
- State or Province Name
- City or Locality Name
- Organization Name
- Organizational Unit Name
- Common Name (your domain/IP)
- Email Address

## 🚀 Server Commands

### HTTP Mode (Default)
```bash
python dev_server.py
```
- URL: http://localhost:8000
- No encryption
- Best for local development

### HTTPS Mode (Default Certificate)
```bash
python dev_server.py --https
```
- URL: https://localhost:8000
- Uses `ssl/server.crt` and `ssl/server.key`
- Self-signed certificate (browser warning expected)

### HTTPS Mode (Custom Certificate)
```bash
python dev_server.py --https --cert mycert.crt --key mykey.key
```
- URL: https://localhost:8000
- Uses your custom certificate files
- For production deployments

### Network Access
```bash
# Allow access from other devices on your network (default behavior)
python dev_server.py --https --port 8443

# Or explicitly specify host
python dev_server.py --https --host 0.0.0.0 --port 8443
```
- Access from other devices: https://YOUR_IP:8443
- Replace YOUR_IP with your computer's IP address
- Default host (0.0.0.0) allows network access automatically

## 🔧 Advanced Options

### Custom Port
```bash
python dev_server.py --https --port 8443
```

### Custom Host
```bash
python dev_server.py --https --host 192.168.1.100
```

### All Options Combined
```bash
python dev_server.py --https --host 0.0.0.0 --port 8443 --cert ssl/server.crt --key ssl/server.key
```

## 📁 File Structure

After running the OpenSSL command, your directory structure will be:
```
web/
├── ssl/
│   ├── server.crt    # SSL certificate
│   └── server.key    # Private key
├── buzzer.html
├── dev_server.py
└── requirements.txt
```

## 🛠️ Troubleshooting

### Certificate Not Found
If you get "Certificate file not found" errors:
```bash
# Check if files exist
ls -la web/ssl/
```

### Permission Errors
```bash
# Fix permissions
chmod 644 web/ssl/server.crt
chmod 600 web/ssl/server.key
```

### Browser Security Warning
When using self-signed certificates, browsers will show a security warning:
1. Click "Advanced" or "Show details"
2. Click "Proceed to localhost (unsafe)" or "Continue to site"
3. This is normal for self-signed certificates

### OpenSSL Not Found
**macOS**: `brew install openssl`
**Ubuntu/Debian**: `sudo apt install openssl`
**Windows**: Download from https://slproweb.com/products/Win32OpenSSL.html

## 🔒 Security Notes

### Development
- Self-signed certificates are fine for development
- Browser warnings are expected and can be bypassed
- Use HTTP for simple local testing

### Production
- Use real SSL certificates from a Certificate Authority
- Consider Let's Encrypt for free certificates
- Never use self-signed certificates in production
- Set proper file permissions (certificate: 644, key: 600)

## 📞 Command Reference

```bash
# Generate certificate
openssl req -x509 -newkey rsa:2048 -keyout ssl/server.key -out ssl/server.crt -days 365 -nodes -subj "/CN=localhost"

# Start server (HTTP)
python dev_server.py

# Start server (HTTPS, default certificate)
python dev_server.py --https

# Start server (HTTPS, custom certificate)
python dev_server.py --https --cert mycert.crt --key mykey.key

# Network access (custom port)
python dev_server.py --https --port 8443
```

## 🎯 Quick Setup Checklist

- [ ] Navigate to `web/` directory
- [ ] Run OpenSSL command to generate certificate
- [ ] Start server with `python dev_server.py --https`
- [ ] Open https://localhost:8000 in browser
- [ ] Accept browser security warning (for self-signed certificate)
- [ ] Verify buzzer system works with HTTPS

The server will automatically use `ssl/server.crt` and `ssl/server.key` when `--https` is specified without custom paths! 🔒 