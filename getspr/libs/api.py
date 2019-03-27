#coding: utf-8

import os
import sys
import json
import time
import uuid
import psycopg2
import traceback
import subprocess

class PG:
    """
    класс для работы с postgres через with
    """

    def __init__(self, port=5432):
        self.connect_params = {'dbname': 'spr', 'user': 'postgres', 'host': '127.0.0.1', 'port': port}

    def __enter__(self):
        self.connect = psycopg2.connect(**self.connect_params)
        self.cursor = self.connect.cursor()
        return self.cursor

    def __exit__(self, *args):
        try:
            self.cursor.close()
        except:
            pass
        try:
            self.connect.close()
        except:
            pass


class API:
    """
    API class for http post access
    x_hash - API key
    """

    doc = """

обращение к справочникам

https://online365.pro/references

Методы:

getData({"table": <имя таблицы, string>, "output": <что выводить из таблицы, string>, "input_params": <что передаем в таблицу: list>})
получаем данные из базы, методы будем добавлять по мере необходимости
table: LNK, output: ID_SPR, input_params: SH_PRC -> ID_SPR
            output: ID_VND, input_params: ID_VND, ID_TOVAR -> distinct  ID_VND, ID_TOVAR, ID_SPR
table: SPR, output: *, input_params: ID_SPR -> ID_SPR, C_TOVAR, ID_ZAVOD, ID_STRANA, ID_TOVAR
table: BRAK, output: *, input_params: SH_PRC, SERIES -> SH_PRC, RAZBRAK
table: GROUPS, output: *, input_params: IDX_GROUP -> cd_code, cd_group
ответ: {"result": True or False, "value": "data generated" or reason, "data": ответ сервера по fetchall}

genSpr({"type": <тип базы, string>}) - выполняется для spr около 2 мин, для spr_roz около 1 мин
дает команду на создание базы данных и возвращает ссылку на файл справочника, ссылка активна до конца суток
type: spr -> spr.db3
type: spr_roz -> spr-roz.db3
ответ: {"result": True or False, "value":  filename or reson, 'url': url}

getLastModified({"sprtype_type": <тип базы, string>})
дата и время последнего создания базы
type: spr -> spr.db3
type: spr_roz -> spr-roz.db3
ответ: {"result": True or False, "value":  datetime  or reson}

getSpr({"type": <тип базы, string>})
плучение ссылки на файл справочника, ссылка активна до конца суток
type: spr -> spr.db3
type: spr_roz -> spr-roz.db3
ответ: {"result": True or False, "value":  filename or reson, 'url': url}


Пример:

import requests
url = "https://online365.pro/references?getSpr"


param = {"type":"spr_roz"}
req = requests.post(url, data=json.dumps(param).encode(), headers={"x-api-key": "x_enter"})
if req.status_code == '200':
    ret = req.json()
    if ret.get('result') == True:
    print(ret.get('value'))  #вывод -> spr-roz.db3
    print(ret.get('url'))  #вывод -> http://78.155.207.51/files/8b797ca3e49c431bb3a4453fbf338324/spr-roz.db3

    """


    def __init__(self, log, w_path = '/ms71/data/getspr', p_path='/ms71/data/getspr/api-k', pg=False, production=False):
        #назначить пустой префикс на продакшене
        self.production = production
        self.udp = sys.APPCONF["udpsock"]
        self.prefix = ""
        self.path = w_path
        self.p_path = p_path
        if not os.path.exists(self.path):
             os.makedirs(self.path, mode=0o777)
        if not os.path.exists(self.p_path):
             os.makedirs(self.p_path, mode=0o777)
        self.log = log
        self._pg = True
        if pg:
            self.port = pg
        else:
            self.port = 5432
        self.log(f"getspr starting api --> {'PRODUCTION' if self.production else 'TEST'}")
        self.log("with postgres starting on %s port" % self.port)

    def _print(self, msg=None):
        #вывод логов sql запросов
        udp_msg = [self.log.appname, 'sql', '', msg, time.strftime("%Y-%m-%d %H:%M:%S")]
        print(str(json.dumps(udp_msg)), file=self.udp or sys.stdout)

    def _prepareForData(self, params):
        #подготавливаем данные для запроса в базу данных
        table = params.get('table', "").strip().upper()
        output = params.get('output', "").strip().upper()
        input_params = params.get('input', [])
        sql = None
        opt = None
        if "LNK" == table:
            if "ID_SPR" == output:
                if len(input_params) == 1:
                    sql = """select ID_SPR from LNK where SH_PRC = %s;"""
                    opt = (str(input_params[0]),)
            if "ID_VND" == output:
                if len(input_params) == 2:
                    sql = """select distinct ID_VND, ID_TOVAR, ID_SPR from LNK where ID_VND = %s and ID_TOVAR = %s;"""
                    opt = (int(input_params[0]), str(input_params[1]))
        elif "SPR" == table:
            if len(input_params) == 1:
                sql = """select ID_SPR, C_TOVAR, ID_ZAVOD, ID_STRANA, ID_TOVAR from SPR where ID_SPR=%s;"""
                opt = (int(input_params[0]),)
        elif "BRAK" == table:
            if len(input_params) == 2:
                sql = """select b.sh_prc, b.razbrak from brak b join lnk l on l.sh_prc = b.sh_prc and b.sh_prc = %s and id_vnd='10000' where b.series = %s;"""
                opt = (str(input_params[0]), str(input_params[1]))
        elif "GROUPS" == table:
            if len(input_params) == 1:
                sql = """select g.cd_code, g.cd_group from groups g join classifier c on g.cd_group = c.cd_group and c.idx_group = %s order by g.cd_code asc;"""
                opt = (int(input_params[0]),)
        return sql, opt

    def getData(self, params=None, x_hash=None):
        #получение данных из базы данных
        if self._check(x_hash):
            sql, opt = self._prepareForData(params)
            if sql:
                ret = []
                with PG(self.port) as pg:
                    pg.execute(sql, opt)
                    self._print(msg=pg.query.decode())
                    ret = pg.fetchall()
                data = {"result": True, "value": "data generated", "data": ret}
            else:
                data = {"result": False, "value": "cann't create sql-request"}
                self.log(f"SQL_CREATE_ERROR->params: {str(params)}")
        else:
            data = {"result": False, "value": "access denied"}
        return data
        # return json.dumps(data)

    def genSpr(self, params=None, x_hash=None):
        #сгенерировать базу db3 и отдать ссылку на нее
        if self._check(x_hash):
            spr_type = params.get("type", "spr")
            spr_type = spr_type.replace("_", "-")
            #в последующем сделаем эту функцию в отдельом треде по таймеру, если надо
            # но итоговая ссылка на новый файл будет доступна только после формирования файла,
            # до этого момента файл будет старый.
            ret_value = self._genSpr(spr_type)
            if ret_value:
                data = self.getSpr(params, x_hash)
            else:
                data = {"result": False, "value": "cann't process"}
        else:
            data = {"result": False, "value": "access denied"}
        return data

    def getLastModified(self, params=None, x_hash=None):
        #получить дату и время последней выгрузки справочника
        if self._check(x_hash):
            spr_type = params.get("type", "spr")
            spr_type = spr_type.replace("_", "-")
            f_name =  f"{self.prefix}/ms71/data/spr/{spr_type}.db3"
            #print(f_name)
            if os.path.exists(f_name):
                #или берем из файла .lm
                dt = os.stat(f_name).st_mtime
                dt = time.strftime("%H:%M:%S %Y-%m-%d", time.gmtime(dt))
            else:
                dt = "None"
            ret = {"result": True, "value": dt}
        else:
            ret = {"result": False, "value": "access denied"}
        return ret
        

    def getSpr(self, params=None, x_hash=None):
        #отдать ссылку на справочник
        if self._check(x_hash):
            #будем отдавать ссылку вместо файла
            spr_type = params.get("type", "spr")
            url = None
            if spr_type == "spr" or spr_type == "spr_roz":
                spr_type = spr_type.replace("_", "-")
                f_name = f"{self.prefix}/ms71/data/spr/{spr_type}.db3"
            else:
                f_name = ""
            if f_name:
                #создаем папку с сгенерированным md5 именем, в папку кидаем симфолическую ссылку на запрашиваемый файл
                #срок жизни папки  - до конца дня. в конце дня производим удаление папок по крону
                folder_name = os.path.join("files", uuid.uuid4().hex)
                os.makedirs(os.path.join(f"{self.prefix}/ms71/html/", folder_name), mode=0o777, exist_ok=True)
                sym_name = os.path.join(folder_name, os.path.basename(f_name))
                os.symlink(f_name, os.path.join(f"{self.prefix}/ms71/html/", sym_name), target_is_directory=False, dir_fd=None)
                url = f"http://{sys.extip}/{sym_name}"
            # if f_name:
            #     #print(f_name)
            #     with open(f_name, "rb") as f_obj:
            #         data =f_obj.read()
            # else:
            #     data = None
            if url:
                #добавляем контрольную сумму файла - сделаем позже, если нужно
                ret = {"result": True, "value":  os.path.basename(f_name), 'url': url, "md5": "checksum will be here later"}
            else:
                ret = {"result": False, "value": "no data"}
        else:
            ret = {"result": False, "value": "access denied"}
        return ret


    def _genSpr(self, spr_type):
        #запуск скриптов для выгрузки справочника
        if not self.production:
            return True
        ret = True
        process = True
        user = "robot"
        if spr_type == "spr":
            #command = f"sudo {self.prefix}/ms71/saas/spr_copy/start_snapshot.sh"
            command = f"{self.prefix}/ms71/saas/spr_copy/start_snapshot.sh"
        elif spr_type == "spr-roz":
            #command = f"sudo {self.prefix}/ms71/saas/spr_copy/start_snapshot_roz.sh"
            command = f"{self.prefix}/ms71/saas/spr_copy/start_snapshot_roz.sh"
        else:
            command = ""
        if (os.path.exists(f'{self.prefix}/ms71/data/linker/{spr_type}.pid')):
            process = False
            command = ""
        else:
            with open(f'{self.prefix}/ms71/data/linker/{spr_type}.pid', 'w') as f_obj:
                f_obj.write(user)
        if command:
            subprocess.Popen(command).wait()
            try:
                os.remove(f'{self.prefix}/ms71/data/linker/{spr_type}.pid')
                with open(f'{self.prefix}/ms71/data/linker/{spr_type}.lm', 'w') as f_obj:
                    f_obj.write(str(int(time.time())))
                    f_obj.write("::" + user)
            except:
                traceback.print_exc()
        else:
            if not process:
                while os.path.exists(f'{self.prefix}/ms71/data/linker/{spr_type}.pid'):
                    time.sleep(1)
            else:
                ret = False
        return ret


    def _check(self, x_hash):
        #проверка валидности ключа
        ret = False
        if x_hash:
            f_name = os.path.join(self.p_path, x_hash)
            if os.path.exists(f_name):
                ret = True
        return ret

