from google.appengine.ext.webapp import template
import webapp2
import os

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
        template2handler(self,'index-tv.html',{
                                           'title': 'You are the TV !'
                                           })      
  
class mobileRouter(webapp2.RequestHandler):
    def get(self):
        template2handler(self,'index-mobile.html',{
                                           'title': 'You are the player!'
                                           })  
                
app = webapp2.WSGIApplication([
                               ('/', MainRouter),
                               ('/.*/tv', TvRouter),             
                               ('/.*/mobile/player1', mobileRouter),
                               ('/.*/mobile/player2', mobileRouter)
                               ], debug=True)