#coding: utf-8

import os
import sys
import time
import queue
import random
import traceback
import subprocess
import socketserver
import configparser
import datetime
from urllib.parse import unquote
from http.server import BaseHTTPRequestHandler

import psycopg2

try:
    import fdb
except ImportError:
    import libs.fdb as fdb


class API:

    def __init__(self, log):
        self.log = log

        self.connect_params = {'dbname': 'spr', 'user': 'postgres', 'host': 'localhost', 'port': 5430}
        self.production = True
            
        if callable(self.log):
            self.log("Production" if self.production else "Test")
        else:
            print("Production" if self.production else "Test", flush=True)


    def send_busy(self):
        data = None
        c = 0
        while True:
            k = list(sys._SSE.keys())
            while k:
                cur = None
                con = None
                v = k.pop()
                _q, dt_old = sys._SSE.get(v)
                if _q:
                    spr_process = os.path.exists('/ms71/data/linker/spr.pid')
                    spr_roz_process = os.path.exists('/ms71/data/linker/spr_roz.pid')
                    if spr_process:
                        params = ['enablespin', f'spr::0', c]
                    else:
                        try:
                            with open('/ms71/data/linker/spr.lm', 'r') as f_obj:
                                last_m = f_obj.read().strip()
                        except:
                            last_m = 0
                        params = ['disablespin', f'spr::{last_m or 0}', c]
                    _q.put(params)
                    
                    if spr_roz_process:
                        params = ['enablespin', f'spr_roz::0', c]
                    else:
                        try:
                            with open('/ms71/data/linker/spr_roz.lm', 'r') as f_obj:
                                last_m = f_obj.read().strip()
                        except:
                            last_m = 0
                        params = ['disablespin', f'spr_roz::{last_m or 0}', c]
                    _q.put(params)
            time.sleep(1.5)


    def send_data(self):
        data = None
        c = 0
        while True:
            k = list(sys._SSE.keys())
            while k:
                cur = None
                con = None
                v = k.pop()
                _q, dt_old = sys._SSE.get(v)
                if _q:
                    _, user = v.split('::')
                    try:
                        con = psycopg2.connect(**self.connect_params)
                    except Exception as Err:
                        self._log(traceback.format_exc(), kind="error:connection")
                    else:
                        cur = con.cursor()
                    if cur:
                        sql = """SELECT r.SH_PRC, r.CHANGE_DT
FROM PRC r
JOIN USERS u on u."GROUP" = r.ID_ORG AND u."USER" = %s
WHERE r.N_FG <> 1 ORDER by r.CHANGE_DT DESC
limit 1"""
                        opt = (user,)
                        res = cur.execute(sql, opt)
                        try:
                            dt = res.fetchone()[1]
                            dt = time.mktime(dt.timetuple())
                        except:
                            dt = 0
                        c += 1
                        rr = random.random() * 100
                        #if rr > 95 or dt != dt_old:
                        if dt > dt_old:
                            params = ['update', 'Есть новые позиции для сведения. Обновите данные.', c]
                            sys._SSE[v] = [_q, dt]
                        else:
                            params = ['info', f'U->{user}, dt-> {dt}, c-> {c}', c]
                        _q.put(params)
                try:
                    con.close()
                except:
                    pass
            time.sleep(60)


def getip():
    """
    get ip's function
    """
    
    import socket
    _urls = ('https://sklad71.org/consul/ip/', 'http://ip-address.ru/show','http://yandex.ru/internet',
        'http://ip-api.com/line/?fields=query', 'http://icanhazip.com', 'http://ipinfo.io/ip',
        'https://api.ipify.org')
    s = r"[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}"
    eip = None
    iip = ''
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as se:
            se.connect(("77.88.8.8", 80))
            iip = se.getsockname()[0]
    except Exception as e:
        sys._log(f"err:{str(e)}")
    import ssl, re, urllib.request
    ssl._create_default_https_context = ssl._create_unverified_context
    for url in _urls:
        r = None
        data = ''
        try:
            with urllib.request.urlopen(url, timeout=2) as r:
                data = str(r.headers)
                data += r.read().decode()
                eip = re.findall(s, data)[0].strip()
                break
        except Exception as e:
            continue
    return eip, iip

class sseServer (socketserver.ThreadingMixIn, socketserver.TCPServer):
    #класс JSONRPCServer
    daemon_threads = True
    allow_reuse_address = True
    _send_traceback_header = False
    
    def handle_error(self, request, client_address):
        pass
        return

class sseHandler(BaseHTTPRequestHandler):

    sse_path = '/events/SSE'

    def send_200(self, cl_id):
        try:
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Cache-Control", "no-cache")
            self.send_header("X-Accel-Buffering", "no")
            self.send_header("Connection", "keep-alive")
            self.send_header("Pragma", "no-cache")
            self.end_headers()
        except Exception as Err:
            sys._log(f'client: \'{cl_id}\' error ->> {traceback.format_exc()}')

    def send_err(self, cl_id):
        if cl_id:
            code = 423
            response = '[GET] Locked {0}: change the uri to {1}\n'.format(self.path, self.sse_path).encode()
        else:
            code = 401
            response = '[GET] Unauthorized: you have to provide your id\n'.encode()
        try:
            self.send_response(code)
            self.send_header("Content-type", "text/plain")
            self.send_header("Content-length", str(len(response)))
            self.send_header("Cache-control", "no-cache")
            self.end_headers()
            self.wfile.write(response)
            data = "retry: {0}\n\n".format('5')
            self.wfile.write(data.encode())
            self.wfile.flush()
        except Exception as Err:
            sys._log(f'client: \'{cl_id}\' error ->> {traceback.format_exc()}')

    def do_GET(self):
        try:
            self.path, cl_id = self.path.split('?')
            cl_id = unquote(cl_id)
        except:
            cl_id = None
        if not self.path.endswith('/SSE') or not cl_id:
            self.send_err(cl_id)
        else:
            self.close_connection = 0
            self.send_200(cl_id)
            q = queue.Queue()
            # new connect
            sys._SSE[cl_id] = [q, 0]
            d2 = 'welcome %s !' % (cl_id)
            data = "event: greating\ndata: %s\n\n" % d2
            try:
                self.wfile.write(data.encode())
                self.wfile.flush()
            except: pass
            while True:
                params = None
                #отсылаем или событие, если оно есть, или пустое сообщение
                try:
                    params = q.get(block=True, timeout=1+random.random())
                    data = 'event: %s\ndata: %s\nid: %s\n\n' % (params[0], params[1], params[2])
                    q.task_done()
                except queue.Empty:
                    time.sleep(random.random())
                    data = ":\n\n"
                try:
                    self.wfile.write(data.encode())
                    self.wfile.flush()
                except Exception as Err:
                    sys._log('except while main writing')
                    sys._log(f'client: \'{cl_id}\' error ->> connection lost')
                    break
            # close connect
            try: sys._SSE.pop(cl_id)
            except: pass
            try: self.wfile.close()
            except: pass
            try: self.rfile.close()
            except: pass


def shutdown(app_conf):
    """
    function, runs when exiting
    """
    try:
        os.remove(app_conf["filelocation"])
    except: pass
    subprocess.call(['sudo', 'nginx', '-s', 'reload', '-c', '/ms71/saas.conf', '-p', '/ms71/'])
    try:
        app_conf['sse_server'].server_close()
    except Exception as Err:
        sys._log(Err)

def send_data():
    #функция шлет данные во все открытые SSE соединения
    data = None
    c = 0
    for data in data_gen():
        if data:
            c += 1
            v = list(sys._SSE.values())
            params = ['message', data, c]
            while v:
                _q = v.pop()
                _q.put(params)
        time.sleep(4)

def data_gen():
    c = 0
    while True:
        c += 1
        payload = random.random()*120
        data = f'Iteration {c}, payload: {payload}'
        yield data


class logs:
    """
    logging class
    """
    def __init__(self, hostname=None, version=None, appname=None, profile=None):
        self.hostname = hostname
        self.version = version
        self.appname = appname
        self.profile = profile
        self.output = sys.stdout

    def __call__(self, msg, kind='info', begin='', end='\n', clear=False):
        try:
            ts = "%Y-%m-%d %H:%M:%S"
            try: ts = time.strftime(ts)
            except: ts = time.strftime(ts)
            if not clear:
                if self.hostname:
                    if self.profile:
                        s = '{0}{1} {2} {4}.{5}:{3}:{6} {7}{8}'.format(begin, ts, self.hostname, self.version, self.appname, self.profile, kind, msg, end)
                    else:
                        s = '{0}{1} {2} {4}:{3}:{5} {6}{7}'.format(begin, ts, self.hostname, self.version, self.appname, kind, msg, end)
                else:
                    if self.profile:
                        s = '{0}{1} {3}.{4}:{2}:{5} {6}{7}'.format(begin, ts, self.version, self.appname, self.profile, kind, msg, end)
                    else:
                        s = '{0}{1} {3}:{2}:{4} {5}{6}'.format(begin, ts, self.version, self.appname, kind, msg, end)
            else:
                s = '{0}{1}'.format(msg, end)
            self.output.write(s)
            self.output.flush()
        except:
            traceback.print_exc()


