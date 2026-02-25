# Contributing to @kylebrodeur/type-safe-mapping

Thank you for your interest in contributing! We welcome contributions from the community.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/type-safe-mapping.git
   cd type-safe-mapping
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```

## Development Workflow

### Running Tests

```bash
npm test                 # Run tests
npm run test:coverage    # Run tests with coverage report
```

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```

### Building

```bash
npm run build
```

## Making Changes

1. **Create a new branch** for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

2. **Make your changes** following the code style of the project

3. **Add tests** for any new functionality

4. **Ensure all tests pass**:
   ```bash
   npm test
   npm run typecheck
   npm run lint
   ```

5. **Commit your changes** with a clear commit message:
   ```bash
   git commit -m "Add feature: description of your changes"
   ```

6. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request** on GitHub

## Code Style

- Use TypeScript strict mode
- Follow existing naming conventions
- Write clear, descriptive variable and function names
- Add JSDoc comments for public APIs
- Keep functions focused and single-purpose

## Testing Guidelines

- Write tests for all new features
- Maintain or improve code coverage
- Use descriptive test names that explain what is being tested
- Test edge cases and error conditions

## Reporting Issues

When reporting issues, please include:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected vs actual behavior
- Code samples demonstrating the issue
- Your environment (Node version, TypeScript version, OS)

## Questions?

Feel free to open an issue with the `question` label if you have any questions about contributing.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
