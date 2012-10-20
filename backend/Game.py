"""
Game object
""""

from google.appengine.ext import db

# Data Model
class GameState(db.Model):
  """All the data we store for a game"""
  partyHash = db.StringProperty()
  currentPlayer = db.StringProperty()
  totalPlayer = dbIntegerProperty()
  scorePlayers =  db.StringListProperty()

# Game controler object
class Game():

    def __init__(self):

    def push(self,GameState):
        GameState.put()        
        
    def pull(self,partyHash):
        self.game = Game.get_by_key_name(partyHash)
        return game
        