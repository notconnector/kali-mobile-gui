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

Author: Kali Remote GUI Contributors
License: MIT
"""

import asyncio
import json
import os
import subprocess
import sys
import time
import logging
from collections import defaultdict
from typing import Dict, Optional, Set

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
authenticated_clients: Set[int] = set()

# Rate limiting: track commands per client per minute
command_history: defaultdict = defaultdict(list)  # client -> list of timestamps


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


async def run_command(
    command: str,
    timeout: int = 60,
    cwd: Optional[str] = None
) -> str:
    """
    Execute a shell command with timeout and safety checks.

    Args:
        command: Command to execute
        timeout: Maximum execution time in seconds
        cwd: Working directory for command

    Returns:
        Command output as string
    """
    # Safety: basic command validation
    dangerous_patterns = ["rm -rf /", "mkfs.", "> /dev/sd", "dd if=/dev/zero"]
    for pattern in dangerous_patterns:
        if pattern in command:
            logger.warning(f"Blocked dangerous command: {command[:50]}")
            return f"[BLOCKED] Potentially destructive command detected"

    try:
        proc = await asyncio.create_subprocess_shell(
            command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
            cwd=cwd,
            env={**os.environ, "TERM": "xterm", "FORCE_COLOR": "0"},
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
            logger.warning(f"Command timed out: {command[:50]}")
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

                logger.info(f"Starting shell for {client_addr}")
                shell_proc = await asyncio.create_subprocess_shell(
                    "/bin/bash",
                    stdin=asyncio.subprocess.PIPE,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.STDOUT,
                    env={**os.environ, "TERM": "xterm-256color", "PS1": "\\w $ "},
                )
                active_shells[client_id] = shell_proc

                async def read_shell():
                    """Read shell output and stream to client."""
                    while True:
                        try:
                            data = await asyncio.wait_for(
                                shell_proc.stdout.read(1024),
                                timeout=0.1
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
                        except asyncio.TimeoutError:
                            if shell_proc.returncode is not None:
                                break
                        except Exception as e:
                            logger.error(f"Shell read error: {e}")
                            break

                asyncio.ensure_future(read_shell())
                await websocket.send(json.dumps({
                    "id": msg_id,
                    "type": "shell_started",
                    "output": ""
                }))

            elif msg_type == "shell_write":
                data = msg.get("data", "")
                if shell_proc and shell_proc.stdin and not shell_proc.returncode:
                    try:
                        shell_proc.stdin.write(data.encode())
                        await shell_proc.stdin.drain()
                    except Exception as e:
                        logger.error(f"Shell write error: {e}")

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
