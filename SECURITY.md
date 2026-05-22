# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Security Considerations

Kali Remote GUI provides remote command execution capabilities. This is inherently dangerous if misconfigured.

### Critical Security Risks

1. **Remote Code Execution**: The bridge allows anyone with access to execute arbitrary commands
2. **Privilege Escalation**: Running as root exposes entire system
3. **Network Exposure**: Public IP exposure without authentication allows anyone to connect
4. **Plaintext Communication**: Current WebSocket implementation is unencrypted

### Security Checklist

Before deploying:

- [ ] Bridge bound to localhost only (127.0.0.1) OR
- [ ] Firewall restricting port 8765 to trusted IPs
- [ ] VPN or Tailscale used for remote access
- [ ] Bridge running as non-privileged user (not root)
- [ ] SSH key authentication configured (not password)
- [ ] Rate limiting enabled
- [ ] Logging enabled and monitored
- [ ] Regular security updates applied

### Recommended Deployment

```python
# Most secure: localhost + SSH tunnel
HOST = "127.0.0.1"  # Never 0.0.0.0 for production
PORT = 8765
```

```bash
# Create SSH tunnel
ssh -L 8765:localhost:8765 user@kali-host
```

### Network Isolation

```bash
# iptables rules for additional protection
iptables -A INPUT -p tcp --dport 8765 -s 127.0.0.1 -j ACCEPT
iptables -A INPUT -p tcp --dport 8765 -s 192.168.1.0/24 -j ACCEPT
iptables -A INPUT -p tcp --dport 8765 -j DROP
```

## Reporting Vulnerabilities

**Please do not create public GitHub issues for security vulnerabilities.**

Instead:

1. **Email**: Create a security advisory via GitHub (preferred) or email security concerns to the maintainers
2. **Details Include**:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

3. **Timeline**:
   - Acknowledgment within 48 hours
   - Initial assessment within 7 days
   - Fix timeline communicated
   - Public disclosure after fix released (90-day standard unless critical)

## Security Updates

Security patches will be:
- Released as soon as possible for critical vulnerabilities
- Documented in release notes
- Backported to supported versions when applicable

## Best Practices for Users

### Network Security

1. **Never expose bridge to public internet**
2. **Use VPN/Tailscale for remote access**
3. **Restrict firewall rules to minimum necessary**

### Authentication

1. **Prefer SSH keys over passwords**
2. **Use strong, unique passwords if password auth required**
3. **Rotate credentials regularly**

### Monitoring

```bash
# Monitor bridge logs
journalctl -u kali-bridge -f

# Check active connections
ss -tuln | grep 8765

# Monitor for unusual activity
tail -f /var/log/auth.log
```

### Updates

- Keep Kali Linux updated: `sudo apt update && sudo apt upgrade`
- Keep bridge updated to latest version
- Subscribe to security advisories for dependencies

## Known Limitations

Current version limitations that affect security:

1. WebSocket communication is plaintext (no TLS)
2. No built-in authentication mechanism
3. Rate limiting is basic

These are planned improvements — see [Roadmap](README.md#roadmap).

## Contact

- Security issues: Create private security advisory on GitHub
- General questions: Use [GitHub Discussions](https://github.com/notconnector/kali-remote-gui/discussions)

---

*This security policy is a living document and will be updated as the project evolves.*
