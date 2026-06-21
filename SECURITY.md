# Security Policy

Security is a primary priority for Carbon Mirror. This document outlines our security policies and how to report vulnerabilities.

## Supported Versions

Only the `main` branch and the latest active release receive security updates.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

Please **DO NOT** report security vulnerabilities via public GitHub issues.

If you discover a security vulnerability, please send an email to `security@carbonmirror.example.com`. 
We will acknowledge receipt of your vulnerability report within 48 hours and strive to send you regular updates about our progress.

## Security Mitigations (OWASP Top 10)

We have hardened the application against common web vulnerabilities:
- **Injection Flaws**: All Firestore queries use strict parameterized SDK methods. Dynamic HTML rendering leverages aggressive `sanitizeHTML()` to prevent DOM-based XSS.
- **Broken Authentication**: We utilize Firebase Authentication. The development environment uses strict CI/CD pipelines to ensure secrets are never committed.
- **Sensitive Data Exposure**: API keys (Maps, Firebase, Gemini) are restricted by HTTP referrers and IP constraints in the Google Cloud Console.
- **Security Misconfiguration**: `firebase.json` enforces strict security headers (Content-Security-Policy, X-Content-Type-Options, X-Frame-Options, X-XSS-Protection).
- **Rate Limiting**: Cloud Functions utilize transaction-based rate-limiting to prevent API abuse and denial-of-wallet attacks against the Gemini API.
