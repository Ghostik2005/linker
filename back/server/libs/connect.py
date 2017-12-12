#coding: utf-8
import sys
import traceback
import fdb
#import libs.fdb as fdb


class fb_local:

    def __init__(self, log):
        self.con = None
        self.log = log
        try:
            print('Connect')
            self.con = fdb.connect(
                dsn='localhost:spr',
                user='SYSDBA', password='masterkey'#, charset = 'WIN1251'
              )

        except Exception as Err:
            print(traceback.format_exc())
            #self.log(traceback.format_exc(), kind="error:connection")

    def request(self, params = None):
        #делаем селекты
        cur = self.con.cursor()
        sql = params.get('sql')
        cur.execute(sql)
        ret = cur.fetchall()
        cur.close()
        return ret

    def execute(self, params = None):
        #делаем инсерты, апдейты и делиты - одна команда на транзакцию
        cur = self.con.cursor()
        sql = params.get('sql')
        cur.execute(sql)
        ret = cur.fetchall()
        cur.close()
        return ret

    def executemany(self, params = None):
        #делаем инсерты, апдейты и делиты -  много команд на транзакцию
        cur = self.con.cursor()
        sql = params.get('sql')
        cur.execute(sql)
        ret = cur.fetchall()
        cur.close()
        return ret


def main():
    qq = fb_local('l')

if "__main__" == __name__:
    main()

