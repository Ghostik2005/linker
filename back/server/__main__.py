# coding: utf-8

__appname__ = "linker"
__version__ = "23.193.1800"  # новая версияы
# __version__ = "20.051.1230"  # исправлен поиск по spr
# __version__ = '20.044.1100' # добавленно поле id_owner в таблицу SPR
# __version__ = '19.344.1210' # добавлен фильтр по значению в шапке линкера
# __version__ = '19.277.1121' # возвращаем из пропущенных только на админа
# __version__ = '19.268.1000' # исправлен sql запрос на вставку в штрихкоды
# __version__ = '19.263.1100' # ускорили ответы при запросе следующих страниц во всех таблицах
# __version__ = '19.262.1100' # добавили лог изменения связок в клик
# __version__ = '19.255.1630' #добавлен пул соединений с сервером
# __version__ = '19.233.1400' #добаленно поле накладная в ошибках
# __version__ = '19.134.1330' #добавлен фильтр по id_tovar в связках по точному соответсвию
# __version__ = '19.133.1717' #добавлен фильтр по id_tovar в пропущенных
# __version__ = '19.133.1641' #добавлен фильтр по id_tovar в несвязанных
# __version__ = '19.115.1400' #отбор по товарной группе
# __version__ = '19.102.1435' #можно дублировать товары в prc
# __version__ = '19.100.0955' #исправлен метод на вставку данных по ошибкам из склада
# __version__ = '19.094.1700' #исправлена оштибка при назначении свойства для одного товара, добавленно поле user_id в ошибках из склада
# __version__ = '19.093.1700' #добавлен поиск по производителю в сведении РЛС
# __version__ = '19.093.1500' #исправленна сортировка в справочнике эталонов
# __version__ = '19.088.1300' #добавлена таблица  для записи ошибок из склада
# __version__ = '19.084.1300' #оптимизирован один sql запрос
# __version__ = '19.081.1300' #убрано все от Firebird
# __version__ = '19.077.1500' #fix sql requests for mass set properties
# __version__ = '19.074.1235' #fix sql requests for inprice. again
# __version__ = '19.073.1820' #fix sql requests for inprice
# __version__ = '19.073.1820' #added table with actual items in price
# __version__ = '19.073.1650' #fix sql request for admspr with epty group
# __version__ = '19.070.1650' #minors stability update
# __version__ = '19.051.1045' #возвращается код 204 если ответ пустой
# __version__ = '19.031.1630' #пофиксены некоторые багги
# __version__ = '19.024.1625' #добавленны колонки в ШК
# __version__ = '19.022.1530' #добавлен отчет по дублирующимся штрихкодам
# __version__ = '19.021.1400' #добавлен отбор по отсутсвующим свойствам
# __version__ = '19.021.1045' #сведение справочника  с рлс, сайт производителя
# __version__ = '19.016.1600' #добавленно массовое изменение свойств эталона
# __version__ = '19.015.1200' #изменени интерфейс части справочников, добавлена дата добавления эталона
# __version__ = '19.013.1330' #добавленное реадктирование товарных групп
# __version__ = '18.355.0900' #исправленно сравнение файла xls с нашей базой
# __version__ = '18.353.1500' #добавлено сравнение файла xls с нашей базой
# __version__ = '18.347.1725' #добавлено сравнение хешей для сохраняемого письма в браку
# __version__ = '18.341.0900' #добавлена корректировка файла забраковки
# __version__ = '18.334.1500' #исправленны старые запросы, текст ошибки передает на фронт
# __version__ = '18.320.1500' #сокращено время загрузки в забракованных, добавленна галочка 'без писем'
# __version__ = '18.319.1535' #сокращено время загрузки приложения на 4 секунды, улучшения в админке
# __version__ = '18.318.1735' #сделана сортировка по количеству вхождений в spr
# __version__ = '18.317.1250' #подсчитыается количество групп при заведении новых позиций в справочнике, отрефаторен код
# __version__ = '18.311.1417' #убрана ошибка в отборе по рецептурным и обязательным в админке
# __version__ = '18.306.1200' #опция для того чтоб не сводить, убран алерт при 403 ошибке
# __version__ = '18.302.1650' #добавлен метод getBrakMailApi
# __version__ = '18.302.1125' #добавлена отправка данных о сервисе на UDP, убрано конфигурирование nginx для статики
# __version__ = '18.299.1355' #улучшены кнопки выгрузки spr, подправлен фильтр по поставщику в связках
# __version__ = '18.295.1700' #работаем с SSE, полностью реализованны выгрузки spr
# __version__ = '18.291.1600' #исправлен отбор во всех несвязанных, добавлена возможность изменять поведение сведения по кодам
# __version__ = '18.290.1500' #убраны (надеюсь все) проблемы с сортировками, работаем с базой pg,
# __version__ = '18.288.1000' #добавлен выбор порта для pg
# __version__ = '18.285.1800' #учтены некоторые пожелания
# __version__ = '18.284.1600' #устранены ошибки в некоторых запросах, доработано удаление писем о браке
# __version__ = '18.284.1030' #запущено приложение brak
# __version__ = '18.283.1750' #сделанно добавление текста письма
# __version__ = '18.274.1000' #исправлены запросы sql, которые не работали для pg, исправлены скрипты для даблиц с SPR, чтоб не было ошибок
# __version__ = '18.270.1600' #исправлены все фильтры с датами в приложении, обновлена блокировка файлов, API вынесено в отдельный файл
# __version__ = '18.270.1312' #пофиксен неправильный отбор по дате в пропущенных
# __version__ = '18.268.1725' #улучшен Брак
# __version__ = '18.263.1705' #поиск по sh_prc в пропущенных и несвязанных
# __version__ = '18.260.1415' #показываются все несвязанные, в т.ч. и в те, которые в работе, выбор производетя сделан по RegExp
# __version__ = '18.257.1615' #добавлена выборка брака, пока без текста писем
# __version__ = '18.256.1615' #добавленно setexit
# __version__ = '18.242.1750' #добавленна поддержка PG, нужно просто переключить
# __version__ = '18.227.1040' #исправлена обработка ответа запроса в связках по эталонам
# __version__ = '18.211.1220' #не передает поставщика если он null
# __version__ = '18.180.1750' #можно сохранять некоторые параметры
# __version__ = '18.180.0925' #исправлен запрос на поиск в несведенных (была ошибка при выборе источника)
# __version__ = '18.179.1005' #исправлен запрос на пропуск товара
# __version__ = '18.178.1005' #добавленно поле id_org, исправленно неверное трактования значения стартовой позиции и конечной позиции, исправлен запрос по всем несведенным позициям
# __version__ = '18.177.1425' #в связках добавленно столбец источник, откуда пришло
# __version__ = '18.176.1425' #в несвязанных и пропущенных добавленно поле источник для вывода
# __version__ = '18.160.1310' #исправленная ошибка при добавлении новой позиции в SPR: при пустой форме выпуска формировался неправильный sql запрос, исправлен поиск по idspr в основном экране
# __version__ = '18.159.1640' #сделанны отборы в таблицах по выпадающему списку везде, где есть справочные значения, оптимизированн запрос по поиску связок
# __version__ = '18.158.1640' #добавленно сохранение на сервере состояние кнопок
# __version__ = '18.157.1640' #исправленно формирование больших отчетов - теперь ограничение только физическими возможностями сервера
# __version__ = '18.156.1715' #формируем отчеты в xlsx, csv, ods
# __version__ = '18.155.1545' #улучшен отбор по производителю эталонна в связках (поиск по справочнику)
# __version__ = '18.155.1030' #добавлен отбор в связках по поставщикам через комбо-фильтр, отбор в связках по хэшу
# __version__ = '18.152.0925' #оптимизированны некоторые запросы
# __version__ = '18.150.1125' #оптимизированны некоторые запросы
# __version__ = '18.136.1625' #устранен баг с формами выпуска
# __version__ = '18.136.1430' #устранен баг с поиском
# __version__ = '18.135.1505' #добавлена форма выпуска препарата
# __version__ = '18.135.1005' #добавлен фильтр по idspr и д.в-ву в линкере
# __version__ = '18.135.0900' #изменен поиск по производителю в основном экране
# __version__ = '18.131.1200' #добавленно удаление из SPR
# __version__ = '18.130.1600' #немного оптимизирован код
# __version__ = '18.117.1430' #возвращаем параметры поиска, и в системе отображаем только данные по последнему запросу
# __version__ = '18.116.1400' #скорректированны sql запросы, изменен принцип вывода в связках по справочнику, переведено на webix 5.3
# __version__ = '18.115.1700' #скорректированны sql запросы, переведено на webix-jet 1.5
# __version__ = '18.114.1420' #сделанно боковое меню, изменен вывод в несвязанных, переписаны запросы в несвязанных
# __version__ = '18.106.0945' #оптимизирован запрос в несвязанных, исправлен отбор по производителю в главном поиске
# __version__ = '18.103.1330' #убранны ошибки при выборе в свзяках
# __version__ = '18.101.1520' #убранны некоторые баги, берем из базы слова исключения и коды на сведение
# __version__ = '18.101.1020' #добавлен отбор по источнику данных, убранны некоторые баги
# __version__ = '18.099.1727' #изменены sql запросы в попытке ускорения
# __version__ = '18.088.1400' # все справочникни грузятся одним запросом, а на сервере выполняются в разных тредах, запросы на проверку записей с count переписаны на exists
# __version__ = '18.088.1100' # основные запросы  и count выплняются в разных тредах, что привело в ускорению на 20% на одноядерной машине.
# __version__ = '18.080.1700' # оптимизированны запросы и доработанны некоторые функции, оптимизирован код фронтэнда.
# __version__ = '18.066.1625' # Добавлен редактор ролей, при изменении роли пользователей с этой ролью вышибает
# __version__ = '18.065.1735' # добавляются пользователи, пишется дата изменения штрихкодов в товаре, сделаны роли пользователей, даннае берутся с сервера. Осталось сделать табличку - редактор ролей.
# __version__ = '18.064.1400' # ускорен запрос для getLnkSprs, добавлен фильтр по дате в пропущенных и всех несвязанных
# __version__ = '18.061.1200' # ускорен запрос для spradmin'а
# __version__ = '18.060.0937' # исправлены запросы с выборкой по дате (при нажатии 'сегодня' не просавляется время в вебиксе) и добавлены фильры в админке SPR
# __version__ = '18.059.1555' # оптимизированны запросы с count(*)
# __version__ = '18.058.1405' # исправлены sql запросы для фильтров в связках
# __version__ = '18.058.0935' # исправлен запрос с выборкой из PRC по дате
# __version__ = '18.057.1630' # оптимизированны запросы, добавлены отборы и сортировки в линках
# __version__ = '18.047.1500' # выборка по количеству штрихкодов
# __version__ = '18.045.1500' # изменены некоторые sql запросы
# __version__ = '18.043.1610' # добавлена проверка данных при получении, там можно проверять права пользователя, добалена авторизация по роли вместо имени
# __version__ = '18.033.1000' # очень много исправлений и добавлений
# __version__ = '2017.346.1400' # старт
__profile__ = ""
__index__ = -1

import json
import os
import sys
import threading
import time
import traceback
import urllib
import zlib
from os import path

import libs.api as app_api
import libs.libs as libs


def main(debug_fg=False):
    w_path = "/ms71/data/linker"
    p_path = "/ms71/data/linker/api-k"
    sys.extip = None
    sys.intip = None
    global __profile__, __index__
    addr = ("127.0.0.1", 5555) if debug_fg else ("127.0.0.1", 0)
    sys.APPCONF = {
        "debug": debug_fg,
        "params": [],
        "kwargs": {},
        "addr": addr,
        "nginx": {
            "location": "/ms71/conf/location",
            "upstream": "/ms71/conf/upstream",
        },
    }
    wd = path.dirname(path.abspath(__file__))
    work_dir = wd if path.isdir(wd) else path.dirname(wd)
    pg = path.join(work_dir, "spr.postgres")
    sys.APPCONF["udpsock"] = libs.UDPSocket()
    (
        sys.APPCONF["params"],
        sys.APPCONF["kwargs"],
        __profile__,
        __index__,
        production,
        sys.APPCONF["udp"],
    ) = libs.handle_commandline(__profile__, __index__)
    sys.APPCONF["addr"] = sys.APPCONF["kwargs"].pop(
        "addr", sys.APPCONF["addr"]
    )
    sys.APPCONF["log"] = libs.logs(
        hostname=None,
        version=__version__,
        appname=__appname__,
        profile=__profile__,
    )
    sys.APPCONF["api"] = app_api.API(
        app_conf=sys.APPCONF,
        w_path=w_path,
        p_path=p_path,
        pg=pg,
        production=production,
    )
    rc = 0
    try:
        server = libs.SCGIServer(
            sys.APPCONF["log"],
            hostname=None,
            version=__version__,
            appname=__appname__,
            profile=__profile__,
            index=__index__,
        )
        threads, processes = prepare_server(api=sys.APPCONF["api"])
        sys.APPCONF["log"]("%s:%s started" % sys.APPCONF["addr"], begin="")
        server.serve_forever(
            sys.APPCONF["addr"], application, debug_fg=debug_fg
        )
    except KeyboardInterrupt:
        sys.APPCONF["log"]("KEYBOARD EXIT", kind="info")
    except SystemExit as e:
        if e:
            rc = e.code
    except Exception:
        sys.APPCONF["log"](traceback.format_exc(), kind="error")
    finally:
        try:
            libs.shutdown(sys.APPCONF["log"], debug_fg=debug_fg)
        except Exception:
            sys.APPCONF["log"](traceback.format_exc(), kind="error:shutdown")
    return rc


def application(env):
    """
    main bussiness script
    """

    tt = time.time()
    addr, pid = env["scgi.initv"][:2]
    msg = f'{addr[0]} {addr[1]} {env["HTTP_METHOD"]} {env["URI"]} {env["HTTP_PARAMS"]} {env["HTTP_KWARGS"] or ""}'
    env["scgi.defer"] = lambda: sys.APPCONF["log"]("%s DONE" % msg)
    sys.APPCONF["log"](env["REMOTE_ADDR"], kind="REMOTE")
    sys.APPCONF["log"]("%s STARTS" % msg)
    ret_code = "200 OK"
    content = ""
    _rm = env["HTTP_METHOD"].upper()
    # args=None
    fname = env["HTTP_KWARGS"].get("filename")
    if "POST" == _rm:
        arg = env.get("HTTP_PARAMS")[0]
        _p_http = env.get("HTTP_KWARGS")
        _param = env["scgi.rfile"].read(env["CONTENT_LENGTH"])
        try:
            _param = zlib.decompress(_param)
        except Exception:
            pass
        #######################
        if not _p_http:
            try:
                _param = _param.decode()
            except Exception:
                pass
            if "{" not in _param:
                try:
                    _param = urllib.parse.unquote(_param, encoding="utf-8")
                    _param = json.dumps(urllib.parse.parse_qs(_param))
                except Exception:
                    pass
        ######################

        try:
            _param = json.loads(_param)
        except Exception:
            data = _param
            _param = _p_http
            if fname:
                _param.update({"data": data})
        else:
            _param.update(_p_http)
        sys.APPCONF["log"](arg, kind="info:method:")
        t = _param.copy()
        if fname:
            t.pop("data")
        sys.APPCONF["log"](t, kind="info:params:")
        udp_msg = [
            __appname__,
            "info",
            arg,
            t,
            time.strftime("%Y-%m-%d %H:%M:%S"),
        ]
        # send to UDP socket our message:
        # appname, kind of message('info', 'error', etc), called method, method's params, timestamp
        print(json.dumps(udp_msg), file=sys.APPCONF["udpsock"])
        content = libs.parse_args(
            arg, _param, env["X-API-KEY"], sys.APPCONF["api"]
        )
    fileReturn = False
    if arg in ["saveData", "barcodeReport"]:
        res = content.get("result")
        if res:
            ret_v = content.get("ret_val")
            f_type = ret_v.get("type")
            ret_value = ret_v.get("data")
            content_length = len(ret_value)
            header = libs.f_head(content_length, f_type)
            fileReturn = True
        else:
            ret_value = json.dumps({}, ensure_ascii=False)
    if not fileReturn:
        ret_value = content.encode()
        content_length = len(ret_value)
        if arg == "login":
            header = libs.authHead(content, content_length)
        else:
            header = libs.head(content_length, False, True)
    tt = time.time() - tt
    env["scgi.defer"] = lambda: sys.APPCONF["log"](
        "%s DONE in %s secs" % (msg, tt)
    )
    # передаем: статус, заголовки, содержание
    if content_length == 0:
        ret_code = "204 No Content"
    yield ret_code
    yield header
    yield ret_value


def prepare_server(api=None):
    """prepare the server, loading all bussiness-logic threads"""

    if not api.app_conf.get("debug") or api.app_conf.get("debug") is False:
        if not path.exists(api.path):
            os.makedirs(api.path, mode=0o777)
        if not path.exists(api.p_path):
            os.makedirs(api.p_path, mode=0o777)
    # while not sys.extip:
    #     sys.extip, sys.intip = libs.getip(sys.APPCONF["log"])
    threads = []
    processes = []
    sys.APPCONF["log"](f"{__appname__} started.\tinternal ip-> {sys.intip}")
    sys.APPCONF["log"](f"\t\t\textrnal  ip-> {sys.extip}")

    # threads.append(threading.Thread(target=_insert_function_for_thread_here, args=(_insert_args_here,), daemon=True))
    threads.append(
        threading.Thread(
            target=libs.udp_send,
            args=(__appname__, __version__, sys.APPCONF["udp"]),
            daemon=True,
        )
    )

    for th in threads:
        th.start()
    for pr in processes:
        pr.start()
    return threads, processes


###############################################

if "__main__" == __name__:
    debug_fg = False
    for arg in sys.argv:
        if "debug" in arg:
            debug_fg = True
            break
    main(debug_fg)
