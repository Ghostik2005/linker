#coding: utf-8

__appname__ = 'merge3'
__version__ = '18.347.1520' #добавлен поиск по производителю
#__version__ = '18.340.1000' #production start
#__version__ = '18.324.1000' #project start

__profile__ = ""
__index__   =-1

import os
import sys
import json
import time
import uuid
import zlib
import queue
import os.path
import random
import urllib
import threading
import traceback

import libs.libs as libs
import libs.api as app_api

def main():
    w_path = '/ms71/data/merge3'
    p_path = '/ms71/data/merge3/api-k'
    sys.extip = None
    sys.intip = None
    global __profile__, __index__
    sys.APPCONF = {
        "params": [],
        "kwargs": {},
        "addr": ("127.0.0.1", 0),
        "nginx": {
            "location": "/ms71/conf/location",
            "upstream": "/ms71/conf/upstream",
            },
        }
    sys.APPCONF["udpsock"] = libs.UDPSocket()
    sys.APPCONF["params"], sys.APPCONF["kwargs"] , __profile__, __index__, pg, production, sys.APPCONF["udp"] = libs.handle_commandline(__profile__, __index__)
    sys.APPCONF["addr"] = sys.APPCONF["kwargs"].pop("addr", sys.APPCONF["addr"])
    sys.APPCONF["log"] = libs.logs(hostname=None, version=__version__, appname=__appname__, profile=__profile__)
    sys.APPCONF["api"] = app_api.API(log = sys.APPCONF["log"], w_path = w_path, p_path=p_path, pg=pg, production=production)
    rc = 0
    try:
        server = libs.SCGIServer(sys.APPCONF["log"], hostname=None, version=__version__,
                                 appname=__appname__, profile=__profile__, index=__index__, production=production)
        threads, processes = prepare_server(api = sys.APPCONF["api"])
        server.serve_forever(sys.APPCONF["addr"], application)
    except KeyboardInterrupt as e:
        sys.APPCONF["log"]('KEYBOARD EXIT', kind="info")
    except SystemExit as e:
        if e:
            rc = e.code
    except:
        sys.APPCONF["log"](traceback.format_exc(), kind="error")
    finally:
        try:
            libs.shutdown(sys.APPCONF["log"])
        except:
            sys.APPCONF["log"](traceback.format_exc(), kind="error:shutdown")
    return (rc)

def application(env):
    """
    main bussiness script
    """

    tt = time.time()
    addr, pid = env["scgi.initv"][:2]
    msg = f'{addr[0]} {addr[1]} {env["HTTP_METHOD"]} {env["URI"]} {env["HTTP_PARAMS"]} {env["HTTP_KWARGS"] or ""}'
    env["scgi.defer"] = lambda: sys.APPCONF["log"]("%s DONE" % msg)
    sys.APPCONF["log"](env['REMOTE_ADDR'], kind='REMOTE')
    sys.APPCONF["log"]("%s STARTS" % msg)
    ret_code = u'200 OK'
    content = u''
    _rm = env["HTTP_METHOD"].upper()
    arg=None
    fname = env['HTTP_KWARGS'].get('filename')
    if 'POST' == _rm:
        arg = env.get('HTTP_PARAMS')[0]
        _param = env['scgi.rfile'].read(env['CONTENT_LENGTH'])
        try:
            _param = zlib.decompress(_param)
        except Exception:
            pass
        try:
            _param = _param.decode()
        except Exception:
            pass 
        try:
            _param = json.loads(_param)
        except Exception:
            traceback.print_exc()
        sys.APPCONF["log"](arg, kind='info:method:')
        t = _param.copy()
        t = str(t)
        try:
            t = t[:8192]
        except:
            pass
        sys.APPCONF["log"](t, kind='info:params:')
        udp_msg = [__appname__, 'info', arg, t, time.strftime("%Y-%m-%d %H:%M:%S")]
        #send to UDP socket our message:
        #appname, kind of message('info', 'error', etc), called method, method's params, timestamp 
        print(json.dumps(udp_msg), file=sys.APPCONF["udpsock"]) 
        content = libs.parse_args(arg, _param, env['X-API-KEY'], sys.APPCONF['api'])

    ret_value = content.encode()
    if arg == 'login':
        header = libs.authHead(content, len(ret_value))
    else:
        header = libs.head(len(ret_value), False, True)
    tt = time.time() - tt
    env["scgi.defer"] = lambda: sys.APPCONF["log"]("%s DONE in %s secs" % (msg, tt))
    # передаем: статус, заголовки, содержание
    yield ret_code
    yield header
    yield ret_value


def prepare_server(api = None):
    """prepare the server, loading all bussiness-logic threads"""

    if not os.path.exists(api.path):
        os.makedirs(api.path, mode=0o777)
    if not os.path.exists(api.p_path):
        os.makedirs(api.p_path, mode=0o777)
    while not sys.extip:
        sys.extip, sys.intip = libs.getip(sys.APPCONF["log"])
    threads = []
    processes = []
    sys.APPCONF["log"](f'{__appname__} started.\tinternal ip-> {sys.intip}')
    sys.APPCONF["log"](f'\t\t\textrnal  ip-> {sys.extip}')

    #threads.append(threading.Thread(target=_insert_function_for_thread_here, args=(_insert_args_here,), daemon=True))
    threads.append(threading.Thread(target=libs.udp_send, args=(__appname__, __version__, sys.APPCONF["udp"]), daemon=True))

    for th in threads:
        th.start()
    for pr in processes:
        pr.start()
    return threads, processes


###############################################

if "__main__" == __name__:
    main()

