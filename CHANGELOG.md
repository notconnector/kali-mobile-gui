# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Enhanced security for bridge with rate limiting, authentication tokens, and payload size limits
- Docker support for bridge deployment
- Comprehensive documentation (README, SETUP, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY)
- GitHub Actions CI/CD for automated builds and releases
- Health check endpoint for monitoring
- Dangerous command blocking (rm -rf /, mkfs, etc.)
- Environment variable configuration support

### Security
- Bridge now defaults to localhost (127.0.0.1) binding for security
- Added rate limiting: 30 commands per minute per client
- Authentication token support
- Security warnings when running with 0.0.0.0 or without auth
- SECURITY.md with threat model and vulnerability reporting

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
