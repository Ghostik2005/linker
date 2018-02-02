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
    sql ="select count(*) from prc"
    sql = "select count(*) from spr r WHERE lower(r.C_TOVAR) like lower('%12507%')"
    sql = "select r.id_spr, r.c_tovar from spr r WHERE lower(r.C_TOVAR) like lower('%анальгин%') order by r.c_tovar asc ROWS 1 to 20"
    sql = "insert INTO ROLES (id, name) values (0, 'Пользователь')"
    opt = ()
    rr = fb.execute({"sql": sql, "options": opt})
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

