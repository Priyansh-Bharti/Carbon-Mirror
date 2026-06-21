# Contributing to Carbon Mirror

First off, thank you for considering contributing to Carbon Mirror! It's people like you that make this application a powerful tool for environmental awareness.

## Code of Conduct
By participating in this project, you agree to abide by our Code of Conduct. We expect all contributors to maintain a respectful, welcoming, and inclusive environment.

## How Can I Contribute?

### Reporting Bugs
- **Check the issue tracker** to see if the bug has already been reported.
- If it hasn't, open a new **Bug Report** using the provided issue template.
- Include detailed steps to reproduce the bug, your environment details, and screenshots if applicable.

### Suggesting Enhancements
- Open a new **Feature Request** using the provided issue template.
- Describe the feature clearly and explain *why* it would be beneficial for the project and its users.

### Pull Requests
1. **Fork the repo** and create your branch from `main`.
2. **Branch Naming**: Use `feature/your-feature-name`, `bugfix/issue-number-description`, or `chore/task-description`.
3. **Coding Standards**:
   - We strictly adhere to ES Modules and Vanilla CSS3.
   - All JavaScript files must begin with `'use strict';`.
   - Maximum function length is 30 lines.
   - Use `logger` instead of `console.log` in client-side code.
   - Maintain 100% test coverage for logic in `carbon.js` and `utils.js`.
4. **Testing**: Run `npm run test` and ensure all tests pass before submitting.
5. **Security**: Ensure no API keys or secrets are hardcoded. Use the `config.js` patterns for environment variables.
6. **Submit PR**: Open a Pull Request and fill out the provided PR template.

## Local Development
Refer to the `README.md` for instructions on setting up your local environment and Firebase Emulators.

Thank you for contributing to a greener future!
