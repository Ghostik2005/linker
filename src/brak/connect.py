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
                host='localhost/8025', database='SPR',
                #host='localhost', database='d:/work/IBExpert/SPR.FDB',
                user='SYSDBA', password='masterkey', charset = 'WIN1251'
              )
        except Exception, e:
            #print str(e)
            con = None, str(e)
        return con
########################################################################


if __name__=='__main__':
        con = conMySpr()
        print con