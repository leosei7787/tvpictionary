import os
import webapp2
from google.appengine.api import channel
from google.appengine.api import users
import logging

class Channel(webapp2.RequestHandler):
    def get(self):
#        hash = self.request.get('hash')
        token = channel.create_channel('hash'+'player1')

        self.response.out.write('token='+token)