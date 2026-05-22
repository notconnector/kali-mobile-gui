# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-05-22

### Added
- **Tool Scanner**: Comprehensive pentesting tool detection and management
  - Detects 80+ installed tools via `which` command
  - One-click installation of missing tools via `apt-get`
  - Add detected tools to Custom Tools library
  - Filter by All/Installed/Missing status
  - Real-time scan statistics
- **Settings About Section**: Simple information table
  - Version display (v1.3.0)
  - Exact tool count (110 built-in + custom)
  - Categories count (12)
  - Connection status indicator
- **Splash Screen Enhancements**: Loading status with tool counting
  - Real-time tool counting during app startup
  - Version display on splash screen
  - Connection status indicators
- **Dashboard Improvements**: Dynamic tool count display
  - Exact tool count instead of hardcoded "130+"
  - Category header with tool count
  - About button with version and tool count (removed)
- **Settings Integration**: About section as table
  - Settings → About table with key information
  - Dynamic tool count including custom tools
  - No navigation to separate About screen
- **TypeScript Migration**: Full codebase conversion to TypeScript
  - Strong type definitions for hosts, commands, tools, and application state
  - Improved IDE support and error detection
  - Type-safe React Native components
- **Multi-Host Support**: Manage multiple Kali Linux connections
  - Add/edit/delete SSH host profiles
  - Switch between different hosts
  - Per-host connection history and settings
- **File Browser Framework**: Foundation for remote file operations
  - Directory listing and navigation
  - File type detection (directory/file/link)
  - Permission and ownership information
- **Enhanced Documentation**: Professional project documentation
  - Comprehensive README with architecture diagram
  - Detailed SETUP.md with troubleshooting
  - CONTRIBUTING.md with development guidelines
  - CODE_OF_CONDUCT.md based on Contributor Covenant
  - SECURITY.md with threat model and best practices
- **CI/CD Pipeline**: Automated GitHub Actions workflows
  - Android APK building and testing
  - Docker image building for bridge
  - Security scanning (CodeQL, dependency check)
  - Automated releases with changelog generation
- **Bridge Security Enhancements**: 
  - Rate limiting (30 commands/minute per client)
  - Authentication token support
  - Dangerous command blocking
  - Environment variable configuration
  - Health check endpoint
  - Docker deployment support

### Changed
- **Bridge Architecture**: Rewritten in Python with enhanced security
  - WebSocket server with connection logging
  - Rate limiting and authentication
  - Configurable via environment variables
  - Docker containerization support
- **Navigation Structure**: Added Tool Scanner to Dashboard stack
  - Quick access from Dashboard when connected
  - Dedicated route in navigation hierarchy
- **Connection Management**: Backward-compatible API migration
  - Legacy `saveConfig()` and `sshConfig` support
  - Seamless transition from single-host to multi-host
- **Dependencies**: Updated to compatible versions
  - TypeScript ESLint plugins aligned with React Native config
  - Fixed npm dependency conflicts

### Fixed
- **Connection Issues**: Resolved SettingsScreen integration with new AppContext
  - Fixed `saveConfig` undefined errors
  - Corrected `connect()` parameter handling
  - Updated test connection functionality
- **TypeScript Errors**: Resolved compilation issues
  - Fixed React namespace imports
  - Corrected WebSocket event handler types
  - Resolved implicit `any` type errors
- **Build Issues**: Fixed CI/CD pipeline errors
  - Updated ESLint configuration for TypeScript files
  - Fixed flake8 warnings in Python bridge
  - Resolved npm dependency conflicts

### Security
- Bridge defaults to localhost (127.0.0.1) binding
- Authentication token enforcement warnings
- Rate limiting prevents command flooding
- Dangerous command pattern blocking
- Security documentation and threat model

### Fixed
- **CI/CD Pipeline Issues**: Resolved GitHub Actions build failures
  - Fixed missing `android/app/src/main/assets/` directory creation
  - Added Linux `gradlew` wrapper script for Ubuntu runners
  - Fixed npm dependency conflicts with TypeScript ESLint versions
  - Resolved ESLint prettier/prettier compatibility with Prettier 3.x
- **Connection Issues**: Resolved SettingsScreen integration with new AppContext
  - Fixed `saveConfig` undefined errors
  - Corrected `connect()` parameter handling
  - Updated test connection functionality
- **TypeScript Errors**: Resolved compilation issues
  - Fixed React namespace imports
  - Corrected WebSocket event handler types
  - Resolved implicit `any` type errors
  - Fixed no-shadow variable conflicts
  - Resolved React hooks exhaustive-deps warnings

### Technical
- React Native 0.73 with TypeScript support
- WebSocket communication via Python bridge
- AsyncStorage for multi-host configuration persistence
- React Navigation with type-safe routing
- Docker containerization for bridge deployment

## [1.0.0] - 2024-XX-XX

### Added
- Initial release of Kali Remote GUI
- React Native Android app with 130+ penetration testing tools
- WebSocket bridge for remote command execution
- Live terminal with real-time output streaming
- Command history with search functionality
- SSH connection management
- Dark hacker-themed UI
- Categorized tool library (Recon, Web, Exploitation, etc.)
- Tool detail screens with descriptions and example commands

### Features
- **Tools Library**: 130+ tools across 12 categories
  - Information Gathering (nmap, recon-ng, theHarvester, etc.)
  - Vulnerability Analysis (nikto, openvas, etc.)
  - Web Applications (sqlmap, gobuster, dirb, etc.)
  - Exploitation (metasploit, searchsploit, etc.)
  - Post-Exploitation (empire, covenant, etc.)
  - Password Attacks (hashcat, john, hydra, etc.)
  - Wireless Attacks (aircrack-ng, wifite, etc.)
  - Sniffing & Spoofing (wireshark, ettercap, etc.)
  - Forensics (autopsy, sleuthkit, etc.)
  - Reverse Engineering (ghidra, radare2, etc.)
  - Social Engineering (setoolkit, king-phisher, etc.)
  - OSINT (maltego, osrframework, etc.)

- **Terminal**: Interactive bash shell via PTY
- **Settings**: SSH connection configuration with persistence
- **History**: Command execution history with favorites

### Technical
- React Native 0.73.6
- Android API 26+ support
- WebSocket communication via `websockets` library
- AsyncStorage for local data persistence
- React Navigation for routing
- Linear gradient theming

### Documentation
- Basic README with setup instructions
- SETUP.md with build instructions
- MIT License

---

## Release Template

### Added
- New features

### Changed
- Changes to existing functionality

### Deprecated
- Soon-to-be removed features

### Removed
- Removed features

### Fixed
- Bug fixes

### Security
- Security improvements and vulnerability fixes
