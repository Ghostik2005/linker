#coding: utf-8

import os
import sys
import json
import time
import traceback
# import psycopg2
import libs.connect_pool as connect_pool
from urllib.parse import unquote

from libs.libs import _int

class Connect_proto(object):

    def __init__(self, *args, **kwargs):
        self.production = kwargs.get("production", False)
        self.udp = kwargs.get('udp')

    def _print(self, msg=''):
        udp_msg = [sys.APPCONF["log"].appname, 'sql', '', msg, time.strftime("%Y-%m-%d %H:%M:%S")]
        print(json.dumps(udp_msg), file=self.udp or sys.stdout)

    def ch_log(self, user='', m_type='change', msg=''):
        msg = json.dumps(msg, ensure_ascii=False)
        udp_msg = [sys.APPCONF["log"].appname+'' if self.production else '_test',
                   m_type, user, msg, time.strftime("%Y-%m-%d %H:%M:%S")
                  ]
        if not self.production:
            print(user, m_type, msg, sep='\n', flush=True, file=sys.stdout)
        print(json.dumps(udp_msg), file=self.udp or sys.stdout)


class pg_local(Connect_proto):

    def __init__(self, log, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.log = log
        pg_conn = kwargs.get('pg_conn')
        print("*"*10, pg_conn)
        if not pg_conn:
            self.connect_params = {'dbname': 'spr', 'user': 'postgres', 'host': '127.0.0.1', 'port': 5432}
        else:
            if os.path.exists(pg_conn):
                conn = None
                with open(pg_conn, 'r') as _f:
                    conn = _f.readlines()
                if conn:
                    self.connect_params = {}
                    for x in conn:
                        i = x.find('=')
                        if i > -1:
                            k, x  = x[:i].strip(), x[i+1:].strip()
                        else:
                            k = None
                        if k:
                            self.connect_params[unquote(k)] = _int(unquote(x))
                        else:
                            pass
            else:
                self.connect_params = {'dbname': 'spr', 'user': 'postgres', 'host': '127.0.0.1', 'port': 5432}

        self._log("Production" if self.production else "Test")
        self._log(self.connect_params, kind='Connection')

        self.connection = connect_pool.ConectPool(connection_params=self.connect_params)


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
            # con = psycopg2.connect(**self.connect_params)
            con = self.connection.connect()
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
            # con = psycopg2.connect(**self.connect_params)
            con = self.connection.connect()
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
            # con = psycopg2.connect(**self.connect_params)
            con = self.connection.connect()
        except Exception as Err:
            self._log(traceback.format_exc(), kind="error:connection")
        else:
            cur = con.cursor()
            sql = params.get('sql')
            options = params.get('options', ())
            # print("%"*20)
            # print(options)
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



if "__main__" == __name__:
    pass
