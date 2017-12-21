#coding: utf-8
import sys
import traceback
import fdb
#import libs.fdb as fdb


class fb_local:

    def __init__(self, log):
        self.log = log
        self.connect_params = {
                "host": "localhost",
                "database": "spr",
                "user": 'SYSDBA',
                "password":'masterkey',
                "charset" : 'WIN1251'
            }

    def _log(self, message, kind=''):
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
                ret = cur.fetchall()
            except:
                ret = -2
                #self._log(traceback.format_exc(), kind="error:sql")
                self._log(Err, kind="error:sql")
            finally:
                cur.close()
                con.close()
        return ret

    def execute(self, params = None):
        """
        делаем инсерты, апдейты и делиты - одна команда на транзакцию
        sql - строка sql  с символами ? вместо параметров
        options - список или кортеж опций для подстановки в sql строку
        """
        ret = -1
        try:
            con = fdb.connect(**self.connect_params)
        except:
            self._log(traceback.format_exc(), kind="error:connection")
        else:
            cur = con.cursor()
            sql = params.get('sql')
            options = params.get('options')
            try:
                cur.execute(sql, options)
                con.commit()
                ret = cur.fetchall()
            except Exception as Err:
                ret = -2
                #self._log(traceback.format_exc(), kind="error:sql")
                self._log(Err, kind="error:sql")
            finally:
                cur.close()
                con.close()
        return ret

    def executemany(self, params = None):
        """
        делаем инсерты, апдейты и делиты -  много команд на транзакцию
        sql - строка sql  с символами ? вместо параметров
        options - список списков или кортежей опций для подстановки в sql строку
        """
        ret = -1
        try:
            con = fdb.connect(**self.connect_params)
        except:
            self._log(traceback.format_exc(), kind="error:connection")
        else:
            cur = con.cursor()
            sql = params.get('sql')
            options = params.get('options')
            try:
                ret = []
                for i in options:
                    cur.execute(sql, options)
                    con.commit()
                    reti = cur.fetchall()
                    ret.append(reti[0])
            except Exception as Err:
                ret = -2
                #self._log(traceback.format_exc(), kind="error:sql")
                self._log(Err, kind="error:sql")
            finally:
                cur.close()
                con.close()
        return ret

if "__main__" == __name__:
    fb = fb_local('l')
    sql ="select count(*) from spr where id_spr < ?"
    opt = ("100",)
    rr = fb.request({"sql": sql, "options": opt})
    if rr == -1:
        print("sql connection error")
    elif rr == -2:
        print("sql script error")
    else:
        for i in rr:
            print(i)

