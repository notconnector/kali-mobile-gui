# Contributing to Kali Remote GUI

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Commit Guidelines](#commit-guidelines)
6. [Pull Request Process](#pull-request-process)
7. [Security](#security)

---

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

---

## Getting Started

### Prerequisites

- Node.js 18+
- JDK 17
- Android SDK
- Python 3.8+ (for bridge development)

### Fork and Clone

```bash
# Fork the repo on GitHub first, then:
git clone https://github.com/YOUR_USERNAME/kali-remote-gui.git
cd kali-remote-gui

# Add upstream remote
git remote add upstream https://github.com/notconnector/kali-remote-gui.git
```

### Install Dependencies

```bash
npm install
```

---

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-description
```

### 2. Make Changes

- Write clear, documented code
- Add tests for new functionality
- Update documentation as needed

### 3. Test Locally

```bash
# Start Metro bundler
npx react-native start

# Run on Android device/emulator
npx react-native run-android

# Run tests
npm test
```

### 4. Commit and Push

```bash
git add .
git commit -m "feat: add new feature description"
git push origin feature/your-feature-name
```

### 5. Create Pull Request

Go to GitHub and create a PR from your fork to the main repository.

---

## Coding Standards

### JavaScript/React Native

- Use ESLint configuration provided in the project
- Follow React Native best practices
- Use functional components with hooks
- Keep components under 300 lines; split if larger
- Use meaningful variable names

Example:
```javascript
// Good
const ToolCard = ({ tool, onPress }) => {
  const [isLoading, setIsLoading] = useState(false);
  // ...
};

// Avoid
const TC = (props) => {
  const [x, setX] = useState(false);
  // ...
};
```

### Python (Bridge)

- Follow PEP 8 style guide
- Use type hints where appropriate
- Document functions with docstrings
- Keep functions focused and under 50 lines

Example:
```python
def execute_command(command: str, timeout: int = 60) -> str:
    """
    Execute a shell command and return output.
    
    Args:
        command: The command to execute
        timeout: Maximum execution time in seconds
        
    Returns:
        Command output as string
        
    Raises:
        TimeoutError: If command exceeds timeout
    """
    # implementation
```

### File Organization

```
src/
├── components/     # Reusable UI components
├── screens/        # Screen components
├── utils/          # Utility functions and managers
├── config/         # Configuration files
├── data/           # Static data (tools, categories)
├── theme/          # Styling and theme
└── context/        # React contexts
```

---

## Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, no logic change)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks
- `security:` Security-related changes

### Examples

```
feat(bridge): add SSH key authentication support

fix(ui): resolve terminal scroll issue on Android 12

docs: update SETUP.md with Docker instructions

security(bridge): implement rate limiting for commands
```

---

## Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] All tests pass (`npm test`)
- [ ] Documentation updated if needed
- [ ] No hardcoded secrets or credentials
- [ ] Security implications considered

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Security Considerations
Any security implications?

## Screenshots (if UI changes)
```

### Review Process

1. Maintainers will review within 5 business days
2. Address review comments
3. Ensure CI checks pass
4. Squash commits if requested
5. Merge will be done by maintainers

---

## Security

### Reporting Vulnerabilities

**DO NOT** create public issues for security vulnerabilities.

Instead:
1. Email security concerns to: security@example.com (replace with actual)
2. Include detailed description and reproduction steps
3. Allow 90 days for fix before public disclosure

### Security Best Practices for Contributors

- Never commit passwords, API keys, or private keys
- Use environment variables for sensitive configuration
- Validate all user inputs
- Use parameterized commands to prevent injection
- Keep dependencies updated

---

## Questions?

- Check existing [Issues](https://github.com/notconnector/kali-remote-gui/issues)
- Join [GitHub Discussions](https://github.com/notconnector/kali-remote-gui/discussions)
- Create a new issue for bugs or feature requests

Thank you for contributing!
