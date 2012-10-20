"""
Game object
"""

from google.appengine.ext import db
from Player import Player, PlayerProperty, PlayerManager
import logging

# Data Model
class GameState(db.Model):
  """All the data we store for a game"""
  currentPlayer = db.StringProperty()
  totalPlayer = db.IntegerProperty()
  scorePlayers =  db.StringListProperty()
  currentIndex = db.IntegerProperty()
  
  players = db.StringListProperty()

  def get_players(self):
      Players =[]
      for playerId in self.players:
          p = PlayerManager.pull(playerId)
          Players.append( p )
      return Players

# Game controler object
class Game():
    @classmethod
    def push(cls,GS):
      GS.put()        
    
    @classmethod
    def pull(cls, partyHash):
      return GameState.get_by_key_name(partyHash)

