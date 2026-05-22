#!/usr/bin/env python3
"""
Kali Remote GUI Bridge - Secure WebSocket Server
=================================================
Provides remote command execution for Kali Linux via WebSocket.

Usage:
    python3 kali-bridge.py

Environment Variables:
    KALI_BRIDGE_HOST        - Bind host (default: 127.0.0.1)
    KALI_BRIDGE_PORT        - Bind port (default: 8765)
    KALI_BRIDGE_AUTH_TOKEN  - Authentication token (optional but recommended)
    KALI_BRIDGE_RATE_LIMIT  - Max commands per minute (default: 30)
    KALI_BRIDGE_LOG_LEVEL   - DEBUG/INFO/WARNING/ERROR (default: INFO)
    KALI_BRIDGE_MAX_PAYLOAD - Max message size in bytes (default: 1048576)

Security Notes:
    - Default bind is localhost (127.0.0.1) for security
    - Use SSH tunnel or VPN for remote access
    - Set AUTH_TOKEN for production use
    - Never expose to public internet without authentication

Author: _.notconnector._
License: MIT
"""

import asyncio
import json
import os
import sys
import time
import logging
import shlex
import re
import pty
from collections import defaultdict
from typing import Dict, Optional, Set, List, Tuple

try:
    import websockets
    from websockets.server import WebSocketServerProtocol
except ImportError:
    print("[ERROR] websockets module not found. Install with:")
    print("  pip3 install websockets")
    sys.exit(1)

# Configuration from environment
HOST = os.environ.get("KALI_BRIDGE_HOST", "127.0.0.1")  # Default localhost for security
PORT = int(os.environ.get("KALI_BRIDGE_PORT", "8765"))
AUTH_TOKEN = os.environ.get("KALI_BRIDGE_AUTH_TOKEN", "")
RATE_LIMIT = int(os.environ.get("KALI_BRIDGE_RATE_LIMIT", "30"))  # Commands per minute
MAX_PAYLOAD = int(os.environ.get("KALI_BRIDGE_MAX_PAYLOAD", "1048576"))  # 1MB

# Setup logging
LOG_LEVEL = os.environ.get("KALI_BRIDGE_LOG_LEVEL", "INFO")
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL.upper()),
    format="[%(asctime)s] [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("kali-bridge")

# Global state
active_shells: Dict[int, asyncio.subprocess.Process] = {}
active_pty_fds: Dict[int, int] = {}  # Track PTY master FDs
authenticated_clients: Set[int] = set()
client_shell_counts: Dict[int, int] = defaultdict(int)  # Track shell count per client

# Rate limiting: track commands per client per minute
command_history: defaultdict = defaultdict(list)  # client -> list of timestamps

# Shell limits
MAX_SHELLS_PER_CLIENT = 3

# Command whitelist for security
ALLOWED_COMMANDS: List[str] = [
    # Recon tools
    'nmap', 'ping', 'traceroute', 'dig', 'whois', 'nslookup', 'host', 'arp',
    # Web tools
    'curl', 'wget', 'nikto', 'gobuster', 'dirb', 'sqlmap',
    # Network tools
    'netcat', 'nc', 'tcpdump', 'tshark', 'netstat', 'ss', 'lsof',
    # System tools
    'ps', 'top', 'htop', 'df', 'du', 'free', 'uname', 'id', 'whoami', 'pwd', 'ls',
    'cat', 'grep', 'find', 'which', 'whereis', 'file', 'strings', 'hexdump',
    # Pentesting tools
    'hydra', 'john', 'hashcat', 'aircrack-ng', 'metasploit', 'msfconsole',
    'searchsploit', 'exploitdb', 'setoolkit',
    # File operations (safe)
    'head', 'tail', 'less', 'more', 'wc', 'sort', 'uniq', 'cut', 'awk', 'sed',
    # Compression
    'tar', 'gzip', 'gunzip', 'zip', 'unzip',
    # Process management
    'kill', 'killall', 'pkill', 'pgrep',
]

# Critical dangerous patterns (always blocked)
CRITICAL_DANGEROUS_PATTERNS = [
    r'rm\s+-rf\s+/',  # rm -rf / with variations
    r'mkfs\.',       # Filesystem formatting
    r'dd\s+if=/dev/(zero|random|null)',  # Disk destruction
    r'shutdown\s+',  # System shutdown
    r'reboot\s+',     # System reboot
    r'halt\s+',      # System halt
    r'poweroff\s+',  # Power off
    r'passwd\s+',    # Password changes
    r'chpasswd\s+',  # Password changes
    r'user(add|del|mod)\s+',  # User management
    r'chmod\s+777',  # Dangerous permissions
    r'chown\s+root', # Ownership changes
    r'mount\s+',     # Mount operations
    r'umount\s+',    # Unmount operations
    r'iptables\s+',  # Firewall changes
    r'ufw\s+',       # Firewall changes
    r'firewalld\s+', # Firewall changes
    r'service\s+',   # Service management
    r'systemctl\s+', # Systemd management
    r'init\s+',      # Init system
    r'crontab\s+',   # Cron management
    r'at\s+',        # At scheduler
    r'batch\s+',     # Batch scheduler
    r'nohup\s+',     # Background processes
    r'sudo\s+(su|-i|bash|sh)',  # Privilege escalation
    r'nc\s+-l',      # Netcat listener
    r'netcat\s+-l',  # Netcat listener
    r'python\s+-c',  # Python code execution
    r'perl\s+-e',    # Perl code execution
    r'ruby\s+-e',    # Ruby code execution
    r'eval\s+',      # Eval execution
    r'exec\s+',      # Exec execution
    r'\bsource\s+', # Source execution
    r'\.$',          # Source execution
    r'>>\s+/',       # Redirect to system files
    r'>\s+/',        # Redirect to system files
    r'<\s+/',        # Input from system files
]

# Suspicious patterns (warn in shell, block in exec)
SUSPICIOUS_PATTERNS = [
    r'&&\s+',        # Command chaining
    r'\|\|\s+',      # Command chaining
    r';\s+',         # Command chaining
    r'\|\s+\w+',    # Pipe to command
]


def check_rate_limit(client_id: int) -> bool:
    """Check if client has exceeded rate limit. Returns True if allowed."""
    now = time.time()
    minute_ago = now - 60

    # Clean old entries
    command_history[client_id] = [t for t in command_history[client_id] if t > minute_ago]

    # Check limit
    if len(command_history[client_id]) >= RATE_LIMIT:
        logger.warning(f"Rate limit exceeded for client {client_id}")
        return False

    command_history[client_id].append(now)
    return True


async def cleanup_pty(client_id: int, master_fd: int):
    """Centralized PTY cleanup with proper error handling."""
    try:
        if client_id in active_pty_fds:
            del active_pty_fds[client_id]
        if client_id in client_shell_counts:
            client_shell_counts[client_id] = max(0, client_shell_counts[client_id] - 1)
        if master_fd is not None:
            os.close(master_fd)
    except Exception as e:
        logger.error(f"PTY cleanup error: {e}")


async def authenticate(websocket: WebSocketServerProtocol, message: dict) -> bool:
    """Authenticate client connection."""
    if not AUTH_TOKEN:
        # No auth required if token not set
        return True

    token = message.get("auth_token", "")
    if token == AUTH_TOKEN:
        authenticated_clients.add(id(websocket))
        return True

    return False


def validate_command(command: str, is_shell_mode: bool = False) -> Tuple[bool, str]:
    """
    Validate command against whitelist and dangerous patterns.
    
    Args:
        command: Command to validate
        is_shell_mode: True if running in interactive shell (allows more patterns)
    
    Returns:
        Tuple of (is_safe, error_message)
    """
    command = command.strip()
    if not command:
        return False, "Empty command"
    
    # Check critical dangerous patterns (always blocked)
    for pattern in CRITICAL_DANGEROUS_PATTERNS:
        if re.search(pattern, command, re.IGNORECASE):
            return False, f"Critical dangerous pattern detected: {pattern}"
    
    # Check suspicious patterns (warn in shell, block in exec)
    for pattern in SUSPICIOUS_PATTERNS:
        if re.search(pattern, command, re.IGNORECASE):
            if is_shell_mode:
                logger.warning(f"Suspicious pattern in shell: {command[:100]} - {pattern}")
                return True, ""  # Allow in shell with warning
            else:
                return False, f"Suspicious pattern not allowed in exec mode: {pattern}"
    
    # Parse command safely
    try:
        args = shlex.split(command)
    except ValueError as e:
        return False, f"Command parsing failed: {e}"
    
    if not args:
        return False, "No command found"
    
    base_command = args[0]
    
    # Check if command is in whitelist
    if base_command not in ALLOWED_COMMANDS:
        return False, f"Command '{base_command}' not in allowed list"
    
    # Additional safety checks
    if len(args) > 20:  # Reasonable argument limit
        return False, "Too many arguments"
    
    if len(command) > 1000:  # Reasonable command length
        return False, "Command too long"
    
    return True, ""

async def run_command(
    command: str,
    timeout: int = 60,
    cwd: Optional[str] = None
) -> str:
    """
    Execute a command securely with proper validation.

    Args:
        command: Command to execute
        timeout: Maximum execution time in seconds
        cwd: Working directory for command

    Returns:
        Command output as string
    """
    # Validate command
    is_safe, error_msg = validate_command(command)
    if not is_safe:
        logger.warning(f"Blocked command: {command[:100]} - {error_msg}")
        return f"[BLOCKED] {error_msg}"
    
    try:
        # Parse command safely
        args = shlex.split(command)
        
        # Execute without shell
        proc = await asyncio.create_subprocess_exec(
            *args,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
            cwd=cwd,
            env={**os.environ, "TERM": "xterm", "FORCE_COLOR": "0"},
            preexec_fn=os.setsid,
        )

        try:
            stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=timeout)
            output = stdout.decode("utf-8", errors="replace")
            # Limit output size
            max_output = 100000  # 100KB
            if len(output) > max_output:
                output = output[:max_output] + f"\n[TRUNCATED] Output exceeded {max_output} chars"
            return output
        except asyncio.TimeoutError:
            proc.kill()
            logger.warning(f"Command timed out: {command[:100]}")
            return f"[TIMEOUT] Command exceeded {timeout}s timeout"

    except Exception as e:
        logger.error(f"Command execution failed: {e}")
        return f"[ERROR] {str(e)}"


async def handler(websocket: WebSocketServerProtocol, path: str = ""):
    """Handle WebSocket connection."""
    client_addr = websocket.remote_address
    client_id = id(websocket)

    logger.info(f"New connection from {client_addr}")

    shell_proc: Optional[asyncio.subprocess.Process] = None
    is_authenticated = False

    try:
        async for raw in websocket:
            # Size limit check
            if len(raw) > MAX_PAYLOAD:
                logger.warning(f"Oversized payload from {client_addr}")
                await websocket.send(json.dumps({
                    "error": "Payload too large",
                    "type": "error"
                }))
                continue

            # Parse message
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                logger.warning(f"Invalid JSON from {client_addr}")
                continue

            msg_id = msg.get("id", 0)
            msg_type = msg.get("type")

            # Authentication check (if enabled)
            if AUTH_TOKEN and not is_authenticated:
                if msg_type == "auth":
                    if await authenticate(websocket, msg):
                        is_authenticated = True
                        logger.info(f"Client {client_addr} authenticated successfully")
                        await websocket.send(json.dumps({
                            "id": msg_id,
                            "type": "auth_success",
                            "output": "Authenticated"
                        }))
                    else:
                        logger.warning(f"Authentication failed for {client_addr}")
                        await websocket.send(json.dumps({
                            "id": msg_id,
                            "type": "auth_failed",
                            "error": "Invalid authentication token"
                        }))
                        await websocket.close(1008, "Authentication failed")
                        return
                else:
                    await websocket.send(json.dumps({
                        "id": msg_id,
                        "type": "auth_required",
                        "error": "Authentication required"
                    }))
                continue

            # Rate limiting
            if msg_type in ["exec", "shell_write"]:
                if not check_rate_limit(client_id):
                    await websocket.send(json.dumps({
                        "id": msg_id,
                        "type": "rate_limited",
                        "error": f"Rate limit exceeded: {RATE_LIMIT} commands per minute"
                    }))
                    continue

            # Handle message types
            if msg_type == "exec":
                command = msg.get("command", "").strip()
                if not command:
                    await websocket.send(json.dumps({
                        "id": msg_id,
                        "output": ""
                    }))
                    continue

                logger.info(f"Executing command from {client_addr}: {command[:100]}")
                output = await run_command(command, timeout=msg.get("timeout", 60))
                await websocket.send(json.dumps({
                    "id": msg_id,
                    "type": "exec_result",
                    "output": output
                }))

            elif msg_type == "shell_start":
                if shell_proc and shell_proc.returncode is None:
                    await websocket.send(json.dumps({
                        "id": msg_id,
                        "type": "shell_started",
                        "output": ""
                    }))
                    continue
                
                # Check shell limit
                if client_shell_counts[client_id] >= MAX_SHELLS_PER_CLIENT:
                    await websocket.send(json.dumps({
                        "id": msg_id,
                        "type": "error",
                        "message": f"Shell limit exceeded (max {MAX_SHELLS_PER_CLIENT} per client)"
                    }))
                    continue

                logger.info(f"Starting PTY shell for {client_addr}")
                
                # Create PTY for proper terminal support
                master_fd, slave_fd = pty.openpty()
                
                try:
                    shell_proc = await asyncio.create_subprocess_exec(
                        "/bin/bash",
                        stdin=slave_fd,
                        stdout=slave_fd,
                        stderr=slave_fd,
                        env={**os.environ, "TERM": "xterm-256color", "PS1": "\\w $ "},
                        preexec_fn=os.setsid,
                    )
                    active_shells[client_id] = shell_proc
                    active_pty_fds[client_id] = master_fd
                    client_shell_counts[client_id] += 1
                    
                    # Close slave FD in parent process
                    os.close(slave_fd)
                    
                    async def read_shell():
                        """Read PTY output and stream to client."""
                        loop = asyncio.get_event_loop()
                        
                        try:
                            while True:
                                try:
                                    # Read from PTY without busy loop
                                    data = await loop.run_in_executor(
                                        None, lambda: os.read(master_fd, 1024)
                                    )
                                    if not data:
                                        break
                                    
                                    try:
                                        await websocket.send(json.dumps({
                                            "type": "shell_output",
                                            "data": data.decode("utf-8", errors="replace")
                                        }))
                                    except websockets.exceptions.ConnectionClosed:
                                        break
                                        
                                    # Add small yield to prevent executor spam
                                    await asyncio.sleep(0)
                                        
                                except OSError:
                                    if shell_proc.returncode is not None:
                                        break
                                    continue
                                except Exception as e:
                                    logger.error(f"PTY read error: {e}")
                                    break
                                    
                        finally:
                            # Centralized PTY cleanup
                            await cleanup_pty(client_id, master_fd)

                    asyncio.ensure_future(read_shell())
                    
                except Exception as e:
                    # Cleanup on error
                    try:
                        os.close(master_fd)
                    except Exception:
                        pass
                    try:
                        os.close(slave_fd)
                    except Exception:
                        pass
                    raise e
                await websocket.send(json.dumps({
                    "id": msg_id,
                    "type": "shell_started",
                    "output": ""
                }))

            elif msg_type == "shell_write":
                data = msg.get("data", "")
                master_fd = active_pty_fds.get(client_id)
                if master_fd is not None and data:
                    try:
                        # Write directly to PTY master
                        os.write(master_fd, data.encode())
                    except Exception as e:
                        logger.error(f"PTY write error: {e}")

                await websocket.send(json.dumps({
                    "id": msg_id,
                    "type": "shell_write_ack",
                    "output": ""
                }))

            elif msg_type == "shell_close":
                if shell_proc:
                    try:
                        shell_proc.kill()
                        await shell_proc.wait()
                    except Exception:
                        pass
                    shell_proc = None
                    active_shells.pop(client_id, None)
                    
                    # Close PTY with centralized cleanup
                    master_fd = active_pty_fds.pop(client_id, None)
                    if master_fd is not None:
                        await cleanup_pty(client_id, master_fd)
                    
                    logger.info(f"Shell closed for {client_addr}")

                await websocket.send(json.dumps({
                    "id": msg_id,
                    "type": "shell_closed",
                    "output": ""
                }))

            elif msg_type == "ping":
                await websocket.send(json.dumps({
                    "type": "pong",
                    "id": msg_id
                }))

            else:
                logger.warning(f"Unknown message type: {msg_type}")

    except websockets.exceptions.ConnectionClosed as e:
        logger.info(f"Connection closed from {client_addr}: {e}")
    except Exception as e:
        logger.error(f"Handler error for {client_addr}: {e}")
    finally:
        # Cleanup
        if shell_proc:
            try:
                shell_proc.kill()
            except Exception:
                pass
        active_shells.pop(client_id, None)
        
        # Close PTY with centralized cleanup
        master_fd = active_pty_fds.pop(client_id, None)
        if master_fd is not None:
            await cleanup_pty(client_id, master_fd)
        
        # Reset shell count
        client_shell_counts.pop(client_id, None)
        
        authenticated_clients.discard(client_id)
        command_history.pop(client_id, None)
        logger.info(f"Client disconnected: {client_addr}")


async def health_check_server():
    """Simple health check endpoint for monitoring."""
    async def handle_health(reader, writer):
        writer.write(b"HTTP/1.1 200 OK\r\n")
        writer.write(b"Content-Type: application/json\r\n")
        writer.write(b"Connection: close\r\n\r\n")

        status = {
            "status": "healthy",
            "active_connections": len(active_shells),
            "version": "1.0.0"
        }
        writer.write(json.dumps(status).encode())
        await writer.drain()
        writer.close()

    server = await asyncio.start_server(handle_health, HOST, PORT + 1)
    logger.info(f"Health check endpoint on http://{HOST}:{PORT + 1}/health")
    async with server:
        await server.serve_forever()


async def main():
    """Main entry point."""
    # Security warnings
    if HOST == "0.0.0.0":
        logger.warning("=" * 60)
        logger.warning("WARNING: Bridge is bound to all interfaces (0.0.0.0)")
        logger.warning("This exposes the bridge to all network interfaces!")
        logger.warning("Ensure you have proper firewall rules in place.")
        logger.warning("Consider using localhost + SSH tunnel instead.")
        logger.warning("=" * 60)

    if not AUTH_TOKEN:
        logger.warning("=" * 60)
        logger.warning("WARNING: No authentication token configured!")
        logger.warning("Set KALI_BRIDGE_AUTH_TOKEN for production use.")
        logger.warning("Anyone with network access can execute commands.")
        logger.warning("=" * 60)
    else:
        logger.info("Authentication enabled")

    logger.info(f"Kali Remote GUI Bridge starting on ws://{HOST}:{PORT}")
    logger.info(f"Rate limit: {RATE_LIMIT} commands/minute per client")
    logger.info(f"Max payload: {MAX_PAYLOAD} bytes")
    logger.info("Press Ctrl+C to stop")

    # Start WebSocket server
    async with websockets.serve(
        handler,
        HOST,
        PORT,
        ping_interval=20,
        ping_timeout=10,
        max_size=MAX_PAYLOAD,
        compression=None  # Disable compression for security
    ):
        # Also start health check in background
        health_task = asyncio.create_task(health_check_server())

        try:
            await asyncio.Future()  # Run forever
        except KeyboardInterrupt:
            logger.info("Shutting down...")
        finally:
            health_task.cancel()
            try:
                await health_task
            except asyncio.CancelledError:
                pass


if __name__ == "__main__":
    asyncio.run(main())
