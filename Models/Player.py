"""
Game object
"""

from google.appengine.ext import db
import json
import logging

# Data Model
class Player(db.Model):
  """All the data we store for a game"""
  player_name = db.StringProperty()
  player_token = db.StringProperty()

# Player manager object
class PlayerManager():
    @classmethod
    def push(cls, player):
      player.put()        
    
    @classmethod
    def pull(cls, hash_player):
      return Player.get_by_key_name(hash_player)
  
  
class PlayerProperty(db.Property):

    # Tell what the user type is.
    data_type = Player

    # For writing to datastore.
    def get_value_for_datastore(self, model_instance):
        player = super(PlayerProperty,
                     self).get_value_for_datastore(model_instance)
        if (player == None):
            logging.info(player)
            return None
        return json.dumps({"player_name": player.player_name, "key_name": player.key_name, "player_token":player.player_token})

    # For reading from datastore.
    def make_value_from_datastore(self, value):
        if value is None:
            return None
        data = json.loads(value)
        return Player(key_name = data.key_name, player_name = data.player_name, player_token = data.player_token)

    def validate(self, value):
        if value is not None and not isinstance(value, Player):
            raise BadValueError('Property %s must be convertible '
                                'to a Player instance (%s)' %
                                (self.name, value))
        return super(PlayerProperty, self).validate(value)

    def empty(self, value):
        return not value

