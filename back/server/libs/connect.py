#coding: utf-8
import sys
import traceback
import configparser
try:
    from libs.ms71lib import client as ms71_cli
except ImportError:
    import ms71lib.client as ms71_cli
try:
    import libs.fdb as fdb
except ImportError:
    import fdb


class fb_local:

    def __init__(self, log):
        try:
            config = configparser.ConfigParser()
            config.read('/ms71/saas/linker/conf.ini', encoding='UTF-8')
            init = config['init']
            self.prod_params = {
                    'uri': init['uri'],
                    'api_key': init['api'],
                    'allow_none': True
                    }
            self.production = True
        except:
            self.production = False
            self.prod_params = {}
        self.log = log
        if callable(self.log):
            self.log("Production" if self.production else "Test")
        else:
            print("Production" if self.production else "Test", flush=True)
        self.connect_params = {
                "host": "localhost",
                "database": "spr",
                "user": 'SYSDBA',
                "password":'masterkey',
                "charset" : 'WIN1251'
            }
            
    def request(self, params=None):
        if self.production:
            ret = self._request_(params)
        else:
            ret = self._request(params)
        if not ret:
            ret = []
        return ret

    def execute(self, params=None):
        if self.production:
            ret = self._execute_(params)
        else:
            ret = self._execute(params)
        if not ret:
            ret = []
        return ret

    def executemany(self, params=None):
        if self.production:
            ret = self._executemany_(params)
        else:
            ret = self._executemany(params)
        if not ret:
            ret = []
        return ret

    def _log(self, message, kind='info'):
        if callable(self.log):
            self.log(message, kind=kind)
        else:
            print(message, flush=True)

    def _request_(self, params = None):
        ret = -1
        try:
            con = ms71_cli.ServerProxy(**self.prod_params)
        except Exception as Err:
            self._log(traceback.format_exc(), kind="error:connection")
        else:
            sql = params.get('sql')
            options = params.get('options')
            try:
                ret = con.fdb.execute('spr', sql, options)
            except Exception as Err:
                ret = -3 #empty return
                self._log(Err, kind="error:sql return")
        return ret

    def _execute_(self, params = None):
        """
        делаем инсерты, апдейты и делиты - одна команда на транзакцию
        sql - строка sql  с символами ? вместо параметров
        options - список или кортеж опций для подстановки в sql строку
        """
        ret = -1 #connection error
        try:
            con = ms71_cli.ServerProxy(**self.prod_params)
        except Exception as Err:
            self._log(traceback.format_exc(), kind="error:connection")
        else:
            sql = params.get('sql')
            options = params.get('options')
            try:
                ret = con.fdb.execute('spr', sql, options)
            except Exception as Err:
                ret = -3 #empty return
                self._log(Err, kind="error:sql return")
        return ret

    def _executemany_(self, params = None):
        """
        делаем инсерты, апдейты и делиты -  много команд на транзакцию
        sql - строка sql  с символами ? вместо параметров
        options - список списков или кортежей опций для подстановки в sql строку
        """
        ret = -1
        try:
            con = ms71_cli.ServerProxy(**self.prod_params)
        except Exception as Err:
            self._log(traceback.format_exc(), kind="error:connection")
        else:
            sql = params.get('sql')
            options = params.get('options')
            try:
                ret = con.fdb.executemany('spr', sql, options)
            except Exception as Err:
                ret = -3 #empty return
                self._log(Err, kind="error:sql return")
        return ret

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
            finally:
                cur.close()
                con.close()
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
    sql = """SELECT r.SH_PRC, r.ID_VND, r.ID_TOVAR, r.N_FG, r.N_CENA, r.C_TOVAR, r.C_ZAVOD, r.ID_ORG, r.C_INDEX, r.DT, r.IN_WORK, r.CHANGE_DT, r.SOURCE FROM PRC r where r.SH_PRC = 'f4821862885c29533d538b90720b4a33'"""
    sqls = ["""CREATE TABLE PRC_TASKS
(
  UIN VARCHAR(255) NOT NULL COLLATE WIN1251,
  SOURCE SMALLINT,
  CALLBACK VARCHAR(255) COLLATE WIN1251,
  DT TDATETIME,
  CONSTRAINT T_PK_TASKS PRIMARY KEY (UIN)
)""",
"""GRANT DELETE, INSERT, REFERENCES, SELECT, UPDATE
 ON PRC_TASKS TO SYSDBA WITH GRANT OPTION"""]

    for ss in sqls:
        fb.execute({"sql": ss, "options": opt})

    sys.exit(0)





    #rr = fb.execute({"sql": sql1, "options": opt})
    if rr == -1:
        print("sql connection error")
    elif rr == -2:
        print("sql script error")
    elif rr == -3:
        print("sql script no return")
    else:
        if rr:
            for i in rr:
                print(i)
        else:
            print(rr)

