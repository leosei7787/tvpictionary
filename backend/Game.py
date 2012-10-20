"""
Game object
"""

from google.appengine.ext import db

# Data Model
class GameState(db.Model):
  """All the data we store for a game"""
  currentPlayer = db.StringProperty()
  totalPlayer = db.IntegerProperty()
  scorePlayers =  db.StringListProperty()

# Game controler object
class Game():
    @classmethod
    def push(cls,GS):
      GS.put()        
    
    @classmethod
    def pull(cls, partyHash):
      return GameState.get_by_key_name(partyHash)

