import secrets
import asyncio
import json
from interval import set_interval

class User:
	def __init__(self, name, id):
		self.name = name
		self.id = id
		self.game = None
		self.websocket = None
		self.timeout_interval = None
		self.points = [0, 100, 100]
		self.gamble_times = 0
		self.gamble_amount = 100

users = dict()

def add_user(name):
	new_id = secrets.token_hex(16)
	while new_id in users:
		new_id = secrets.token_hex(16)
	users[new_id] = User(name, new_id)
	return new_id

def user_exists(id):
	return id in users

def handle_player_disconnect(player_code):
	print("Disconnecting ", player_code)
	async def real_disconnect():
		print("Disconnected ", player_code)
		users[player_code].timeout_interval.cancel()
		users.pop(player_code)
		await admin.socket.send(json.dumps({ "type": "disconnect", "id": player_code }))
	users[player_code].timeout_interval = set_interval(30, lambda: asyncio.run(real_disconnect()))

class Admin:
	def __init__(self):
		self.socket = None

admin = Admin()