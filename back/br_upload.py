#coding: utf-8

import os
import sys
import fdb
import glob
import psycopg2
import traceback


def main():

    pg = {'dbname': 'spr', 'user': 'postgres', 'host': 'localhost', 'port': 5432}
    fb = {"host": "127.0.0.1", "port": 8025, "database": "spr", "user": 'SYSDBA',
          "password":'masterkey', "charset" : 'WIN1251'}

    try:
        f_list = glob.glob('/ms71/temp/brak/*.txt')
        options = []
        options_f = []
        for f in f_list:
            data = None
            with open(f, 'r') as f_obj:
                data = f_obj.read()
            name = os.path.basename(f).split('.txt')[0]
            o = (name, psycopg2.Binary(data.encode()))
            o_f = (name, data.encode())
            options.append(o)
            options_f.append(o_f)
        #pg_con = psycopg2.connect(**pg)
        fb_con = fdb.connect(**fb)
        #pg_cur = pg_con.cursor()
        fb_cur = fb_con.cursor()
        sql = """insert into BRAK_MAIL_TEXT (LINK_FILE, MAIL_TEXT)
values (%s, %s);"""
        sql_f = """insert into BRAK_MAIL_TEXT (LINK_FILE, MAIL_TEXT)
values (?, ?);"""
        #pg_cur.executemany(sql, options)
        #pg_con.commit()
        fb_cur.executemany(sql_f, options_f)
        fb_con.commit()

    except KeyboardInterrupt:
        print('kb exit')

    except Exception:
        traceback.print_exc()
    finally:
        try:
            #pg_con.close()
            fb_con.close()
        except:
            pass

    return


if "__main__" == __name__:

    main()
    sys.exit(0)
