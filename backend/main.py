from google.appengine.ext.webapp import template
from google.appengine.api import channel
from Game import GameState
from Game import Game
from Player import Player
from Player import PlayerManager
import json
import webapp2
import os
import logging
import hashlib
import time
import random

ChannelTimeout = 120
wordlist = ["bite", "jojo", "mauvais", "salope", "anus", "PQ", "HACKDAY", "CAMPING", "Pedophile", "bestialisme", "maitresse bernard"]

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
                           currentIndex = 0,
                           currentKeyword = "",
                           totalPlayer = 0,
                           scorePlayers = ["0"]
                           )
        Game.push(GS)
        
        # redirect to /hash/tv
        self.redirect("/"+hash+"/tv")

class ChannelRouter(webapp2.RequestHandler):
    def get(self):
        return
    
    def post(self):
        logging.info(self.request.get('from'))

class CMD():
    @classmethod
    def get(cls, cmdCODE, player, data):
        return json.dumps({"cmd":cmdCODE, "player":player,"data":data})


class TvRouter(webapp2.RequestHandler):
    def get(self):
        hash = self.request.url.split("/")[3]
        token = channel.create_channel(hash+'tv',ChannelTimeout)

        template2handler(self,'index-tv.html',{
                                               'tv': True,
                                               'drawer':True,
                                               'title': 'You are the TV !',
                                               'token': token
                                               })
        
    def post(self):
        hash = self.request.url.split("/")[3]
        
        if (self.request.get('coordinates')):
            channel.send_message(hash+'tv', self.request.get('coordinates'))
            
        if (self.request.get('playerstop')):
            GS = Game.pull(hash)
            players = GS.players
            randomkeyword = wordlist[random.randrange(0,len(wordlist))]
            GS.currentKeyword = randomkeyword
            
            for playerid in players:
                playerstandby = playerid.split("_")[1]
                channel.send_message(hash + 'mobile' + playerstandby, CMD.get("PLAYER_STOP", playerstandby, {"keyword":randomkeyword}))
            
            if ( not GS.currentIndex == GS.totalPlayer - 1):
                GS.currentIndex += 1
            else:
                GS.currentIndex = 0
            
            GS.currentPlayer = players[GS.currentIndex].split("_")[1]
            Game.push(GS)
                            
            channel.send_message(hash + 'mobile' + GS.currentPlayer, CMD.get("PLAYER_READY", GS.currentPlayer, {"keyword":GS.currentKeyword}))
            
            
class mobileRouter(webapp2.RequestHandler):
    def get(self):
        hash = self.request.url.split("/")[3]
        player_str = self.request.url.split("/")[5]
        GS = Game.pull(hash)

        
        if len(GS.players) == 0 or (hash+"_"+player_str) not in GS.players:
            logging.info("creating channel");
            token = channel.create_channel( hash + 'mobile' + player_str,ChannelTimeout)
            
            #Create a player and push it in the DB
            playerDb = Player(key_name = hash + "_" + player_str, player_name = player_str, player_token = token)
            
            GS.players.append(hash+"_"+player_str)
            
            PlayerManager.push(playerDb)
        else:
            logging.info("player already existing, restoring token")
            #TODO : Token are expiring so they shouldn't be stored
            token = PlayerManager.pull( (hash+"_"+player_str) ).player_token
        
        logging.info("____TOKEN "+token)

        template2handler(self,'index-mobile.html',{
                                                   'mobile': True,
                                                   'drawer':True,
                                                   'title': 'You are the player_str!',
                                                   'token': token
                                                   })
        if (self.request.get('message')):
            channel.send_message(hash+'tv', self.request.get('message'))
        
        #TODO: update with next version
        if (GS.currentPlayer == "-1"):
            GS.currentPlayer = player_str
        GS.totalPlayer += 1
        Game.push(GS)

        channel.send_message(hash+'tv', CMD.get("JOIN", player_str, {}))
        
    def post(self):
        
        hash = self.request.url.split("/")[3]
        player = self.request.url.split("/")[5]

        GS = Game.pull(hash)
        
        if (self.request.get('coordinates')):
            channel.send_message(hash+'tv', CMD.get("DRAW", player, self.request.get("coordinates"))) 

        if (self.request.get('readyAck')):
        # Notify Tv of player connection
            logging.info(GS.currentPlayer)

            if (GS.currentPlayer == player):
                randomkeyword = wordlist[random.randrange(0,len(wordlist))]
                GS.currentKeyword = randomkeyword
                channel.send_message(hash + 'tv', CMD.get("PLAYER_READY", player, {}))
               
                # defer sending event to mobile
                time.sleep(0.5)
                channel.send_message(hash + 'mobile' + player, CMD.get("PLAYER_READY", player, {"keyword":randomkeyword}))
                logging.info("SENDING PLAYER READY TO "+player);
                
            else:
                for playerid in GS.players:
                    playerstandby = playerid.split("_")[1]
                    if (not playerstandby == GS.currentPlayer):
                        channel.send_message(hash + 'mobile' + playerstandby, CMD.get("PLAYER_STOP", playerstandby, {"keyword":GS.currentKeyword}))
                        logging.info("SENDING PLAYER STOP TO "+playerstandby);
        if (self.request.get('playerstart')):
            channel.send_message(hash + 'tv', CMD.get("PLAYER_START", player, {}))
                
        Game.push(GS)
        
app = webapp2.WSGIApplication([
                               ('/', MainRouter),
                               ('/_ah/channel/disconnected/', ChannelRouter),
                               ('/.*/tv', TvRouter),
                               ('/.*/mobile/player1', mobileRouter),
                               ('/.*/mobile/player2', mobileRouter), 
                               ('/.*/mobile/.*', mobileRouter)
                               ], debug=True)
