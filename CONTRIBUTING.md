# Contributing to ChainTrack

First off, thank you for considering contributing to ChainTrack! It's people like you that make ChainTrack such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our commitment to creating a welcoming and respectful environment. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed and what behavior you expected**
- **Include screenshots if relevant**

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a step-by-step description of the suggested enhancement**
- **Explain why this enhancement would be useful**

### Pull Requests

1. Fork the repo and create your branch from `develop`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code lints
6. Issue that pull request!

## Development Setup

### Prerequisites

- Node.js 18+
- Python 3.10+
- Docker (optional but recommended)

### Local Development

```bash
# Clone your fork
git clone https://github.com/nobleenia/ChainTrack.git
cd ChainTrack

# Create a branch
git checkout -b feature/your-feature-name

# Install dependencies
cd backend && pip install -r requirements.txt
cd ../frontend && npm install
cd ../contracts && npm install

# Start development
docker-compose up -d
```

## Style Guides

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

### Python Style Guide

- Follow PEP 8
- Use type hints where appropriate
- Document functions and classes with docstrings

### JavaScript Style Guide

- Use ESLint configuration provided
- Prefer functional components with hooks
- Use TypeScript types where possible

### Solidity Style Guide

- Follow Solidity style guide
- Use NatSpec comments for functions
- Prefer composition over inheritance

## Questions?

Feel free to open an issue with your question or reach out to the maintainers.

Thank you for contributing! 🎉
