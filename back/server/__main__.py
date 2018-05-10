#coding: utf-8

__appname__ = 'linker'
__version__ = '18.130.1600' #немного оптимизирован код
#__version__ = '18.117.1430' #возвращаем параметры поиска, и в системе отображаем только данные по последнему запросу
#__version__ = '18.116.1400' #скорректированны sql запросы, изменен принцип вывода в связках по справочнику, переведено на webix 5.3
#__version__ = '18.115.1700' #скорректированны sql запросы, переведено на webix-jet 1.5
#__version__ = '18.114.1420' #сделанно боковое меню, изменен вывод в несвязанных, переписаны запросы в несвязанных
#__version__ = '18.106.0945' #оптимизирован запрос в несвязанных, исправлен отбор по производителю в главном поиске
#__version__ = '18.103.1330' #убранны ошибки при выборе в свзяках
#__version__ = '18.101.1520' #убранны некоторые баги, берем из базы слова исключения и коды на сведение
#__version__ = '18.101.1020' #добавлен отбор по источнику данных, убранны некоторые баги
#__version__ = '18.099.1727' #изменены sql запросы в попытке ускорения
#__version__ = '18.088.1400' # все справочникни грузятся одним запросом, а на сервере выполняются в разных тредах, запросы на проверку записей с count переписаны на exists
#__version__ = '18.088.1100' # основные запросы  и count выплняются в разных тредах, что привело в ускорению на 20% на одноядерной машине.
#__version__ = '18.080.1700' # оптимизированны запросы и доработанны некоторые функции, оптимизирован код фронтэнда.
#__version__ = '18.066.1625' # Добавлен редактор ролей, при изменении роли пользователей с этой ролью вышибает
#__version__ = '18.065.1735' # добавляются пользователи, пишется дата изменения штрихкодов в товаре, сделаны роли пользователей, даннае берутся с сервера. Осталось сделать табличку - редактор ролей.
#__version__ = '18.064.1400' # ускорен запрос для getLnkSprs, добавлен фильтр по дате в пропущенных и всех несвязанных
#__version__ = '18.061.1200' # ускорен запрос для spradmin'а
#__version__ = '18.060.0937' # исправлены запросы с выборкой по дате (при нажатии 'сегодня' не просавляется время в вебиксе) и добавлены фильры в админке SPR
#__version__ = '18.059.1555' # оптимизированны запросы с count(*)
#__version__ = '18.058.1405' # исправлены sql запросы для фильтров в связках
#__version__ = '18.058.0935' # исправлен запрос с выборкой из PRC по дате
#__version__ = '18.057.1630' # оптимизированны запросы, добавлены отборы и сортировки в линках
#__version__ = '18.047.1500' # выборка по количеству штрихкодов
#__version__ = '18.045.1500' # изменены некоторые sql запросы
#__version__ = '18.043.1610' # добавлена проверка данных при получении, там можно проверять права пользователя, добалена авторизация по роли вместо имени
#__version__ = '18.033.1000' # очень много исправлений и добавлений
#__version__ = '2017.346.1400' # старт
__profile__ = ""
__index__   =-1

import os
import sys
import json
import time
import uuid
import queue
import os.path
import random
import threading
import traceback

import libs.libs as libs

def main():
    w_path = '/ms71/data/linker'
    p_path = '/ms71/data/linker/api-k'
    sys.extip = None
    sys.intip = None
    global __profile__, __index__
    sys.APPCONF = {
        "Lock": libs.fLock,
        "params": [],
        "kwargs": {},
        "addr": ("127.0.0.1", 0),
        "nginx": {
            "location": "/ms71/conf/location",
            "upstream": "/ms71/conf/upstream",
        },
    }
    sys.APPCONF["params"], sys.APPCONF["kwargs"] , __profile__, __index__ = libs.handle_commandline(__profile__, __index__)
    sys.APPCONF["addr"] = sys.APPCONF["kwargs"].pop("addr", sys.APPCONF["addr"])
    sys.APPCONF["log"] = libs.logs(hostname=None, version=__version__, appname=__appname__, profile=__profile__)
    sys.APPCONF["api"] = libs.API(Lock=sys.APPCONF['Lock'], log = sys.APPCONF["log"], w_path = w_path, p_path=p_path)

    #import atexit
    #atexit.register(libs.shutdown, sys.APPCONF["log"])
    #threading.Thread(target=s_send, args=(), daemon=True).start()

    threads, processes = prepare_server(Lock=sys.APPCONF['Lock'], api = sys.APPCONF["api"])
    rc = 0
    try:
        server = libs.SCGIServer(sys.APPCONF["log"], hostname=None, version=__version__,
                                 appname=__appname__, profile=__profile__, index=__index__)
        server.serve_forever(sys.APPCONF["addr"], application)
    except KeyboardInterrupt as e:
        pass
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
    """main bussiness script"""
    addr, pid = env["scgi.initv"][:2]
    msg = f'{addr[0]} {addr[1]} {env["HTTP_METHOD"]} {env["URI"]} {env["HTTP_PARAMS"]} {env["HTTP_KWARGS"]}'
    env["scgi.defer"] = lambda: sys.APPCONF["log"]("%s close" % msg)
    #print(env['X-API-KEY'])
    sys.APPCONF["log"](msg)
    ret_code = u'200 OK'
    content = u''
    _rm = env["HTTP_METHOD"].upper()
    args=None
    if 'POST' == _rm:
        arg = env.get('HTTP_PARAMS')[0]
        _p_http = env.get('HTTP_KWARGS')
        _param = env['scgi.rfile'].read(env['CONTENT_LENGTH'])
        try:
            _param = zlib.decompress(_param)
        except Exception as Err:
            pass
        try:
            _param = json.loads(_param)
        except Exception as Err:
            _param = _p_http
            #sys.APPCONF["log"](_param, kind='error')
            #content = u'not applicable format. use JSON-formated string'
        else:
            _param.update(_p_http)
        sys.APPCONF["log"](arg, kind='info:method:')
        sys.APPCONF["log"](_param, kind='info:params:')
        #arg, _param = args.popitem()
        content = libs.parse_args(arg, _param, env['X-API-KEY'], sys.APPCONF['api'])

    # три обязательных вызова yield: статус, заголовки, содержание
    ret_value = content.encode()
    header = libs.head(len(ret_value), False, True)
    yield ret_code
    yield header
    yield ret_value

def prepare_server(Lock=None, api = None):
    """prepare the server, loading all bussiness-logic threads"""

    if not os.path.exists(api.path):
        os.makedirs(api.path)
    if not os.path.exists(api.p_path):
        os.makedirs(api.p_path)
    while not sys.extip:
        sys.extip, sys.intip = libs.getip(sys.APPCONF["log"])
    threads = []
    processes = []
    sys.APPCONF["log"](f'{__appname__} started.\tinternal ip-> {sys.intip}')
    sys.APPCONF["log"](f'\t\t\textrnal  ip-> {sys.extip}')

    #threads.append(threading.Thread(target=libs.warden, args=(Lock, st_queue, api), daemon=True))

    for th in threads:
        th.start()
    for pr in processes:
        pr.start()
    return threads, processes

def s_send():
    import json

    udpsock = libs.UDPSocket()
    pid = os.getpid() #pid of service
    uid = uuid.uuid4().hex #guid of service
    a_path = f'https://online365.pro/linker' #path for access from outside
    w_p = os.path.abspath(sys.argv[0])#full path to running script.
    f_size = os.path.getsize(w_p) #size of running file
    m_time = os.path.getmtime(w_p) #last modify time of running file
    sys.argv[0] = w_p
    argv = '%%'.join(m for m in sys.argv) #formated string from sys.argv
    while True: #infinite loop for heart beating
        p_d = {'appname': __appname__, 'version': __version__, 'profile': __profile__, 'index': __index__, 'pid': pid, 'uid': uid,
               'extip': sys.extip, 'intip': sys.intip, 'nginx path': a_path, 'argv': argv, 'm_time': m_time, 'size': f_size}
        payload = json.dumps(p_d, ensure_ascii=False) #heart beat message, it needs to discuss
        print(payload, file=udpsock) #send to UDP socket our message
        time.sleep(1.5 + random.random())


###############################################

if "__main__" == __name__:
    main()

