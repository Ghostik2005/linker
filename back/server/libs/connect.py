#coding: utf-8
import sys
import json
import time
import traceback
import configparser
try:
    import libs.fdb as fdb
except ImportError:
    import fdb

import psycopg2


class Connect(object):

    def __init__(self, *args, **kwargs):
        print('args', args, sep='\t')
        print('kwargs', kwargs, sep='\t')
        self.udp = kwargs.get('udp')

    def _print(self, msg=None):
        udp_msg = [sys.APPCONF["log"].appname, 'sql', '', msg, time.strftime("%Y-%m-%d %H:%M:%S")]
        print(json.dumps(udp_msg), file=self.udp or sys.stdout)
        #print('xxxxxxxxxxxxxxxxxxxx')
        
    pass

class pg_local(Connect):

    def __init__(self, log, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.log = log
        self.production = False
        self.connect_params = {'dbname': 'spr', 'user': 'postgres', 'host': 'localhost', 'port': 5432}
        if callable(self.log):
            self.log("Production" if self.production else "Test")
        else:
            print("Production" if self.production else "Test", flush=True)
        self._print('xxxxxxxxxxxxx')

    def _log(self, message, kind='info'):
        if callable(self.log):
            self.log(message, kind=kind)
        else:
            print(message, flush=True)

    def execute(self, params=None):
        """
        делаем инсерты, апдейты и делиты - одна команда на транзакцию
        sql - строка sql  с символами ? вместо параметров
        options - список или кортеж опций для подстановки в sql строку
        """
        ret = -1 #connection error
        try:
            con = psycopg2.connect(**self.connect_params)
        except Exception as Err:
            self._log(traceback.format_exc(), kind="error:connection")
        else:
            cur = con.cursor()
            sql = params.get('sql')
            options = params.get('options')
            try:
                if not options:
                    cur.execute(sql)
                    if not self.production:
                        print(cur.query.decode())
                    self._print(cur.query.decode())
                else:
                    cur.execute(sql, options)
                    if not self.production:
                        print(cur.query.decode())
                    self._print(cur.query.decode())
                try:
                    ret = cur.fetchall()
                except Exception as Err:
                    ret = -3 #empty return
                    self._log(Err, kind="error:sql return")
                finally:
                    con.commit()
            except Exception as Err:
                ret = -2 # transaction error
                self._log(traceback.format_exc(), kind="error:sql")
                self._log(Err, kind="error:sql")
                self._log(sql, kind="error:text")
            finally:
                cur.close()
                con.close()
        if not ret:
            ret = []
        return ret

    def executemany(self, params=None):
        """
        делаем инсерты, апдейты и делиты -  много команд на транзакцию
        sql - строка sql  с символами ? вместо параметров
        options - список списков или кортежей опций для подстановки в sql строку
        """
        ret = -1
        try:
            con = fdb.connect(**self.connect_params)
        except Exception as Err:
            self._log(traceback.format_exc(), kind="error:connection")
        else:
            cur = con.cursor()
            sql = params.get('sql')
            options = params.get('options')
            try:
                cur.executemany(sql, options)
                try:
                    ret = cur.fetchall()
                except Exception as Err:
                    ret = -3 #empty return
                    self._log(Err, kind="error:sql return")
                finally:
                    con.commit()
            except Exception as Err:
                ret = -2 # transaction error
                self._log(Err, kind="error:sql")
            finally:
                cur.close()
                con.close()
        if not ret:
            ret = []
        return ret


    def request(self, params=None):
        """
        делаем селекты
        sql - строка sql  с символами ? вместо параметров
        options - список или кортеж опций для подстановки в sql строку
        """
        ret = -1
        try:
            con = psycopg2.connect(**self.connect_params)
        except Exception as Err:
            self._log(traceback.format_exc(), kind="error:connection")
        else:
            cur = con.cursor()
            sql = params.get('sql')
            options = params.get('options')
            try:
                if not options:
                    cur.execute(sql)
                    if not self.production:
                        print(cur.query.decode())
                    self._print(cur.query.decode())
                else:
                    cur.execute(sql, options)
                    if not self.production:
                        print(cur.query.decode())
                    self._print(cur.query.decode())
                try:
                    ret = cur.fetchall()
                except Exception as Err:
                    ret = -3 #empty return
                    self._log(Err, kind="error:sql return")
            except Exception as Err:
                ret = -2
                self._log(traceback.format_exc(), kind="error:sql")
                self._log(Err, kind="error:sql")
                self._log(sql, kind="error:text")
            finally:
                cur.close()
                con.close()
        finally:
            try:
                cur.close()
                con.close()
            except: pass
        if not ret:
            ret = []
        return ret


class fb_local(Connect):

    def __init__(self, log, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._print()
        try:
            config = configparser.ConfigParser()
            config.read('/ms71/saas/linker/conf.ini', encoding='UTF-8')
            init = config['init']
            self.prod_params = {
                    'uri': init['uri'],
                    'api_key': init['api'],
                    'allow_none': True
                    }
            self.connect_params = {
                    "host": "127.0.0.1",
                    "port": 8025,
                    "database": "spr",
                    "user": 'SYSDBA',
                    "password":'masterkey',
                    "charset" : 'WIN1251'
                }
            self.production = True
        except:
            traceback.print_exc()
            self.connect_params = {
                    "host": "127.0.0.1",
                    "database": "spr",
                    "user": 'SYSDBA',
                    "password":'masterkey',
                    "charset" : 'WIN1251'
                }
            self.production = False
            self.prod_params = {}
            
        self.log = log
        if callable(self.log):
            self.log("Production" if self.production else "Test")
        else:
            print("Production" if self.production else "Test", flush=True)

    def request(self, params=None):
        ret = self._request(params)
        if not ret:
            ret = []
        return ret

    def execute(self, params=None):
        ret = self._execute(params)
        if not ret:
            ret = []
        return ret

    def executemany(self, params=None):
        ret = self._executemany(params)
        if not ret:
            ret = []
        return ret

    def _log(self, message, kind='info'):
        if callable(self.log):
            self.log(message, kind=kind)
        else:
            print(message, flush=True)

    def _request(self, params = None):
        """
        делаем селекты
        sql - строка sql  с символами ? вместо параметров
        options - список или кортеж опций для подстановки в sql строку
        """
        ret = -1
        try:
            con = fdb.connect(**self.connect_params)
        except Exception as Err:
            self._log(traceback.format_exc(), kind="error:connection")
        else:
            cur = con.cursor()
            sql = params.get('sql')
            options = params.get('options')
            try:
                cur.execute(sql, options)
                try:
                    ret = cur.fetchall()
                except Exception as Err:
                    ret = -3 #empty return
                    self._log(Err, kind="error:sql return")
            except Exception as Err:
                ret = -2
                #self._log(traceback.format_exc(), kind="error:sql")
                self._log(Err, kind="error:sql")
                self._log(sql, kind="error:text")
            finally:
                cur.close()
                con.close()
        finally:
            try:
                cur.close()
                con.close()
            except: pass
        return ret

    def _execute(self, params = None):
        """
        делаем инсерты, апдейты и делиты - одна команда на транзакцию
        sql - строка sql  с символами ? вместо параметров
        options - список или кортеж опций для подстановки в sql строку
        """
        ret = -1 #connection error
        try:
            con = fdb.connect(**self.connect_params)
        except Exception as Err:
            self._log(traceback.format_exc(), kind="error:connection")
        else:
            cur = con.cursor()
            sql = params.get('sql')
            options = params.get('options')
            try:
                cur.execute(sql, options)
                try:
                    ret = cur.fetchall()
                except Exception as Err:
                    ret = -3 #empty return
                    self._log(Err, kind="error:sql return")
                finally:
                    con.commit()
            except Exception as Err:
                ret = -2 # transaction error
                #self._log(traceback.format_exc(), kind="error:sql")
                self._log(Err, kind="error:sql")
                self._log(sql, kind="error:text")
            finally:
                cur.close()
                con.close()
        return ret

    def _executemany(self, params = None):
        """
        делаем инсерты, апдейты и делиты -  много команд на транзакцию
        sql - строка sql  с символами ? вместо параметров
        options - список списков или кортежей опций для подстановки в sql строку
        """
        ret = -1
        try:
            con = fdb.connect(**self.connect_params)
        except Exception as Err:
            self._log(traceback.format_exc(), kind="error:connection")
        else:
            cur = con.cursor()
            sql = params.get('sql')
            options = params.get('options')
            try:
                cur.executemany(sql, options)
                try:
                    ret = cur.fetchall()
                except Exception as Err:
                    ret = -3 #empty return
                    self._log(Err, kind="error:sql return")
                finally:
                    con.commit()
            except Exception as Err:
                ret = -2 # transaction error
                #self._log(traceback.format_exc(), kind="error:sql")
                self._log(Err, kind="error:sql")
            finally:
                cur.close()
                con.close()
        return ret

if "__main__" == __name__:
    fb = fb_local('l')
    opt = ()
    sql = """SELECT rsh as sh_prc, v.C_VND as vendor, ridt as vendor_idspr, rct as vendor_ctovar, rcv as vendor_zavod, rids as etalon_idspr, s.C_TOVAR as etalon_ctovar, z.C_ZAVOD as etalon_zavod
from (
    SELECT r.SH_PRC rsh, r.ID_TOVAR ridt, r.C_TOVAR rct, r.C_ZAVOD rcv, r.ID_SPR rids, r.ID_VND ridv
        FROM (SELECT r.SH_PRC lsh
        FROM LNK r 
  ORDER by r.c_tovar asc)
        JOIN LNK r on r.SH_PRC = lsh
    )
JOIN VND v on (v.ID_VND = ridv) and v.ID_VND LIKE '201%'
JOIN SPR s on (s.ID_SPR = rids)
join SPR_ZAVOD  z on (z.ID_SPR = s.ID_ZAVOD)"""


    sql = """select * from PRC_TASKS"""


    sqls = ["""select * from users """
    ]

    #for ss in sqls:
        #fb.execute({"sql": ss, "options": opt})

    #sys.exit(0)


    #sql = "select * from spr_issue where id_is = 14"
    #sql = "UPDATE issue set c_issue = 'МАЗЬ НАРУЖ' where id = 14"
    #opt = (95489, "МАЗЬ НАРУЖ")


    rr = fb.execute({"sql": sql, "options": opt})
    if rr == -1:
        print("sql connection error")
    elif rr == -2:
        print("sql script error")
    elif rr == -3:
        print("sql script no return")
    else:
        if rr:
            for row in rr:
                print(row)
            ##связки сиа
            #with open("links_sia_all.csv", 'w') as f_obj:
                #li = """sh_prc\tvendor\tvendor_idspr\tvendor_ctovar\tvendor_zavod\tetalon_idspr\tetalon_ctovar\tetalon_zavod\n"""
                #f_obj.write(li)
                #for row in rr:
                    #li = "\t".join([str(i).replace("\t", " ") for i in row]) + "\n"
                    #f_obj.write(li)
                    
        else:
            print(rr)

