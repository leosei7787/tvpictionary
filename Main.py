from google.appengine.ext.webapp import template
from google.appengine.api import channel
from Models.Game import GameState
from Models.Game import Game
from Models.Player import Player
from Models.Player import PlayerManager
import json
import webapp2
import os
import logging
import hashlib
import time
import random

ChannelTimeout = 120
#wordlist = ["lampe", "tele", "maison", "geek", "ordinateur", "porte", "grenade", "gun", "sabre laser", "darth vador", "yoda", "anonymous", "chomage", "argent", "gagnants", "mammouth"]
wordlist = ["Light","Hack","Computer","Flower","Light Saber","Phone","iPod","Connected TV","Camping","Anonymous","Red","Blue","Green","Philosophy","Music","Rainbow","Bier","T-Shirt","Concert","Movie","Bible","iPhone","Bus","Plane","Apple","Milk","Glass","Bed","Geek","Money","Monster","Spaguetti","Hamburger","Pizza","Carpaccio","Beach","Skyscraper","Church","Bold","Keyboard","Plane","Tree","Grass","Love","Sun","Cloud","Air","Hair"]

def template2handler(handler,client,template_name,template_value):
    path = os.path.join(os.path.dirname(__file__),client,'template', template_name)
    logging.info(path)
    handler.response.headers['Content-Type'] = 'text/html; charset=utf-8'
    handler.response.out.write(template.render(path, template_value))    

# Apps modules.

class MainRouter(webapp2.RequestHandler):
    def get(self):
        template2handler(self,'tv','tv-index.html',{
                                            'client': 'tv',
                                            'page_name':'index',
                                            'title': 'Welcome on TV Pictionary - by jHackers'
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

        template2handler(self,'tv','tv-game.html',{
                                               'client': 'tv',
                                               'page_name':'game',
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
            randomkeyword = wordlist[ (random.randint(0,len(wordlist)-1)) ]
            GS.currentKeyword = randomkeyword

            if ( GS.currentIndex < GS.totalPlayer - 1):
                GS.currentIndex += 1
            else:
                GS.currentIndex = 0
            
            GS.currentPlayer = players[GS.currentIndex].split("_")[1]
            
            for playerid in players:
                playerstandby = playerid.split("_")[1]
                if( GS.currentPlayer == playerstandby):
                     logging.info("SENDING READY TO "+GS.currentPlayer)
                     channel.send_message(hash + 'mobile' + GS.currentPlayer, CMD.get("PLAYER_READY", GS.currentPlayer, {"keyword":GS.currentKeyword}))
                     channel.send_message(hash + 'tv' , CMD.get("PLAYER_READY", GS.currentPlayer, {}))
                else:
                    channel.send_message(hash + 'mobile' + playerstandby, CMD.get("PLAYER_STOP", playerstandby, {"keyword":randomkeyword}))
            

            Game.push(GS)
                            
           
            
            
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
            GS.totalPlayer += 1
            PlayerManager.push(playerDb)
        else:
            logging.info("player already existing, restoring token")
            #TODO : Token are expiring so they shouldn't be stored
            token = PlayerManager.pull( (hash+"_"+player_str) ).player_token
        
        logging.info("____TOKEN "+token)

        if (self.request.get('message')):
            channel.send_message(hash+'tv', self.request.get('message'))
        
        #TODO: update with next version
        if (GS.currentPlayer == "-1"):
            GS.currentPlayer = player_str
        
        Game.push(GS)

        channel.send_message(hash+'tv', CMD.get("JOIN", player_str, {}))
        
        template2handler(self,'mobile','mobile-game.html',{
                                                   'client': 'mobile',
                                                   'title': 'You are the '+player_str+' !',
                                                   'token': token
                                                   })
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
                randomkeyword = wordlist[random.randint(0,len(wordlist)-1)]
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
            
        if (player != GS.currentPlayer and self.request.get('playerattack')):
            channel.send_message(hash + 'mobile' + GS.currentPlayer, CMD.get("PLAYER_ATTACKED", GS.currentPlayer, {}))
            
        if (self.request.get('playerfound')):
            """players = GS.players
            randomkeyword = wordlist[random.randrange(0,len(wordlist))]
            GS.currentKeyword = randomkeyword
            
            for playerid in players:
                playerstandby = playerid.split("_")[1]
                channel.send_message(hash + 'mobile' + playerstandby, CMD.get("PLAYER_STOP", playerstandby, {"keyword":randomkeyword}))
            
            if ( not GS.currentIndex == GS.totalPlayer - 2):
                GS.currentIndex += 1
            else:
                GS.currentIndex = 0
            
            GS.currentPlayer = players[GS.currentIndex].split("_")[1]"""
            channel.send_message(hash + 'tv', CMD.get("PLAYER_FOUND", player, {}))
            #channel.send_message(hash + 'mobile' + GS.currentPlayer, CMD.get("PLAYER_READY", GS.currentPlayer, {"keyword":GS.currentKeyword}))
        
        Game.push(GS)
        
app = webapp2.WSGIApplication([
                               ('/', MainRouter),
                               ('/_ah/channel/disconnected/', ChannelRouter),
                               ('/.*/tv', TvRouter),
                               ('/.*/mobile/player1', mobileRouter),
                               ('/.*/mobile/player2', mobileRouter), 
                               ('/.*/mobile/.*', mobileRouter)
                               ], debug=True)
