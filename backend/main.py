from google.appengine.ext.webapp import template
from google.appengine.api import channel
import webapp2
import os
import logging

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

class TvRouter(webapp2.RequestHandler):
    def get(self):
        
        token = channel.create_channel('hash'+'tv')

        template2handler(self,'index-tv.html',{
                                           'title': 'You are the TV !',
                                           'token': token
                                           })
    def post(self):
#       self.response.headers['Content-Type'] = 'text/json'
#        self.response.out.write('{"message":"How are you ?"}')
##        self.response.out('Salut')

        channel.send_message('hash'+'tv','{"message":"How are you ?"}')
#        channel.send_message('hash'+'tv','How are you?')

        if (self.request.get('message')):
            channel.send_message('hash'+'tv', self.request.get('message'))
  
class mobileRouter(webapp2.RequestHandler):
    def get(self):
        
        token = channel.create_channel('hash'+'mobile')

        template2handler(self,'index-mobile.html',{
                                           'title': 'You are the player!',
                                           'token': token
                                           })
        if (self.request.get('message')):
            channel.send_message('hash'+'tv', self.request.get('message'))
        
    def post(self):
        
        for argument in self.request.arguments():
            logging.info('arg:'+argument)
        
        if (self.request.get('message')):
            channel.send_message('hash'+'tv', self.request.get('message'))
        if (self.request.get('coordinates')):
            channel.send_message('hash'+'tv', self.request.get("coordinates")) 
            
        


                
app = webapp2.WSGIApplication([
                               ('/', MainRouter),
                               ('/.*/tv', TvRouter),
                               ('/.*/mobile/player1', mobileRouter),
                               ('/.*/mobile/player2', mobileRouter)
                               ], debug=True)