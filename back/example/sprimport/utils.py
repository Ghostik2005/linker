#!/usr/bin/python
# -*- coding: utf-8 -*-
import string
import sys
import traceback
import fdb




def conMySpr():
        global DB_HOST
        con = None
        try:
            con = fdb.connect(
                dsn='localhost/8025:SPR',
                #dsn='82.146.40.211:SPR',
                user='SYSDBA', password='masterkey', charset = 'WIN1251'
              )
        except Exception, e:
            #print str(e)
            con = None
        return con
########################################################################


if __name__=='__main__':
        con = conMySpr()
        print con