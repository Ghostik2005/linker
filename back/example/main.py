# -*- coding: utf-8 -*-

import web
import sys, os
import inv_link_ext

reload(sys)
sys.setdefaultencoding('utf8')

def set_process_name(name):
    if os.name == 'posix':
        from ctypes import cdll, byref, create_string_buffer
        libc = cdll.LoadLibrary('libc.so.6')
        buff = create_string_buffer(len(name) + 1)
        buff.value = name
        libc.prctl(15, byref(buff), 0, 0, 0)
set_process_name('invlink-server')

pid_file = '/var/invlink-server.pid'
log_file = '/var/invlink-server.log'
        
urls = (
    '/(.*)', 'invlink_server'
)


app = web.application(urls, globals())

class invlink_server:
    def GET(self, name):
        return "Hi I invlink_server"
    
    def POST(self, name):
        i = web.input()
        invLinkTools = inv_link_ext.invLinkTools()
        invLinkTools.sp_task = i.sp_task
        if "start" in i:
            invLinkTools.start = str(i.start)
        if "limit" in i:
            invLinkTools.limit = str(i.limit)
        if "type_action" in i:
            invLinkTools.type_action = str(i.type_action)
        
        if "query" in i:
            invLinkTools.query = str(i.query)
        
        if "specParam" in i:
            invLinkTools.specParam = str(i.specParam)
            
        if "sp_serch" not in i:
            #print "-------------"
            i.sp_serch = "999999"
        try:            
            #print i.sp_task, ' - ', i.sp_serch
            return getattr(invLinkTools, i.sp_task)(i.sp_serch)
        except Exception, e:
            #print "main error: ", e
            return e

class Logger(object):
    def __init__(self):
        self.log = open(log_file, 'a', 0)
    def __del__(self):
        self.log.close()
    def write(self, msg):
        #self.log.write(msg.decode('utf-8'))
        self.log.write(msg)
        os.fsync(self.log)
            
def main():
    # reopen stdout file descriptor with write mode
    # and 0 as the buffer size (unbuffered)
    #sys.stdout = os.fdopen(sys.stdout.fileno(), 'w', 0)
    sys.stdout = sys.stderr = Logger() #open(log_file, 'a')
    app.run()
 #   print 'end'
 #   print 'end'

if __name__ == "__main__":

    # do the UNIX double-fork magic, see Stevens' "Advanced 
    # Programming in the UNIX Environment" for details (ISBN 0201563177)
    app.run()
    sys.stdout.flush()