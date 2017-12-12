#!/usr/bin/python
# -*- coding: utf-8 -*-

import sys, xlsx2tsv
reload(sys)
sys.setdefaultencoding('utf8')

import os
import json
import utils

class DBsync:
    def Load(self):
        #self.clearAll1()
        db = utils.conMySpr()
        dbc = db.cursor()
        
        sql = """select distinct(spr.id_spr), sprimp_main.kod3 from spr
        inner join lnk on (lnk.id_spr = spr.id_spr and lnk.id_vnd = 20871)
        inner join sprimp_main on (lnk.id_tovar = sprimp_main.sprid)"""
        
        sql = """select spr.id_spr, sprimp_main.kod3 from sprimp_main
            inner join spr on (sprimp_main.barcode = spr.barcode)"""
                
        dbc.execute(sql)
        result = dbc.fetchall()
        
        try:        
            for rec in result:                
                sql = "UPDATE SPR SET id_sprimp = '%s' WHERE (ID_SPR = %s and id_sprimp='')" % ( rec[1], rec[0])
                print sql
                dbc.execute(sql)
            db.commit()
            print len(result)
        except  Exception, e:
            return False, e
    
        
    
if __name__ == "__main__":
    DBsync = DBsync()
    print DBsync.Load()
    