import asyncio
import websockets
import json
import os

import users
import games

async def error(websocket, message):
	event = {
		"type": "error",
		"message": message
	}
	await websocket.send(json.dumps(event))

async def handler(websocket):
	"""
	Handle a connection and dispatch it according to who is connecting.

	"""
	# Receive and parse the "init" event from the UI.
	event = { "type": "none" }
	while event["type"] != "init" and event["type"] != "reconnect":
		message = await websocket.recv()
		try:
			event = json.loads(message)
		except:
			await error(websocket, "Invalid JSON")
		if event["type"] == "ping":
			await websocket.send(json.dumps({ "type" : "pong" }))

	if "isAdmin" in event and event["isAdmin"]:
		if event["password"] != "19844":
			return
		response = {
			"type": "init",
			"success": True
		}
		users.admin.socket = websocket
		print("done")
		await websocket.send(json.dumps(response))
		print("done2")
		games.current_game = 0
		websockets.broadcast(
			[user.websocket for (_, user) in users.users.items() if user.websocket != None],
			json.dumps({ "type": "next", "currentGame": 0 })
		)
		try:
			print("tried")
			async for m in websocket:
				print(m)
				try:
					message = json.loads(m)
				except:
					error(websocket, "Invalid JSON")
					continue
				print(message)
				if message["type"] == "ping":
					await websocket.send(json.dumps({ "type" : "pong" }))
				elif message["type"] == "next":
					games.current_game += 1
					websockets.broadcast(
						[user.websocket for (_, user) in users.users.items() if user.websocket != None],
						json.dumps({ "type": "next", "currentGame": games.current_game })
					)
					if games.current_game == 2:
						for _, user in users.users.items():
							user.gamble_amount = 0
				elif message["type"] == "gamble":
					await games.gamble()
		except Exception as e:
			print(e)
		finally:
			print("FOLD")
			games.current_game = -1
			users.admin.socket = None
			websockets.broadcast(
				[user.websocket for (_, user) in users.users.items() if user.websocket != None],
				json.dumps({ "type": "next", "currentGame": -1 })
			)
			return
	print(games.current_game)
	if games.current_game == -1:
		return

	if event["type"] == "reconnect":
		id = response["id"]
		if id not in users.users.items():
			back_response = {
				"type": "reconnect",
				"success": False
			}
			await websocket.send(json.dumps(back_response))
			return
		users.users[id].websocket = websocket
		users.users[id].timeout_interval.cancel()
		users.users[id].timeout_interval = None
		back_response = {
			"type": "reconnect",
			"success": True,
			"currentGame": games.current_game
		}
		await websocket.send(json.dumps(back_response))
	else:
		id = users.add_user(event["name"])
		users.users[id].websocket = websocket
		back_response = {
			"type": "init",
			"id": id,
			"currentGame": games.current_game
		}
		await websocket.send(json.dumps(back_response))
		await users.admin.socket.send(json.dumps({ "type": "join", "id": id, "name": event["name"] }))
	try:
		async for m in websocket:
			try:
				message = json.loads(m)
			except:
				error(websocket, "Invalid JSON")
				continue
			if message["type"] == "ping":
				await websocket.send(json.dumps({ "type": "pong" }))
			elif message["type"] == "gamble":
				games.set_gamble(id, message["amount"])
				await websocket.send(json.dumps({ "type": "gamble", "amount": message["amount"] }))
	finally:
		users.handle_player_disconnect(id)

async def main():
	# Set the stop condition when receiving SIGTERM.
	loop = asyncio.get_running_loop()
	stop = loop.create_future()
	# loop.add_signal_handler(signal.SIGTERM, stop.set_result, None)

	port = int(os.environ.get("PORT", "8001"))
	async with websockets.serve(handler, "", port):
		await stop


if __name__ == "__main__":
	asyncio.run(main())