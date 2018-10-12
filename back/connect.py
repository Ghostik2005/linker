#!/usr/bin/python
# -*- coding: utf-8 -*-
import string
import sys
import traceback
import fdb

try:
    import psycopg2
except ImportError:
    pass


def conMySpr():
        global DB_HOST
        con = None
        try:
            con = psycopg2.connect(**{'dbname': 'spr', 'user': 'postgres', 'host': 'localhost', 'port': 5432})
            cur = con.cursor()
            cur.execute("select count(*) from SPR;")
            cur.close()
        except:
            try:
                con = fdb.connect(
                    host='localhost/8025', database='SPR',
                    #host='localhost', database='d:/work/IBExpert/SPR.FDB',
                    user='SYSDBA', password='masterkey', charset = 'WIN1251'
                  )
            except Exception as e:
                #print str(e)
                con = None, str(e)
        return con
########################################################################


if __name__=='__main__':
        con = conMySpr()
        print con
