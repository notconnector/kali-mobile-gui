#!/usr/bin/env python3
"""
Kali GUI Bridge - WebSocket server
Uruchom na Kali Linux: python3 kali-bridge.py
Wymaga: pip3 install websockets
Port: 8765
"""

import asyncio
import json
import subprocess
import os
import pty
import select
import threading

try:
    import websockets
except ImportError:
    print("[ERROR] Brak modulu websockets. Uruchom:")
    print("  pip3 install websockets")
    exit(1)

HOST = "0.0.0.0"
PORT = 8765

active_shells = {}

async def run_command(command, timeout=60):
    try:
        proc = await asyncio.create_subprocess_shell(
            command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
            env={**os.environ, "TERM": "xterm", "FORCE_COLOR": "0"},
        )
        try:
            stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=timeout)
            return stdout.decode("utf-8", errors="replace")
        except asyncio.TimeoutError:
            proc.kill()
            return f"[TIMEOUT] Komenda przekroczyla {timeout}s"
    except Exception as e:
        return f"[ERROR] {str(e)}"


async def handler(websocket):
    client = websocket.remote_address
    print(f"[+] Polaczono: {client}")
    shell_proc = None

    try:
        async for raw in websocket:
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue

            msg_id = msg.get("id")
            msg_type = msg.get("type")

            if msg_type == "exec":
                command = msg.get("command", "")
                print(f"[CMD] {command}")
                output = await run_command(command)
                await websocket.send(json.dumps({"id": msg_id, "output": output}))

            elif msg_type == "shell_start":
                if shell_proc and shell_proc.returncode is None:
                    await websocket.send(json.dumps({"id": msg_id, "output": ""}))
                    continue
                shell_proc = await asyncio.create_subprocess_shell(
                    "/bin/bash",
                    stdin=asyncio.subprocess.PIPE,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.STDOUT,
                    env={**os.environ, "TERM": "xterm"},
                )
                active_shells[id(websocket)] = shell_proc

                async def read_shell():
                    while True:
                        try:
                            data = await asyncio.wait_for(shell_proc.stdout.read(1024), timeout=0.1)
                            if not data:
                                break
                            await websocket.send(json.dumps({
                                "type": "shell_output",
                                "data": data.decode("utf-8", errors="replace")
                            }))
                        except asyncio.TimeoutError:
                            if shell_proc.returncode is not None:
                                break
                        except Exception:
                            break

                asyncio.ensure_future(read_shell())
                await websocket.send(json.dumps({"id": msg_id, "output": ""}))

            elif msg_type == "shell_write":
                data = msg.get("data", "")
                if shell_proc and shell_proc.stdin:
                    shell_proc.stdin.write(data.encode())
                    await shell_proc.stdin.drain()
                await websocket.send(json.dumps({"id": msg_id, "output": ""}))

            elif msg_type == "shell_close":
                if shell_proc:
                    try:
                        shell_proc.kill()
                    except Exception:
                        pass
                    shell_proc = None
                await websocket.send(json.dumps({"id": msg_id, "output": ""}))

    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        if shell_proc:
            try:
                shell_proc.kill()
            except Exception:
                pass
        active_shells.pop(id(websocket), None)
        print(f"[-] Rozlaczono: {client}")


async def main():
    print(f"[*] Kali GUI Bridge uruchomiony na ws://{HOST}:{PORT}")
    print(f"[*] Zatrzymaj przez Ctrl+C")
    async with websockets.serve(handler, HOST, PORT, ping_interval=20, ping_timeout=10):
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
