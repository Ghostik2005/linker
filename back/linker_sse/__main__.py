#coding: utf-8

__appname__ = 'linker_sse'
__version__ = '2018.176.1330' #start project


__profile__ = ""
__index__   =-1

import sys
import time
import queue
import random
import threading
import traceback
import subprocess


import libs.libs as libs


sys._SSE = {} #словарь текущих SSE подключений

def main():
    app_conf = init()
    
    try:
        app_conf['sse_server'].serve_forever()
    except KeyboardInterrupt as Err:
        print('Keyboard break, exiting', flush=True)
    except Exception as Err:
        print('Errr', flush=True)
    finally:
        libs.shutdown(app_conf)
    return

def init():
    sys._log = libs.logs(hostname=None, version=__version__, appname=__appname__, profile=__profile__)
    app_conf = {}
    app_conf['extip'] = None
    app_conf['intip'] = None
    while not app_conf['extip']:
        app_conf['extip'], app_conf['intip'] = libs.getip()
    sys._log('Server class: {0}'.format('SSE'))
    sys._log('Int IP: {0}, ext IP: {1}'.format(app_conf['intip'], app_conf['extip']))
    rc = 0
    #starting rpc-sse server
    sse_server = libs.sseServer(('127.0.0.1', 0), libs.sseHandler)
    srv_host, srv_port = sse_server.socket.getsockname()
    app_conf['sse_server'] = sse_server
    data = """location /events {

         if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'HEAD, GET, POST, OPTIONS';
            add_header 'Access-Control-Allow-Headers' '*';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
         }

         if ($request_method = 'GET') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'HEAD, GET, POST, OPTIONS';
            add_header 'Access-Control-Allow-Headers' '*';
            add_header 'Access-Control-Expose-Headers' '*';
         }

    limit_except GET OPTIONS {
        deny all;
        }
    proxy_buffering off;
    chunked_transfer_encoding off;
    proxy_cache off;
    proxy_pass http://%s:%s; #%s
    }""" % (srv_host, srv_port, __appname__)
    filelocation = f"/ms71/conf/location/{__appname__}"
    app_conf['filelocation'] = filelocation
    with open(filelocation, "wb") as f:
        f.write(data.encode())
    rc = subprocess.call(['sudo', 'nginx', '-s', 'reload', '-c', '/ms71/saas.conf', '-p', '/ms71/'])
    if 0 == rc:
        sys._log('Serving SSE server at {0}:{1}'.format(srv_host, srv_port))
        api = libs.API(sys._log)
        #threading.Thread(target=libs.send_data, args=(), daemon=True).start() #send data via SSE
        threading.Thread(target=api.send_data, args=(), daemon=True).start() #send data via SSE
        return app_conf
    raise SystemExit(rc)




if "__main__" == __name__:
    main()
