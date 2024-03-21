import asyncio
from users import users, admin
import websockets
import json
import random

current_game = -1

def set_gamble(id, amount):
	users[id].gamble_amount = amount

async def gamble():
	if current_game == 1:
		for id, user in users.items():
			if (user.websocket == None):
				continue
			if random.random() >= 0.5:
				user.points[1] += user.gamble_amount * 0.8
			else:
				user.points[1] -= user.gamble_amount * 0.5
			if user.gamble_amount > 0:
				user.gamble_times += 1
			await user.websocket.send(json.dumps({ "type": "gamble_1_result", "result": user.points[1] }))
			user.gamble_amount = user.points[1]
		await admin.socket.send(json.dumps({
			"type": "finish_gamble_1",
			"players": [{
				"name": user.name,
				"points": user.points[1],
				"times": user.gamble_times
			} for (_, user) in users.items()]
		}))
	elif current_game == 2:
		random_flip = random.randint(0, 1)
		for id, user in users.items():
			if (user.websocket == None):
				continue
			if random_flip == 1:
				user.points[2] += user.gamble_amount * 0.8
			else:
				user.points[2] -= user.gamble_amount * 0.5
			await user.websocket.send(json.dumps({ "type": "gamble_2_result", "result": user.points[2] }))
			user.gamble_amount = 0
		await admin.socket.send(json.dumps({
			"type": "finish_gamble_2",
			"players": [{
				"name": user.name,
				"points": user.points[2]
			} for (_, user) in users.items()],
			"result": random_flip
		}))