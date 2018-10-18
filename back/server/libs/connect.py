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
        #print('args', args, sep='\t')
        #print('kwargs', kwargs, sep='\t')
        self.production = kwargs.get("production", False)
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
        self.port = kwargs.get('port', 5432)
        
        self.connect_params = {'dbname': 'spr', 'user': 'postgres', 'host': 'localhost', 'port': int(self.port)}
        self._log("Production" if self.production else "Test")

    def _log(self, message, kind='info'):
        if callable(self.log):
            self.log(message, kind=kind)
        else:
            print(message, flush=True)

    def execute(self, params=None):
        """
        делаем инсерты, апдейты и делиты - одна команда на транзакцию
        sql - строка sql  с символами %s вместо параметров
        options - список или кортеж опций для подстановки в sql строку
        """
        ret = []
        try:
            con = psycopg2.connect(**self.connect_params)
        except Exception as Err:
            self._log(traceback.format_exc(), kind="error:connection")
        else:
            cur = con.cursor()
            sql = params.get('sql')
            options = params.get('options', ())
            try:
                cur.execute(sql, options) if options else cur.execute(sql)
                if not self.production:
                    pass
                    #print(cur.query.decode())
                self._print(cur.query.decode())
                try:
                    ret = cur.fetchall()
                except Exception as Err:
                    self._log(Err, kind="error:sql return")
                finally:
                    con.commit()
            except Exception as Err:
                self._log(traceback.format_exc(), kind="error:sql")
                self._log(Err, kind="error:sql")
                self._log(sql, kind="error:text")
        try:
            cur.close()
            con.close()
        except Exception as Err:
            pass
        return ret

    def executemany(self, params=None):
        """
        делаем инсерты, апдейты и делиты -  много команд на транзакцию
        sql - строка sql  с символами %s вместо параметров
        options - список списков или кортежей опций для подстановки в sql строку
        """
        ret = []
        try:
            con = psycopg2.connect(**self.connect_params)
        except Exception as Err:
            self._log(traceback.format_exc(), kind="error:connection")
        else:
            cur = con.cursor()
            sql = params.get('sql')
            options = params.get('options', ())
            try:
                cur.executemany(sql, options)
                if not self.production:
                    pass
                    #print(cur.query.decode())
                self._print(cur.query.decode())
                try:
                    ret = cur.fetchall()
                except Exception as Err:
                    self._log(Err, kind="error:sql return")
                finally:
                    con.commit()
            except Exception as Err:
                self._log(Err, kind="error:sql")
        try:
            cur.close()
            con.close()
        except Exception as Err:
            pass
        return ret

    def request(self, params=None):
        """
        делаем селекты
        sql - строка sql  с символами %s вместо параметров
        options - список или кортеж опций для подстановки в sql строку
        """
        ret = []
        try:
            con = psycopg2.connect(**self.connect_params)
        except Exception as Err:
            self._log(traceback.format_exc(), kind="error:connection")
        else:
            cur = con.cursor()
            sql = params.get('sql')
            options = params.get('options', ())
            #print("%"*20)
            #print(options)
            try:
                cur.execute(sql, options) if options else cur.execute(sql)
                if not self.production:
                    pass
                    print(cur.query.decode())
                self._print(cur.query.decode())
                try:
                    ret = cur.fetchall()
                except Exception as Err:
                    self._log(Err, kind="error:sql return")
            except Exception as Err:
                self._log(traceback.format_exc(), kind="error:sql")
                self._log(Err, kind="error:sql")
                self._log(sql, kind="error:text")
            finally:
                cur.close()
                con.close()
        try:
            cur.close()
            con.close()
        except Exception as Err:
            pass
        return ret


class fb_local(Connect):

    def __init__(self, log, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._print("***************")
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
            #self.production = True
        except:
            traceback.print_exc()
            self.production = False
        self.log = log
        self._log("Production" if self.production else "Test")

    def _log(self, message, kind='info'):
        if callable(self.log):
            self.log(message, kind=kind)
        else:
            print(message, flush=True)

    def request(self, params = None):
        """
        делаем селекты
        sql - строка sql  с символами ? вместо параметров
        options - список или кортеж опций для подстановки в sql строку
        """
        ret = []
        try:
            con = fdb.connect(**self.connect_params)
        except Exception as Err:
            self._log(traceback.format_exc(), kind="error:connection")
        else:
            cur = con.cursor()
            sql = params.get('sql')
            options = params.get('options')
            try:
                cur.execute(sql, options) if options else cur.execute(sql)
                try:
                    ret = cur.fetchall()
                except Exception as Err:
                    self._log(Err, kind="error:sql return")
            except Exception as Err:
                self._log(Err, kind="error:sql")
                self._log(sql, kind="error:text")
            finally:
                cur.close()
                con.close()
        try:
            cur.close()
            con.close()
        except Exception as Err:
            pass
        return ret

    def execute(self, params = None):
        """
        делаем инсерты, апдейты и делиты - одна команда на транзакцию
        sql - строка sql  с символами ? вместо параметров
        options - список или кортеж опций для подстановки в sql строку
        """
        ret = []
        try:
            con = fdb.connect(**self.connect_params)
        except Exception as Err:
            self._log(traceback.format_exc(), kind="error:connection")
        else:
            cur = con.cursor()
            sql = params.get('sql')
            options = params.get('options')
            try:
                cur.execute(sql, options) if options else cur.execute(sql)
                try:
                    ret = cur.fetchall()
                except Exception as Err:
                    self._log(Err, kind="error:sql return")
                finally:
                    con.commit()
            except Exception as Err:
                self._log(Err, kind="error:sql")
                self._log(sql, kind="error:text")
        try:
            cur.close()
            con.close()
        except Exception as Err:
            pass
        return ret

    def executemany(self, params = None):
        """
        делаем инсерты, апдейты и делиты -  много команд на транзакцию
        sql - строка sql  с символами ? вместо параметров
        options - список списков или кортежей опций для подстановки в sql строку
        """
        ret = []
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
                    self._log(Err, kind="error:sql return")
                finally:
                    con.commit()
            except Exception as Err:
                self._log(Err, kind="error:sql")
        try:
            cur.close()
            con.close()
        except Exception as Err:
            pass
        return ret

if "__main__" == __name__:
    fb = fb_local('l')
    opt = ()
    sql = """select * from PRC_TASKS"""
    sqls = ["""select * from users """
           ]
    #for ss in sqls:
        #fb.execute({"sql": ss, "options": opt})
    rr = fb.execute({"sql": sql, "options": opt})
    for row in rr:
        print(row)

