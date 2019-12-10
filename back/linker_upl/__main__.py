#coding: utf-8

__appname__ = 'linker_uploader'
__version__ = '19.336.2045' # убрана еФаорма из сведения по протеку
__version__ = '19.319.1205' # объединяются коды Надежда-Ф
# __version__ = '19.263.1200' # исправленна функция загрузки файлов .nolink
# __version__ = '19.259.1200' # добавлен пул соединений с сервером
# __version__ = '19.217.1000' # добавлен еще один протек 20237
# __version__ = '19.212.1220' # замена кодов для м-аптеки
# __version__ = '19.191.0940' # все переводится на Admin
# __version__ = '19.176.1620' # добавлен поставщик 40278, теперь все поставщики с кодами 402** приводятся к 40277
#__version__ = '19.153.0900' # введен дополнительный лог
#__version__ = '19.150.1210' # добавленно сведение по кодам для протека
# __version__ = '19.023.1635' # добавленно автоматическое направление на сведение для антея
#__version__ = '19.011.1320' # ускорен запрос на обработку по кодам, добавлена проверка по ШК
#__version__ = '18.333.1027' #улучшена обработка по производителю
#__version__ = '18.292.1150' #переведено на pg, выбираются разрешенные id_vnd из базы
#__version__ = '18.281.1144' #изменена функция вычисления хэша: теперь учитываютмя + и - если в наименовании есть слово "ОЧКИ"
#__version__ = '18.256.1445' #порезали вывод в лог
#__version__ = '18.242.1750' #добавленная поддержка PG, можно будет просто  переключить на нее.
#__version__ = '18.232.1000' #исправлены некоторые ошибки
#__version__ = '18.233.1700' #считаем контрольную сумму md5 загружаемых данных из PLExpert, если она совпадает с существующимим заданиями от этого поставщика - пропускаем
#__version__ = '18.232.1345' #заглушка чтобы не обрабатывать PLEXpert
#__version__ = '18.220.1350' #добавленна обработка после каждого файла
#__version__ = '18.211.1300' #исправленна функция запроса названия поставщика
#__version__ = '18.193.1513' #исправлен ошибка импорта requests
#__version__ = '18.192.1553' #изменен api сервиса получения имени
#__version__ = '18.180.1815' #убираем из насвания производителя все, что до знака > вместе с эти знаком
#__version__ = '18.179.1120' #добавленно добавление имени поставщика в базу
#__version__ = '18.176.1400' # добавлено разделение на склад и плэксперт
#__version__ = '18.152.0921' # более стабильная версия
#__version__ = '18.150.1125' # более стабильная версия
#__version__ = '18.108.0945' # старт
__profile__ = ""
__index__   =-1

import os
import sys
import zlib
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
    w_path = '/ms71/data/linker_upl'
    p_path = '/ms71/data/linker_upl/restricted'
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
    addr, _ = env["scgi.initv"][:2]
    msg = f'{addr[0]} {addr[1]} {env["HTTP_METHOD"]} {env["URI"]} {env["HTTP_PARAMS"]} {env["HTTP_KWARGS"]}'
    env["scgi.defer"] = lambda: sys.APPCONF["log"]("%s close" % msg)
    #print(env['X-API-KEY'])
    sys.APPCONF["log"](msg)
    ret_code = u'200 OK'
    content = u''
    _rm = env["HTTP_METHOD"].upper()
    arg=None
    fname = env['HTTP_KWARGS'].get('filename')
    source = env['HTTP_KWARGS'].get('source')
    callback = env['HTTP_KWARGS'].get('callback')
    if fname:
        if 'POST' == _rm:
            data = env['scgi.rfile'].read(env['CONTENT_LENGTH'])
            try:
                data = zlib.decompress(data)
            except Exception:
                pass
            if data and fname:
                sys.APPCONF["log"](fname, kind='info:saving:')
                content = sys.APPCONF['api'].upload_file(fname, data, source, callback, x_hash=env['X-API-KEY'])
    else:
        if 'POST' == _rm:
            arg = env.get('HTTP_PARAMS')[0]
            _p_http = env.get('HTTP_KWARGS')
            _param = env['scgi.rfile'].read(env['CONTENT_LENGTH'])
            try:
                _param = zlib.decompress(_param)
            except Exception:
                pass
            try:
                _param = json.loads(_param)
            except Exception:
                _param = _p_http
            else:
                _param.update(_p_http)
            sys.APPCONF["log"](arg, kind='info:method:')
            if len(str(_param)) < 1000:
                sys.APPCONF["log"](_param, kind='info:params:')
            else:
                sys.APPCONF["log"](str(_param)[:1000], kind='info:params:')
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

    threads.append(threading.Thread(target=libs.guardian, args=(api,), daemon=True)) ########################
    
    #threads.append(threading.Thread(target=libs.monitor, args=(api,), daemon=True))

    for th in threads:
        th.start()
    for pr in processes:
        pr.start()
    return threads, processes


###############################################

if "__main__" == __name__:
    main()

