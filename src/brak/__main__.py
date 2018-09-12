#!/usr/bin/python
# -*- coding: utf-8 -*-

import web
import sys, os
import worker, shutil
import json
#import options
#import Image
from PIL import Image
reload(sys)
sys.setdefaultencoding('utf8')
        
urls = ( '/(.*)', 'brak' )

app = web.application(urls, globals())

class brak:
    def GET(self, name):
        return "Hi I brak_server Get"        
    
    def POST(self, name):
        i = web.input()        
        try:
            Worker = worker.Worker()
            Worker.task = i.task
            if i.task == 'fileUpload':
                Worker.action = web.input(impfile={})
            if "action" in i:
                Worker.action = i.action
	    #return Worker.action, Worker.task
            return getattr(Worker, i.task)()
        except Exception, e:
            return e
        

if __name__ == "__main__":
    print "start..."
    sys.stdout.flush()
    app.run()
    