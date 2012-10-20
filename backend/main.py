from google.appengine.ext.webapp import template
from google.appengine.api import channel
from Game import GameState
from Game import Game
import json
import webapp2
import os
import logging
import hashlib
import time

def template2handler(handler,template_name,template_value):
    handler.response.headers['Content-Type'] = 'text/html; charset=ISO-8859-1'
    handler.response.out.write(template2string(template_name, template_value))

def template2string(template_name,template_value):
    path = os.path.join(os.path.dirname(__file__), '..','template', template_name)
    return template.render(path, template_value)

# Apps modules.

class MainRouter(webapp2.RequestHandler):
    def get(self):
        template2handler(self,'index.html',{
                                            'tv': True,
                                            'title': 'Welcome on TV Pictionary'
                                           })               

    def post(self):
        # Generate Hash
        hash = hashlib.sha1()
        hash.update(str(time.time()))
        hash = hash.hexdigest()[:4]
        
        # Create GameState to store data info
        GS = GameState(key_name = hash,
                           currentPlayer = "-1",
                           totalPlayer = 0,
                           scorePlayers = ["0"])
        Game.push(GS)
        
        # redirect to /hash/tv
        self.redirect("/"+hash+"/tv")

class CMD():
    @classmethod
    def get(cls, cmdCODE, player, data):
        return json.dumps({"cmd":cmdCODE, "player":player,"data":data})


class TvRouter(webapp2.RequestHandler):
    def get(self):
        hash = self.request.url.split("/")[3]
        token = channel.create_channel(hash+'tv')

        template2handler(self,'index-tv.html',{
                                               'tv': True,
                                               'drawer':True,
                                               'title': 'You are the TV !',
                                               'token': token
                                               })
        logging.info(CMD.get("TEST_CODE", "PLAYER!_TEST", {}))
        
    def post(self):
        hash = self.request.url.split("/")[3]

        if (self.request.get('coordinates')):
            channel.send_message(hash+'tv', self.request.get('coordinates'))
            
        if (self.request.get('playerstop')):
            start = Game.pull(hash).currentPlayer.split("r")[1]
            stop = Game.pull(hash).totalPlayer
            if (start < stop):
                GS
                
            for i in range(start, stop):
                channel.send_message(hash + 'mobile' + Game.pull(hash).currentPlayer, CMD.get("PLAYER_STOP", player, {}))
  
class mobileRouter(webapp2.RequestHandler):
    def get(self):
        hash = self.request.url.split("/")[3]
        player = self.request.url.split("/")[5]
        
        token = channel.create_channel( hash+'mobile'+player )

        GS = Game.pull(hash)
        
        logging.info(GS.currentPlayer)

        template2handler(self,'index-mobile.html',{
                                                   'mobile': True,
                                                   'drawer':True,
                                                   'title': 'You are the player!',
                                                   'token': token
                                                   })
        if (self.request.get('message')):
            channel.send_message(hash+'tv', self.request.get('message'))
        
        if (GS.currentPlayer == "-1"):
            GS.currentPlayer = player
            GS.totalPlayer += 1
            Game.push(GS)
        elif (player != GS.currentPlayer):
            #A voir si on garde dans le gamestate les infos sur tous les players
            GS.totalPlayer += 1
            Game.push(GS)

        channel.send_message(hash+'tv', CMD.get("JOIN", player, {}))
        
    def post(self):
        
        GS = Game.pull(hash)
        
        hash = self.request.url.split("/")[3]
        player = self.request.url.split("/")[5]

        if (self.request.get('coordinates')):
            channel.send_message(hash+'tv', CMD.get("DRAW", player, self.request.get("coordinates"))) 

        if (self.request.get('readyAck')):
        # Notify Tv of player connection
            if (GS.currentPlayer == player):
                channel.send_message(hash + 'mobile' + player, CMD.get("PLAYER_READY", player, {}))
                channel.send_message(hash + 'tv', CMD.get("PLAYER_READY", player, {}))
            else:
                channel.send_message(hash + 'mobile' + player, CMD.get("PLAYER_STOP", player, {}))
                
        if (self.request.get('playerstart')):
            channel.send_message(hash + 'tv', CMD.get("PLAYER_START", player, {}))
                

app = webapp2.WSGIApplication([
                               ('/', MainRouter),
                               ('/.*/tv', TvRouter),
                               ('/.*/mobile/player1', mobileRouter),
                               ('/.*/mobile/player2', mobileRouter)
                               ], debug=True)