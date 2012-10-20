from google.appengine.ext.webapp import template
from google.appengine.api import channel
from Game import GameState
from Game import Game
import webapp2
import os
import logging
import hashlib
import time

def template2handler(handler,template_name,template_value):
    handler.response.headers['Content-Type'] = 'text/html'
    handler.response.out.write(template2string(template_name, template_value))

def template2string(template_name,template_value):
    path = os.path.join(os.path.dirname(__file__), '..','template', template_name)
    return template.render(path, template_value)

# Apps modules.

class MainRouter(webapp2.RequestHandler):
    def get(self):
        template2handler(self,'index.html',{
                                           'title': 'Welcome on TV Pictionary'
                                           })               

    def post(self):
        # Generate Hash
        hash = hashlib.sha1()
        hash.update(str(time.time()))
        hash = hash.hexdigest()[:4]
        
        # Create GameState to store data info
        GS = GameState(key_name = hash,
                           currentPlayer = -1,
                           totalPlayer = 0,
                           scorePlayers = ["0"])
        Game.push(GS)
        
        # redirect to /hash/tv
        self.redirect("/"+hash+"/tv")

class TvRouter(webapp2.RequestHandler):
    def get(self):
        hash = self.request.url.split("/")[3]
        token = channel.create_channel(hash+'tv')

        template2handler(self,'index-tv.html',{
                                           'title': 'You are the TV !',
                                           'token': token
                                           })
    def post(self):
        hash = self.request.url.split("/")[3]

        if (self.request.get('coordinates')):
            channel.send_message(hash+'tv', self.request.get('coordinates'))
            
  
class mobileRouter(webapp2.RequestHandler):
    def get(self):
        hash = self.request.url.split("/")[3]
        player = self.request.url.split("/")[5]
        
        token = channel.create_channel( hash+'mobile' )

        GS = Game.pull(hash)
        
        logging.info(GS.currentPlayer)

        template2handler(self,'index-mobile.html',{
                                           'title': 'You are the player!',
                                           'token': token
                                           })
        if (self.request.get('message')):
            channel.send_message(hash+'tv', self.request.get('message'))
        
        # Notify Tv of player connection
            channel.send_message(hash+'tv', {"cmd":"JOIN", "player":player,"data":{}})
        
    def post(self):
        hash = self.request.url.split("/")[3]
        player = self.request.url.split("/")[5]

        if (self.request.get('coordinates')):
            channel.send_message(hash+'tv', {"cmd":"DRAW", "player":player,"data":self.request.get("coordinates")}) 

                
app = webapp2.WSGIApplication([
                               ('/', MainRouter),
                               ('/.*/tv', TvRouter),
                               ('/.*/mobile/player1', mobileRouter),
                               ('/.*/mobile/player2', mobileRouter)
                               ], debug=True)